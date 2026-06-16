import { useState, useEffect, useMemo } from "react";
import { api } from "../utils/api";
import TherapistMap from "../components/TherapistMap";
import "./TherapistConnect.css";

const SAMPLE_THERAPISTS = [
  {
    id: "local-1",
    name: "Dr. Ananya Kulkarni",
    specialty: "Clinical Psychologist · CBT Specialist",
    rating: 4.9,
    reviews: 142,
    exp: "11 yrs",
    distance: "2.3 km",
    fee: "₹1200/session",
    available: true,
    tags: ["Anxiety", "Depression", "Stress"],
    avatar: "👩‍⚕️",
    avatarBg: "linear-gradient(135deg,#dceee4,#a8c4b0)",
    profileUrl: "https://example.com/dr-ananya-kulkarni",
    address: "Pimpri-Chinchwad, Pune, Maharashtra",
    lat: 18.6279,
    lng: 73.8000,
  },
  {
    id: "local-2",
    name: "Mr. Rohit Desai",
    specialty: "Counselling Psychologist · Mindfulness",
    rating: 4.7,
    reviews: 98,
    exp: "8 yrs",
    distance: "3.1 km",
    fee: "₹900/session",
    available: true,
    tags: ["Mindfulness", "Trauma", "Relationships"],
    avatar: "👨‍⚕️",
    avatarBg: "linear-gradient(135deg,#ede9f8,#c4b9e8)",
    profileUrl: "https://example.com/mr-rohit-desai",
    address: "Baner, Pune, Maharashtra",
    lat: 18.5582,
    lng: 73.7890,
  },
];

const INFO_CARDS = [
  { icon:"🔒", title:"Confidential & Safe",    desc:"All sessions are private and protected by our strict confidentiality policy and ethical guidelines." },
  { icon:"✅", title:"Verified Professionals", desc:"Every therapist is licensed, credentialed, and background-checked by our clinical review team." },
  { icon:"📱", title:"Online & In-Person",     desc:"Choose the format that works best for your comfort, schedule, and personal preference." },
];

