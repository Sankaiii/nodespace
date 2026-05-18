import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import type { ImageNodeData } from '../types';

export const ImageNode = memo(function ImageNode({
  id,
  data,
  selected,
}: NodeProps<ImageNodeData>) {
  const { setNodes, setEdges } = useReactFlow();

  const deleteThis = useCallback(() => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
  }, [id, setNodes, setEdges]);

  const updateLabel = useCallback(
    (label: string) =>
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
      ),
    [id, setNodes]
  );

  return (
    <div className={`image-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" />

      <div className="image-node-header">
        <i className="ti ti-photo" style={{ color: 'var(--text-muted)', fontSize: 13 }} aria-hidden="true" />
        <input
          className="image-node-label nodrag"
          value={data.label ?? 'Image'}
          onChange={(e) => updateLabel(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 10.5, color: 'var(--text-muted)', flex: 1,
            fontFamily: 'inherit', cursor: 'text',
          }}
        />
        <button
          className="image-node-delete nodrag"
          onClick={(e) => { e.stopPropagation(); deleteThis(); }}
          title="Supprimer"
          aria-label="Supprimer l'image"
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>

      {data.src ? (
        <img
          src={data.src}
          alt={data.label ?? 'Image'}
          className="image-node-preview"
          draggable={false}
        />
      ) : (
        <div className="image-node-drop">
          <i className="ti ti-photo-off" style={{ fontSize: 28, opacity: .3 }} aria-hidden="true" />
          <span>Aucune image</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
});
