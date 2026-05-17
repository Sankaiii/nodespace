import { useEffect, useRef } from 'react';
import { useReactFlow, type Node } from 'reactflow';
import { useStore } from '../store/useStore';
import { DEFAULT_COLORS, type NodeData, type CtxMenu, type Background } from '../types';
import { nanoid } from 'nanoid';

const BG_OPTIONS = [
  { value: 'dots'  as Background, label: 'Points',    icon: '.' },
  { value: 'grid'  as Background, label: 'Quadrille', icon: '#' },
  { value: 'lines' as Background, label: 'Lignes',    icon: '=' },
  { value: 'none'  as Background, label: 'Vide',      icon: 'O' },
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

  const pw = ref.current?.parentElement?.offsetWidth ?? 9999;
  const ph = ref.current?.parentElement?.offsetHeight ?? 9999;
  const safeX = Math.min(menu.x, pw - 170);
  const safeY = Math.min(menu.y, ph - (menu.type === 'node' ? 340 : 260));

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && e.target instanceof Element && !ref.current.contains(e.target)) onClose();
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function duplicateNode(n: Node<NodeData>) {
    setNodes((ns) => [...ns, {
      id: nanoid(), type: 'bubble',
      position: { x: n.position.x + 30, y: n.position.y + 30 },
      data: { ...n.data, title: n.data.title + ' (copie)', isNew: false },
    }]);
    onClose();
  }

  return (
    <div ref={ref} className="ctx-menu" style={{ left: safeX, top: safeY }}>
      {menu.type === 'node' && node && (
        <>
          <div className="ctx-item" onClick={() => { onUpdateNode(node.id, { isNew: true }); onClose(); }}>
            <span>F2</span> Renommer
          </div>
          <div className="ctx-item" onClick={() => duplicateNode(node)}>
            <span>+</span> Dupliquer <span className="ctx-shortcut">Shift+D</span>
          </div>
          <div className="ctx-item" onClick={() => { onUpdateNode(node.id, { collapsed: !node.data.collapsed }); onClose(); }}>
            <span>{node.data.collapsed ? '+' : '-'}</span> {node.data.collapsed ? 'Developper' : 'Reduire'}
          </div>
          <div className="ctx-item" onClick={() => { onUpdateNode(node.id, { locked: !node.data.locked }); onClose(); }}>
            <span>{node.data.locked ? 'U' : 'L'}</span> {node.data.locked ? 'Deverrouiller' : 'Verrouiller'}
          </div>
          <div className="ctx-sep" />
          <div className="ctx-label">Couleur des contours</div>
          <div className="ctx-swatches">
            {DEFAULT_COLORS.map((col) => (
              <div key={col} className={`swatch${node.data.color === col ? ' active' : ''}`}
                style={{ background: col }} onClick={() => { onUpdateNode(node.id, { color: col }); onClose(); }} />
            ))}
          </div>
          <div className="ctx-sep" />
          <div className="ctx-item danger" onClick={() => { onDeleteNode(node.id); onClose(); }}>
            <span>X</span> Supprimer <span className="ctx-shortcut">X</span>
          </div>
        </>
      )}

      {menu.type === 'pane' && (
        <>
          <div className="ctx-item" onClick={() => { if (menu.flowPos) onAddNode(menu.flowPos); onClose(); }}>
            <span>+</span> Nouvelle fiche <span className="ctx-shortcut">Shift+A</span>
          </div>
          <div className="ctx-item" onClick={() => { fitView({ duration: 400 }); onClose(); }}>
            <span>[]</span> Ajuster la vue <span className="ctx-shortcut">F</span>
          </div>
          <div className="ctx-sep" />
          <div className="ctx-label">Fond du canvas</div>
          {BG_OPTIONS.map((opt) => (
            <div key={opt.value} className="ctx-item"
              style={currentBackground === opt.value ? { color: 'var(--accent)' } : undefined}
              onClick={() => { setBackground(opt.value); onClose(); }}>
              {opt.label}
              {currentBackground === opt.value && <span style={{ marginLeft: 'auto', fontSize: 10 }}>ok</span>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
