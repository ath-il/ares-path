import { MissionProvider, useMission } from './context/MissionContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import MissionControl from './pages/MissionControl';
import Navbar from './components/Navbar';

function AppShell() {
  const { view } = useMission();

  return (
    <>
      {view === 'landing' ? <LandingPage /> : (
        <div className="flex h-full w-full flex-col">
          <Navbar />
          <main className="relative min-h-0 flex-1 overflow-hidden">
            <MissionControl />
          </main>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <div className="h-full w-full bg-ap-bg text-ap-text">
      <MissionProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </MissionProvider>
    </div>
  );
}
