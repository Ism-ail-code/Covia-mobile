/** Ported 1:1 from the web app's src/data/mock.ts */

export type Verification = "id" | "student" | "phone" | "email";

export type Person = {
  id: string;
  name: string;
  initials: string;
  photo: string;
  rating: number;
  reliability: number;
  rides: number;
  joined: string;
  verifications: Verification[];
  bio?: string;
};

export type Ride = {
  id: string;
  host: Person;
  pickup: string;
  pickupLandmark: string;
  destination: string;
  date: string;
  time: string;
  seatsTotal: number;
  seatsLeft: number;
  fare: number;
  fareType: "Fixed fare" | "Smart split";
  service: "Uber" | "inDrive" | "Yango";
  distanceKm: number;
  tags: string[];
  passengers: Person[];
  status: "upcoming" | "active" | "completed" | "cancelled";
};

const p = (
  id: string,
  name: string,
  photo: string,
  rating: number,
  reliability: number,
  rides: number,
  verifications: Verification[],
  joined = "Mar 2024",
): Person => ({
  id,
  name,
  initials: name
    .split(" ")
    .map((n) => n[0])
    .join(""),
  photo,
  rating,
  reliability,
  rides,
  joined,
  verifications,
});

export const currentUser: Person = {
  ...p(
    "u0",
    "Amina Yusuf",
    "https://i.pravatar.cc/240?img=47",
    4.9,
    98,
    64,
    ["id", "student", "phone", "email"],
    "Jan 2024",
  ),
  bio: "Final-year design student. Always on the 8am route to campus.",
};

export const people: Person[] = [
  p("u1", "Daniel Okonkwo", "https://i.pravatar.cc/240?img=12", 4.9, 97, 128, ["id", "phone"]),
  p("u2", "Sara Mensah", "https://i.pravatar.cc/240?img=32", 5.0, 99, 86, [
    "id",
    "student",
    "phone",
  ]),
  p("u3", "Leo Martins", "https://i.pravatar.cc/240?img=15", 4.7, 92, 41, ["id", "email"]),
  p("u4", "Fatima Bello", "https://i.pravatar.cc/240?img=45", 4.8, 95, 73, ["id", "student"]),
  p("u5", "Kwame Adjei", "https://i.pravatar.cc/240?img=68", 4.6, 90, 22, ["phone", "email"]),
  p("u6", "Nadia Haruna", "https://i.pravatar.cc/240?img=26", 4.9, 96, 55, ["id", "student"]),
];

export const rides: Ride[] = [
  {
    id: "r1",
    host: people[1],
    pickup: "Maple Court, Lekki Phase 1",
    pickupLandmark: "Beside the blue coffee kiosk",
    destination: "Victoria Island — Landmark Centre",
    date: "Today",
    time: "08:15",
    seatsTotal: 4,
    seatsLeft: 2,
    fare: 1450,
    fareType: "Smart split",
    service: "Uber",
    distanceKm: 12.4,
    tags: ["Women only", "Students", "Quiet ride"],
    passengers: [people[3], people[5]],
    status: "upcoming",
  },
  {
    id: "r2",
    host: people[0],
    pickup: "Ikeja City Mall",
    pickupLandmark: "Gate 2, taxi bay",
    destination: "Yaba Tech Campus",
    date: "Today",
    time: "09:00",
    seatsTotal: 3,
    seatsLeft: 1,
    fare: 980,
    fareType: "Fixed fare",
    service: "inDrive",
    distanceKm: 9.1,
    tags: ["Students", "Luggage ok"],
    passengers: [people[4], people[2]],
    status: "active",
  },
  {
    id: "r3",
    host: people[3],
    pickup: "Surulere, Adeniran Ogunsanya",
    pickupLandmark: "In front of the pharmacy",
    destination: "National Theatre",
    date: "Tomorrow",
    time: "17:30",
    seatsTotal: 4,
    seatsLeft: 3,
    fare: 1120,
    fareType: "Smart split",
    service: "Yango",
    distanceKm: 7.8,
    tags: ["Women only"],
    passengers: [people[5]],
    status: "upcoming",
  },
  {
    id: "r4",
    host: people[2],
    pickup: "Gbagada Phase 2",
    pickupLandmark: "Estate main gate",
    destination: "Lekki Toll Gate",
    date: "Tomorrow",
    time: "07:45",
    seatsTotal: 4,
    seatsLeft: 2,
    fare: 1680,
    fareType: "Fixed fare",
    service: "Uber",
    distanceKm: 18.2,
    tags: ["Early bird", "Air-con"],
    passengers: [people[0], people[1]],
    status: "upcoming",
  },
  {
    id: "r5",
    host: people[5],
    pickup: "Ajah Bus Stop",
    pickupLandmark: "Under the pedestrian bridge",
    destination: "Ikoyi — Awolowo Road",
    date: "Fri, 12 Sep",
    time: "06:50",
    seatsTotal: 3,
    seatsLeft: 0,
    fare: 2100,
    fareType: "Smart split",
    service: "inDrive",
    distanceKm: 24.6,
    tags: ["Students", "Quiet ride"],
    passengers: [people[1], people[4], people[3]],
    status: "completed",
  },
  {
    id: "r6",
    host: people[4],
    pickup: "Ogba, College Road",
    pickupLandmark: "Opposite the bank",
    destination: "Computer Village",
    date: "Mon, 8 Sep",
    time: "10:20",
    seatsTotal: 4,
    seatsLeft: 4,
    fare: 760,
    fareType: "Fixed fare",
    service: "Yango",
    distanceKm: 5.2,
    tags: ["Luggage ok"],
    passengers: [],
    status: "cancelled",
  },
];

