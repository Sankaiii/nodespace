import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useStore } from '../store/useStore';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAddBubble: () => void;
  onSave: () => void;
}

export function CommandPalette({ open, onClose, onAddBubble, onSave }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  const { setTheme, setBackground, setSearchOpen, theme, clearAuth } = useStore();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const COMMANDS: Command[] = [
    { id: 'add',    label: 'Ajouter une fiche',      icon: '+',  shortcut: 'Shift+A', action: () => { onAddBubble(); onClose(); } },
    { id: 'save',   label: 'Sauvegarder sur GitHub',  icon: '↑',  shortcut: 'Ctrl+S',  action: () => { onSave(); onClose(); } },
    { id: 'search', label: 'Rechercher',              icon: '⌕',  shortcut: 'Ctrl+F',  action: () => { setSearchOpen(true); onClose(); } },
    { id: 'fit',    label: 'Ajuster la vue',          icon: '⊡',  shortcut: 'F',       action: () => { fitView({ duration: 400 }); onClose(); } },
    { id: 'theme',  label: `Thème ${theme === 'dark' ? 'clair' : 'sombre'}`, icon: '◑', action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); onClose(); } },
    { id: 'bg-dots',  label: 'Fond : Points',   icon: '·', action: () => { setBackground('dots');  onClose(); } },
    { id: 'bg-grid',  label: 'Fond : Quadrillé', icon: '⊞', action: () => { setBackground('grid');  onClose(); } },
    { id: 'bg-lines', label: 'Fond : Lignes',    icon: '≡', action: () => { setBackground('lines'); onClose(); } },
    { id: 'bg-none',  label: 'Fond : Vide',      icon: '○', action: () => { setBackground('none');  onClose(); } },
    { id: 'logout', label: 'Se déconnecter',          icon: '⏻',              action: () => { if (confirm('Se déconnecter ?')) { clearAuth(); onClose(); } } },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && filtered.length > 0) filtered[0].action();
  }

  if (!open) return null;

  return (
    <>
      <div className="palette-backdrop" onClick={onClose} />
      <div className="palette">
        <div className="palette-header">
          <span className="palette-icon">⌕</span>
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tapez une commande…"
          />
          <span className="palette-hint">Échap</span>
        </div>
        <div className="palette-list">
          {filtered.length === 0 ? (
            <div className="palette-empty">Aucune commande trouvée</div>
          ) : (
            filtered.map((cmd) => (
              <div key={cmd.id} className="palette-item" onClick={cmd.action}>
                <span className="palette-item-icon">{cmd.icon}</span>
                <span className="palette-item-label">{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="palette-item-shortcut">{cmd.shortcut}</span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="palette-footer">
          ↑↓ naviguer &nbsp;·&nbsp; Entrée sélectionner &nbsp;·&nbsp; Échap fermer
        </div>
      </div>
    </>
  );
}
