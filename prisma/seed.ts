import { PrismaClient, Role, EventStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedUsers() {
  console.log("Seeding users...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@evora.com" },
    update: {},
    create: {
      firstname: "Evora",
      lastname: "Admin",
      email: "admin@evora.com",
      password: passwordHash,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // Organizer
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@evora.com" },
    update: {},
    create: {
      firstname: "Event",
      lastname: "Organizer",
      email: "organizer@evora.com",
      password: passwordHash,
      role: Role.ORGANIZER,
      isVerified: true,
      refferalCode: "REFORG001",
    },
  });

  // Customers
  const customersData = [
    { firstname: "John", lastname: "Customer", email: "john@evora.com" },
    { firstname: "Alice", lastname: "Customer", email: "alice@evora.com" },
    { firstname: "Bob", lastname: "Customer", email: "bob@evora.com" },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        firstname: c.firstname,
        lastname: c.lastname,
        email: c.email,
        password: passwordHash,
        role: Role.CUSTOMER,
        isVerified: true,
      },
    });
    customers.push(customer);
  }

  console.log("Users seeded:");
  console.log("Admin:", admin.email);
  console.log("Organizer:", organizer.email);
  console.log("Customers:", customers.map((c) => c.email).join(", "));

  return { admin, organizer, customers };
}

function daysFromNow(days: number, hour = 19, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedEventsAndTickets(organizerId: string) {
  console.log("Cleaning old events & ticket types (dev only)...");

  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();

  console.log("Seeding events & ticket types...");

  const eventsData = [
    {
      title: "Jakarta Indie Music Night",
      slug: "jakarta-indie-music-night",
      description:
        "Enjoy a night of live indie performances from local bands in Jakarta.",
      category: "Music",
      location: "Jakarta",
      startDate: daysFromNow(3, 19),
      endDate: daysFromNow(3, 22),
      price: 150000,
      availableSeats: 150,
      status: EventStatus.PUBLISHED,
      bannerImg: null,
      tickets: [
        {
          name: "Early Bird",
          description: "Limited early access ticket",
          price: 100000,
          quota: 50,
        },
        {
          name: "Regular",
          description: "Standard ticket",
          price: 150000,
          quota: 80,
        },
        {
          name: "VIP",
          description: "Front row seat + meet & greet",
          price: 250000,
          quota: 20,
        },
      ],
    },
    {
      title: "Saturday Night Market & Food Fest",
      slug: "saturday-night-market-food-fest",
      description:
        "Discover street food, local brands, and live acoustic performances.",
      category: "Food & Drink",
      location: "Bandung",
      startDate: daysFromNow(5, 17),
      endDate: daysFromNow(5, 22),
      price: 0,
      availableSeats: 300,
      status: EventStatus.PUBLISHED,
      bannerImg: null,
      tickets: [
        {
          name: "General Admission",
          description: "Free entry ticket",
          price: 0,
          quota: 300,
        },
      ],
    },
    {
      title: "Creative Art Workshop: Paint & Chill",
      slug: "creative-art-workshop-paint-chill",
      description:
        "Hands-on painting workshop with guided instructor. All materials included.",
      category: "Art",
      location: "Online",
      startDate: daysFromNow(7, 10),
      endDate: daysFromNow(7, 12),
      price: 200000,
      availableSeats: 40,
      status: EventStatus.PUBLISHED,
      bannerImg: null,
      tickets: [
        {
          name: "Standard",
          description: "Includes digital material & recording",
          price: 200000,
          quota: 30,
        },
        {
          name: "Premium Kit",
          description: "Includes physical art kit shipped to your address",
          price: 350000,
          quota: 10,
        },
      ],
    },
    {
      title: "Startup & Business Networking Night",
      slug: "startup-business-networking-night",
      description:
        "Meet founders, investors, and professionals in a casual networking session.",
      category: "Business",
      location: "Jakarta",
      startDate: daysFromNow(10, 18),
      endDate: daysFromNow(10, 21),
      price: 50000,
      availableSeats: 100,
      status: EventStatus.PUBLISHED,
      bannerImg: null,
      tickets: [
        {
          name: "Networking Pass",
          description: "Includes 1 drink & snack",
          price: 50000,
          quota: 100,
        },
      ],
    },
    {
      title: "Board Game Sunday with New Friends",
      slug: "board-game-sunday-with-new-friends",
      description:
        "Casual board game session, perfect for meeting new people and having fun.",
      category: "Hobby",
      location: "Jakarta",
      startDate: daysFromNow(1, 14),
      endDate: daysFromNow(1, 18),
      price: 25000,
      availableSeats: 24,
      status: EventStatus.PUBLISHED,
      bannerImg: null,
      tickets: [
        {
          name: "Game Seat",
          description: "Includes access to all board games",
          price: 25000,
          quota: 24,
        },
      ],
    },
    {
      title: "Romantic Dinner Date Night",
      slug: "romantic-dinner-date-night",
      description:
        "Special curated 3-course dinner with live music performance.",
      category: "Dating",
      location: "Jakarta",
      startDate: daysFromNow(14, 19),
      endDate: daysFromNow(14, 22),
      price: 500000,
      availableSeats: 20,
      status: EventStatus.PUBLISHED,
      bannerImg: null,
      tickets: [
        {
          name: "Couple Package",
          description: "Dinner for two + welcome drink",
          price: 500000,
          quota: 20,
        },
      ],
    },
    {
      title: "New Year Countdown Party",
      slug: "new-year-countdown-party",
      description:
        "Celebrate New Year with DJ performance, fireworks, and confetti show.",
      category: "Nightlife",
      location: "Bali",
      startDate: daysFromNow(40, 20),
      endDate: daysFromNow(41, 1),
      price: 300000,
      availableSeats: 200,
      status: EventStatus.PUBLISHED,
      bannerImg: null,
      tickets: [
        {
          name: "General",
          description: "Standing area",
          price: 300000,
          quota: 160,
        },
        {
          name: "VIP Table",
          description: "Table for 4 with bottle service",
          price: 1500000,
          quota: 10,
        },
      ],
    },
  ];

  for (const ev of eventsData) {
    const created = await prisma.event.create({
      data: {
        organizerId,
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        category: ev.category,
        location: ev.location,
        startDate: ev.startDate,
        endDate: ev.endDate,
        price: ev.price,
        availableSeats: ev.availableSeats,
        status: ev.status,
        bannerImg: ev.bannerImg,
        ticketType: {
          create: ev.tickets.map((t) => ({
            name: t.name,
            description: t.description,
            price: t.price,
            quota: t.quota,
            availableQuota: t.quota,
          })),
        },
      },
      include: {
        ticketType: true,
      },
    });

    console.log(
      `Event created: ${created.title} (${created.category}) - tickets: ${created.ticketType.length}`
    );
  }

  console.log("Events & ticket types seeding completed!");
}

async function main() {
  console.log("Starting seed...");

  const { organizer } = await seedUsers();
  await seedEventsAndTickets(organizer.id);

  console.log("Seed finished.");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
