import { useEffect } from 'react';
import MapView from './MapView';
import { useRouteStore } from '../../store/useRouteStore';
import { useBusStore } from '../../store/useBusStore';
import { api } from '../../services/api';
import { mockData } from '../../services/mock';
import { SearchInput, Card, Badge, Spinner } from '@repo/utils/ui';

export default function PassengerDashboard() {
  const { routes, setRoutes, selectedRouteId, setSelectedRoute, isLoading, setLoading } = useRouteStore();
  const { locations } = useBusStore();

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        if (import.meta.env.VITE_USE_MOCK === 'true') {
          setRoutes(mockData.routes);
        } else {
          const res = await api.getRoutes();
          if (res.success) setRoutes(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r flex flex-col p-4 gap-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Find Your Route</h2>
        <SearchInput
          value=""
          onChange={() => {}}
          placeholder="Search routes or stops..."
        />

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : (
            routes.map(route => (
              <Card
                key={route.id}
                className={`cursor-pointer transition-all hover:border-blue-400 ${selectedRouteId === route.id ? 'border-blue-600 ring-1 ring-blue-600' : ''}`}
                onClick={() => setSelectedRoute(route.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-blue-600">{route.code}</span>
                    <h3 className="font-semibold text-gray-900">{route.name}</h3>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </Card>
            ))
          )}
        </div>

        {selectedRouteId && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-bold text-blue-800 mb-2">Nearby Buses</h4>
            <div className="space-y-2">
              {Object.values(locations).map(loc => (
                <div key={loc.vehicleId} className="text-sm flex justify-between">
                  <span>Bus {loc.vehicleId}</span>
                  <span className="font-mono text-blue-600">{loc.etaNextStop || 5} min</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Content */}
      <div className="flex-1 relative">
        <MapView />
      </div>
    </div>
  );
}
