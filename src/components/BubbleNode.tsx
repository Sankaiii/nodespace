import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { nanoid } from 'nanoid';
import type { NodeData, NodeStyle, NodeStatus } from '../types';
import { DEFAULT_COLORS } from '../types';

const STATUS_COLORS: Record<NodeStatus, string> = {
  none: 'transparent',
  todo: '#378ADD',
  inprogress: '#BA7517',
  done: '#1D9E75',
  urgent: '#E24B4A',
  blocked: '#888380',
};

const STATUS_LABELS: Record<NodeStatus, string> = {
  none: '', todo: 'A faire', inprogress: 'En cours', done: 'Termine', urgent: 'Urgent', blocked: 'Bloque',
};

export const BubbleNode = memo(function BubbleNode({ id, data, selected }: NodeProps<NodeData>) {
  const [editing, setEditing] = useState(false);
  const { setNodes, setEdges } = useReactFlow();
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const update = useCallback(
    (patch: Partial<NodeData>) =>
      setNodes((ns) => ns.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    [id, setNodes]
  );

  /* Auto-edition a la creation */
  useEffect(() => {
    if (data.isNew) {
      update({ isNew: false });
      setEditing(true);
      setTimeout(() => titleRef.current?.focus(), 60);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing) setTimeout(() => titleRef.current?.focus(), 30);
  }, [editing]);

  function startEdit(e: React.MouseEvent) {
    if (data.locked) return;
    e.stopPropagation();
    setEditing(true);
  }
  function stopEdit() { setEditing(false); }

  /* Mini toolbar : dupliquer / supprimer */
  function duplicate() {
    setNodes((ns) => [...ns, {
      id: nanoid(), type: 'bubble',
      position: { x: (ns.find(n => n.id === id)?.position.x ?? 0) + 25, y: (ns.find(n => n.id === id)?.position.y ?? 0) + 25 },
      data: { ...data, isNew: false },
    }]);
  }
  function deleteThis() {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
  }

  const nodeStyle: NodeStyle = data.style ?? 'normal';
  const status: NodeStatus = data.status ?? 'none';

  const cls = [
    'bubble',
    `bubble-${nodeStyle}`,
    selected   ? 'selected'  : '',
    data.collapsed ? 'collapsed' : '',
    data.locked    ? 'locked'    : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{ '--nc': data.color } as React.CSSProperties}
      onDoubleClick={startEdit}
    >
      <Handle type="target" position={Position.Left} id="in" />

      {/* Barre de statut */}
      {status !== 'none' && (
        <div className="bubble-status" style={{ background: STATUS_COLORS[status] }}>
          {STATUS_LABELS[status]}
        </div>
      )}

      {/* En-tete */}
      <div className="bubble-header">
        {data.icon && <span className="bubble-icon">{data.icon}</span>}
        <div className="bubble-dot" style={{ background: data.color }} />

        {editing ? (
          <input
            ref={titleRef}
            className="bubble-title-input nodrag"
            value={data.title}
            onChange={(e) => update({ title: e.target.value })}
            onBlur={(e) => { if (e.relatedTarget !== bodyRef.current) stopEdit(); }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Tab') { e.preventDefault(); bodyRef.current?.focus(); }
              if (e.key === 'Enter') bodyRef.current?.focus();
              if (e.key === 'Escape') e.currentTarget.blur();
            }}
          />
        ) : (
          <span className="bubble-title">{data.title}</span>
        )}

        {data.locked && <span className="bubble-lock">L</span>}

        <button
          className="bubble-collapse-btn nodrag"
          title={data.collapsed ? 'Developper' : 'Reduire'}
          onClick={(e) => { e.stopPropagation(); update({ collapsed: !data.collapsed }); }}
        >
          {data.collapsed ? 'v' : '^'}
        </button>
      </div>

      {/* Corps */}
      {!data.collapsed && (
        <div className="bubble-body">
          {editing ? (
            <textarea
              ref={bodyRef}
              className="bubble-textarea nodrag nowheel"
              value={data.content}
              rows={4}
              placeholder="Contenu... (TAB depuis le titre)"
              onChange={(e) => update({ content: e.target.value })}
              onBlur={(e) => { if (e.relatedTarget !== titleRef.current) stopEdit(); }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') stopEdit();
                if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); titleRef.current?.focus(); }
              }}
            />
          ) : (
            <div className="bubble-text">
              {data.content || <span className="bubble-placeholder">Double-clic pour editer...</span>}
            </div>
          )}
        </div>
      )}

      {/* Mini toolbar (visible quand selectionne) */}
      {selected && !editing && (
        <div className="bubble-toolbar nodrag">
          {DEFAULT_COLORS.slice(0, 4).map((col) => (
            <button
              key={col}
              className="btb-color"
              style={{ background: col }}
              title={col}
              onClick={(e) => { e.stopPropagation(); update({ color: col }); }}
            />
          ))}
          <div className="btb-sep" />
          <button className="btb-btn" title="Dupliquer" onClick={(e) => { e.stopPropagation(); duplicate(); }}>+</button>
          <button className="btb-btn" title={data.locked ? 'Deverrouiller' : 'Verrouiller'} onClick={(e) => { e.stopPropagation(); update({ locked: !data.locked }); }}>
            {data.locked ? 'U' : 'L'}
          </button>
          <button className="btb-btn danger" title="Supprimer" onClick={(e) => { e.stopPropagation(); deleteThis(); }}>X</button>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
});
