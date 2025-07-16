'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
  Circle,
  Popup,
} from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultCenter: [number, number] = [28.6139, 77.2090]; // Delhi

interface Store {
  id: number;
  name: string;
  category: string;
  location: string;
}

interface CityData {
  city: string;
  storeCount: number;
  categories: string[];
  coordinates: [number, number];
}

interface LocationPickerProps {
  onLocationSelect: (city: string) => void;
  stores?: Store[];
}

export default function LocationPicker({
  onLocationSelect,
  stores = [],
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(defaultCenter);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const lastCityRef = useRef<string | null>(null);

  // Get user's location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error('Geolocation error', err);
        setPosition(defaultCenter);
      }
    );
  }, []);

  // Process stores to get city data
  useEffect(() => {
    if (stores.length === 0) return;

    const cityMap = new Map<string, { count: number; categories: Set<string> }>();
    
    stores.forEach(store => {
      const city = store.location;
      if (!cityMap.has(city)) {
        cityMap.set(city, { count: 0, categories: new Set() });
      }
      const cityInfo = cityMap.get(city)!;
      cityInfo.count++;
      cityInfo.categories.add(store.category);
    });

    // Convert to city data with coordinates
    const processCityData = async () => {
      const cityDataArray: CityData[] = [];
      
      for (const [city, info] of cityMap) {
        try {
          // Geocode city to get coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', India')}&limit=1`
          );
          const data = await response.json();
          
          if (data.length > 0) {
            cityDataArray.push({
              city,
              storeCount: info.count,
              categories: Array.from(info.categories),
              coordinates: [parseFloat(data[0].lat), parseFloat(data[0].lon)]
            });
          }
        } catch (error) {
          console.error(`Failed to geocode ${city}:`, error);
        }
      }
      
      setCityData(cityDataArray);
    };

    processCityData();
  }, [stores]);

  function LocationMarker() {
    const map = useMap();
    const hasFlownTo = useRef(false);

    useEffect(() => {
      if (position && !hasFlownTo.current) {
        map.flyTo(position, 13, { duration: 1.5 });
        hasFlownTo.current = true;
      }
    }, [position, map]);

    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return (
      <>
        <Marker
          position={position}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const latLng = marker.getLatLng();
              setPosition([latLng.lat, latLng.lng]);
            },
          }}
          icon={L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })}
        />
        <Circle
          center={position}
          radius={5000} // 5 km
          pathOptions={{
            color: '#93c5fd',
            fillColor: '#93c5fd',
            fillOpacity: 0.2,
          }}
        />
      </>
    );
  }

  // Custom city marker icon
  const createCityIcon = (storeCount: number) => {
    const size = Math.max(30, Math.min(50, 30 + storeCount * 2));
    return L.divIcon({
      className: 'custom-city-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid white;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${Math.max(10, Math.min(14, 10 + storeCount))}px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${storeCount}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Reverse geocode on position change (debounced)
  useEffect(() => {
    if (!position) return;

    const timer = setTimeout(async () => {
      const [lat, lon] = position;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        const city =
          data.address?.city || data.address?.town || data.address?.village;

        if (city && city !== lastCityRef.current) {
          lastCityRef.current = city;
          onLocationSelect(city);
        }
      } catch (err) {
        console.error('Reverse geocoding failed:', err);
      }
    }, 500); // debounce

    return () => clearTimeout(timer);
  }, [position, onLocationSelect]);

  return (
    <div className="h-[400px] rounded shadow overflow-hidden border relative">
      <MapContainer
        center={position as LatLngExpression}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
        
        {/* City Markers */}
        {cityData.map((cityInfo) => (
          <Marker
            key={cityInfo.city}
            position={cityInfo.coordinates}
            icon={createCityIcon(cityInfo.storeCount)}
            eventHandlers={{
              click: () => onLocationSelect(cityInfo.city),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {cityInfo.city}
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{cityInfo.storeCount}</span> stores available
                  </p>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Categories:</p>
                    <div className="flex flex-wrap gap-1">
                      {cityInfo.categories.slice(0, 3).map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                      {cityInfo.categories.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{cityInfo.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onLocationSelect(cityInfo.city)}
                    className="w-full mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    View Stores
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg border">
        <h4 className="font-semibold text-sm text-gray-800 mb-2">City Markers</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-white"></div>
            <span>Number = Store count</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-white"></div>
            <span>Your location</span>
          </div>
        </div>
      </div>
    </div>
  );
}
