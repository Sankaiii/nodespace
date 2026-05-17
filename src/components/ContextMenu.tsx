import { useEffect, useRef } from 'react';
import type { Node } from 'reactflow';
import { useStore } from '../store/useStore';
import { DEFAULT_COLORS, type NodeData, type CtxMenu, type Background } from '../types';

const BG_OPTIONS: { value: Background; label: string; icon: string }[] = [
  { value: 'dots',  label: 'Points',    icon: '·' },
  { value: 'grid',  label: 'Quadrillé', icon: '⊞' },
  { value: 'lines', label: 'Lignes',    icon: '≡' },
  { value: 'none',  label: 'Vide',      icon: '○' },
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

export function ContextMenu({
  menu,
  nodes,
  currentBackground,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
}: Props) {
  const setBackground = useStore((s) => s.setBackground);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Clamp pour ne pas sortir du canvas */
  const safeX = Math.min(menu.x, (containerRef.current?.parentElement?.offsetWidth ?? 999) - 170);
  const safeY = Math.min(menu.y, (containerRef.current?.parentElement?.offsetHeight ?? 999) - 300);

  /* Fermer au clic extérieur */
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && e.target instanceof Element && !containerRef.current.contains(e.target)) {
        onClose();
      }
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [onClose]);

  /* Fermer à l'Échap */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const node = menu.type === 'node' ? nodes.find((n) => n.id === menu.nodeId) : null;

  return (
    <div
      ref={containerRef}
      className="ctx-menu"
      style={{ left: safeX, top: safeY }}
    >
      {/* ── Menu sur une fiche ── */}
      {menu.type === 'node' && node && (
        <>
          <div
            className="ctx-item"
            onClick={() => {
              onUpdateNode(node.id, { collapsed: !node.data.collapsed });
              onClose();
            }}
          >
            <span>{node.data.collapsed ? '⊞' : '⊟'}</span>
            {node.data.collapsed ? 'Développer' : 'Réduire'}
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
                onClick={() => {
                  onUpdateNode(node.id, { color: col });
                  onClose();
                }}
              />
            ))}
          </div>

          <div className="ctx-sep" />
          <div
            className="ctx-item danger"
            onClick={() => {
              onDeleteNode(node.id);
              onClose();
            }}
          >
            <span>✕</span> Supprimer
          </div>
        </>
      )}

      {/* ── Menu sur le fond ── */}
      {menu.type === 'pane' && (
        <>
          <div
            className="ctx-item"
            onClick={() => {
              if (menu.flowPos) onAddNode(menu.flowPos);
              onClose();
            }}
          >
            <span>+</span> Ajouter une fiche ici
          </div>

          <div className="ctx-sep" />
          <div className="ctx-label">Fond du canvas</div>

          {BG_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className="ctx-item"
              style={currentBackground === opt.value ? { color: 'var(--accent)' } : undefined}
              onClick={() => {
                setBackground(opt.value);
                onClose();
              }}
            >
              <span style={{ fontFamily: 'monospace' }}>{opt.icon}</span>
              {opt.label}
              {currentBackground === opt.value && (
                <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
