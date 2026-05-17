import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getUser, ensureRepo } from '../utils/github';

export function AuthModal() {
  const setAuth = useStore((s) => s.setAuth);

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'repo'>('idle');

  async function handleConnect() {
    const t = token.trim();
    if (!t) return;
    setLoading(true);
    setError(null);

    try {
      const user = await getUser(t);
      setStep('repo');
      await ensureRepo(t, user.login);
      setAuth(t, user.login);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401')) {
        setError('Token invalide. Vérifie qu'il est bien copié.');
      } else if (msg.includes('403')) {
        setError('Permissions insuffisantes. Active le scope « repo » lors de la génération du token.');
      } else {
        setError(`Erreur : ${msg}`);
      }
      setStep('idle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">◈</div>
        <h1 className="auth-title">NodeSpace</h1>
        <p className="auth-subtitle">
          Espace de travail visuel synchronisé avec GitHub
        </p>

        <label className="auth-label" htmlFor="pat-input">
          GitHub Personal Access Token
        </label>
        <input
          id="pat-input"
          className="auth-input"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          disabled={loading}
          autoFocus
        />

        {error && <p className="auth-error">{error}</p>}

        {loading && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0', textAlign: 'center' }}>
            {step === 'repo'
              ? '◈ Initialisation du dépôt nodespace-data…'
              : '◈ Vérification du token…'}
          </p>
        )}

        <button
          className="auth-btn"
          onClick={handleConnect}
          disabled={loading || !token.trim()}
        >
          {loading ? 'Connexion…' : 'Se connecter avec GitHub'}
        </button>

        <p className="auth-help">
          Génère un token sur{' '}
          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=NodeSpace"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/settings/tokens
          </a>{' '}
          avec le scope <code>repo</code>.<br />
          Tes données seront stockées dans un dépôt privé{' '}
          <code>nodespace-data</code> créé automatiquement sur ton compte.
          Le token est gardé uniquement dans ton navigateur (localStorage).
        </p>
      </div>
    </div>
  );
}
