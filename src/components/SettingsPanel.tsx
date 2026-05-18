import { useStore } from '../store/useStore';

interface Props { onClose: () => void; }

const SHORTCUTS = [
  { key: 'Shift+A',    action: 'Ajouter une fiche' },
  { key: 'Double-clic', action: 'Editer une fiche' },
  { key: 'TAB',        action: 'Titre → Contenu' },
  { key: 'X',          action: 'Supprimer selection' },
  { key: 'Ctrl+S',     action: 'Sauvegarder GitHub' },
  { key: 'Ctrl+F',     action: 'Rechercher' },
  { key: 'Ctrl+Space', action: 'Palette commandes' },
  { key: 'Shift+D',    action: 'Dupliquer' },
  { key: 'F / Home',   action: 'Ajuster la vue' },
  { key: 'Clic-molette', action: 'Deplacer la vue' },
  { key: 'Ctrl+V',     action: 'Coller une image' },
  { key: 'Echap',      action: 'Fermer les menus' },
];

export function SettingsPanel({ onClose }: Props) {
  const { theme, setTheme, background, setBackground,
          autoSave, setAutoSave, animations, setAnimations,
          username, guestMode, clearAuth, setGuestMode } = useStore();

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-title">
            <i className="ti ti-settings" aria-hidden="true" style={{ marginRight: 8 }} />
            Parametres
          </span>
          <button className="settings-close" onClick={onClose} aria-label="Fermer">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="settings-body">
          {/* Apparence */}
          <div className="settings-section">
            <div className="settings-section-title">Apparence</div>

            <div className="settings-row">
              <span>Theme</span>
              <div className="settings-toggle-group">
                <button className={`stg-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>
                  <i className="ti ti-moon" aria-hidden="true" /> Sombre
                </button>
                <button className={`stg-btn${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>
                  <i className="ti ti-sun" aria-hidden="true" /> Clair
                </button>
              </div>
            </div>

            <div className="settings-row">
              <span>Fond du canvas</span>
              <div className="settings-toggle-group">
                {(['dots', 'grid', 'lines', 'none'] as const).map((bg) => (
                  <button key={bg} className={`stg-btn${background === bg ? ' active' : ''}`} onClick={() => setBackground(bg)}>
                    {bg === 'dots' ? '···' : bg === 'grid' ? '###' : bg === 'lines' ? '===' : 'Vide'}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <span>Animations</span>
              <button className={`settings-switch${animations ? ' on' : ''}`} onClick={() => setAnimations(!animations)}>
                {animations ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Sauvegarde */}
          <div className="settings-section">
            <div className="settings-section-title">Sauvegarde</div>
            <div className="settings-row">
              <span>Sauvegarde automatique (30s)</span>
              <button className={`settings-switch${autoSave ? ' on' : ''}`} onClick={() => setAutoSave(!autoSave)}>
                {autoSave ? 'ON' : 'OFF'}
              </button>
            </div>
            <p className="settings-note">Ctrl+S sauvegarde manuellement a tout moment.</p>
          </div>

          {/* Compte */}
          <div className="settings-section">
            <div className="settings-section-title">Compte GitHub</div>
            {guestMode ? (
              <>
                <p className="settings-note">
                  <i className="ti ti-user-off" aria-hidden="true" /> Mode invite — donnees locales uniquement.
                </p>
                <button className="settings-action-btn" onClick={() => { setGuestMode(false); }}>
                  <i className="ti ti-brand-github" aria-hidden="true" /> Connecter GitHub
                </button>
              </>
            ) : (
              <>
                <p className="settings-note">
                  <i className="ti ti-user-check" aria-hidden="true" /> Connecte en tant que <strong>@{username}</strong><br />
                  Depot prive : <code>nodespace-data</code>
                </p>
                <div className="settings-perms">
                  <div><i className="ti ti-check" style={{ color: '#1D9E75' }} aria-hidden="true" /> Lecture/ecriture sur nodespace-data</div>
                  <div><i className="ti ti-x" style={{ color: 'var(--text-muted)' }} aria-hidden="true" /> Aucun acces aux autres depots</div>
                  <div><i className="ti ti-x" style={{ color: 'var(--text-muted)' }} aria-hidden="true" /> Aucune collecte de donnees</div>
                </div>
                <button className="settings-action-btn danger" onClick={() => { if (confirm('Se deconnecter ?')) clearAuth(); }}>
                  <i className="ti ti-logout" aria-hidden="true" /> Se deconnecter
                </button>
              </>
            )}
          </div>

          {/* Raccourcis */}
          <div className="settings-section">
            <div className="settings-section-title">Raccourcis clavier</div>
            <div className="settings-shortcuts">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="settings-shortcut">
                  <kbd>{s.key}</kbd>
                  <span>{s.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Version */}
          <div className="settings-section">
            <div className="settings-section-title">A propos</div>
            <p className="settings-note">
              NodeSpace v0.3.0<br />
              React 18 + TypeScript + React Flow + Zustand<br />
              <a href="https://github.com/Sankaiii/nodespace" target="_blank" rel="noopener noreferrer">
                <i className="ti ti-brand-github" aria-hidden="true" /> Code source sur GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
