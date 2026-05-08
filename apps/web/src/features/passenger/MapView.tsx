import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { useBusStore } from '../../store/useBusStore';
import { useRouteStore } from '../../store/useRouteStore';
import type { BusLocationUpdate } from '@repo/utils/types';
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

// ── Status-aware Bus Icon with vehicle registration ──────────────────────────
const STATUS_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  ACTIVE:           { bg: '#16a34a', border: '#15803d', label: '🟢' },
  STATIONARY:       { bg: '#ca8a04', border: '#a16207', label: '🟡' },
  WRONG_DIRECTION:  { bg: '#dc2626', border: '#b91c1c', label: '🔴' },
  OFF_ROUTE:        { bg: '#7f1d1d', border: '#991b1b', label: '⛔' },
  'DRIVER UNREACHABLE': { bg: '#6b7280', border: '#4b5563', label: '⚪' },
};

const createBusIcon = (registration: string, status?: string) => {
  const cfg = STATUS_COLORS[status ?? 'ACTIVE'] ?? STATUS_COLORS.ACTIVE;
  const shortReg = registration.length > 8 ? registration.slice(-8) : registration;
  return L.divIcon({
    className: 'bus-marker',
    html: `
      <div style="
        background:${cfg.bg};
        border:2px solid ${cfg.border};
        border-radius:8px;
        padding:2px 5px;
        display:flex;
        flex-direction:column;
        align-items:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        min-width:52px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM6 10V6h12v4H6z"/>
        </svg>
        <span style="color:white;font-size:9px;font-weight:700;letter-spacing:0.5px;line-height:1.2;margin-top:1px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${shortReg}</span>
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${cfg.bg};margin:0 auto;"></div>
    `,
    iconSize: [64, 52],
    iconAnchor: [32, 52],
    popupAnchor: [0, -54],
  });
};

const StopIcon = (crossed: boolean, isNext: boolean) => L.divIcon({
  className: 'stop-marker',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:${isNext ? '#2563eb' : crossed ? '#6b7280' : '#f59e0b'};
    border:2px solid ${isNext ? '#1d4ed8' : crossed ? '#4b5563' : '#d97706'};
    box-shadow:0 1px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const UserIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#10b981;border:3px solid white;
    box-shadow:0 0 0 4px rgba(16,185,129,0.35);
    animation: pulse 2s infinite;
  "></div>
  <style>@keyframes pulse { 0%,100% { box-shadow:0 0 0 4px rgba(16,185,129,0.35); } 50% { box-shadow:0 0 0 8px rgba(16,185,129,0.1); } }</style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const DEFAULT_CENTER: [number, number] = [11.4726, 77.7086]; // Sathyamangalam
const NEARBY_RADIUS_KM = 5;

/** One-shot recenter when a new target arrives */
function FlyToPosition({ target }: { target: [number, number] | null }) {
  const map = useMap();
  const prevRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (!target) return;
    const [lat, lon] = target;
    const prev = prevRef.current;
    if (!prev || Math.abs(prev[0] - lat) > 0.001 || Math.abs(prev[1] - lon) > 0.001) {
      prevRef.current = [lat, lon];
      map.flyTo([lat, lon], map.getZoom(), { animate: true, duration: 1 });
    }
  }, [map, target]);
  return null;
}

const toRadians = (v: number) => (v * Math.PI) / 180;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNextStopIndex(stops: any[], loc: BusLocationUpdate): number {
  if ((loc.stopsCrossed ?? 0) > 0) return loc.stopsCrossed!;
  let minDist = Infinity;
  let nextIdx = 0;
  stops.forEach((s, i) => {
    const d = getDistanceKm(loc.latitude, loc.longitude, s.latitude, s.longitude);
    if (d < minDist) { minDist = d; nextIdx = i; }
  });
  return nextIdx;
}

