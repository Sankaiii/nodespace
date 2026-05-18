import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState, useReactFlow,
  type Connection, type Edge, type Node, type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';

import { BubbleNode } from './BubbleNode';
import { ImageNode } from './ImageNode';
import { ContextMenu } from './ContextMenu';
import { SearchOverlay } from './SearchOverlay';
import { CommandPalette } from './CommandPalette';
import { OnboardingOverlay } from './OnboardingOverlay';
import { useStore } from '../store/useStore';
import { loadCanvas, saveCanvas } from '../utils/github';
import { compressImage, getImageFromClipboard, getImageFromDrop } from '../utils/imageUtils';
import { showToast } from './Toast';
import { DEFAULT_COLORS, type NodeData, type ImageNodeData, type CtxMenu, type Background as BgType } from '../types';

const NODE_TYPES = { bubble: BubbleNode, image: ImageNode };

function bgVariant(bg: BgType): BackgroundVariant | null {
  if (bg === 'dots')  return BackgroundVariant.Dots;
  if (bg === 'grid')  return BackgroundVariant.Cross;
  if (bg === 'lines') return BackgroundVariant.Lines;
  return null;
}

function makeWelcomeNodes(): Node<NodeData>[] {
  return [
    { id: 'w1', type: 'bubble', position: { x: 80, y: 70 },
      data: { title: 'Bienvenue sur NodeSpace ◈', content: 'Shift+A pour ajouter une fiche\nDouble-clic pour editer\nClic-molette pour naviguer', color: '#7F77DD', collapsed: false } },
    { id: 'w2', type: 'bubble', position: { x: 390, y: 80 },
      data: { title: 'Connexions Bezier', content: 'Relie les fiches via les points\nblancs sur les cotes.\nLes liens sont de vraies courbes.', color: '#1D9E75', collapsed: false } },
    { id: 'w3', type: 'bubble', position: { x: 200, y: 290 },
      data: { title: 'GitHub Sync', content: 'Ctrl+S -> commit auto\nImages : Ctrl+V ou drag & drop', color: '#D85A30', collapsed: false } },
  ];
}
const WELCOME_EDGES: Edge[] = [
  { id: 'we1', source: 'w1', target: 'w2', type: 'default', style: { stroke: '#7F77DD', strokeWidth: 1.5 } },
  { id: 'we2', source: 'w1', target: 'w3', type: 'default', style: { stroke: '#7F77DD', strokeWidth: 1.5 } },
];

