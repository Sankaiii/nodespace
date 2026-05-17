import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import type { NodeData } from '../types';

export const BubbleNode = memo(function BubbleNode({
  id,
  data,
  selected,
}: NodeProps<NodeData>) {
  const [editing, setEditing] = useState(false);
  const { setNodes } = useReactFlow();

  const update = useCallback(
    (patch: Partial<NodeData>) => {
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
      );
    },
    [id, setNodes]
  );

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(true);
  }

  function stopEdit() {
    setEditing(false);
  }

  return (
    <div
      className={`bubble${selected ? ' selected' : ''}${data.collapsed ? ' collapsed' : ''}`}
      style={{ '--nc': data.color } as React.CSSProperties}
      onDoubleClick={startEdit}
    >
      {/* Entrée (connexion reçue) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
      />

      {/* ── En-tête ── */}
      <div className="bubble-header">
        <div className="bubble-dot" style={{ background: data.color }} />

        {editing ? (
          <input
            className="bubble-title-input nodrag"
            value={data.title}
            autoFocus
            onChange={(e) => update({ title: e.target.value })}
            onBlur={stopEdit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') e.currentTarget.blur();
            }}
          />
        ) : (
          <span className="bubble-title">{data.title}</span>
        )}

        <button
          className="bubble-collapse-btn nodrag"
          title={data.collapsed ? 'Développer' : 'Réduire'}
          onClick={(e) => {
            e.stopPropagation();
            update({ collapsed: !data.collapsed });
          }}
        >
          {data.collapsed ? '▾' : '▴'}
        </button>
      </div>

      {/* ── Corps ── */}
      {!data.collapsed && (
        <div className="bubble-body">
          {editing ? (
            <textarea
              className="bubble-textarea nodrag nowheel"
              value={data.content}
              rows={4}
              onChange={(e) => update({ content: e.target.value })}
              onBlur={stopEdit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') e.currentTarget.blur();
              }}
            />
          ) : (
            <div className="bubble-text">
              {data.content || (
                <span className="bubble-placeholder">Double-clic pour éditer…</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sortie (connexion émise) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
      />
    </div>
  );
});
