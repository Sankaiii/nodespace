import { useState } from 'react';

interface Props {
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: '+',
    title: 'Ajouter une fiche',
    desc: 'Appuyez sur Shift+A pour creer une fiche a la position du curseur. Elle entre directement en mode edition.',
    key: 'Shift+A',
  },
  {
    icon: '~',
    title: 'Naviguer sur le canvas',
    desc: 'Clic-molette + glisser pour deplacer la vue. Scroll pour zoomer. Comme dans Blender.',
    key: 'Clic-molette',
  },
  {
    icon: 'o',
    title: 'Connecter les fiches',
    desc: 'Cliquez sur le petit point blanc a droite d\'une fiche, puis sur une autre fiche pour creer une connexion.',
    key: 'Point lateral',
  },
  {
    icon: 'S',
    title: 'Sauvegarder',
    desc: 'Ctrl+S sauvegarde tout sur votre depot GitHub prive avec un commit automatique.',
    key: 'Ctrl+S',
  },
];

export function OnboardingOverlay({ onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div className="onboarding-icon">{current.icon}</div>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-desc">{current.desc}</p>
        <div className="onboarding-key">{current.key}</div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button className="onboarding-btn-ghost" onClick={() => setStep(step - 1)}>
              Precedent
            </button>
          )}

          {!isLast ? (
            <button className="onboarding-btn-primary" onClick={() => setStep(step + 1)}>
              Suivant
            </button>
          ) : (
            <button className="onboarding-btn-primary" onClick={onDismiss}>
              Commencer
            </button>
          )}

          <button className="onboarding-skip" onClick={onDismiss}>
            Passer
          </button>
        </div>
      </div>
    </div>
  );
}
