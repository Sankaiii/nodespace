import { useStore } from '../store/useStore';

export function StatusBar() {
  const saving    = useStore((s) => s.saving);
  const username  = useStore((s) => s.username);
  const guestMode = useStore((s) => s.guestMode);
  const profiles  = useStore((s) => s.profiles);
  const activeId  = useStore((s) => s.activeProfileId);

  const profile = profiles.find((p) => p.id === activeId);
  const nodeCount = profile?.flow.nodes.length ?? 0;
  const edgeCount = profile?.flow.edges.length ?? 0;

  return (
    <div className="statusbar">
      {saving ? (
        <span style={{ color: 'var(--accent)' }}>Sauvegarde GitHub...</span>
      ) : (
        <>
          <span>{guestMode ? 'Invite' : username ? `@${username}` : ''}</span>
          {(guestMode || username) && <span style={{ opacity: 0.3 }}>|</span>}
          <span>{nodeCount} fiche{nodeCount !== 1 ? 's' : ''}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>{edgeCount} connexion{edgeCount !== 1 ? 's' : ''}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>
            <kbd>Shift+A</kbd> ajouter &nbsp;
            <kbd>Ctrl+S</kbd> sauvegarder &nbsp;
            <kbd>Ctrl+F</kbd> chercher &nbsp;
            <kbd>Ctrl+Space</kbd> commandes &nbsp;
            <kbd>F</kbd> ajuster vue
          </span>
        </>
      )}
    </div>
  );
}
