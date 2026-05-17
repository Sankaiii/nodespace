import { useEffect, useRef, useState } from 'react';
import { useReactFlow, type Node } from 'reactflow';
import { useStore } from '../store/useStore';
import type { NodeData } from '../types';

interface Props {
  nodes: Node<NodeData>[];
}

export function SearchOverlay({ nodes }: Props) {
  const searchOpen = useStore((s) => s.searchOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const { setCenter, getZoom } = useReactFlow();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /* Focus à l'ouverture */
  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  if (!searchOpen) return null;

  const q = query.toLowerCase().trim();
  const results = q
    ? nodes.filter(
        (n) =>
          n.data.title.toLowerCase().includes(q) ||
          n.data.content.toLowerCase().includes(q)
      )
    : nodes.slice(0, 8);

  function focusNode(node: Node<NodeData>) {
    const z = Math.max(getZoom(), 0.8);
    setCenter(node.position.x + 107, node.position.y + 52, {
      zoom: z,
      duration: 400,
    });
    setSearchOpen(false);
  }

  function highlight(text: string, term: string) {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(127,119,221,0.3)', color: 'inherit', borderRadius: 2 }}>
          {text.slice(idx, idx + term.length)}
        </mark>
        {text.slice(idx + term.length)}
      </>
    );
  }

  return (
    <div className="search-overlay">
      <input
        ref={inputRef}
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Rechercher dans ${nodes.length} fiche${nodes.length > 1 ? 's' : ''}…`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setSearchOpen(false);
          if (e.key === 'Enter' && results.length > 0) focusNode(results[0]);
        }}
      />

      <div className="search-results">
        {results.length === 0 ? (
          <div className="search-item" style={{ cursor: 'default', opacity: 0.5 }}>
            Aucun résultat
          </div>
        ) : (
          results.map((node) => (
            <div key={node.id} className="search-item" onClick={() => focusNode(node)}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: node.data.color,
                  marginRight: 6,
                  flexShrink: 0,
                }}
              />
              <span className="search-item-title">
                {highlight(node.data.title, q)}
              </span>
              {node.data.content && (
                <div className="search-item-preview">
                  {highlight(
                    node.data.content.slice(0, 60) +
                      (node.data.content.length > 60 ? '…' : ''),
                    q
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
