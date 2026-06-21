import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function TherapistMap({ therapists, center, userLocation, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const isTokenMissing = !token || token.trim() === "" || token.includes("your_mapbox_access_token");

  // 1. Initialize Map
  useEffect(() => {
    if (isTokenMissing || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const mapCenter = center ? [center[1], center[0]] : [73.8000, 18.6279]; // Default [lng, lat] (Pune)

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: mapCenter,
      zoom: 12,
      scrollZoom: true
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
      
      // Initialize Heatmap Data Source
      map.addSource("therapists-heat", {
        type: "geojson",
        data: getGeoJSON()
      });

      // Add Heatmap Layer
      map.addLayer({
        id: "therapists-heat-layer",
        type: "heatmap",
        source: "therapists-heat",
        maxzoom: 15,
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 1,
            15, 3
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(59, 130, 246, 0)",
            0.2, "rgba(59, 130, 246, 0.4)",
            0.6, "rgba(16, 185, 129, 0.7)",
            1.0, "rgba(239, 68, 68, 0.8)"
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 15,
            15, 40
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 0.95,
            15, 0.4
          ]
        }
      });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isTokenMissing]);

  // Helper to generate geojson for heatmap source
  const getGeoJSON = () => {
    return {
      type: "FeatureCollection",
      features: therapists
        .filter((t) => t.lat && t.lng)
        .map((t) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [Number(t.lng), Number(t.lat)]
          },
          properties: {
            id: t.id,
            weight: 0.8
          }
        }))
    };
  };

  // 2. Update Heatmap Data Source when therapists list changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("therapists-heat");
    if (source) {
      source.setData(getGeoJSON());
    }
  }, [therapists, mapLoaded]);

  // 3. Sync Camera when center prop changes (Fly To Pune/Location)
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.flyTo({
      center: [center[1], center[0]],
      zoom: 12.5,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });
  }, [center]);

  // 4. Update Markers (User Location + Therapist Pins)
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old therapist markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Draw Therapist markers
    therapists.forEach((t) => {
      if (!t.lat || !t.lng) return;

      const popupEl = document.createElement("div");
      popupEl.className = "popup-card";
      popupEl.innerHTML = `
        <h3 style="margin:0 0 4px; font-size:14px; color:var(--dk); font-weight:600;">${t.name}</h3>
        <p style="margin:4px 0; font-size:11.5px; color:var(--sage); font-weight:500;">${t.specialty}</p>
        <p style="margin:4px 0; font-size:11px; color:var(--soft);">${t.address}</p>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <a href="${t.profileUrl || "#"}" target="_blank" rel="noreferrer" 
             style="font-size:10px; padding:6px 12px; border-radius:8px; background:var(--sage); color:white; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; font-weight:600;">
             View Profile
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}" target="_blank" rel="noreferrer"
             style="font-size:10px; padding:6px 12px; border-radius:8px; border:1px solid rgba(124,158,138,0.4); background:transparent; color:var(--dk); text-decoration:none; display:inline-flex; align-items:center; justify-content:center; font-weight:600;">
             Directions
          </a>
        </div>
      `;

      const mapboxPopup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setDOMContent(popupEl);

      // Create Custom Mapbox HTML Marker container
      const marker = new mapboxgl.Marker({ color: "#7c9e8a" })
        .setLngLat([Number(t.lng), Number(t.lat)])
        .setPopup(mapboxPopup)
        .addTo(mapRef.current);

      marker.getElement().addEventListener("click", () => {
        onSelect?.(t.id);
      });

      markersRef.current.push(marker);
    });

    // Update User Location marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && userLocation.lat && userLocation.lng) {
      const userEl = document.createElement("div");
      userEl.style.width = "18px";
      userEl.style.height = "18px";
      userEl.style.borderRadius = "50%";
      userEl.style.background = "#3b82f6";
      userEl.style.border = "3px solid white";
      userEl.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.6)";
      
      const mapboxUserPopup = new mapboxgl.Popup({ offset: 10 }).setHTML(
        `<div style="font-size:12px; font-weight:500; color:var(--dk); padding:2px 4px;">You are here</div>`
      );

      const userMarker = new mapboxgl.Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(mapboxUserPopup)
        .addTo(mapRef.current);

      userMarkerRef.current = userMarker;
    }
  }, [therapists, userLocation]);

  if (isTokenMissing) {
    return (
      <div 
        style={{
          width: "100%",
          height: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, rgba(124,158,138,0.06) 0%, rgba(155,142,196,0.05) 100%)",
          border: "1px solid rgba(124,158,138,0.12)",
          borderRadius: "18px",
          padding: "24px",
          textAlign: "center",
          color: "var(--dk)"
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "14px" }}>🗺️</div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", fontFamily: "'Playfair Display', serif" }}>
          Configure Mapbox Access Token
        </h3>
        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--soft)", maxWidth: "340px", lineHeight: "1.5" }}>
          To display therapist directory maps and local coverage patterns, please configure your Mapbox token.
        </p>
        <div 
          style={{
            background: "rgba(255,255,255,0.72)",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            border: "1px dashed rgba(124,158,138,0.3)",
            fontFamily: "monospace",
            color: "var(--sage)",
            marginBottom: "12px"
          }}
        >
          VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
        </div>
        <p style={{ margin: 0, fontSize: "11px", color: "var(--faint)" }}>
          Set this in your <code style={{ background: "rgba(0,0,0,0.04)", padding: "2px 4px", borderRadius: "4px" }}>frontend/.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="therapist-map" 
      style={{ width: "100%", height: "420px", borderRadius: "18px" }} 
    />
  );
}
