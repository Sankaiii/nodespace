import { useEffect, useRef } from 'react';
import { useReactFlow, type Node } from 'reactflow';
import { useStore } from '../store/useStore';
import { DEFAULT_COLORS, type NodeData, type CtxMenu, type Background } from '../types';
import { nanoid } from 'nanoid';

const BG_OPTIONS = [
  { value: 'dots'  as Background, label: 'Points',    icon: 'ti-dots' },
  { value: 'grid'  as Background, label: 'Quadrille', icon: 'ti-grid-4x4' },
  { value: 'lines' as Background, label: 'Lignes',    icon: 'ti-layout-rows' },
  { value: 'none'  as Background, label: 'Vide',      icon: 'ti-square' },
];

interface Props {
  menu: CtxMenu;
  nodes: Node<NodeData>[];
  currentBackground: Background;
  onClose: () => void;
  onUpdateNode: (id: string, patch: Partial<NodeData>) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (pos: { x: number; y: number }) => void;
}

export function ContextMenu({ menu, nodes, currentBackground, onClose, onUpdateNode, onDeleteNode, onAddNode }: Props) {
  const setBackground = useStore((s) => s.setBackground);
  const { setNodes, fitView } = useReactFlow();
  const ref = useRef<HTMLDivElement>(null);
  const node = menu.type === 'node' ? nodes.find((n) => n.id === menu.nodeId) : null;

  const pw = ref.current?.parentElement?.offsetWidth  ?? 9999;
  const ph = ref.current?.parentElement?.offsetHeight ?? 9999;
  const safeX = Math.min(menu.x, pw - 172);
  const safeY = Math.min(menu.y, ph - (menu.type === 'node' ? 350 : 240));

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Element && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener('mousedown', fn);
    return () => window.removeEventListener('mousedown', fn);
  }, [onClose]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  function duplicateNode(n: Node<NodeData>) {
    setNodes((ns) => [...ns, {
      ...n, id: nanoid(), selected: false,
      position: { x: n.position.x + 28, y: n.position.y + 28 },
      data: { ...n.data, isNew: false },
    }]);
    onClose();
  }

  return (
    <div ref={ref} className="ctx-menu" style={{ left: safeX, top: safeY }}>

      {/* ── Menu nœud ── */}
      {menu.type === 'node' && node && (
        <>
          <div className="ctx-item" onClick={() => { onUpdateNode(node.id, { isNew: true }); onClose(); }}>
            <i className="ti ti-pencil" aria-hidden="true" /> Renommer
          </div>
          <div className="ctx-item" onClick={() => duplicateNode(node)}>
            <i className="ti ti-copy" aria-hidden="true" /> Dupliquer
            <span className="ctx-shortcut">Shift+D</span>
          </div>
          <div className="ctx-item" onClick={() => { onUpdateNode(node.id, { collapsed: !node.data.collapsed }); onClose(); }}>
            <i className={`ti ti-${node.data.collapsed ? 'maximize' : 'minimize'}`} aria-hidden="true" />
            {node.data.collapsed ? 'Developper' : 'Reduire'}
          </div>
          <div className="ctx-item" onClick={() => { onUpdateNode(node.id, { locked: !node.data.locked }); onClose(); }}>
            <i className={`ti ti-${node.data.locked ? 'lock-open' : 'lock'}`} aria-hidden="true" />
            {node.data.locked ? 'Deverrouiller' : 'Verrouiller'}
          </div>

          <div className="ctx-sep" />
          <div className="ctx-label">Couleur des contours</div>
          <div className="ctx-swatches">
            {DEFAULT_COLORS.map((col) => (
              <div
                key={col}
                className={`swatch${node.data.color === col ? ' active' : ''}`}
                style={{ background: col }}
                title={col}
                onClick={() => { onUpdateNode(node.id, { color: col }); onClose(); }}
              />
            ))}
          </div>

          <div className="ctx-sep" />
          <div className="ctx-item danger" onClick={() => { onDeleteNode(node.id); onClose(); }}>
            <i className="ti ti-trash" aria-hidden="true" /> Supprimer
            <span className="ctx-shortcut">X</span>
          </div>
        </>
      )}

      {/* ── Menu fond ── */}
      {menu.type === 'pane' && (
        <>
          <div className="ctx-item" onClick={() => { if (menu.flowPos) onAddNode(menu.flowPos); onClose(); }}>
            <i className="ti ti-plus" aria-hidden="true" /> Nouvelle fiche
            <span className="ctx-shortcut">Shift+A</span>
          </div>
          <div className="ctx-item" onClick={() => { fitView({ duration: 400 }); onClose(); }}>
            <i className="ti ti-focus-2" aria-hidden="true" /> Ajuster la vue
            <span className="ctx-shortcut">F</span>
          </div>

          <div className="ctx-sep" />
          <div className="ctx-label">Fond du canvas</div>
          {BG_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className="ctx-item"
              style={currentBackground === opt.value ? { color: 'var(--accent)' } : undefined}
              onClick={() => { setBackground(opt.value); onClose(); }}
            >
              <i className={`ti ${opt.icon}`} aria-hidden="true" /> {opt.label}
              {currentBackground === opt.value && (
                <i className="ti ti-check" style={{ marginLeft: 'auto', fontSize: 11 }} aria-hidden="true" />
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