export function Canvas() {
  const {
    activeProfileId, profiles, background,
    token, username, shaCache, guestMode,
    setSha, setSaving, saving, updateProfileFlow, setSearchOpen,
    firstLaunch, setFirstLaunch,
  } = useStore();

  const activeProfile = profiles.find((p) => p.id === activeProfileId)!;
  const hasNodes = activeProfile.flow.nodes.length > 0;

  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData | ImageNodeData>(
    hasNodes ? (activeProfile.flow.nodes as Node<NodeData | ImageNodeData>[]) : makeWelcomeNodes()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    hasNodes ? activeProfile.flow.edges : WELCOME_EDGES
  );

  const [ctxMenu, setCtxMenu]         = useState<CtxMenu | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 });
  const [loaded, setLoaded]           = useState(false);
  const [dragOver, setDragOver]       = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes, getEdges, fitView } = useReactFlow();

  /* ── Bloquer menu navigateur ── */
  useEffect(() => {
    const prevent = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.('.canvas-container')) e.preventDefault();
    };
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  /* ── Chargement GitHub ── */
  useEffect(() => {
    if (guestMode || !token || !username) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const { flow, sha } = await loadCanvas(token, username, activeProfileId);
      if (cancelled) return;
      if (flow?.nodes.length) {
        setNodes(flow.nodes as Node<NodeData | ImageNodeData>[]);
        setEdges(flow.edges);
        if (sha) setSha(activeProfileId, sha);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── CTRL+V — coller image ── */
  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const file = getImageFromClipboard(e);
      if (!file) return;
      e.preventDefault();
      try {
        const src = await compressImage(file);
        const pos = screenToFlowPosition(mousePos);
        setNodes((ns) => [...ns, {
          id: nanoid(), type: 'image',
          position: { x: pos.x - 110, y: pos.y - 60 },
          data: { src, label: 'Image' } as ImageNodeData,
        }]);
        showToast('Image ajoutee');
      } catch { showToast('Erreur image', 'error'); }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [mousePos, screenToFlowPosition, setNodes]);

  /* ── Drag & Drop images ── */
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) setDragOver(true);
  }
  function onDragLeave() { setDragOver(false); }
  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = getImageFromDrop(e.nativeEvent as DragEvent);
    if (!file) return;
    try {
      const src = await compressImage(file);
      const rect = containerRef.current?.getBoundingClientRect();
      const pos = screenToFlowPosition({ x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
      setNodes((ns) => [...ns, {
        id: nanoid(), type: 'image',
        position: { x: pos.x - 110, y: pos.y - 60 },
        data: { src, label: file.name.replace(/\.[^.]+$/, '') } as ImageNodeData,
      }]);
      showToast('Image ajoutee');
    } catch { showToast('Erreur image', 'error'); }
  }

  /* ── Connexions ── */
  const onConnect = useCallback((params: Connection) => {
    const src = nodes.find((n) => n.id === params.source);
    const color = (src?.data as NodeData)?.color ?? '#7F77DD';
    setEdges((eds) => addEdge({
      ...params,
      type: 'default',   /* vraies courbes Bezier */
      style: { stroke: color, strokeWidth: 1.5, opacity: .65 },
    }, eds));
  }, [nodes, setEdges]);

  /* ── Menus contextuels ── */
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
      x: ce.clientX - rect.left, y: ce.clientY - rect.top,
      flowPos: screenToFlowPosition({ x: ce.clientX, y: ce.clientY }),
    });
  }, [screenToFlowPosition]);

  /* ── Sauvegarde ── */
  const handleSave = useCallback(async () => {
    if (guestMode) { showToast('Mode invite — donnees locales', 'info'); return; }
    if (!token || !username) return;
    const flow = { nodes: getNodes() as Node<NodeData>[], edges: getEdges() };
    setSaving(true);
    try {
      const sha = await saveCanvas(token, username, activeProfileId, flow, shaCache[activeProfileId] ?? null);
      if (sha) setSha(activeProfileId, sha);
      updateProfileFlow(activeProfileId, flow);
      showToast('Sauvegarde sur GitHub');
    } catch (err) { showToast('Erreur de sauvegarde', 'error'); console.error(err); }
    finally { setSaving(false); }
  }, [token, username, guestMode, activeProfileId, shaCache, getNodes, getEdges, setSaving, setSha, updateProfileFlow]);

  /* ── Ajouter fiche ── */
  const addBubble = useCallback((pos?: { x: number; y: number }) => {
    const p = pos ?? screenToFlowPosition(mousePos);
    setNodes((ns) => [...ns, {
      id: nanoid(), type: 'bubble',
      position: { x: p.x - 110, y: p.y - 20 },
      data: {
        title: 'Nouvelle fiche', content: '',
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        collapsed: false, isNew: true,
      } as NodeData,
    }]);
  }, [mousePos, screenToFlowPosition, setNodes]);

  /* ── Dupliquer ── */
  const duplicateBubble = useCallback(() => {
    const sel = getNodes().filter((n) => n.selected);
    if (!sel.length) return;
    setNodes((ns) => [...ns, ...sel.map((n) => ({
      ...n, id: nanoid(), selected: false,
      position: { x: n.position.x + 28, y: n.position.y + 28 },
      data: { ...n.data, isNew: false },
    }))]);
    showToast(`${sel.length} fiche${sel.length > 1 ? 's' : ''} dupliquee${sel.length > 1 ? 's' : ''}`);
  }, [getNodes, setNodes]);

  /* ── Update / Delete ── */
  const updateNode = useCallback((id: string, patch: Partial<NodeData>) =>
    setNodes((ns) => ns.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)), [setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  /* ── Raccourcis clavier ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '');
      const ctrl = e.ctrlKey || e.metaKey;

      /* Shift+A — ajouter */
      if (e.shiftKey && e.key.toUpperCase() === 'A' && !inInput) { e.preventDefault(); addBubble(); return; }
      /* Shift+D — dupliquer */
      if (e.shiftKey && e.key.toUpperCase() === 'D' && !inInput) { e.preventDefault(); duplicateBubble(); return; }
      /* Ctrl+S — sauvegarder */
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); return; }
      /* Ctrl+F ou Ctrl+T — rechercher */
      if (ctrl && (e.key === 'f' || e.key === 't')) { e.preventDefault(); setSearchOpen(true); return; }
      /* Ctrl+Space — palette */
      if (ctrl && e.key === ' ' && !inInput) { e.preventDefault(); setPaletteOpen(true); return; }
      /* F / Home — ajuster vue */
      if ((e.key === 'f' || e.key === 'F' || e.key === 'Home') && !ctrl && !inInput) { fitView({ duration: 400, padding: .3 }); return; }

      /* X ou Delete / Backspace — supprimer sélectionnés */
      if ((e.key === 'x' || e.key === 'X') && !inInput) {
        const sel = getNodes().filter((n) => n.selected);
        sel.forEach((n) => deleteNode(n.id));
        if (sel.length) showToast(`${sel.length} fiche${sel.length > 1 ? 's' : ''} supprimee${sel.length > 1 ? 's' : ''}`);
        return;
      }

      if (e.key === 'Escape') { setCtxMenu(null); setPaletteOpen(false); setSearchOpen(false); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mousePos, addBubble, duplicateBubble, handleSave, setSearchOpen, fitView, getNodes, deleteNode]);

  const nodeTypes = useMemo(() => NODE_TYPES, []);
  const variant = bgVariant(background);

  return (
    <div
      ref={containerRef}
      className={`canvas-container${dragOver ? ' canvas-dragover' : ''}`}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
        minZoom={0.06} maxZoom={5}
        defaultEdgeOptions={{ type: 'default', deletable: true }}
        deleteKeyCode={['Delete', 'Backspace']}
        proOptions={{ hideAttribution: true }}
        fitView fitViewOptions={{ padding: .4, maxZoom: 1 }}
      >
        {variant && (
          <Background variant={variant} color="var(--dot)"
            gap={background === 'dots' ? 24 : 28}
            size={background === 'dots' ? 1.5 : 1} />
        )}
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => (n.data as NodeData)?.color ?? 'var(--accent)'}
          maskColor="rgba(0,0,0,0.5)"
          style={{ bottom: 38, right: 14 }}
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="empty-hint">
          <div style={{ fontSize: 32, marginBottom: 10 }}>◈</div>
          <div>Espace vide</div>
          <div><kbd>Shift+A</kbd> ajouter · <kbd>Clic-molette</kbd> naviguer · <kbd>Ctrl+V</kbd> coller image</div>
        </div>
      )}

      {saving && <div className="saving-badge">Sauvegarde...</div>}
      {guestMode && <div className="guest-badge">Mode invite</div>}

      {ctxMenu && (
        <ContextMenu menu={ctxMenu} nodes={nodes as Node<NodeData>[]} currentBackground={background}
          onClose={() => setCtxMenu(null)} onUpdateNode={updateNode}
          onDeleteNode={deleteNode} onAddNode={addBubble} />
      )}

      <SearchOverlay nodes={nodes as Node<NodeData>[]} />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
        onAddBubble={() => addBubble()} onSave={handleSave} />

      {firstLaunch && <OnboardingOverlay onDismiss={() => setFirstLaunch(false)} />}
    </div>
  );
}
