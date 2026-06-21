import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import argon2 from "argon2";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";

const SEED_PASSWORD = "password123";

const organizers = [
  {
    name: "Alice Chen",
    email: "alice@organizer.com",
  },
  {
    name: "Marcus Rivera",
    email: "marcus@organizer.com",
  },
] as const;

const eventTemplates = [
  {
    title: "Tech Summit 2026",
    description:
      "A full-day conference covering AI, cloud infrastructure, and modern web development with keynote speakers and workshops.",
    location: "San Francisco Convention Center, CA",
    eventDate: new Date("2026-03-15T09:00:00.000Z"),
    totalTickets: 500,
  },
  {
    title: "Indie Music Festival",
    description:
      "Three stages featuring indie rock, electronic, and folk artists. Food trucks and artisan vendors on site.",
    location: "Austin Zilker Park, TX",
    eventDate: new Date("2026-04-20T16:00:00.000Z"),
    totalTickets: 2000,
  },
  {
    title: "Startup Pitch Night",
    description:
      "Early-stage founders pitch to angel investors. Networking reception follows the main program.",
    location: "WeWork Midtown, New York, NY",
    eventDate: new Date("2026-05-08T18:30:00.000Z"),
    totalTickets: 120,
  },
  {
    title: "Marathon City Run 2026",
    description:
      "Annual half-marathon through downtown. Includes finisher medals, hydration stations, and live timing.",
    location: "Chicago Lakefront Trail, IL",
    eventDate: new Date("2026-06-01T07:00:00.000Z"),
    totalTickets: 1500,
  },
  {
    title: "Food & Wine Expo",
    description:
      "Sample dishes from top regional chefs paired with local wines. Cooking demos every hour.",
    location: "Napa Valley Expo Hall, CA",
    eventDate: new Date("2026-06-21T11:00:00.000Z"),
    totalTickets: 800,
  },
  {
    title: "React & TypeScript Workshop",
    description:
      "Hands-on workshop building a full-stack app with React 19, TypeScript, and modern tooling.",
    location: "Online (Zoom)",
    eventDate: new Date("2026-07-10T14:00:00.000Z"),
    totalTickets: 60,
  },
  {
    title: "Summer Jazz in the Park",
    description:
      "Evening outdoor jazz concert series. Bring a blanket and enjoy live performances at sunset.",
    location: "Boston Common, MA",
    eventDate: new Date("2026-07-25T19:00:00.000Z"),
    totalTickets: 350,
  },
  {
    title: "Healthcare Innovation Forum",
    description:
      "Leaders in digital health discuss telemedicine, AI diagnostics, and patient data privacy.",
    location: "Seattle Convention Center, WA",
    eventDate: new Date("2026-08-05T09:30:00.000Z"),
    totalTickets: 400,
  },
  {
    title: "Photography Masterclass",
    description:
      "Learn portrait and landscape techniques from award-winning photographers. Cameras provided for beginners.",
    location: "Portland Art Museum, OR",
    eventDate: new Date("2026-08-18T10:00:00.000Z"),
    totalTickets: 40,
  },
  {
    title: "Esports Championship Finals",
    description:
      "Top teams compete in a live arena broadcast. Meet-and-greet with pro players after matches.",
    location: "Los Angeles Arena, CA",
    eventDate: new Date("2026-09-12T15:00:00.000Z"),
    totalTickets: 5000,
  },
  {
    title: "Green Energy Symposium",
    description:
      "Explore solar, wind, and battery storage trends. Panel discussions with industry engineers and policymakers.",
    location: "Denver Tech Center, CO",
    eventDate: new Date("2026-09-28T08:00:00.000Z"),
    totalTickets: 300,
  },
  {
    title: "Comedy Night Live",
    description:
      "Stand-up showcase featuring rising comedians. Two-drink minimum; doors open 30 minutes early.",
    location: "The Laugh Factory, Hollywood, CA",
    eventDate: new Date("2026-10-03T20:00:00.000Z"),
    totalTickets: 200,
  },
  {
    title: "Data Science Bootcamp",
    description:
      "Intensive one-day bootcamp on Python, pandas, and machine learning fundamentals for beginners.",
    location: "MIT Campus, Cambridge, MA",
    eventDate: new Date("2026-10-17T09:00:00.000Z"),
    totalTickets: 80,
  },
  {
    title: "Holiday Makers Market",
    description:
      "Artisan crafts, handmade gifts, and seasonal treats from local vendors. Family-friendly event.",
    location: "Pike Place Market, Seattle, WA",
    eventDate: new Date("2026-11-22T10:00:00.000Z"),
    totalTickets: 600,
  },
  {
    title: "New Year's Eve Gala",
    description:
      "Black-tie gala with live orchestra, champagne toast at midnight, and panoramic city views.",
    location: "Grand Hyatt Rooftop, Miami, FL",
    eventDate: new Date("2026-12-31T21:00:00.000Z"),
    totalTickets: 250,
  },
  {
    title: "Blockchain & Web3 Meetup",
    description:
      "Monthly meetup for developers and founders building on decentralized protocols and smart contracts.",
    location: "Miami Web3 Hub, FL",
    eventDate: new Date("2026-02-14T18:00:00.000Z"),
    totalTickets: 100,
  },
  {
    title: "Yoga & Wellness Retreat",
    description:
      "Full-day retreat with yoga sessions, meditation, nutrition talks, and healthy lunch included.",
    location: "Sedona Red Rock Center, AZ",
    eventDate: new Date("2026-05-30T08:00:00.000Z"),
    totalTickets: 75,
  },
  {
    title: "Classic Film Screening",
    description:
      "Restored 35mm screening of cinema classics with live organ accompaniment and historian Q&A.",
    location: "Paramount Theatre, Oakland, CA",
    eventDate: new Date("2026-08-30T19:30:00.000Z"),
    totalTickets: 180,
  },
];

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the seed.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createPrismaClient();
  const hashedPassword = await argon2.hash(SEED_PASSWORD);

  console.log("Seeding database...\n");

  const organizerRecords = [];

  for (const organizer of organizers) {
    const user = await prisma.user.upsert({
      where: { email: organizer.email },
      update: {
        name: organizer.name,
        role: UserRole.ORGANIZER,
      },
      create: {
        name: organizer.name,
        email: organizer.email,
        password: hashedPassword,
        role: UserRole.ORGANIZER,
      },
    });

    organizerRecords.push(user);
    console.log(`Organizer: ${user.name} <${user.email}>`);
  }

  for (const organizer of organizerRecords) {
    await prisma.event.deleteMany({ where: { organizerId: organizer.id } });
  }

  let eventCount = 0;

  for (let i = 0; i < eventTemplates.length; i++) {
    const template = eventTemplates[i];
    const organizer = organizerRecords[i % organizerRecords.length];

    await prisma.event.create({
      data: {
        title: template.title,
        description: template.description,
        location: template.location,
        eventDate: template.eventDate,
        totalTickets: template.totalTickets,
        availableTickets: template.totalTickets,
        organizerId: organizer.id,
      },
    });

    eventCount++;
  }

  console.log(`\nCreated ${eventCount} events (${Math.ceil(eventCount / 2)} per organizer).`);
  console.log("\nLogin credentials (all organizers):");
  console.log(`  Password: ${SEED_PASSWORD}`);
  for (const organizer of organizers) {
    console.log(`  Email:    ${organizer.email}`);
  }
  console.log("\nSeed completed.");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});