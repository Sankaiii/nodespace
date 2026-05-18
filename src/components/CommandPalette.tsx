import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useStore } from '../store/useStore';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: string;
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
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  const COMMANDS: Command[] = [
    { id: 'add',      icon: 'ti-plus',         label: 'Ajouter une fiche',       shortcut: 'Shift+A', action: () => { onAddBubble(); onClose(); } },
    { id: 'save',     icon: 'ti-cloud-upload',  label: 'Sauvegarder sur GitHub',  shortcut: 'Ctrl+S',  action: () => { onSave(); onClose(); } },
    { id: 'search',   icon: 'ti-search',        label: 'Rechercher',              shortcut: 'Ctrl+F',  action: () => { setSearchOpen(true); onClose(); } },
    { id: 'fit',      icon: 'ti-focus-2',       label: 'Ajuster la vue',          shortcut: 'F',       action: () => { fitView({ duration: 400 }); onClose(); } },
    { id: 'theme',    icon: 'ti-moon',          label: `Theme ${theme === 'dark' ? 'clair' : 'sombre'}`, action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); onClose(); } },
    { id: 'bg-dots',  icon: 'ti-dots',          label: 'Fond : Points',           action: () => { setBackground('dots');  onClose(); } },
    { id: 'bg-grid',  icon: 'ti-grid-4x4',      label: 'Fond : Quadrille',        action: () => { setBackground('grid');  onClose(); } },
    { id: 'bg-lines', icon: 'ti-layout-rows',   label: 'Fond : Lignes',           action: () => { setBackground('lines'); onClose(); } },
    { id: 'bg-none',  icon: 'ti-square',        label: 'Fond : Vide',             action: () => { setBackground('none');  onClose(); } },
    { id: 'logout',   icon: 'ti-logout',        label: 'Se deconnecter',          action: () => { if (confirm('Se deconnecter ?')) { clearAuth(); onClose(); } } },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  if (!open) return null;

  return (
    <>
      <div className="palette-backdrop" onClick={onClose} />
      <div className="palette">
        <div className="palette-header">
          <i className="ti ti-search palette-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && filtered.length > 0) filtered[0].action(); }}
            placeholder="Tapez une commande..."
            aria-label="Palette de commandes"
          />
          <span className="palette-hint">Echap</span>
        </div>

        <div className="palette-list">
          {filtered.length === 0 ? (
            <div className="palette-empty">Aucune commande trouvee</div>
          ) : (
            filtered.map((cmd) => (
              <div key={cmd.id} className="palette-item" onClick={cmd.action}>
                <i className={`ti ${cmd.icon} palette-item-icon`} aria-hidden="true" />
                <span className="palette-item-label">{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="palette-item-shortcut">{cmd.shortcut}</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          Entree selectionner &nbsp;·&nbsp; Echap fermer
        </div>
      </div>
    </>
  );
}
