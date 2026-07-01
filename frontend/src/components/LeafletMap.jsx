import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet icons asset path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom div icon generators using inline colors for guaranteed rendering in bundle
const createPinIcon = (color, label = '⚡') => {
  return L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 36px; height: 42px;">
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">
          ${label}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
          margin-top: -2px;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
        "></div>
      </div>
    `,
    className: 'custom-marker-pin',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  });
};

const createCurrentLocationIcon = () => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #3b82f6;
          opacity: 0.4;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: absolute;
          top: 4px;
          left: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #2563eb;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      </div>
      <style>
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      </style>
    `,
    className: 'custom-current-location',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Sub-component to dynamically fly the map view to current locations or fit overall bounds
const MapController = ({ currentLocation, destination, stations }) => {
  const map = useMap();

  const currentLat = currentLocation ? currentLocation[0] : null;
  const currentLng = currentLocation ? currentLocation[1] : null;
  const destLat = destination ? destination[0] : null;
  const destLng = destination ? destination[1] : null;
  const stationsLength = stations ? stations.length : 0;

  useEffect(() => {
    if (!map) return;

    const points = [];
    if (currentLat !== null && currentLng !== null) {
      points.push(L.latLng(currentLat, currentLng));
    }
    if (destLat !== null && destLng !== null) {
      points.push(L.latLng(destLat, destLng));
    }

    if (points.length === 0 && stations && stations.length > 0) {
      stations.forEach(s => points.push(L.latLng(s.latitude, s.longitude)));
    }

    if (points.length === 1) {
      map.flyTo(points[0], 12, { duration: 1.2 });
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
    }
  }, [currentLat, currentLng, destLat, destLng, stationsLength, map]);

  return null;
};

const LeafletMap = ({ currentLocation, destination, stations, onSelectStation }) => {
  const defaultCenter = [12.9716, 77.5946]; // Bengaluru center
  const defaultZoom = 12;

  // Resolve pin color by charger availability status
  const getStationColor = (station) => {
    if (station.available_chargers > 0) return '#22c55e'; // Green - Available
    if (station.busy_chargers > 0) return '#eab308'; // Yellow - Busy
    return '#ef4444'; // Red - Offline/Unavailable
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '350px' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker position={currentLocation} icon={createCurrentLocationIcon()}>
            <Popup>
              <div className="text-xs font-bold text-slate-800">📍 You Are Here</div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={destination} icon={createPinIcon('#a855f7', '🏁')}>
            <Popup>
              <div className="text-xs font-bold text-slate-800">🏁 Destination</div>
            </Popup>
          </Marker>
        )}

        {/* Charging Stations Markers */}
        {stations && stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={createPinIcon(getStationColor(station), '⚡')}
            eventHandlers={{
              click: () => onSelectStation && onSelectStation(station)
            }}
          >
            <Popup>
              <div className="p-1 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-800">{station.name}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{station.address}</p>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="font-bold text-primary-600">₹{station.price_per_kwh}/kWh</span>
                  <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-semibold">
                    {station.available_chargers}/{station.total_chargers} Free
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Sync view bounds dynamically */}
        <MapController
          currentLocation={currentLocation}
          destination={destination}
          stations={stations}
        />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
