import React, { useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Note: In a real app, this should be in .env
// You can get a free token at mapbox.com
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.ey...';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface MapProps {
  origin?: Location | null;
  destination?: Location | null;
  drivers?: Array<{ id: string; lat: number; lng: number; rotation?: number }>;
  assignedDriver?: { id: string; lat: number; lng: number; rotation?: number } | null;
  className?: string;
  interactive?: boolean;
}

const MapComponent: React.FC<MapProps> = ({
  origin,
  destination,
  drivers = [],
  assignedDriver = null,
  className = "w-full h-full",
  interactive = true
}) => {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const coords = [];
    if (origin) coords.push([origin.lng, origin.lat]);
    if (destination) coords.push([destination.lng, destination.lat]);
    if (assignedDriver) coords.push([assignedDriver.lng, assignedDriver.lat]);

    if (coords.length >= 2) {
      const bounds = new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]);
      coords.forEach(coord => bounds.extend(coord as [number, number]));

      mapRef.current.fitBounds(bounds, {
        padding: 80,
        duration: 2000
      });
    } else if (origin) {
      mapRef.current.flyTo({
        center: [origin.lng, origin.lat],
        zoom: 15,
        duration: 1500
      });
    }
  }, [origin, destination, assignedDriver]);

  // GeoJSON for route line
  const routeGeoJSON = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        origin ? [origin.lng, origin.lat] : [0, 0],
        destination ? [destination.lng, destination.lat] : [0, 0]
      ]
    }
  };

  return (
    <div className={`${className} relative`}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: origin?.lng || -74.006,
          latitude: origin?.lat || 40.7128,
          zoom: 13
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        interactive={interactive}
      >
        {/* Origin Marker */}
        {origin && (
          <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full mb-1 shadow-lg">TU UBICACIÓN</div>
              <div className="w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-background rounded-full animate-pulse" />
              </div>
            </div>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="px-3 py-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full mb-1 shadow-lg">DESTINO</div>
              <div className="w-6 h-6 bg-accent rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-background rounded-full" />
              </div>
            </div>
          </Marker>
        )}

        {/* Route Line */}
        {origin && destination && (
          <Source id="route" type="geojson" data={routeGeoJSON as any}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#9b87f5',
                'line-width': 4,
                'line-opacity': 0.6,
                'line-dasharray': [2, 1]
              }}
            />
          </Source>
        )}

        {/* Assigned Driver Marker (High Visibility) */}
        {assignedDriver && (
          <Marker longitude={assignedDriver.lng} latitude={assignedDriver.lat}>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150" />
              <div
                className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(155,135,245,0.8)] filter transition-all duration-500"
                style={{ transform: `rotate(${assignedDriver.rotation || 0}deg)` }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                </svg>
              </div>
            </div>
          </Marker>
        )}

        {/* Generic Drivers */}
        {drivers.filter(d => d.id !== assignedDriver?.id).map(driver => (
          <Marker key={driver.id} longitude={driver.lng} latitude={driver.lat}>
            <div
              className="w-6 h-6 text-muted-foreground/60 transition-all duration-1000"
              style={{ transform: `rotate(${driver.rotation || 0}deg)` }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
              </svg>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default MapComponent;
