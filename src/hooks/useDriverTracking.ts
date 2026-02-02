import { useState, useEffect, useCallback } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseDriverTrackingOptions {
  enabled: boolean;
  updateInterval?: number; // milliseconds
  onLocationUpdate?: (position: GeolocationPosition) => void;
}

export function useDriverTracking(options: UseDriverTrackingOptions) {
  const { enabled, updateInterval = 5000, onLocationUpdate } = options;
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const updatePosition = useCallback((geoPosition: any) => {
    const newPosition: GeolocationPosition = {
      latitude: geoPosition.coords.latitude,
      longitude: geoPosition.coords.longitude,
      accuracy: geoPosition.coords.accuracy,
      heading: geoPosition.coords.heading,
      speed: geoPosition.coords.speed,
      timestamp: geoPosition.timestamp,
    };

    setPosition(newPosition);
    onLocationUpdate?.(newPosition);
  }, [onLocationUpdate]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Error desconocido';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permiso de ubicación denegado. Actívalo en configuración.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible. Verifica tu GPS.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
        break;
    }
    setError(errorMessage);
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);
    setError(null);

    // High accuracy tracking for drivers
    const watchId = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Also update periodically to ensure fresh data
    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }, updateInterval);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [enabled, updateInterval, updatePosition, handleError]);

  return {
    position,
    error,
    isTracking,
  };
}
