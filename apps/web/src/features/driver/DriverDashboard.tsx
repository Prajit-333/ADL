import { useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Button, Card, Badge, Alert } from '@repo/utils/ui';
import { Car, MapPin, Route, Shield } from 'lucide-react';

const formatDuration = (startedAt: Date | null) => {
  if (!startedAt) return '--';
  const elapsedMs = Date.now() - startedAt.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [lastTripDuration, setLastTripDuration] = useState<string | null>(null);
  const { position, error } = useGeolocation(isTripActive);

  const speedKmh = useMemo(() => {
    if (!position?.coords.speed || position.coords.speed < 0) return 0;
    return position.coords.speed * 3.6;
  }, [position]);

  const handleStartTrip = () => {
    if (!user || user.role !== 'DRIVER') return;
    setTripStartTime(new Date());
    setIsTripActive(true);
  };

  const handleEndTrip = () => {
    setIsTripActive(false);
    setLastTripDuration(formatDuration(tripStartTime));
    setTripStartTime(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Driver Console</h2>
          <p className="text-gray-500">Manage your active trip lifecycle and live GPS sharing</p>
        </div>
        <Badge variant={isTripActive ? 'success' : 'danger'}>
          {isTripActive ? 'TRIP RUNNING' : 'TRIP IDLE'}
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
          <div className="space-y-2">
            <Button className="w-full" onClick={handleStartTrip} disabled={isTripActive}>
              <Route className="mr-2" size={18} />
              Start Trip
            </Button>
            <Button
              className="w-full"
              variant="danger"
              onClick={handleEndTrip}
              disabled={!isTripActive}
            >
              End Trip
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border p-2">
              <p className="text-gray-500">Started At</p>
              <p className="font-semibold">
                {tripStartTime ? tripStartTime.toLocaleTimeString() : '--'}
              </p>
            </div>
            <div className="rounded border p-2">
              <p className="text-gray-500">Trip Duration</p>
              <p className="font-semibold">
                {isTripActive ? formatDuration(tripStartTime) : (lastTripDuration ?? '--')}
              </p>
            </div>
          </div>
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
              <span className="font-mono">{speedKmh.toFixed(1)} km/h</span>
            </div>
          </div>
          {error && <Alert variant="error" message={`GPS Error: ${error}`} />}
          {!isTripActive && (
            <div className="flex items-center justify-center p-8 text-gray-400">
              <p>Start a trip to enable GPS sharing</p>
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
              <Button size="sm" variant="outline" disabled={!isTripActive}>
                Arrived
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
