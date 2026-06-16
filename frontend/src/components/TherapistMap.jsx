import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const therapistIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function HeatLayer({ therapists }) {
  const map = useMap();

  useEffect(() => {
    if (!map || therapists.length === 0) return;

    // Create heatmap data from therapist locations
    const heatData = therapists
      .filter((t) => t.lat && t.lng)
      .map((t) => [t.lat, t.lng, 0.8]);

    // Remove existing heat layer
    map.eachLayer((layer) => {
      if (layer instanceof L.HeatLayer) {
        map.removeLayer(layer);
      }
    });

    // Add new heat layer
    if (heatData.length > 0) {
      L.heatLayer(heatData, {
        radius: 30,
        blur: 25,
        maxZoom: 13,
        minOpacity: 0.3,
        gradient: {
          0.0: "#3b82f6",
          0.5: "#10b981",
          1.0: "#ef4444",
        },
      }).addTo(map);
    }
  }, [map, therapists]);

  return null;
}

function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.setView(center, 13);
    }
  }, [map, center]);

  return null;
}

export default function TherapistMap({ therapists, center, userLocation, onSelect }) {
  const defaultCenter = useMemo(
    () => center || [18.6279, 73.8000],
    [center]
  );

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom={false}
      className="therapist-map"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController center={center} />

      <HeatLayer therapists={therapists} />

      {therapists.map((therapist) => {
        const position = [therapist.lat || 18.6279, therapist.lng || 73.8000];
        return (
          <Marker
            key={therapist.id}
            position={position}
            icon={therapistIcon}
            eventHandlers={{
              click: () => onSelect?.(therapist.id),
            }}
          >
            <Popup>
              <div className="popup-card">
                <h3>{therapist.name}</h3>
                <p>{therapist.specialty}</p>
                <p>{therapist.address}</p>
                <div className="popup-actions">
                  <a
                    href={therapist.profileUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pr"
                  >
                    View Profile
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-out"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          pathOptions={{ color: "#3b82f6" }}
          radius={8}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
