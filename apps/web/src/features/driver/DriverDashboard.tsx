import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripTracker } from '../../hooks/useTripTracker';
import { Button, Card, Badge, Alert } from '@repo/utils/ui';
import { Car, MapPin, Route, Shield, CheckCircle, Circle, AlertTriangle, Navigation, Ban } from 'lucide-react';
import { api } from '../../services/api';

const formatDuration = (startedAt: Date | null) => {
  if (!startedAt) return '--';
  const elapsedMs = Date.now() - startedAt.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const STATUS_CONFIG = {
  ACTIVE: { label: 'Moving', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: Navigation },
  STATIONARY: { label: 'Stationary', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: Circle },
  WRONG_DIRECTION: { label: 'Wrong Direction!', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
  OFF_ROUTE: { label: 'Off Route!', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: Ban },
} as const;

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [lastTripDuration, setLastTripDuration] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Keep duration display live
  useEffect(() => {
    if (!isTripActive) return;
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [isTripActive]);

  useEffect(() => {
    if (user?.id) {
      api.getAssignmentByDriverId(user.id)
        .then(res => { if (res.success && res.data) setAssignment(res.data); })
        .catch(err => console.error('Failed to fetch assignment', err));
    }
  }, [user?.id]);

  const { position, error, stopsCrossed, tripStatus } = useTripTracker(isTripActive, assignment);

  const speedKmh = useMemo(() => {
    if (!position?.coords.speed || position.coords.speed < 0) return 0;
    return position.coords.speed * 3.6;
  }, [position]);

  // GPS accuracy in metres — low value = real GPS, high value = IP/Wi-Fi based
  const gpsAccuracy = position?.coords.accuracy ?? null;
  const gpsQuality = gpsAccuracy === null
    ? 'waiting'
    : gpsAccuracy < 50   ? 'good'    // real hardware GPS
    : gpsAccuracy < 200  ? 'fair'    // Wi-Fi triangulation
    : 'poor';                        // IP-based — unreliable

  const stops = assignment?.route?.stops ?? [];
  const sortedStops = useMemo(() => [...stops].sort((a: any, b: any) => a.sequence - b.sequence), [stops]);
  const nextStopIndex = stopsCrossed;
  const nextStop = sortedStops[nextStopIndex] ?? null;

  const handleStartTrip = async () => {
    if (!user || user.role !== 'DRIVER' || !assignment) return;
    
    try {
      const res = await api.startTrip({
        vehicleId: assignment.vehicleId,
        routeId: assignment.routeId,
      });
      
      if (res.success) {
        setActiveTripId(res.data.id);
        setTripStartTime(new Date());
        setIsTripActive(true);
      }
    } catch (err) {
      console.error('Failed to start trip', err);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTripId) return;

    try {
      await api.endTrip(activeTripId);
      setIsTripActive(false);
      setLastTripDuration(formatDuration(tripStartTime));
      setTripStartTime(null);
      setActiveTripId(null);
    } catch (err) {
      console.error('Failed to end trip', err);
    }
  };

  const statusCfg = isTripActive ? STATUS_CONFIG[tripStatus] : null;

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

      {/* GPS Accuracy Warning — shown when browser is using IP/Wi-Fi location */}
      {isTripActive && gpsQuality === 'poor' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border font-semibold bg-orange-50 border-orange-300 text-orange-700">
          <AlertTriangle size={18} />
          <span>⚠️ Poor GPS accuracy ({gpsAccuracy?.toFixed(0)}m) — Your device may be using IP-based location, not real GPS.</span>
          <span className="ml-auto text-sm font-normal opacity-75">Open this app on a mobile phone for real GPS.</span>
        </div>
      )}

      {/* Status Banner */}
      {isTripActive && statusCfg && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
          <statusCfg.icon size={18} />
          <span>Status: {statusCfg.label}</span>
          {(tripStatus === 'OFF_ROUTE' || tripStatus === 'WRONG_DIRECTION') && (
            <span className="ml-auto text-sm font-normal opacity-75">Please check your route and heading.</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600">
            <Shield size={24} />
            <h3 className="font-bold">Active Assignment</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded border">
            <p className="text-sm text-gray-500 uppercase font-bold">Route</p>
            <p className="text-lg font-bold">
              {assignment ? `${assignment.route.code} - ${assignment.route.startLocation} → ${assignment.route.destinationLocation}` : 'No route assigned'}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Car size={16} />
              <span className="text-sm">
                Vehicle: {assignment ? `${assignment.vehicle.registration} (${assignment.vehicle.type})` : 'No vehicle assigned'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Button className="w-full" onClick={handleStartTrip} disabled={isTripActive || !assignment}>
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
              <p className="font-semibold">{tripStartTime ? tripStartTime.toLocaleTimeString() : '--'}</p>
            </div>
            <div className="rounded border p-2">
              <p className="text-gray-500">Trip Duration</p>
              <p className="font-semibold">{isTripActive ? formatDuration(tripStartTime) : (lastTripDuration ?? '--')}</p>
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
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Stops Crossed</span>
              <span className="font-mono font-bold text-blue-600">{stopsCrossed} / {sortedStops.length}</span>
            </div>
            {nextStop && (
              <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Next Stop</span>
              <span className="font-semibold text-emerald-600">{nextStop.name}</span>
            </div>
            )}
            {/* GPS Accuracy row */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500">GPS Accuracy</span>
              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                gpsQuality === 'good'    ? 'bg-green-100 text-green-700'
                : gpsQuality === 'fair' ? 'bg-yellow-100 text-yellow-700'
                : gpsQuality === 'poor' ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-500'
              }`}>
                {gpsAccuracy !== null ? `±${gpsAccuracy.toFixed(0)}m` : 'Waiting…'}
              </span>
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
        <h3 className="font-bold mb-4 text-lg">Route Schedule</h3>
        <div className="space-y-3">
          {sortedStops.length > 0 ? (
            sortedStops.map((stop: any, i: number) => {
              const crossed = i < stopsCrossed;
              const isNext = i === stopsCrossed && isTripActive;
              return (
                <div key={stop.id} className={`flex items-center gap-4 rounded-lg p-2 transition-all ${crossed ? 'opacity-50' : ''} ${isNext ? 'bg-blue-50 border border-blue-200' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${crossed ? 'bg-green-100 text-green-600' : isNext ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {crossed ? <CheckCircle size={18} /> : stop.sequence}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${crossed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{stop.name}</p>
                    <p className="text-sm text-gray-500">
                      {crossed ? 'Arrived' : i === 0 ? 'Start Terminal' : isNext ? '⟵ Next Stop' : `Sequence ${stop.sequence}`}
                    </p>
                  </div>
                  {isNext && (
                    <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded">NEXT</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center p-8 text-gray-400">
              <p>No stops found for this route.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
