import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
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

const UserIcon = L.divIcon({
  className: 'user-marker',
  html: `<div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const NEARBY_RADIUS_KM = 5;

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);

  return null;
}

const toRadians = (value: number) => (value * Math.PI) / 180;

function getDistanceKm(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
) {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(toLat - fromLat);
  const lonDiff = toRadians(toLon - fromLon);
  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lonDiff / 2) *
      Math.sin(lonDiff / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export default function MapView() {
  const { locations } = useBusStore();
  const { routes, selectedRouteId } = useRouteStore();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const selectedRoute = routes.find(r => r.id === selectedRouteId);
  const mapCenter = userPosition ?? DEFAULT_CENTER;

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setLocationError(null);
      },
      (error) => {
        setLocationError(error.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const nearbyBusLocations = useMemo(() => {
    const allLocations = Object.values(locations);
    if (!userPosition) return allLocations;

    return allLocations.filter((loc) => {
      const distanceKm = getDistanceKm(
        userPosition[0],
        userPosition[1],
        loc.latitude,
        loc.longitude
      );
      return distanceKm <= NEARBY_RADIUS_KM;
    });
  }, [locations, userPosition]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      className="h-full w-full"
    >
      <RecenterMap center={mapCenter} zoom={14} />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* User live location */}
      {userPosition && (
        <>
          <Marker position={userPosition} icon={UserIcon}>
            <Popup>You are here</Popup>
          </Marker>
          <Circle center={userPosition} radius={NEARBY_RADIUS_KM * 1000} pathOptions={{ color: '#10b981', weight: 1, fillOpacity: 0.08 }} />
        </>
      )}

      {/* Render all route polylines */}
      {routes.map((route) => {
        if (!route.stops || route.stops.length < 2) return null;
        const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
        const isSelected = route.id === selectedRouteId;
        return (
          <Polyline
            key={route.id}
            positions={sortedStops.map((s) => [s.latitude, s.longitude] as [number, number])}
            color={isSelected ? '#1d4ed8' : '#60a5fa'}
            weight={isSelected ? 5 : 3}
            opacity={isSelected ? 0.9 : 0.45}
          />
        );
      })}

      {/* Render selected route stops */}
      {selectedRoute?.stops.map(stop => (
        <Marker
          key={stop.id}
          position={[stop.latitude, stop.longitude]}
          icon={DefaultIcon}
        >
          <Popup>{stop.name}</Popup>
        </Marker>
      ))}

      {/* Render nearby bus locations */}
      {nearbyBusLocations.map(loc => (
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
              {userPosition && (
                <p className="text-sm text-gray-600">
                  {getDistanceKm(userPosition[0], userPosition[1], loc.latitude, loc.longitude).toFixed(1)} km away
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {locationError && (
        <Marker position={mapCenter} icon={DefaultIcon}>
          <Popup>{locationError}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
