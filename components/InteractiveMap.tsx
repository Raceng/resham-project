
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location, MapPlace } from '../types';

// Custom icons for start and destination
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface InteractiveMapProps {
  userLocation: Location | null;
  places: MapPlace[];
  darkMode?: boolean;
}

const RecenterMap: React.FC<{ location: Location | null }> = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], 13);
    }
  }, [location, map]);
  return null;
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ userLocation, places, darkMode }) => {
  const defaultPosition: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : [37.7749, -122.4194]; // Default to SF

  // Map tile providers
  const lightTiles = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={darkMode ? darkTiles : lightTiles}
        />
        
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>
              <div className="font-semibold text-blue-600 dark:text-blue-400">Your Current Position</div>
            </Popup>
          </Marker>
        )}

        <RecenterMap location={userLocation} />
      </MapContainer>
      
      {places.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 max-w-xs z-[1000] transition-colors duration-200">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
            <span className="mr-2">📍</span> Journey Context
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
            {places.map((place, idx) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <a href={place.uri} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 block mb-1">
                  {place.title}
                </a>
                {place.snippet && <p className="text-gray-500 dark:text-gray-400 italic">"{place.snippet}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
