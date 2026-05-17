import { useStore } from '../store/useStore';

interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Shift+A', action: 'Ajouter une fiche' },
  { key: 'Double-clic', action: 'Editer une fiche' },
  { key: 'TAB', action: 'Passer titre -> contenu' },
  { key: 'Ctrl+S', action: 'Sauvegarder sur GitHub' },
  { key: 'Ctrl+F', action: 'Rechercher' },
  { key: 'Ctrl+Space', action: 'Palette de commandes' },
  { key: 'Shift+D', action: 'Dupliquer la selection' },
  { key: 'X / Suppr', action: 'Supprimer la selection' },
  { key: 'F', action: 'Ajuster la vue' },
  { key: 'Home', action: 'Recentrer le canvas' },
  { key: 'Clic-molette', action: 'Deplacer la vue' },
  { key: 'Scroll', action: 'Zoomer / dezoomer' },
  { key: 'Echap', action: 'Fermer les menus' },
];

export function SettingsPanel({ onClose }: Props) {
  const {
    theme, setTheme,
    background, setBackground,
    autoSave, setAutoSave,
    animations, setAnimations,
    username, guestMode, clearAuth, setGuestMode,
  } = useStore();

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-title">Parametres</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Apparence */}
          <div className="settings-section">
            <div className="settings-section-title">Apparence</div>

            <div className="settings-row">
              <span>Theme</span>
              <div className="settings-toggle-group">
                <button
                  className={`stg-btn${theme === 'dark' ? ' active' : ''}`}
                  onClick={() => setTheme('dark')}
                >Sombre</button>
                <button
                  className={`stg-btn${theme === 'light' ? ' active' : ''}`}
                  onClick={() => setTheme('light')}
                >Clair</button>
              </div>
            </div>

            <div className="settings-row">
              <span>Fond</span>
              <div className="settings-toggle-group">
                {(['dots', 'grid', 'lines', 'none'] as const).map((bg) => (
                  <button
                    key={bg}
                    className={`stg-btn${background === bg ? ' active' : ''}`}
                    onClick={() => setBackground(bg)}
                  >
                    {bg === 'dots' ? '...' : bg === 'grid' ? '###' : bg === 'lines' ? '===' : 'Vide'}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <span>Animations</span>
              <button
                className={`settings-switch${animations ? ' on' : ''}`}
                onClick={() => setAnimations(!animations)}
              >
                {animations ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Sauvegarde */}
          <div className="settings-section">
            <div className="settings-section-title">Sauvegarde</div>
            <div className="settings-row">
              <span>Auto-sauvegarde (30s)</span>
              <button
                className={`settings-switch${autoSave ? ' on' : ''}`}
                onClick={() => setAutoSave(!autoSave)}
              >
                {autoSave ? 'ON' : 'OFF'}
              </button>
            </div>
            <p className="settings-note">
              Ctrl+S sauvegarde manuellement a tout moment.
            </p>
          </div>

          {/* Compte */}
          <div className="settings-section">
            <div className="settings-section-title">Compte GitHub</div>
            {guestMode ? (
              <div>
                <p className="settings-note">Mode invite — donnees locales uniquement.</p>
                <button
                  className="settings-action-btn"
                  onClick={() => { setGuestMode(false); }}
                >
                  Connecter GitHub
                </button>
              </div>
            ) : (
              <div>
                <p className="settings-note">
                  Connecte en tant que <strong>@{username}</strong><br />
                  Depot : <code>nodespace-data</code> (prive)
                </p>
                <div className="settings-perms">
                  <div>+ Lecture/ecriture sur nodespace-data</div>
                  <div>- Aucun acces aux autres depots</div>
                </div>
                <button
                  className="settings-action-btn danger"
                  onClick={() => { if (confirm('Se deconnecter ?')) clearAuth(); }}
                >
                  Se deconnecter
                </button>
              </div>
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
              NodeSpace v0.2.0<br />
              React + TypeScript + React Flow + Zustand<br />
              <a href="https://github.com/Sankaiii/nodespace" target="_blank" rel="noopener noreferrer">
                Code source sur GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
