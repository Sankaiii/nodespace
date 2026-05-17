import { useState } from 'react';
import { useStore } from '../store/useStore';
import { SettingsPanel } from './SettingsPanel';

export function TopBar() {
  const profiles       = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const theme          = useStore((s) => s.theme);
  const saving         = useStore((s) => s.saving);
  const guestMode      = useStore((s) => s.guestMode);

  const setActiveProfile = useStore((s) => s.setActiveProfile);
  const addProfile       = useStore((s) => s.addProfile);
  const renameProfile    = useStore((s) => s.renameProfile);
  const deleteProfile    = useStore((s) => s.deleteProfile);
  const setTheme         = useStore((s) => s.setTheme);
  const setSearchOpen    = useStore((s) => s.setSearchOpen);

  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [tabName, setTabName]       = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleAdd() {
    const name = prompt('Nom du profil :');
    if (name?.trim()) addProfile(name.trim());
  }

  function startRename(id: string, name: string) {
    setEditingTab(id); setTabName(name);
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

  return (
    <>
      <div className="topbar">
        <span className="topbar-logo">NodeSpace</span>
        <div className="topbar-sep" />

        <div className="topbar-tabs">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`tab-btn${p.id === activeProfileId ? ' active' : ''}`}
              onClick={() => setActiveProfile(p.id)}
              onDoubleClick={() => startRename(p.id, p.name)}
              onContextMenu={(e) => handleCtxTab(e, p.id)}
            >
              {editingTab === p.id ? (
                <input
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: 'var(--text)', width: Math.max(tabName.length * 7, 40), fontFamily: 'inherit' }}
                  value={tabName}
                  autoFocus
                  onChange={(e) => setTabName(e.target.value)}
                  onBlur={() => commitRename(p.id)}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commitRename(p.id); if (e.key === 'Escape') setEditingTab(null); }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : p.name}
            </div>
          ))}
          <button className="icon-btn" onClick={handleAdd} title="Nouveau profil">+</button>
        </div>

        <div className="topbar-actions">
          {guestMode && <span className="guest-label">Invite</span>}

          <button className="icon-btn" onClick={() => setSearchOpen(true)} title="Rechercher (Ctrl+F)">
            srch
          </button>

          <button
            className={`icon-btn${saving ? ' active' : ''}`}
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }))}
            title="Sauvegarder (Ctrl+S)"
          >
            {saving ? '...' : 'sav'}
          </button>

          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Theme">
            {theme === 'dark' ? 'day' : 'ngt'}
          </button>

          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Parametres">
            cfg
          </button>
        </div>
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
