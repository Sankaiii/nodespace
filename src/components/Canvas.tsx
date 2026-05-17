import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';

import { BubbleNode } from './BubbleNode';
import { ContextMenu } from './ContextMenu';
import { SearchOverlay } from './SearchOverlay';
import { useStore } from '../store/useStore';
import { loadCanvas, saveCanvas } from '../utils/github';
import { DEFAULT_COLORS, type NodeData, type CtxMenu, type Background as BgType } from '../types';

/* ─── Types de nœuds React Flow ─── */
const NODE_TYPES = { bubble: BubbleNode };

/* ─── Variante de fond ─── */
function bgVariant(bg: BgType): BackgroundVariant | null {
  if (bg === 'dots')  return BackgroundVariant.Dots;
  if (bg === 'grid')  return BackgroundVariant.Cross;
  if (bg === 'lines') return BackgroundVariant.Lines;
  return null;
}

/* ─── Nœud initial de bienvenue ─── */
function makeWelcomeNodes(): Node<NodeData>[] {
  return [
    {
      id: 'w1',
      type: 'bubble',
      position: { x: 60, y: 60 },
      data: { title: 'Bienvenue 👋', content: 'Shift+A pour ajouter une fiche\nDouble-clic pour éditer\nClic-molette pour déplacer', color: '#7F77DD', collapsed: false },
    },
    {
      id: 'w2',
      type: 'bubble',
      position: { x: 340, y: 100 },
      data: { title: 'Connexions', content: 'Relie les fiches via les points\nblancs sur les côtés.', color: '#1D9E75', collapsed: false },
    },
    {
      id: 'w3',
      type: 'bubble',
      position: { x: 160, y: 270 },
      data: { title: 'Sauvegarde GitHub', content: 'Ctrl+S → commit automatique\nsur ton dépôt privé.', color: '#D85A30', collapsed: false },
    },
  ];
}
const WELCOME_EDGES: Edge[] = [
  { id: 'we1', source: 'w1', target: 'w2', type: 'smoothstep', style: { stroke: '#7F77DD', strokeWidth: 1.5, opacity: 0.55 } },
  { id: 'we2', source: 'w1', target: 'w3', type: 'smoothstep', style: { stroke: '#7F77DD', strokeWidth: 1.5, opacity: 0.55 } },
];

