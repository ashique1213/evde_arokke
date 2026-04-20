
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { UserLocation } from '../types';
import { KOROME_LAT, KOROME_LNG } from '../lib/geo';
import { formatDistanceToNow } from 'date-fns';

// Fix leafet icon paths
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const getMarkerIcon = (status: string, online: boolean) => {
  const color = 
    status === 'In Korome' ? '#22c55e' : 
    status === 'Nearby' ? '#eab308' : 
    status === 'Wayanad' ? '#f97316' :
    status === 'Outside Kerala' ? '#ef4444' : '#6b7280';
    
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${online ? color : '#9ca3af'};
        width: 14px; 
        height: 14px; 
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

interface MapProps {
  locations: UserLocation[];
}

export function MapView({ locations }: MapProps) {
  return (
    <div className="w-full h-full min-h-[400px] sm:min-h-[600px] rounded-xl overflow-hidden glass-card shadow-lg border border-white/20">
      <MapContainer 
        center={[KOROME_LAT, KOROME_LNG]} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full min-h-[400px] sm:min-h-[600px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Korome Village Bounds */}
        <Circle 
          center={[KOROME_LAT, KOROME_LNG]} 
          radius={3000} // 3km
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1 }} 
        />

        {locations.map((loc) => (
          <Marker 
            key={loc.user_id} 
            position={[loc.lat, loc.lng]}
            icon={getMarkerIcon(loc.status, loc.online)}
          >
            <Popup className="glass-popup custom-popup">
              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 overflow-hidden text-accent flex items-center justify-center font-bold relative">
                    {loc.profiles?.avatar_url ? (
                      <img src={loc.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      loc.profiles?.name?.charAt(0) || '?'
                    )}
                    {loc.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base m-0 text-foreground">{loc.profiles?.name || 'Unknown'}</h3>
                    <p className="text-xs text-muted-foreground m-0">{loc.status}</p>
                  </div>
                </div>
                <div className="text-xs flex flex-col gap-1 mt-2 p-2 bg-muted/50 rounded-lg">
                  <span className="flex justify-between">
                    <span className="text-muted-foreground">Last seen:</span>
                    <span className="font-medium">{formatDistanceToNow(new Date(loc.last_seen), { addSuffix: true })}</span>
                  </span>
                  {loc.arrived_at && (
                    <span className="flex justify-between">
                      <span className="text-muted-foreground">Arrived:</span>
                      <span className="font-medium">{formatDistanceToNow(new Date(loc.arrived_at), { addSuffix: true })}</span>
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
