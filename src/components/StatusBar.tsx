import { useStore } from '../store/useStore';

export function StatusBar() {
  const saving    = useStore((s) => s.saving);
  const username  = useStore((s) => s.username);
  const guestMode = useStore((s) => s.guestMode);
  const profiles  = useStore((s) => s.profiles);
  const activeId  = useStore((s) => s.activeProfileId);

  const profile   = profiles.find((p) => p.id === activeId);
  const nodeCount = profile?.flow.nodes.length ?? 0;
  const edgeCount = profile?.flow.edges.length ?? 0;

  if (saving) {
    return (
      <div className="statusbar">
        <i className="ti ti-cloud-upload" aria-hidden="true" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--accent)' }}>Sauvegarde GitHub...</span>
      </div>
    );
  }

  return (
    <div className="statusbar">
      {(guestMode || username) && (
        <>
          <i className="ti ti-user" aria-hidden="true" />
          <span>{guestMode ? 'Mode invite' : `@${username}`}</span>
          <span className="sb-divider">|</span>
        </>
      )}
      <i className="ti ti-layout-cards" aria-hidden="true" />
      <span>{nodeCount} fiche{nodeCount !== 1 ? 's' : ''}</span>
      <span className="sb-divider">|</span>
      <i className="ti ti-git-branch" aria-hidden="true" />
      <span>{edgeCount} connexion{edgeCount !== 1 ? 's' : ''}</span>
      <span className="sb-divider">|</span>
      <span>
        <kbd>Shift+A</kbd> ajouter &nbsp;
        <kbd>Ctrl+S</kbd> sauvegarder &nbsp;
        <kbd>Ctrl+F</kbd> chercher &nbsp;
        <kbd>Ctrl+Space</kbd> palette &nbsp;
        <kbd>X</kbd> supprimer &nbsp;
        <kbd>F</kbd> ajuster vue
      </span>
    </div>
  );
}