// ── Bus Status Panel (bottom-left of map) ───────────────────────────────────
const STATUS_PANEL: Record<string, { bg: string; text: string; icon: string; desc: string }> = {
  ACTIVE:          { bg: '#16a34a', text: 'white',   icon: '🟢', desc: 'Bus is on route & moving' },
  STATIONARY:      { bg: '#ca8a04', text: 'white',   icon: '🟡', desc: 'Bus is stationary' },
  WRONG_DIRECTION: { bg: '#dc2626', text: 'white',   icon: '🔴', desc: 'Bus is moving in wrong direction!' },
  OFF_ROUTE:       { bg: '#7f1d1d', text: 'white',   icon: '⛔', desc: 'Bus is off the route!' },
  'DRIVER UNREACHABLE': { bg: '#4b5563', text: 'white',   icon: '⚪', desc: 'Driver is unreachable' },
  NO_BUS:          { bg: '#6b7280', text: 'white',   icon: '⬜', desc: 'No active bus on this route' },
};

function BusStatusPanel({ bus, selectedRouteId }: {
  bus: BusLocationUpdate | undefined;
  selectedRouteId: string | null;
}) {
  if (!selectedRouteId) return null;

  const key = bus?.status ?? 'NO_BUS';

  // Staleness: if last update is > 2 min ago, treat as stale
  const isStale = bus?.timestamp ? (Date.now() - bus.timestamp) > 120_000 : false;
  const displayKey = isStale ? 'NO_BUS' : key;
  const displayCfg = STATUS_PANEL[displayKey] ?? STATUS_PANEL.NO_BUS;

  return (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      left: '12px',
      zIndex: 1000,
      background: displayCfg.bg,
      color: displayCfg.text,
      borderRadius: '12px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: 700,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '200px',
      maxWidth: '280px',
    }}>
      <span style={{ fontSize: '18px' }}>{displayCfg.icon}</span>
      <div>
        <div style={{ fontSize: '11px', opacity: 0.85, fontWeight: 500 }}>
          {bus?.registration ? `Bus ${bus.registration}` : 'Bus Status'}
        </div>
        <div>{displayCfg.desc}</div>
        {bus?.speed != null && !isStale && (
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
            {bus.speed.toFixed(1)} km/h · {bus.stopsCrossed ?? 0} stops crossed
          </div>
        )}
        {isStale && (
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
            ⚠️ Last seen &gt;2 min ago
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapView() {
  const { locations } = useBusStore();
  const { routes, selectedRouteId } = useRouteStore();

  // User's own GPS position
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [followUser, setFollowUser] = useState(true);

  const selectedRoute = routes.find(r => r.id === selectedRouteId);
  const busLocations = useMemo(() => Object.values(locations), [locations]);

  // Only show buses that belong to the currently selected route
  const visibleBuses = useMemo(() => {
    if (!selectedRouteId) return busLocations;
    return busLocations.filter(b => b.routeId === selectedRouteId);
  }, [busLocations, selectedRouteId]);

  // Primary bus on the selected route (first one found)
  const primaryBus = visibleBuses[0];

  // The flyTo target: selected bus → route start → user
  const flyTarget = useMemo((): [number, number] | null => {
    if (selectedBus) {
      const b = busLocations.find(loc => loc.vehicleId === selectedBus);
      if (b && b.latitude && b.longitude) return [b.latitude, b.longitude];
    }
    if (selectedRoute) {
      const activeBus = visibleBuses.find(b => b.latitude && b.longitude);
      if (activeBus) return [activeBus.latitude, activeBus.longitude];
      if (selectedRoute.startLat && selectedRoute.startLng) {
        return [selectedRoute.startLat, selectedRoute.startLng];
      }
      if (selectedRoute.stops?.length) {
        const sorted = [...selectedRoute.stops].sort((a, b) => a.sequence - b.sequence);
        return [sorted[0].latitude, sorted[0].longitude];
      }
    }
    return followUser ? userPosition : null;
  }, [selectedBus, selectedRoute, busLocations, visibleBuses, userPosition, followUser]);

  // Watch passenger's own GPS (real device GPS, not IP-based)
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported.');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocationError(null);
      },
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const initialCenter: [number, number] = flyTarget ?? DEFAULT_CENTER;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={initialCenter}
        zoom={13}
        className="h-full w-full"
        whenReady={() => {}}
      >
        <FlyToPosition target={flyTarget} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* ── User's own location ── */}
        {userPosition && (
          <>
            <Marker position={userPosition} icon={UserIcon}>
              <Popup>
                <div className="p-1 text-sm">
                  <p className="font-bold">📍 You are here</p>
                  <p className="text-xs text-gray-500 mt-0.5">{userPosition[0].toFixed(5)}, {userPosition[1].toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={userPosition}
              radius={NEARBY_RADIUS_KM * 1000}
              pathOptions={{ color: '#10b981', weight: 1, fillOpacity: 0.05, dashArray: '6 4' }}
            />
          </>
        )}

        {/* ── Route Polylines ── */}
        {routes.map((route) => {
          const sortedStops = route.stops ? [...route.stops].sort((a, b) => a.sequence - b.sequence) : [];

          const routeCoords: [number, number][] = [];
          if (route.startLat && route.startLng) routeCoords.push([route.startLat, route.startLng]);
          sortedStops.forEach(s => routeCoords.push([s.latitude, s.longitude]));
          if (route.destLat && route.destLng) routeCoords.push([route.destLat, route.destLng]);

          if (routeCoords.length < 2) return null;

          const isSelected = route.id === selectedRouteId;
          const progressBus = busLocations.find(b => (b.stopsCrossed ?? 0) > 0);
          const offset = (route.startLat && route.startLng) ? 1 : 0;
          const splitIdx = (progressBus?.stopsCrossed ?? 0) + offset;

          if (!isSelected) {
            return (
              <Polyline
                key={route.id}
                positions={routeCoords}
                color="#93c5fd"
                weight={3}
                opacity={0.5}
              />
            );
          }

          const completedCoords = routeCoords.slice(0, Math.min(splitIdx + 1, routeCoords.length));
          const remainingCoords = routeCoords.slice(Math.max(splitIdx, 0));

          return (
            <span key={route.id}>
              {completedCoords.length >= 2 && (
                <Polyline
                  positions={completedCoords}
                  color="#6b7280"
                  weight={5}
                  opacity={0.7}
                  dashArray="8 4"
                />
              )}
              {remainingCoords.length >= 2 && (
                <Polyline
                  positions={remainingCoords}
                  color="#1d4ed8"
                  weight={5}
                  opacity={0.85}
                />
              )}
            </span>
          );
        })}

        {/* ── Route Endpoints (Start/End markers) ── */}
        {selectedRoute && (
          <>
            {selectedRoute.startLat && selectedRoute.startLng && (
              <Marker position={[selectedRoute.startLat, selectedRoute.startLng]} icon={StopIcon(true, false)}>
                <Popup><div className="p-1 min-w-[120px]"><p className="font-bold text-sm text-green-700">Start: {selectedRoute.startLocation}</p></div></Popup>
              </Marker>
            )}
            {selectedRoute.destLat && selectedRoute.destLng && (
              <Marker position={[selectedRoute.destLat, selectedRoute.destLng]} icon={StopIcon(false, false)}>
                <Popup><div className="p-1 min-w-[120px]"><p className="font-bold text-sm text-red-700">Destination: {selectedRoute.destinationLocation}</p></div></Popup>
              </Marker>
            )}
          </>
        )}

        {/* ── Route Stops for selected route ── */}
        {selectedRoute?.stops.map((stop, i) => {
          const splitIdx = primaryBus?.stopsCrossed ?? 0;
          const crossed = i < splitIdx;
          const isNext = i === splitIdx;
          return (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={StopIcon(crossed, isNext)}
            >
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-sm">{stop.name}</p>
                  <p className="text-xs text-gray-500">Stop #{stop.sequence}</p>
                  {userPosition && (
                    <p className="text-xs text-blue-600 mt-1">
                      📍 {getDistanceKm(userPosition[0], userPosition[1], stop.latitude, stop.longitude).toFixed(2)} km from you
                    </p>
                  )}
                  {crossed && <p className="text-xs text-green-600 font-semibold mt-1">✓ Passed</p>}
                  {isNext && <p className="text-xs text-blue-600 font-semibold mt-1">⟶ Next Stop</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── Live Bus Markers ── */}
        {visibleBuses
          .filter(loc => loc.latitude != null && loc.longitude != null)
          .map(loc => {
            const reg = loc.registration ?? loc.vehicleId;
            let nextStopName = '—';
            let crossedCount = loc.stopsCrossed ?? 0;
            let totalStops = 0;

            if (selectedRoute) {
              const sortedStops = [...selectedRoute.stops].sort((a, b) => a.sequence - b.sequence);
              totalStops = sortedStops.length;
              const nextIdx = getNextStopIndex(sortedStops, loc);
              nextStopName = sortedStops[nextIdx]?.name ?? 'End of Route';
              if (loc.stopsCrossed !== undefined) crossedCount = loc.stopsCrossed;
            }

            const statusCfg = STATUS_COLORS[loc.status ?? 'ACTIVE'] ?? STATUS_COLORS.ACTIVE;

            return (
              <Marker
                key={loc.vehicleId}
                position={[loc.latitude, loc.longitude]}
                icon={createBusIcon(reg, loc.status)}
                eventHandlers={{ click: () => setSelectedBus(loc.vehicleId === selectedBus ? null : loc.vehicleId) }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px] space-y-2">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <span className="text-lg">🚌</span>
                      <div>
                        <p className="font-bold text-sm">{reg}</p>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: statusCfg.bg, color: 'white' }}>
                          {loc.status ?? 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-gray-50 rounded p-1.5">
                        <p className="text-gray-400">Speed</p>
                        <p className="font-bold text-blue-700">{(loc.speed ?? 0).toFixed(1)} km/h</p>
                      </div>
                      <div className="bg-gray-50 rounded p-1.5">
                        <p className="text-gray-400">Progress</p>
                        <p className="font-bold text-blue-700">{crossedCount} / {totalStops} stops</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded p-2 text-xs">
                      <p className="text-blue-400">Next Stop</p>
                      <p className="font-bold text-blue-700">⟶ {nextStopName}</p>
                    </div>

                    {userPosition && (
                      <p className="text-xs text-gray-500">
                        📍 {getDistanceKm(userPosition[0], userPosition[1], loc.latitude, loc.longitude).toFixed(2)} km from you
                      </p>
                    )}

                    {(loc.status === 'OFF_ROUTE' || loc.status === 'WRONG_DIRECTION') && (
                      <div className="bg-red-50 border border-red-200 rounded p-1.5 text-xs text-red-600 font-semibold">
                        ⚠️ {loc.status === 'OFF_ROUTE' ? 'Bus is off its route!' : 'Bus is moving in wrong direction!'}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {locationError && (
          <Marker position={initialCenter} icon={DefaultIcon}>
            <Popup>{locationError}</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ── Bus Status Panel (bottom-left) ── */}
      <BusStatusPanel bus={primaryBus} selectedRouteId={selectedRouteId} />

      {/* ── Recenter on Me button ── */}
      <button
        onClick={() => setFollowUser(true)}
        title="Recenter on my location"
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '12px',
          zIndex: 1000,
          background: followUser ? '#10b981' : 'white',
          color: followUser ? 'white' : '#374151',
          border: '2px solid',
          borderColor: followUser ? '#059669' : '#d1d5db',
          borderRadius: '50%',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontSize: '18px',
          transition: 'all 0.2s',
        }}
      >
        📍
      </button>

      {/* ── GPS error banner ── */}
      {locationError && (
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#dc2626',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          ⚠️ GPS: {locationError}
        </div>
      )}

      {/* ── Passenger location coordinates overlay ── */}
      {userPosition && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '4px 12px',
          fontSize: '11px',
          color: '#6b7280',
          pointerEvents: 'none',
        }}>
          📍 {userPosition[0].toFixed(5)}, {userPosition[1].toFixed(5)}
        </div>
      )}
    </div>
  );
}
