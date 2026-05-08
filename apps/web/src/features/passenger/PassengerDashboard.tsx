import { useEffect, useState } from 'react';
import MapView from './MapView';
import { useRouteStore } from '../../store/useRouteStore';
import { useBusStore } from '../../store/useBusStore';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { SearchInput, Card, Badge, Spinner } from '@repo/utils/ui';

export default function PassengerDashboard() {
  const { routes, setRoutes, selectedRouteId, setSelectedRoute, isLoading, setLoading } = useRouteStore();
  const { locations, updateLocation } = useBusStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const res = await api.getRoutes();
        if (res.success) setRoutes(res.data);
      } finally {
        setLoading(false);
      }
    };

    const fetchActiveBuses = async () => {
      try {
        const res = await api.getActiveBuses();
        if (res.success && res.data) {
          res.data.forEach((bus: any) => {
            updateLocation({
              vehicleId: bus.vehicleId,
              latitude: bus.latitude,
              longitude: bus.longitude,
              speed: bus.speed,
              recordedAt: bus.recordedAt,
              tripId: bus.tripId,
              registration: bus.registration,
              status: bus.status,
              stopsCrossed: bus.stopsCrossed,
            });
          });
        }
      } catch (err) {
        console.error('Failed to fetch active buses', err);
      }
    };

    fetchRoutes();
    fetchActiveBuses();

    // Connect to real-time WebSocket
    realtime.connect();

    return () => {
      realtime.disconnect();
    };
  }, []);

  // Subscribe to selected route
  useEffect(() => {
    if (selectedRouteId) realtime.subscribeToRoute(selectedRouteId);
    return () => {
      if (selectedRouteId) realtime.unsubscribeFromRoute(selectedRouteId);
    };
  }, [selectedRouteId]);

  // Check for stale locations (driver unreachable)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const STALE_THRESHOLD = 10000; // 10 seconds

      Object.values(locations).forEach(loc => {
        if (loc.recordedAt && loc.status !== 'DRIVER UNREACHABLE') {
          const recordedTime = new Date(loc.recordedAt).getTime();
          if (now - recordedTime > STALE_THRESHOLD) {
            updateLocation({
              ...loc,
              status: 'DRIVER UNREACHABLE',
              speed: 0
            });
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [locations, updateLocation]);

  const filteredRoutes = routes.filter(r => {
    const q = search.toLowerCase();
    return (
      r.code.toLowerCase().includes(q) ||
      (r.startLocation?.toLowerCase().includes(q) ?? false) ||
      (r.destinationLocation?.toLowerCase().includes(q) ?? false)
    );
  });

  const activeBusCount = Object.keys(locations).length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r flex flex-col p-4 gap-4 overflow-y-auto">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Find Your Route</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeBusCount} bus{activeBusCount !== 1 ? 'es' : ''} currently active
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={(e) => setSearch(typeof e === 'string' ? e : (e as any).target?.value ?? '')}
          placeholder="Search routes or stops..."
        />

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center p-8 text-gray-400 text-sm">No routes found.</div>
          ) : (
            filteredRoutes.map(route => (
              <Card
                key={route.id}
                className={`cursor-pointer transition-all hover:border-blue-400 ${selectedRouteId === route.id ? 'border-blue-600 ring-1 ring-blue-600' : ''}`}
                onClick={() => setSelectedRoute(selectedRouteId === route.id ? null : route.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-blue-600">{route.code}</span>
                    <h3 className="font-semibold text-gray-900 text-sm">{route.startLocation} → {route.destinationLocation}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{route.stops?.length ?? 0} stops · {route.city}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Active buses on selected route */}
        {selectedRouteId && (
          <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-bold text-blue-800 mb-2 text-sm">Buses on this route</h4>
            <div className="space-y-2">
              {Object.values(locations).filter(loc => loc.routeId === selectedRouteId).length === 0 ? (
                <p className="text-xs text-blue-400">No active buses right now.</p>
              ) : (
                Object.values(locations).filter(loc => loc.routeId === selectedRouteId).map(loc => {
                  const statusColors: Record<string, string> = {
                    ACTIVE: 'text-green-600',
                    STATIONARY: 'text-yellow-600',
                    WRONG_DIRECTION: 'text-red-600',
                    OFF_ROUTE: 'text-red-700',
                    'DRIVER UNREACHABLE': 'text-gray-500',
                  };
                  const sc = statusColors[loc.status ?? 'ACTIVE'] ?? 'text-gray-500';
                  return (
                    <div key={loc.vehicleId} className="text-sm flex justify-between items-center">
                      <div>
                        <span className="font-mono font-semibold">{loc.registration ?? loc.vehicleId}</span>
                        <span className={`ml-2 text-xs font-semibold ${sc}`}>{loc.status ?? 'ACTIVE'}</span>
                      </div>
                      <span className="font-mono text-blue-600 text-xs">{(loc.speed ?? 0).toFixed(0)} km/h</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView />
      </div>
    </div>
  );
}
