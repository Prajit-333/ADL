import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Button, Card, Badge, Alert } from '@repo/utils/ui';
import { Car, MapPin, Power, Shield } from 'lucide-react';

export default function DriverDashboard() {
  const { user, login, logout } = useAuthStore();
  const [isShiftActive, setIsShiftActive] = useState(false);
  const { position, error } = useGeolocation(isShiftActive);

  const handleToggleShift = () => {
    if (!user) {
      // Simulate login for demo if not logged in
      login({ id: 'd1', name: 'John Doe', role: 'DRIVER' });
    }
    setIsShiftActive(!isShiftActive);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Driver Console</h2>
          <p className="text-gray-500">Manage your active trip and GPS sharing</p>
        </div>
        <Badge variant={isShiftActive ? 'success' : 'danger'}>
          {isShiftActive ? 'ONLINE' : 'OFFLINE'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600">
            <Shield size={24} />
            <h3 className="font-bold">Active Assignment</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded border">
            <p className="text-sm text-gray-500 uppercase font-bold">Route</p>
            <p className="text-lg font-bold">101 - Downtown Express</p>
            <div className="mt-3 flex items-center gap-2">
              <Car size={16} />
              <span className="text-sm">Vehicle: KA-01-F-1234 (AC)</span>
            </div>
          </div>
          <Button
            className="w-full"
            variant={isShiftActive ? 'danger' : 'primary'}
            onClick={handleToggleShift}
          >
            <Power className="mr-2" size={18} />
            {isShiftActive ? 'End Shift' : 'Start Shift'}
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600">
            <MapPin size={24} />
            <h3 className="font-bold">Live Telemetry</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Latitude</span>
              <span className="font-mono">{position?.coords.latitude.toFixed(6) || '--'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Longitude</span>
              <span className="font-mono">{position?.coords.longitude.toFixed(6) || '--'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Speed</span>
              <span className="font-mono">{(position?.coords.speed || 0).toFixed(1)} km/h</span>
            </div>
          </div>
          {error && <Alert variant="error" message={`GPS Error: ${error}`} />}
          {!isShiftActive && (
            <div className="flex items-center justify-center p-8 text-gray-400">
              <p>Start shift to enable GPS sharing</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-4">Upcoming Stops</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                {i}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Stop Name {i}</p>
                <p className="text-sm text-gray-500">Scheduled: 10:45 AM</p>
              </div>
              <Button size="sm" variant="outline">Arrived</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
