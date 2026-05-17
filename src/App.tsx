import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useStore } from './store/useStore';
import { LandingPage } from './components/LandingPage';
import { TopBar } from './components/TopBar';
import { Canvas } from './components/Canvas';
import { StatusBar } from './components/StatusBar';
import { Toast } from './components/Toast';

export function App() {
  const token = useStore((s) => s.token);
  const guestMode = useStore((s) => s.guestMode);
  const theme = useStore((s) => s.theme);
  const activeProfileId = useStore((s) => s.activeProfileId);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const isConnected = !!token || guestMode;

  if (!isConnected) {
    return (
      <>
        <LandingPage />
        <Toast />
      </>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="app-root">
        <TopBar />
        <Canvas key={activeProfileId} />
        <StatusBar />
      </div>
      <Toast />
    </ReactFlowProvider>
  );
}