export const getRide = (id: string) => rides.find((r) => r.id === id) ?? rides[0];

export type TimelineStep = {
  label: string;
  detail: string;
  time: string;
};

export const timelineSteps: TimelineStep[] = [
  { label: "Ride created", detail: "Sara published this route", time: "07:02" },
  { label: "Passenger joined", detail: "Fatima requested a seat", time: "07:14" },
  { label: "Passenger approved", detail: "Host approved 2 companions", time: "07:18" },
  { label: "Ride full", detail: "All 4 seats matched", time: "07:41" },
  { label: "Driver booked", detail: "Booked on Uber by host", time: "07:52" },
  { label: "Driver arriving", detail: "3 minutes from pickup", time: "08:09" },
  { label: "Passengers arrived", detail: "3 of 4 at the meeting point", time: "08:12" },
  { label: "Ride started", detail: "En route to Victoria Island", time: "08:16" },
  { label: "Passenger dropped", detail: "First stop completed", time: "08:34" },
  { label: "Ride completed", detail: "Fare split confirmed", time: "08:48" },
];

export type AppNotification = {
  id: string;
  kind:
    | "request"
    | "approved"
    | "rejected"
    | "joined"
    | "cancelled"
    | "reminder"
    | "started"
    | "completed"
    | "emergency";
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export const notifications: AppNotification[] = [
  {
    id: "n1",
    kind: "request",
    title: "New join request",
    body: "Kwame Adjei wants a seat on your 09:00 ride to Yaba Tech.",
    time: "2m",
    unread: true,
  },
  {
    id: "n2",
    kind: "approved",
    title: "Request approved",
    body: "Sara approved you for the 08:15 ride to Landmark Centre.",
    time: "18m",
    unread: true,
  },
  {
    id: "n3",
    kind: "reminder",
    title: "Ride starts in 30 minutes",
    body: "Head to Maple Court, beside the blue coffee kiosk.",
    time: "42m",
    unread: true,
  },
  {
    id: "n4",
    kind: "joined",
    title: "Passenger joined",
    body: "Nadia Haruna joined your Surulere → National Theatre ride.",
    time: "3h",
    unread: false,
  },
  {
    id: "n5",
    kind: "emergency",
    title: "Safety check-in",
    body: "We noticed an unusual stop. Tap to confirm you are safe.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "n6",
    kind: "completed",
    title: "Ride completed",
    body: "Your fare split was ₦2,100. Rate your companions.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "n7",
    kind: "cancelled",
    title: "Ride cancelled",
    body: "Kwame cancelled the Ogba → Computer Village ride.",
    time: "2d",
    unread: false,
  },
];

export type ChatMessage = {
  id: string;
  author: Person | null;
  text: string;
  time: string;
  mine?: boolean;
  announcement?: boolean;
};

export const chatMessages: ChatMessage[] = [
  {
    id: "m0",
    author: null,
    text: "Ride created — Maple Court → Landmark Centre, departing 08:15",
    time: "07:02",
    announcement: true,
  },
  { id: "m1", author: people[1], text: "Morning everyone! I'll book the Uber at 08:05.", time: "07:55" },
  { id: "m2", author: people[3], text: "Perfect. I'm already at the kiosk ☕", time: "07:57" },
  { id: "m3", author: currentUser, text: "Leaving now, 4 minutes away.", time: "07:58", mine: true },
  {
    id: "m4",
    author: null,
    text: "Driver booked on Uber — silver Corolla, 3 min away",
    time: "08:05",
    announcement: true,
  },
  { id: "m5", author: people[5], text: "Should we wait at the gate or the kiosk?", time: "08:07" },
  { id: "m6", author: people[1], text: "Kiosk please, easier for the driver to stop.", time: "08:08" },
];

export const quickActions = [
  { label: "Create ride", icon: "plus", to: "/create" },
  { label: "Browse", icon: "compass", to: "/explore" },
  { label: "Safety", icon: "shield", to: "/safety" },
  { label: "Activity", icon: "clock", to: "/activity" },
];

export const safetyTips = [
  "Always confirm the host's verification badge before joining.",
  "Share your live ride link with an emergency contact.",
  "Meet at well-lit, public pickup landmarks.",
  "Companion never handles your driver payment — split in-app after the ride.",
];

export const emergencyContacts = [
  { name: "Zainab Yusuf", relation: "Sister", phone: "+234 802 •••• 118" },
  { name: "Tobi Adeyemi", relation: "Roommate", phone: "+234 813 •••• 402" },
];

export const reviews = [
  {
    id: "rv1",
    author: people[0],
    rating: 5,
    text: "Great companion, on time and easy to coordinate with. Would ride again.",
    time: "1 week ago",
  },
  {
    id: "rv2",
    author: people[3],
    rating: 5,
    text: "Very clear pickup instructions and split the fare instantly.",
    time: "3 weeks ago",
  },
  {
    id: "rv3",
    author: people[2],
    rating: 4,
    text: "Friendly and punctual. Chat updates were helpful.",
    time: "Last month",
  },
];

export const money = (n: number) => `₦${n.toLocaleString()}`;
