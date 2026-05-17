import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  addEdge, useNodesState, useEdgesState, useReactFlow,
  type Connection, type Edge, type Node, type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import { BubbleNode } from './BubbleNode';
import { ContextMenu } from './ContextMenu';
import { SearchOverlay } from './SearchOverlay';
import { CommandPalette } from './CommandPalette';
import { OnboardingOverlay } from './OnboardingOverlay';
import { useStore } from '../store/useStore';
import { loadCanvas, saveCanvas } from '../utils/github';
import { showToast } from './Toast';
import { DEFAULT_COLORS, type NodeData, type CtxMenu, type Background as BgType } from '../types';

const NODE_TYPES = { bubble: BubbleNode };

function bgVariant(bg: BgType): BackgroundVariant | null {
  if (bg === 'dots')  return BackgroundVariant.Dots;
  if (bg === 'grid')  return BackgroundVariant.Cross;
  if (bg === 'lines') return BackgroundVariant.Lines;
  return null;
}

function makeWelcomeNodes(): Node<NodeData>[] {
  return [
    { id: 'w1', type: 'bubble', position: { x: 80, y: 60 },
      data: { title: 'Bienvenue sur NodeSpace', content: 'Shift+A pour ajouter une fiche\nDouble-clic pour editer\nClic-molette pour naviguer', color: '#7F77DD', collapsed: false } },
    { id: 'w2', type: 'bubble', position: { x: 370, y: 70 },
      data: { title: 'Connexions', content: 'Relie les fiches via les points blancs sur les cotes.', color: '#1D9E75', collapsed: false } },
    { id: 'w3', type: 'bubble', position: { x: 185, y: 270 },
      data: { title: 'GitHub Sync', content: 'Ctrl+S -> commit automatique\nsur ton depot prive.', color: '#D85A30', collapsed: false } },
  ];
}
const WELCOME_EDGES: Edge[] = [
  { id: 'we1', source: 'w1', target: 'w2', type: 'smoothstep', animated: true, style: { stroke: '#7F77DD', strokeWidth: 1.5, opacity: 0.55 } },
  { id: 'we2', source: 'w1', target: 'w3', type: 'smoothstep', animated: true, style: { stroke: '#7F77DD', strokeWidth: 1.5, opacity: 0.55 } },
];

