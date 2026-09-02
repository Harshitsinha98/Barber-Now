import type { Shop, Service } from "./types";

// Reusable Unsplash imagery (barbershops / grooming)
const IMG = {
  cover1:
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
  cover2:
    "https://images.unsplash.com/photo-1521490878406-8b98e0eaced4?auto=format&fit=crop&w=1200&q=80",
  cover3:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
  cover4:
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80",
  cover5:
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80",
  cover6:
    "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80",
  g1: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80",
  g2: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
  g3: "https://images.unsplash.com/photo-1596728325488-58c87691e9af?auto=format&fit=crop&w=800&q=80",
  g4: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80",
  g5: "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?auto=format&fit=crop&w=800&q=80",
};

function avatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=1a1d24&color=c9a24b&size=128&bold=true`;
}

// Common service menus
const gentsServices: Service[] = [
  { id: "s-haircut", name: "Haircut", price: 250, durationMinutes: 30, category: "hair", description: "Classic or modern cut by an expert stylist." },
  { id: "s-haircut-premium", name: "Premium Styling Cut", price: 450, durationMinutes: 45, category: "hair", discountPercent: 15, description: "Consultation + wash + precision cut + styling." },
  { id: "s-beard", name: "Beard Trim & Shape", price: 150, durationMinutes: 20, category: "beard", description: "Detailed shaping with hot towel finish." },
  { id: "s-shave", name: "Royal Shave", price: 200, durationMinutes: 25, category: "shave", description: "Hot towel, pre-shave oil, straight razor shave." },
  { id: "s-headmassage", name: "Head Massage", price: 180, durationMinutes: 20, category: "spa", description: "Relaxing champi with premium oils." },
  { id: "s-facial", name: "De-Tan Facial", price: 600, durationMinutes: 40, category: "spa", discountPercent: 20, description: "Refreshing facial to remove tan & dullness." },
  { id: "s-combo", name: "Haircut + Beard Combo", price: 350, durationMinutes: 45, category: "combo", discountPercent: 10, description: "Best value grooming combo." },
  { id: "s-kids", name: "Kids Haircut", price: 150, durationMinutes: 20, category: "kids", description: "Gentle, patient cuts for little ones." },
];

export const shops: Shop[] = [
  {
    id: "1",
    slug: "sharma-mens-salon",
    name: "Sharma Men's Salon",
    tagline: "Traditional cuts, modern comfort",
    address: "Shop 14, Lajpat Nagar Central Market",
    area: "Lajpat Nagar",
    city: "New Delhi",
    distanceKm: 0.8,
    lat: 28.5677,
    lng: 77.2433,
    rating: 4.7,
    reviewCount: 428,
    priceLevel: 2,
    coverImage: IMG.cover1,
    gallery: [IMG.g1, IMG.g2, IMG.g3, IMG.g4],
    openNow: true,
    openHours: "9:00 AM – 9:00 PM",
    amenities: ["AC", "UPI / Cards", "Sanitised Tools", "Kids Friendly"],
    services: gentsServices,
    barbers: [
      { id: "b1", name: "Raju Sharma", avatarUrl: avatar("Raju Sharma"), specialities: ["Fades", "Beard"], rating: 4.8, experienceYears: 12 },
      { id: "b2", name: "Amit Kumar", avatarUrl: avatar("Amit Kumar"), specialities: ["Classic Cut", "Shave"], rating: 4.6, experienceYears: 7 },
    ],
    reviews: [
      { id: "r1", userName: "Vikas G.", rating: 5, comment: "Best fade in Lajpat Nagar. Booked online, zero wait!", date: "2026-08-20" },
      { id: "r2", userName: "Rohan M.", rating: 4, comment: "Clean place, good beard work. AC was a relief.", date: "2026-08-14" },
    ],
    queue: { peopleAhead: 3, avgServiceMinutes: 15, status: "moderate" },
  },
  {
    id: "2",
    slug: "the-gentlemen-lounge",
    name: "The Gentlemen Lounge",
    tagline: "Premium grooming studio",
    address: "1st Floor, DLF Galleria, Sector 28",
    area: "DLF Phase 4",
    city: "Gurugram",
    distanceKm: 1.4,
    lat: 28.4692,
    lng: 77.0821,
    rating: 4.9,
    reviewCount: 612,
    priceLevel: 3,
    coverImage: IMG.cover2,
    gallery: [IMG.g2, IMG.g5, IMG.g3, IMG.g1],
    openNow: true,
    openHours: "10:00 AM – 10:00 PM",
    amenities: ["AC", "Valet Parking", "Complimentary Beverage", "Cards / UPI"],
    services: gentsServices.map((s) => ({ ...s, price: Math.round(s.price * 1.6) })),
    barbers: [
      { id: "b3", name: "Kabir Singh", avatarUrl: avatar("Kabir Singh"), specialities: ["Executive Styling"], rating: 4.9, experienceYears: 15 },
      { id: "b4", name: "Sameer Ali", avatarUrl: avatar("Sameer Ali"), specialities: ["Beard Sculpting", "Facials"], rating: 4.8, experienceYears: 9 },
    ],
    reviews: [
      { id: "r3", userName: "Aditya R.", rating: 5, comment: "Feels like a proper spa. Worth every rupee.", date: "2026-08-22" },
      { id: "r4", userName: "Nikhil P.", rating: 5, comment: "The straight razor shave is elite. Highly recommend.", date: "2026-08-10" },
    ],
    queue: { peopleAhead: 0, avgServiceMinutes: 25, status: "quiet" },
  },
  {
    id: "3",
    slug: "classic-cuts-barbershop",
    name: "Classic Cuts Barbershop",
    tagline: "Your neighbourhood barber, upgraded",
    address: "22, FC Road, Near Deccan",
    area: "Shivajinagar",
    city: "Pune",
    distanceKm: 2.1,
    lat: 18.5236,
    lng: 73.8478,
    rating: 4.5,
    reviewCount: 289,
    priceLevel: 1,
    coverImage: IMG.cover3,
    gallery: [IMG.g3, IMG.g4, IMG.g1, IMG.g2],
    openNow: false,
    openHours: "9:30 AM – 8:30 PM",
    amenities: ["UPI", "Sanitised Tools", "Kids Friendly"],
    services: gentsServices.map((s) => ({ ...s, price: Math.round(s.price * 0.8) })),
    barbers: [
      { id: "b5", name: "Ganesh Patil", avatarUrl: avatar("Ganesh Patil"), specialities: ["Quick Cuts"], rating: 4.5, experienceYears: 10 },
    ],
    reviews: [
      { id: "r5", userName: "Sagar D.", rating: 4, comment: "Affordable and quick. Queue tracker saves so much time.", date: "2026-08-18" },
    ],
    queue: { peopleAhead: 6, avgServiceMinutes: 12, status: "busy" },
  },
  {
    id: "4",
    slug: "urban-mane-studio",
    name: "Urban Mane Studio",
    tagline: "Where style meets precision",
    address: "45, Indiranagar 100ft Road",
    area: "Indiranagar",
    city: "Bengaluru",
    distanceKm: 3.2,
    lat: 12.9719,
    lng: 77.6412,
    rating: 4.8,
    reviewCount: 517,
    priceLevel: 2,
    coverImage: IMG.cover4,
    gallery: [IMG.g4, IMG.g1, IMG.g5, IMG.g3],
    openNow: true,
    openHours: "10:00 AM – 9:30 PM",
    amenities: ["AC", "Cards / UPI", "Complimentary Beverage", "Wi-Fi"],
    services: gentsServices.map((s) => ({ ...s, price: Math.round(s.price * 1.2) })),
    barbers: [
      { id: "b6", name: "Arjun Nair", avatarUrl: avatar("Arjun Nair"), specialities: ["Textured Crops", "Colour"], rating: 4.9, experienceYears: 8 },
      { id: "b7", name: "David Thomas", avatarUrl: avatar("David Thomas"), specialities: ["Fades", "Beard"], rating: 4.7, experienceYears: 6 },
    ],
    reviews: [
      { id: "r6", userName: "Karthik S.", rating: 5, comment: "Arjun nailed the textured crop. Booking flow is smooth.", date: "2026-08-21" },
      { id: "r7", userName: "Mehul J.", rating: 5, comment: "Never waiting in line again. Game changer.", date: "2026-08-05" },
    ],
    queue: { peopleAhead: 2, avgServiceMinutes: 18, status: "moderate" },
  },
  {
    id: "5",
    slug: "royal-touch-salon",
    name: "Royal Touch Salon",
    tagline: "Grooming fit for royalty",
    address: "Shop 3, C.G. Road, Navrangpura",
    area: "Navrangpura",
    city: "Ahmedabad",
    distanceKm: 4.0,
    lat: 23.0369,
    lng: 72.5619,
    rating: 4.6,
    reviewCount: 341,
    priceLevel: 2,
    coverImage: IMG.cover5,
    gallery: [IMG.g5, IMG.g2, IMG.g4, IMG.g1],
    openNow: true,
    openHours: "9:00 AM – 9:00 PM",
    amenities: ["AC", "UPI / Cards", "Sanitised Tools"],
    services: gentsServices,
    barbers: [
      { id: "b8", name: "Imran Shaikh", avatarUrl: avatar("Imran Shaikh"), specialities: ["Beard Art", "Shave"], rating: 4.7, experienceYears: 11 },
    ],
    reviews: [
      { id: "r8", userName: "Jay P.", rating: 5, comment: "Imran bhai is an artist with the beard. Loved it.", date: "2026-08-19" },
    ],
    queue: { peopleAhead: 1, avgServiceMinutes: 20, status: "quiet" },
  },
  {
    id: "6",
    slug: "the-cut-above",
    name: "The Cut Above",
    tagline: "Modern barbering, timeless service",
    address: "8, Park Street, Near Flurys",
    area: "Park Street",
    city: "Kolkata",
    distanceKm: 5.5,
    lat: 22.5535,
    lng: 88.3521,
    rating: 4.4,
    reviewCount: 198,
    priceLevel: 2,
    coverImage: IMG.cover6,
    gallery: [IMG.g1, IMG.g3, IMG.g2, IMG.g5],
    openNow: true,
    openHours: "10:30 AM – 9:00 PM",
    amenities: ["AC", "UPI", "Wi-Fi", "Kids Friendly"],
    services: gentsServices.map((s) => ({ ...s, price: Math.round(s.price * 1.1) })),
    barbers: [
      { id: "b9", name: "Rahul Das", avatarUrl: avatar("Rahul Das"), specialities: ["Classic Cut"], rating: 4.4, experienceYears: 9 },
    ],
    reviews: [
      { id: "r9", userName: "Souvik B.", rating: 4, comment: "Solid haircut, friendly staff, fair prices.", date: "2026-08-12" },
    ],
    queue: { peopleAhead: 4, avgServiceMinutes: 16, status: "busy" },
  },
];

export function getShopBySlug(slug: string): Shop | undefined {
  return shops.find((s) => s.slug === slug);
}

export const cities = Array.from(new Set(shops.map((s) => s.city))).sort();
