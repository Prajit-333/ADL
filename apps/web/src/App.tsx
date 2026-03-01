import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useBusStore } from './store/useBusStore';
import { realtime } from './services/realtime';
import { startSimulation } from './services/mock';
import PassengerDashboard from './features/passenger/PassengerDashboard';
import DriverDashboard from './features/driver/DriverDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import { Button } from '@repo/utils/ui';

export default function App() {
  const { user, login } = useAuthStore();
  const [view, setView] = useState<'passenger' | 'driver' | 'admin'>('passenger');

  useEffect(() => {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';
    if (useMock) {
      startSimulation((update) => {
        useBusStore.getState().updateLocation(update);
      });
    } else {
      realtime.connect();
    }
    return () => realtime.disconnect();
  }, []);

  const renderView = () => {
    switch (view) {
      case 'driver': return <DriverDashboard />;
      case 'admin': return <AdminDashboard />;
      default: return <PassengerDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">ADL Transport</h1>
        <nav className="flex gap-4">
          <Button
            variant="ghost"
            className={view === 'passenger' ? 'bg-blue-700' : ''}
            onClick={() => setView('passenger')}
          >
            Passenger
          </Button>
          <Button
            variant="ghost"
            className={view === 'driver' ? 'bg-blue-700' : ''}
            onClick={() => setView('driver')}
          >
            Driver
          </Button>
          <Button
            variant="ghost"
            className={view === 'admin' ? 'bg-blue-700' : ''}
            onClick={() => setView('admin')}
          >
            Admin
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}
