import React, { useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import { motion } from 'framer-motion';
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
  middleStops?: Location[];
  drivers?: Array<{ id: string; lat: number; lng: number; rotation?: number }>;
  assignedDriver?: { id: string; lat: number; lng: number; rotation?: number } | null;
  className?: string;
  interactive?: boolean;
  showRoute?: boolean;
  routeColor?: string;
  onMapClick?: (lat: number, lng: number) => void;
  demandPoints?: Array<{ lat: number; lng: number; intensity: number }>;
}

const MapComponent: React.FC<MapProps> = ({
  origin,
  destination,
  middleStops = [],
  drivers = [],
  assignedDriver = null,
  className = "w-full h-full",
  interactive = true,
  showRoute = true,
  routeColor = '#9b87f5',
  onMapClick,
  demandPoints = []
}) => {
  const mapRef = useRef<MapRef>(null);

  // GeoJSON for Demand Heatmap
  const heatmapGeoJSON = {
    type: 'FeatureCollection',
    features: demandPoints.map(p => ({
      type: 'Feature',
      properties: { intensity: p.intensity },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
    }))
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const coords = [];
    if (origin) coords.push([origin.lng, origin.lat]);
    middleStops.forEach(s => coords.push([s.lng, s.lat]));
    if (destination) coords.push([destination.lng, destination.lat]);
    if (assignedDriver) coords.push([assignedDriver.lng, assignedDriver.lat]);

    // Smart Fit Bounds
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
  }, [origin, destination, assignedDriver, middleStops]);

  // GeoJSON for route line logic
  const routePoints = [
    ...(origin ? [[origin.lng, origin.lat]] : []),
    ...middleStops.map(s => [s.lng, s.lat]),
    ...(destination ? [[destination.lng, destination.lat]] : [])
  ];

  const routeGeoJSON = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: routePoints.length > 0 ? routePoints : [[0, 0]]
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
        mapStyle="mapbox://styles/mapbox/navigation-night-v1"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        interactive={interactive}
        onClick={(e) => {
          if (onMapClick) {
            onMapClick(e.lngLat.lat, e.lngLat.lng);
          }
        }}
      >
        {/* Demand Heatmap Layer */}
        {demandPoints.length > 0 && (
          <Source id="demand-heat" type="geojson" data={heatmapGeoJSON as any}>
            <Layer
              id="demand-heat-layer"
              type="heatmap"
              paint={{
                'heatmap-weight': ['get', 'intensity'],
                'heatmap-intensity': 1,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.2, 'rgba(155, 135, 245, 0.2)', // Primary color low density
                  0.4, 'rgba(155, 135, 245, 0.4)',
                  0.6, 'rgba(255, 0, 255, 0.5)',   // Accent color mid density
                  0.8, 'rgba(255, 0, 0, 0.6)'      // Danger/Hot high density
                ],
                'heatmap-radius': 50,
                'heatmap-opacity': 0.4
              }}
            />
          </Source>
        )}

        {/* Origin Marker */}
        {origin && (
          <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-1 text-[10px] font-bold rounded-full mb-1 shadow-[0_0_15px_rgba(155,135,245,0.5)] border border-white/20"
                style={{ backgroundColor: routeColor, color: '#fff' }}
              >
                TU UBICACIÓN
              </motion.div>
              <div className="relative">
                <div className="absolute inset-[-4px] bg-primary/30 rounded-full blur-sm animate-pulse" />
                <div
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-xl relative z-10"
                  style={{ backgroundColor: routeColor }}
                >
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </Marker>
        )}

        {/* Middle Stops Markers */}
        {middleStops.map((stop, index) => (
          <Marker key={index} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-6 h-6 bg-white rounded-full border-2 border-primary flex items-center justify-center shadow-lg relative z-10">
                  <span className="text-[10px] font-bold text-black">{index + 1}</span>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-primary" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Destination Marker */}
        {destination && (
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full mb-1 shadow-[0_0_15px_rgba(0,255,255,0.4)] border border-white/20"
              >
                DESTINO
              </motion.div>
              <div className="relative">
                <div className="absolute inset-[-4px] bg-accent/30 rounded-full blur-sm animate-pulse" />
                <div className="w-7 h-7 bg-accent rounded-full border-2 border-white flex items-center justify-center shadow-xl relative z-10">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </Marker>
        )}

        {/* Route Line */}
        {origin && destination && showRoute && (
          <Source id="route" type="geojson" data={routeGeoJSON as any}>
            <Layer
              id="route-line-blur"
              type="line"
              paint={{
                'line-color': routeColor,
                'line-width': 8,
                'line-opacity': 0.2,
                'line-blur': 4
              }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': routeColor,
                'line-width': 4,
                'line-opacity': 0.9,
                'line-dasharray': [1, 0.5]
              }}
            />
          </Source>
        )}

        {/* Assigned Driver Marker (High Visibility) */}
        {assignedDriver && (
          <Marker longitude={assignedDriver.lng} latitude={assignedDriver.lat}>
            <div className="relative group">
              <div className="absolute inset-[-8px] bg-primary/40 rounded-full animate-ping scale-150 blur-md" />
              <div className="absolute inset-[-4px] bg-primary/20 rounded-full animate-pulse blur-sm" />
              <div
                className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(155,135,245,1)] filter transition-all duration-500"
                style={{ transform: `rotate(${assignedDriver.rotation || 0}deg)` }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-lg">
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