export default function TherapistConnect() {
  const [therapists, setTherapists] = useState(SAMPLE_THERAPISTS);
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.6279, 73.8000]);
  const [citySearch, setCitySearch] = useState("");
  const [searchedLocation, setSearchedLocation] = useState(null);

  useEffect(() => {
    const loadTherapists = async () => {
      try {
        const data = await api.get("/therapists");
        if (Array.isArray(data) && data.length > 0) {
          setTherapists(data);
          const first = data.find((t) => t.lat && t.lng);
          if (first) {
            setMapCenter([Number(first.lat), Number(first.lng)]);
          }
        }
      } catch (err) {
        setError("Unable to load therapist listings. Showing sample data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTherapists();
  }, []);

  const filtered = useMemo(() => {
    // Helper function to calculate distance between two coordinates (in km)
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return therapists.filter((t) => {
      const searchValue = search.toLowerCase();
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(searchValue) ||
        t.specialty.toLowerCase().includes(searchValue) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(searchValue));
      const matchAvail =
        filterAvail === "all" ||
        (filterAvail === "available" && t.available);
      
      // If a city is searched, only show therapists within 20km radius
      let matchLocation = true;
      if (searchedLocation) {
        const distance = getDistance(
          searchedLocation[0],
          searchedLocation[1],
          t.lat,
          t.lng
        );
        matchLocation = distance <= 20; // 20km radius
      }
      
      return matchSearch && matchAvail && matchLocation;
    });
  }, [therapists, search, filterAvail, searchedLocation]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        setMapCenter([lat, lng]);
      },
      (err) => {
        setError("Could not get your location. Please try again.");
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        citySearch
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const location = data[0];
        setMapCenter([Number(location.lat), Number(location.lon)]);
        setSearchedLocation([Number(location.lat), Number(location.lon)]);
        setError(""); // Clear error on success
      } else {
        setError(`No results found for "${citySearch}". Try another location.`);
        setSearchedLocation(null);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to find that city or location.");
      setSearchedLocation(null);
    }
  };

  const handleClearCityFilter = () => {
    setCitySearch("");
    setSearchedLocation(null);
    setMapCenter([18.6279, 73.8000]);
  };

  return (
    <div className="therapist-page">
      <div className="pt-row fade-up">
        <h2 className="section-title">Therapist <span>Connect</span></h2>
        <button className="btn-pr" onClick={handleUseLocation}>
          📍 Use My Location
        </button>
      </div>

      {error && <div className="alert-message">{error}</div>}

      <div className="card map-card fd1">
        <div className="map-header">
          <div>
            <h3>{searchedLocation ? `📍 ${citySearch}` : "Nearby therapists"}</h3>
            <p>{filtered.length} therapist{filtered.length === 1 ? "" : "s"} available {searchedLocation ? "in this area" : ""}</p>
          </div>
          <div className="map-search-row">
            <input
              type="text"
              className="input-field therapist-search"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city or neighbourhood"
            />
            <button className="btn-out" onClick={handleCitySearch}>
              Search
            </button>
            {searchedLocation && (
              <button className="btn-out" onClick={handleClearCityFilter}>
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        <div className="map-wrapper">
          <TherapistMap
            therapists={filtered}
            center={mapCenter}
            userLocation={userLocation}
            onSelect={setSelected}
          />
        </div>
      </div>

      <div className="distress-alert fd1">
        <div className="distress-icon">🆘</div>
        <div style={{ flex: 1 }}>
          <div className="distress-title">If you're in crisis or feel unsafe</div>
          <div className="distress-text">
            iCall Helpline: <strong>9152987821</strong> &nbsp;·&nbsp; Vandrevala Foundation: <strong>1860-2662-345</strong> (24/7, free)
          </div>
        </div>
        <a 
          className="connect-btn" 
          style={{ background: "#c47880", flexShrink: 0, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          href="https://www.vandrevalafoundation.com/"
          target="_blank"
          rel="noreferrer"
        >
          Call Now
        </a>
      </div>

      <div className="therapist-controls fd2">
        <input
          className="input-field therapist-search"
          type="text"
          placeholder="Search by name, specialty, or issue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ch-tabs">
          <button
            className={`ch-tab ${filterAvail === "all" ? "on" : ""}`}
            onClick={() => setFilterAvail("all")}
          >
            All
          </button>
          <button
            className={`ch-tab ${filterAvail === "available" ? "on" : ""}`}
            onClick={() => setFilterAvail("available")}
          >
            Available Now
          </button>
        </div>
      </div>

      {loading && <p className="empty-state">Loading therapists...</p>}

      {!loading && filtered.length === 0 ? (
        <p className="empty-state">No therapists found matching your search.</p>
      ) : (
        <div className="therapist-grid fd2">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className={`card therapist-card ${selected === t.id ? "selected" : ""}`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => setSelected(selected === t.id ? null : t.id)}
            >
              <div className="th-avatar" style={{ background: t.avatarBg || "linear-gradient(135deg,#dceee4,#a8c4b0)" }}>
                {t.avatar || "👤"}
                <div className={`avail-badge ${t.available ? "avail-on" : "avail-off"}`} />
              </div>

              <div className="th-info">
                <div className="th-name-row">
                  <span className="th-name">{t.name}</span>
                  <span className="verified-badge">✓ Verified</span>
                </div>
                <div className="th-specialty">{t.specialty}</div>
                <div className="th-rating">
                  ⭐ {t.rating} · {t.reviews} reviews · {t.exp}
                </div>
                <div className="th-tags">
                  {t.tags?.map((tag) => (
                    <span key={tag} className="th-tag">{tag}</span>
                  ))}
                </div>
                <div className="th-bottom">
                  <span className="th-location">📍 {t.distance || t.address}</span>
                  <span className="th-fee">{t.fee}</span>
                </div>

                {selected === t.id && (
                  <div className="th-actions">
                    <a
                      className="btn-pr"
                      href={t.profileUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Profile
                    </a>
                    <a
                      className="btn-out"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${t.lat || 18.6279},${t.lng || 73.8000}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Get Directions
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="info-cards fd3">
        {INFO_CARDS.map((card, i) => (
          <div key={i} className="card info-card">
            <div className="info-icon">{card.icon}</div>
            <div className="info-title">{card.title}</div>
            <div className="info-desc">{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
