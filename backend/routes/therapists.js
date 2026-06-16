const router = require("express").Router();
const axios = require("axios");

const SAMPLE_THERAPISTS = [
  {
    id: "local-1",
    name: "Dr. Ananya Kulkarni",
    specialty: "Clinical Psychologist · CBT Specialist",
    rating: 4.9,
    reviews: 142,
    exp: "11 yrs",
    fee: "₹1200/session",
    available: true,
    tags: ["Anxiety", "Depression", "Stress"],
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
    fee: "₹900/session",
    available: true,
    tags: ["Mindfulness", "Trauma", "Relationships"],
    profileUrl: "https://example.com/mr-rohit-desai",
    address: "Baner, Pune, Maharashtra",
    lat: 18.5582,
    lng: 73.7890,
  },
   {
    id: "local-3",
    name: "Dr. Sneha Patil",
    specialty: "Psychiatrist · Anxiety & Mood Disorders",
    rating: 4.8,
    reviews: 121,
    exp: "10 yrs",
    fee: "₹1500/session",
    available: true,
    tags: [
      "Anxiety",
      "Panic Attacks",
      "Mood Disorders"
    ],
    profileUrl: "https://example.com/dr-sneha-patil",
    address: "Wakad, Pune, Maharashtra",
    lat: 18.5975,
    lng: 73.7898
  },
  {
    id: "local-4",
    name: "Ms. Neha Joshi",
    specialty: "Counselling Psychologist · Student Therapy",
    rating: 4.6,
    reviews: 87,
    exp: "6 yrs",
    fee: "₹800/session",
    available: true,
    tags: [
      "Stress",
      "Career Guidance",
      "Student Counseling"
    ],
    profileUrl: "https://example.com/ms-neha-joshi",
    address: "Hinjewadi, Pune, Maharashtra",
    lat: 18.5913,
    lng: 73.7389
  },
  {
    id: "local-5",
    name: "Dr. Karan Mehta",
    specialty: "Clinical Psychologist · Relationship Therapy",
    rating: 4.9,
    reviews: 176,
    exp: "13 yrs",
    fee: "₹1400/session",
    available: false,
    tags: [
      "Relationships",
      "Couple Therapy",
      "Depression"
    ],
    profileUrl: "https://example.com/dr-karan-mehta",
    address: "Aundh, Pune, Maharashtra",
    lat: 18.5608,
    lng: 73.8077
  },
  {
    id: "local-6",
    name: "Dr. Rutuja Shinde",
    specialty: "Therapist · Trauma Recovery Specialist",
    rating: 4.8,
    reviews: 109,
    exp: "9 yrs",
    fee: "₹1100/session",
    available: true,
    tags: [
      "Trauma",
      "PTSD",
      "Emotional Healing"
    ],
    profileUrl: "https://example.com/dr-rutuja-shinde",
    address: "Nigdi, Pune, Maharashtra",
    lat: 18.6513,
    lng: 73.7706
  },
  {
    id: "local-7",
    name: "Mr. Aditya Gokhale",
    specialty: "Mental Wellness Coach · Mindfulness Therapy",
    rating: 4.5,
    reviews: 74,
    exp: "5 yrs",
    fee: "₹700/session",
    available: true,
    tags: [
      "Mindfulness",
      "Burnout",
      "Work Stress"
    ],
    profileUrl: "https://example.com/mr-aditya-gokhale",
    address: "Pimple Saudagar, Pune, Maharashtra",
    lat: 18.5991,
    lng: 73.7816
  },
  {
    id: "local-8",
    name: "Dr. Meera Apte",
    specialty: "Child & Adolescent Psychologist",
    rating: 4.9,
    reviews: 133,
    exp: "12 yrs",
    fee: "₹1300/session",
    available: true,
    tags: [
      "Teen Mental Health",
      "ADHD",
      "Family Counseling"
    ],
    profileUrl: "https://example.com/dr-meera-apte",
    address: "Ravet, Pune, Maharashtra",
    lat: 18.6455,
    lng: 73.7458
  },
  {
    id: "local-9",
    name: "Ms. Priyanka More",
    specialty: "Psychotherapist · Women’s Mental Health",
    rating: 4.7,
    reviews: 91,
    exp: "7 yrs",
    fee: "₹950/session",
    available: true,
    tags: [
      "Women's Wellness",
      "Stress",
      "Self-esteem"
    ],
    profileUrl: "https://example.com/ms-priyanka-more",
    address: "Thergaon, Pune, Maharashtra",
    lat: 18.6152,
    lng: 73.7765
  }
];

const normalizeTherapist = (item) => {
  const name = item.name || item.fullName || item.provider_name || item.doctor || "Therapist";
  const specialty = item.specialty || item.specialization || item.title || "Mental Health Specialist";
  const profileUrl = item.profile_url || item.website || item.url || item.profileUrl || "";
  const address = item.address || item.location || item.clinic_address || "";

  return {
    id: item.id || item._id || item.provider_id || name,
    name,
    specialty,
    rating: item.rating ?? item.score ?? 4.5,
    reviews: item.reviews ?? item.reviewCount ?? 0,
    exp: item.experience || item.years || item.exp || "N/A",
    fee: item.fee || item.consultation_fee || item.price || "Contact for fee",
    available: item.available ?? item.status === "available" ?? true,
    tags: Array.isArray(item.tags) ? item.tags : item.categories || [],
    profileUrl,
    address,
    lat: item.lat || item.latitude || item.location?.lat || null,
    lng: item.lng || item.longitude || item.location?.lng || null,
    distance: item.distance || item.distance_km || "",
    description: item.description || item.bio || "Experienced therapist available for supportive care.",
  };
};

router.get("/", async (req, res) => {
  try {
    const apiUrl = process.env.THERAPIST_API_URL;
    const apiKey = process.env.THERAPIST_API_KEY;

    if (!apiUrl) {
      return res.json(SAMPLE_THERAPISTS);
    }

    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const response = await axios.get(apiUrl, { headers, timeout: 10000 });
    const data = response.data;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.therapists)
      ? data.therapists
      : [];

    const normalized = items.map(normalizeTherapist);

    res.json(normalized);
  } catch (error) {
    console.error("Therapist fetch error:", error.message || error);
    res.status(500).json({ error: error.message || "Failed to fetch therapists" });
  }
});

module.exports = router;
