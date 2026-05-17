import { useState } from 'react';
import { useStore } from '../store/useStore';

export function TopBar() {
  const profiles = useStore((s) => s.profiles);
  const activeProfileId = useStore((s) => s.activeProfileId);
  const theme = useStore((s) => s.theme);
  const saving = useStore((s) => s.saving);

  const setActiveProfile = useStore((s) => s.setActiveProfile);
  const addProfile = useStore((s) => s.addProfile);
  const renameProfile = useStore((s) => s.renameProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);
  const setTheme = useStore((s) => s.setTheme);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const clearAuth = useStore((s) => s.clearAuth);

  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [tabName, setTabName] = useState('');

  function handleAddProfile() {
    const name = prompt('Nom du profil :');
    if (name?.trim()) addProfile(name.trim());
  }

  function handleTabDblClick(id: string, currentName: string) {
    setEditingTab(id);
    setTabName(currentName);
  }

  function handleTabRename(id: string) {
    if (tabName.trim()) renameProfile(id, tabName.trim());
    setEditingTab(null);
  }

  function handleTabContextMenu(e: React.MouseEvent, id: string) {
    e.preventDefault();
    if (profiles.length <= 1) return;
    if (confirm(`Supprimer le profil "${profiles.find((p) => p.id === id)?.name}" ?`)) {
      deleteProfile(id);
    }
  }

  return (
    <div className="topbar">
      <span className="topbar-logo">◈ NodeSpace</span>
      <div className="topbar-sep" />

      {/* Onglets profils */}
      <div className="topbar-tabs">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={`tab-btn${p.id === activeProfileId ? ' active' : ''}`}
            onClick={() => setActiveProfile(p.id)}
            onDoubleClick={() => handleTabDblClick(p.id, p.name)}
            onContextMenu={(e) => handleTabContextMenu(e, p.id)}
          >
            {editingTab === p.id ? (
              <input
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 11,
                  color: 'var(--text)',
                  width: Math.max(tabName.length * 7, 40),
                  fontFamily: 'inherit',
                }}
                value={tabName}
                autoFocus
                onChange={(e) => setTabName(e.target.value)}
                onBlur={() => handleTabRename(p.id)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleTabRename(p.id);
                  if (e.key === 'Escape') setEditingTab(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              p.name
            )}
          </div>
        ))}

        {/* Bouton nouveau profil */}
        <button
          className="icon-btn"
          onClick={handleAddProfile}
          title="Nouveau profil"
          aria-label="Nouveau profil"
          style={{ fontSize: 16 }}
        >
          +
        </button>
      </div>

      {/* Actions à droite */}
      <div className="topbar-actions">
        <button
          className="icon-btn"
          onClick={() => setSearchOpen(true)}
          title="Rechercher (Ctrl+T)"
          aria-label="Rechercher"
        >
          ⌕
        </button>

        <button
          className={`icon-btn${saving ? ' active' : ''}`}
          onClick={() =>
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }))
          }
          title="Sauvegarder sur GitHub (Ctrl+S)"
          aria-label="Sauvegarder"
        >
          {saving ? '◌' : '↑'}
        </button>

        <button
          className="icon-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Changer le thème"
          aria-label="Changer le thème"
        >
          {theme === 'dark' ? '☀' : '☽'}
        </button>

        <button
          className="icon-btn"
          onClick={() => {
            if (confirm('Se déconnecter ? Le token sera supprimé du navigateur.')) clearAuth();
          }}
          title="Se déconnecter"
          aria-label="Se déconnecter"
          style={{ fontSize: 12 }}
        >
          ⏻
        </button>
      </div>
    </div>
  );
}
