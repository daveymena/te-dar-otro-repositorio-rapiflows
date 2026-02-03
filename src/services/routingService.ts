import { useState, useEffect } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYW50aWdyYXZpdHkiLCJhIjoiY2x0ZXN0In0.test';

interface Coordinates {
    lat: number;
    lng: number;
}

interface RouteStep {
    instruction: string;
    distance: number;
    duration: number;
    maneuver: string;
}

interface RouteData {
    distance: number; // meters
    duration: number; // seconds
    geometry: any; // GeoJSON LineString
    steps: RouteStep[];
}

export async function getOptimizedRoute(
    origin: Coordinates,
    destination: Coordinates
): Promise<RouteData | null> {
    try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&steps=true&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
                steps: route.legs[0].steps.map((step: any) => ({
                    instruction: step.maneuver.instruction,
                    distance: step.distance,
                    duration: step.duration,
                    maneuver: step.maneuver.type,
                })),
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching route:', error);
        return null;
    }
}


export async function searchPlaces(query: string, proximity?: Coordinates): Promise<any[]> {
    try {
        const proximityQuery = proximity ? `&proximity=${proximity.lng},${proximity.lat}` : '';
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5${proximityQuery}&language=es`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.features) {
            return data.features.map((f: any) => ({
                name: f.text,
                address: f.place_name,
                lat: f.center[1],
                lng: f.center[0]
            }));
        }

        return [];
    } catch (error) {
        console.error('Error searching places:', error);
        return [];
    }
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            return { lat, lng };
        }
        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

export async function reverseGeocode(coordinates: Coordinates): Promise<string | null> {
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0].place_name;
        }

        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
}

export function calculateETA(distanceMeters: number, speedMps: number | null): number {
    // If we have real-time speed, use it; otherwise assume average city speed (30 km/h = 8.33 m/s)
    const effectiveSpeed = speedMps && speedMps > 0 ? speedMps : 8.33;
    return Math.round(distanceMeters / effectiveSpeed);
}

export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
}

export function useRouteTracking(
    origin: Coordinates | null,
    destination: Coordinates | null,
    driverPosition: Coordinates | null
) {
    const [route, setRoute] = useState<RouteData | null>(null);
    const [eta, setEta] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!origin || !destination) {
            setRoute(null);
            return;
        }

        setIsLoading(true);
        getOptimizedRoute(origin, destination).then((routeData) => {
            setRoute(routeData);
            setIsLoading(false);
        });
    }, [origin, destination]);

    useEffect(() => {
        if (!route || !driverPosition || !destination) {
            setEta(null);
            return;
        }

        // Calculate remaining distance from driver to destination
        const R = 6371e3; // Earth radius in meters
        const φ1 = (driverPosition.lat * Math.PI) / 180;
        const φ2 = (destination.lat * Math.PI) / 180;
        const Δφ = ((destination.lat - driverPosition.lat) * Math.PI) / 180;
        const Δλ = ((destination.lng - driverPosition.lng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;
        const estimatedEta = calculateETA(distance, null);
        setEta(estimatedEta);
    }, [route, driverPosition, destination]);

    return {
        route,
        eta,
        isLoading,
        formattedDistance: route ? formatDistance(route.distance) : null,
        formattedDuration: route ? formatDuration(route.duration) : null,
        formattedEta: eta ? formatDuration(eta) : null,
    };
}
