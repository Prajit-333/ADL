import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useBusStore } from '../../store/useBusStore';
import { useRouteStore } from '../../store/useRouteStore';
import L from 'leaflet';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const BusIcon = L.divIcon({
  className: 'bus-marker',
  html: `<div class="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 00-2 2v6a2 2 0 002 2V4z" />
      <path fill-rule="evenodd" d="M1 11.5a.5.5 0 01.5-.5h17a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-1a1.5 1.5 0 01-3 0h-7a1.5 1.5 0 01-3 0h-1a.5.5 0 01-.5-.5v-2zm12 1.5a.5.5 0 100-1 .5.5 0 000 1zm-9 0a.5.5 0 100-1 .5.5 0 000 1z" clip-rule="evenodd" />
      <path d="M5 4h10v6H5V4z" />
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function MapView() {
  const { locations } = useBusStore();
  const { routes, selectedRouteId } = useRouteStore();

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={13}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Render Stops */}
      {selectedRoute?.stops.map(stop => (
        <Marker
          key={stop.id}
          position={[stop.latitude, stop.longitude]}
          icon={DefaultIcon}
        >
          <Popup>{stop.name}</Popup>
        </Marker>
      ))}

      {/* Render Bus Locations */}
      {Object.values(locations).map(loc => (
        <Marker
          key={loc.vehicleId}
          position={[loc.latitude, loc.longitude]}
          icon={BusIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">Bus {loc.vehicleId}</h3>
              <p className="text-sm">Speed: {loc.speed} km/h</p>
              {loc.etaNextStop && <p className="text-sm font-semibold text-blue-600">ETA: {loc.etaNextStop} mins</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Render Route Polyline (Simplified) */}
      {selectedRoute && (
        <Polyline
          positions={selectedRoute.stops.map(s => [s.latitude, s.longitude] as [number, number])}
          color="blue"
          weight={4}
          opacity={0.6}
        />
      )}
    </MapContainer>
  );
}
