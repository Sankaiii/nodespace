import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getUser, ensureRepo } from '../utils/github';

export function LandingPage() {
  const { setAuth, setGuestMode } = useStore();
  const [showPAT, setShowPAT] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    const t = token.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      setLoadingStep('Verification du token...');
      const user = await getUser(t);
      setLoadingStep('Initialisation du depot nodespace-data...');
      await ensureRepo(t, user.login);
      setAuth(t, user.login);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401')) setError('Token invalide. Verifie qu\'il est bien copie.');
      else if (msg.includes('403')) setError('Permissions insuffisantes. Active le scope "repo".');
      else setError(`Erreur : ${msg}`);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }

  return (
    <div className="landing">
      {/* Fond animé avec fausses bulles */}
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-bubble lb1">Idees</div>
        <div className="landing-bubble lb2">Projets</div>
        <div className="landing-bubble lb3">Notes</div>
        <div className="landing-bubble lb4">Canvas</div>
        <div className="landing-bubble lb5">GitHub</div>
        <svg className="landing-lines" xmlns="http://www.w3.org/2000/svg">
          <path d="M 180 130 C 340 80 480 100 600 90" />
          <path d="M 600 90 C 720 80 760 200 740 340" />
          <path d="M 180 130 C 160 240 140 340 160 440" />
          <path d="M 740 340 C 700 400 500 430 380 480" />
        </svg>
      </div>

      <div className="landing-content">
        <div className="landing-logo">◈</div>
        <h1 className="landing-title">NodeSpace</h1>
        <p className="landing-tagline">
          Votre espace cognitif visuel.<br />
          <span style={{ opacity: 0.6, fontSize: 14 }}>
            Inspire de Blender, concu pour penser.
          </span>
        </p>

        <div className="landing-features">
          <div className="lf-item"><span className="lf-icon">◈</span><span>Canvas infini style Blender Shader Editor</span></div>
          <div className="lf-item"><span className="lf-icon">↑</span><span>Synchronise avec votre GitHub prive</span></div>
          <div className="lf-item"><span className="lf-icon">⊟</span><span>Multi-profils, multi-appareils</span></div>
          <div className="lf-item"><span className="lf-icon">⌕</span><span>Recherche instantanee dans toutes vos fiches</span></div>
        </div>

        {!showPAT ? (
          <div className="landing-actions">
            <button className="landing-btn-primary" onClick={() => setShowPAT(true)}>
              Connexion avec GitHub
            </button>
            <button className="landing-btn-ghost" onClick={() => setGuestMode(true)}>
              Essayer en mode invite
            </button>
            <p className="landing-note">
              Mode invite : donnees locales uniquement, pas de synchronisation.
            </p>
          </div>
        ) : (
          <div className="landing-pat">
            <p className="landing-pat-title">Personal Access Token GitHub</p>
            <p className="landing-pat-help">
              Genere sur{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=NodeSpace"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/settings/tokens
              </a>{' '}
              avec le scope <code>repo</code>.
            </p>

            <input
              className="auth-input"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              autoFocus
              disabled={loading}
            />

            {error && <p className="auth-error">{error}</p>}
            {loading && <p className="landing-loading-step">{loadingStep}</p>}

            <div className="landing-pat-actions">
              <button
                className="landing-btn-primary"
                onClick={handleConnect}
                disabled={loading || !token.trim()}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <button
                className="landing-btn-ghost"
                onClick={() => { setShowPAT(false); setError(null); setToken(''); }}
                disabled={loading}
              >
                Retour
              </button>
            </div>

            <div className="landing-perms">
              <div className="landing-perm ok">✓ Acces lecture/ecriture au depot <code>nodespace-data</code> uniquement</div>
              <div className="landing-perm ok">✓ Token stocke uniquement dans votre navigateur</div>
              <div className="landing-perm no">✗ Aucun acces a vos autres depots</div>
              <div className="landing-perm no">✗ Aucune collecte de donnees personnelles</div>
              <div className="landing-perm no">✗ Aucun serveur tiers implique</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
