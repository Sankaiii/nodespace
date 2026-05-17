import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useStore } from './store/useStore';
import { AuthModal } from './components/AuthModal';
import { TopBar } from './components/TopBar';
import { Canvas } from './components/Canvas';
import { StatusBar } from './components/StatusBar';

export function App() {
  const token = useStore((s) => s.token);
  const theme = useStore((s) => s.theme);
  const activeProfileId = useStore((s) => s.activeProfileId);

  /* Applique le thème sur <html> */
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  if (!token) {
    return <AuthModal />;
  }

  return (
    <ReactFlowProvider>
      <div className="app-root">
        <TopBar />
        {/*
          key={activeProfileId} force le démontage/remontage de Canvas
          à chaque changement de profil → état React Flow repart de zéro
          et on recharge depuis GitHub.
        */}
        <Canvas key={activeProfileId} />
        <StatusBar />
      </div>
    </ReactFlowProvider>
  );
}
