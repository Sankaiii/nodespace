import { useStore } from '../store/useStore';

export function StatusBar() {
  const saving = useStore((s) => s.saving);
  const username = useStore((s) => s.username);

  return (
    <div className="statusbar">
      {saving ? (
        <span style={{ color: 'var(--accent)' }}>◈ Sauvegarde sur GitHub…</span>
      ) : (
        <span>
          {username && <>@{username} · </>}
          Clic-molette : déplacer &nbsp;·&nbsp;
          Scroll : zoom &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--border)', padding: '0 4px', borderRadius: 3, fontSize: 9 }}>Shift+A</kbd> ajouter &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--border)', padding: '0 4px', borderRadius: 3, fontSize: 9 }}>Ctrl+S</kbd> sauvegarder &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--border)', padding: '0 4px', borderRadius: 3, fontSize: 9 }}>Ctrl+T</kbd> chercher &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--border)', padding: '0 4px', borderRadius: 3, fontSize: 9 }}>Suppr</kbd> supprimer &nbsp;·&nbsp;
          Double-clic : éditer
        </span>
      )}
    </div>
  );
}