export function Canvas() {
  const {
    activeProfileId, profiles, background,
    token, username, shaCache,
    setSha, setSaving, saving, updateProfileFlow, setSearchOpen,
  } = useStore();

  const activeProfile = profiles.find((p) => p.id === activeProfileId)!;

  /* ─── React Flow state ─── */
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(
    activeProfile.flow.nodes.length ? activeProfile.flow.nodes : makeWelcomeNodes()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    activeProfile.flow.nodes.length ? activeProfile.flow.edges : WELCOME_EDGES
  );

  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  /* ─── Chargement depuis GitHub au montage ─── */
  useEffect(() => {
    if (!token || !username) { setLoaded(true); return; }
    let cancelled = false;

    (async () => {
      const { flow, sha } = await loadCanvas(token, username, activeProfileId);
      if (cancelled) return;
      if (flow && (flow.nodes.length > 0)) {
        setNodes(flow.nodes);
        setEdges(flow.edges);
        if (sha) setSha(activeProfileId, sha);
      }
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionnellement vide : un seul chargement au montage (géré par key= dans App.tsx)

  /* ─── Connexion entre fiches ─── */
  const onConnect = useCallback(
    (params: Connection) => {
      const src = nodes.find((n) => n.id === params.source);
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            style: { stroke: src?.data.color ?? '#7F77DD', strokeWidth: 1.5, opacity: 0.55 },
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  /* ─── Menus contextuels ─── */
  const onNodeContextMenu: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCtxMenu({ type: 'node', x: e.clientX - rect.left, y: e.clientY - rect.top, nodeId: node.id });
  }, []);

  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCtxMenu({
        type: 'pane',
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
        flowPos: screenToFlowPosition({
          x: (e as React.MouseEvent).clientX,
          y: (e as React.MouseEvent).clientY,
        }),
      });
    },
    [screenToFlowPosition]
  );

  /* ─── Sauvegarde GitHub ─── */
  const handleSave = useCallback(async () => {
    if (!token || !username) return;
    const currentNodes = getNodes() as Node<NodeData>[];
    const currentEdges = getEdges();
    const flow = { nodes: currentNodes, edges: currentEdges };

    setSaving(true);
    try {
      const newSha = await saveCanvas(
        token, username, activeProfileId, flow,
        shaCache[activeProfileId] ?? null
      );
      if (newSha) setSha(activeProfileId, newSha);
      updateProfileFlow(activeProfileId, flow);
    } catch (err) {
      console.error('Erreur de sauvegarde :', err);
      alert('Sauvegarde échouée. Vérifie ta connexion ou ton token GitHub.');
    } finally {
      setSaving(false);
    }
  }, [token, username, activeProfileId, shaCache, getNodes, getEdges, setSaving, setSha, updateProfileFlow]);

  /* ─── Ajout d'une fiche ─── */
  const addBubble = useCallback(
    (pos: { x: number; y: number }) => {
      setNodes((ns) => [
        ...ns,
        {
          id: nanoid(),
          type: 'bubble',
          position: { x: pos.x - 107, y: pos.y - 17 },
          data: {
            title: 'Nouvelle fiche',
            content: '',
            color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
            collapsed: false,
          },
        },
      ]);
    },
    [setNodes]
  );

  /* ─── Mise à jour / suppression d'une fiche ─── */
  const updateNode = useCallback(
    (id: string, patch: Partial<NodeData>) =>
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))),
    [setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges]
  );

  /* ─── Raccourcis clavier ─── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inInput = ['INPUT', 'TEXTAREA'].includes(
        (document.activeElement?.tagName ?? '')
      );

      /* Shift+A — ajouter une fiche à la position du curseur */
      if (e.shiftKey && e.key.toUpperCase() === 'A' && !inInput) {
        e.preventDefault();
        addBubble(screenToFlowPosition(mousePos));
        return;
      }

      /* Ctrl/Cmd+S — sauvegarder */
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      /* Ctrl/Cmd+T — rechercher */
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      /* Échap — fermer menus */
      if (e.key === 'Escape') {
        setCtxMenu(null);
        setSearchOpen(false);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mousePos, screenToFlowPosition, addBubble, handleSave, setSearchOpen]);

  /* ─── Mémoisation des nodeTypes ─── */
  const nodeTypes = useMemo(() => NODE_TYPES, []);

  /* ─── Fond ─── */
  const variant = bgVariant(background);

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {!loaded && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 13, zIndex: 10,
            background: 'var(--bg)',
          }}
        >
          ◈ Chargement…
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={() => { setCtxMenu(null); }}
        nodeTypes={nodeTypes}
        /* Navigation style Blender : clic-molette = pan, scroll = zoom */
        panOnDrag={[1, 2]}
        selectionOnDrag={false}
        zoomOnScroll
        zoomOnPinch
        minZoom={0.1}
        maxZoom={5}
        defaultEdgeOptions={{ type: 'smoothstep', deletable: true }}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 1 }}
      >
        {variant && (
          <Background
            variant={variant}
            color="var(--dot)"
            gap={background === 'dots' ? 24 : 28}
            size={background === 'dots' ? 1.5 : 1}
          />
        )}
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Indice si le canvas est vide */}
      {nodes.length === 0 && (
        <div className="empty-hint" style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>◈</div>
          <div>Espace vide</div>
          <div>
            <kbd>Shift+A</kbd> pour ajouter une fiche &nbsp;·&nbsp;{' '}
            <kbd>Clic-molette</kbd> pour déplacer
          </div>
        </div>
      )}

      {/* Badge de sauvegarde */}
      {saving && <div className="saving-badge">◌ Sauvegarde…</div>}

      {/* Menu contextuel */}
      {ctxMenu && (
        <ContextMenu
          menu={ctxMenu}
          nodes={nodes}
          currentBackground={background}
          onClose={() => setCtxMenu(null)}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          onAddNode={addBubble}
        />
      )}

      {/* Recherche */}
      <SearchOverlay nodes={nodes} />
    </div>
  );
}
