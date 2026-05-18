import { useState } from 'react';
import { useStore } from '../store/useStore';
import { SettingsPanel } from './SettingsPanel';

export function TopBar() {
  const profiles        = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const theme           = useStore((s) => s.theme);
  const saving          = useStore((s) => s.saving);
  const guestMode       = useStore((s) => s.guestMode);

  const setActiveProfile = useStore((s) => s.setActiveProfile);
  const addProfile       = useStore((s) => s.addProfile);
  const renameProfile    = useStore((s) => s.renameProfile);
  const deleteProfile    = useStore((s) => s.deleteProfile);
  const setTheme         = useStore((s) => s.setTheme);
  const setSearchOpen    = useStore((s) => s.setSearchOpen);

  const [editingTab, setEditingTab]   = useState<string | null>(null);
  const [tabName, setTabName]         = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleAdd() {
    const name = prompt('Nom du profil :');
    if (name?.trim()) addProfile(name.trim());
  }

  function commitRename(id: string) {
    if (tabName.trim()) renameProfile(id, tabName.trim());
    setEditingTab(null);
  }

  function handleCtxTab(e: React.MouseEvent, id: string) {
    e.preventDefault();
    if (profiles.length <= 1) return;
    const name = profiles.find((p) => p.id === id)?.name ?? '';
    if (confirm(`Supprimer le profil "${name}" ?`)) deleteProfile(id);
  }

  function triggerSave() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
  }

  return (
    <>
      <div className="topbar">
        {/* Logo */}
        <span className="topbar-logo" title="NodeSpace">◈</span>
        <div className="topbar-sep" />

        {/* Onglets profils */}
        <div className="topbar-tabs">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`tab-btn${p.id === activeProfileId ? ' active' : ''}`}
              onClick={() => setActiveProfile(p.id)}
              onDoubleClick={() => { setEditingTab(p.id); setTabName(p.name); }}
              onContextMenu={(e) => handleCtxTab(e, p.id)}
            >
              {editingTab === p.id ? (
                <input
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 12, color: 'var(--text)', width: Math.max(tabName.length * 7, 48),
                    fontFamily: 'inherit',
                  }}
                  value={tabName}
                  autoFocus
                  onChange={(e) => setTabName(e.target.value)}
                  onBlur={() => commitRename(p.id)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') commitRename(p.id);
                    if (e.key === 'Escape') setEditingTab(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : p.name}
            </div>
          ))}

          <button className="icon-btn" onClick={handleAdd} title="Nouveau profil" aria-label="Nouveau profil" style={{ fontSize: 13 }}>
            <i className="ti ti-plus" aria-hidden="true" />
          </button>
        </div>

        {/* Actions */}
        <div className="topbar-actions">
          {guestMode && <span className="guest-label">Invité</span>}

          <button className="icon-btn" onClick={() => setSearchOpen(true)} title="Rechercher (Ctrl+F)" aria-label="Rechercher">
            <i className="ti ti-search" aria-hidden="true" />
          </button>

          <button
            className={`icon-btn${saving ? ' active' : ''}`}
            onClick={triggerSave}
            title="Sauvegarder (Ctrl+S)"
            aria-label="Sauvegarder"
          >
            <i className={`ti ti-${saving ? 'loader-2' : 'cloud-upload'}`} aria-hidden="true" />
          </button>

          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Changer le thème"
            aria-label="Changer le thème"
          >
            <i className={`ti ti-${theme === 'dark' ? 'sun' : 'moon'}`} aria-hidden="true" />
          </button>

          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Paramètres" aria-label="Paramètres">
            <i className="ti ti-settings" aria-hidden="true" />
          </button>
        </div>
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