export function Canvas() {
  const {
    activeProfileId, profiles, background,
    token, username, shaCache, guestMode,
    setSha, setSaving, saving, updateProfileFlow, setSearchOpen,
    firstLaunch, setFirstLaunch, animations,
  } = useStore();

  const activeProfile = profiles.find((p) => p.id === activeProfileId)!;
  const hasNodes = activeProfile.flow.nodes.length > 0;

  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(
    hasNodes ? activeProfile.flow.nodes : makeWelcomeNodes()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    hasNodes ? activeProfile.flow.edges : WELCOME_EDGES
  );

  const [ctxMenu, setCtxMenu]       = useState<CtxMenu | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });
  const [loaded, setLoaded]         = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes, getEdges, fitView } = useReactFlow();

  /* Bloquer menu navigateur dans le canvas */
  useEffect(() => {
    const prevent = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.('.canvas-container')) e.preventDefault();
    };
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  /* Chargement depuis GitHub */
  useEffect(() => {
    if (guestMode || !token || !username) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const { flow, sha } = await loadCanvas(token, username, activeProfileId);
      if (cancelled) return;
      if (flow?.nodes.length) {
        setNodes(flow.nodes);
        setEdges(flow.edges);
        if (sha) setSha(activeProfileId, sha);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Connexion entre fiches */
  const onConnect = useCallback((params: Connection) => {
    const src = nodes.find((n) => n.id === params.source);
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: animations,
      style: { stroke: src?.data.color ?? '#7F77DD', strokeWidth: 1.5, opacity: 0.55 },
    }, eds));
  }, [nodes, setEdges, animations]);

  /* Menus contextuels */
  const onNodeCtx: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCtxMenu({ type: 'node', x: e.clientX - rect.left, y: e.clientY - rect.top, nodeId: node.id });
  }, []);

  const onPaneCtx = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ce = e as React.MouseEvent;
    setCtxMenu({
      type: 'pane',
      x: ce.clientX - rect.left,
      y: ce.clientY - rect.top,
      flowPos: screenToFlowPosition({ x: ce.clientX, y: ce.clientY }),
    });
  }, [screenToFlowPosition]);

  /* Sauvegarde */
  const handleSave = useCallback(async () => {
    if (guestMode) { showToast('Mode invite — donnees en local', 'info'); return; }
    if (!token || !username) return;
    const flow = { nodes: getNodes() as Node<NodeData>[], edges: getEdges() };
    setSaving(true);
    try {
      const sha = await saveCanvas(token, username, activeProfileId, flow, shaCache[activeProfileId] ?? null);
      if (sha) setSha(activeProfileId, sha);
      updateProfileFlow(activeProfileId, flow);
      showToast('Sauvegarde sur GitHub');
    } catch (err) {
      showToast('Erreur de sauvegarde', 'error');
      console.error(err);
    } finally { setSaving(false); }
  }, [token, username, guestMode, activeProfileId, shaCache, getNodes, getEdges, setSaving, setSha, updateProfileFlow]);

  /* Ajouter */
  const addBubble = useCallback((pos?: { x: number; y: number }) => {
    const p = pos ?? screenToFlowPosition(mousePos);
    setNodes((ns) => [...ns, {
      id: nanoid(), type: 'bubble',
      position: { x: p.x - 107, y: p.y - 17 },
      data: {
        title: 'Nouvelle fiche', content: '',
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        collapsed: false, isNew: true,
      },
    }]);
  }, [mousePos, screenToFlowPosition, setNodes]);

  /* Dupliquer */
  const duplicateBubble = useCallback(() => {
    const sel = getNodes().filter((n) => n.selected);
    if (!sel.length) return;
    setNodes((ns) => [...ns, ...sel.map((n) => ({
      ...n, id: nanoid(),
      position: { x: n.position.x + 25, y: n.position.y + 25 },
      data: { ...n.data, isNew: false },
    }))]);
    showToast(`${sel.length} fiche${sel.length > 1 ? 's' : ''} dupliquee${sel.length > 1 ? 's' : ''}`);
  }, [getNodes, setNodes]);

  /* Update / Delete */
  const updateNode = useCallback((id: string, patch: Partial<NodeData>) =>
    setNodes((ns) => ns.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)), [setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  /* Raccourcis clavier */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '');
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.shiftKey && e.key.toUpperCase() === 'A' && !inInput) { e.preventDefault(); addBubble(); return; }
      if (e.shiftKey && e.key.toUpperCase() === 'D' && !inInput) { e.preventDefault(); duplicateBubble(); return; }
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); return; }
      if (ctrl && (e.key === 'f' || e.key === 't')) { e.preventDefault(); setSearchOpen(true); return; }
      if (ctrl && e.key === ' ' && !inInput) { e.preventDefault(); setPaletteOpen(true); return; }
      if (e.key === 'f' && !ctrl && !inInput) { fitView({ duration: 400, padding: 0.3 }); return; }
      if (e.key === 'Home' && !inInput) { fitView({ duration: 400, padding: 0.3 }); return; }
      if (e.key === 'Escape') { setCtxMenu(null); setPaletteOpen(false); setSearchOpen(false); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mousePos, addBubble, duplicateBubble, handleSave, setSearchOpen, fitView]);

  const nodeTypes = useMemo(() => NODE_TYPES, []);
  const variant = bgVariant(background);

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {!loaded && <div className="canvas-loading">Chargement...</div>}

      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeCtx}
        onPaneContextMenu={onPaneCtx}
        onEdgeContextMenu={(e) => e.preventDefault()}
        onPaneClick={() => setCtxMenu(null)}
        nodeTypes={nodeTypes}
        panOnDrag={[1, 2]}
        selectionOnDrag={false}
        zoomOnScroll zoomOnPinch
        minZoom={0.08} maxZoom={5}
        defaultEdgeOptions={{ type: 'smoothstep', animated: animations, deletable: true }}
        deleteKeyCode={['Delete', 'Backspace']}
        proOptions={{ hideAttribution: true }}
        fitView fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
      >
        {variant && (
          <Background variant={variant} color="var(--dot)"
            gap={background === 'dots' ? 24 : 28}
            size={background === 'dots' ? 1.5 : 1} />
        )}
        <Controls showInteractive={false} />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="empty-hint">
          <div style={{ fontSize: 26, marginBottom: 8 }}>◈</div>
          <div>Espace vide</div>
          <div><kbd>Shift+A</kbd> ajouter · <kbd>Clic-molette</kbd> naviguer</div>
        </div>
      )}

      {saving && <div className="saving-badge">Sauvegarde...</div>}
      {guestMode && <div className="guest-badge">Mode invite — donnees locales</div>}

      {ctxMenu && (
        <ContextMenu menu={ctxMenu} nodes={nodes} currentBackground={background}
          onClose={() => setCtxMenu(null)} onUpdateNode={updateNode}
          onDeleteNode={deleteNode} onAddNode={addBubble} />
      )}

      <SearchOverlay nodes={nodes} />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
        onAddBubble={() => addBubble()} onSave={handleSave} />

      {firstLaunch && <OnboardingOverlay onDismiss={() => setFirstLaunch(false)} />}
    </div>
  );
}
