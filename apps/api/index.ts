import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Kafka } from "kafkajs";
import { PrismaService, VehicleStatus } from "db/client";
import crypto from "crypto";

dotenv.config();
const PORT = process.env.PORT || 3009;
const app = express();
app.use(express.json());
app.use(cors());
const prismaService = new PrismaService();
const prisma = prismaService.getClient();

const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "bus.location.updated";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "adl-api";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

type TelemetryPayload = {
  vehicleId: string;
  routeId?: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  recordedAt?: string;
};

const activeBuses = new Map<string, TelemetryPayload & { recordedAt: string }>();

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
});
const producer = kafka.producer();
let producerReady = false;

const connectProducer = async () => {
  if (producerReady) return;
  await producer.connect();
  producerReady = true;
};

const isValidCoordinate = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const parseTelemetry = (payload: unknown): TelemetryPayload | null => {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;

  if (typeof body.vehicleId !== "string" || body.vehicleId.trim().length === 0) {
    return null;
  }
  if (!isValidCoordinate(body.latitude, -90, 90) || !isValidCoordinate(body.longitude, -180, 180)) {
    return null;
  }
  if (body.speed !== undefined && (typeof body.speed !== "number" || !Number.isFinite(body.speed))) {
    return null;
  }
  if (body.routeId !== undefined && typeof body.routeId !== "string") {
    return null;
  }
  if (body.tripId !== undefined && typeof body.tripId !== "string") {
    return null;
  }
  if (body.recordedAt !== undefined && typeof body.recordedAt !== "string") {
    return null;
  }

  return {
    vehicleId: body.vehicleId.trim(),
    routeId: typeof body.routeId === "string" ? body.routeId : undefined,
    tripId: typeof body.tripId === "string" ? body.tripId : undefined,
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    speed: typeof body.speed === "number" ? body.speed : 0,
    recordedAt: typeof body.recordedAt === "string" ? body.recordedAt : undefined,
  };
};

app.get("/health", (_, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.get("/routes", async (_, res) => {
  const routes = await prisma.route.findMany({
    include: { stops: { orderBy: { sequence: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: routes.map((route) => ({
      id: route.id,
      code: route.code,
      name: route.name,
      city: route.city,
      isActive: route.isActive,
      stops: route.stops.map((stop) => ({
        id: stop.id,
        routeId: stop.routeId,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        sequence: stop.sequence,
      })),
    })),
  });
});

app.get("/drivers", async (_, res) => {
  const drivers = await prisma.driverProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: drivers.map((driver) => ({
      id: driver.id,
      userId: driver.userId,
      name: driver.user.name,
      phone: driver.phone ?? undefined,
      licenseNo: driver.licenseNo ?? undefined,
    })),
  });
});

app.get("/stops", async (_, res) => {
  const stops = await prisma.routeStop.findMany({
    orderBy: { sequence: "asc" },
  });

  res.json({
    success: true,
    data: stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  });
});

app.get("/buses/active", async (_, res) => {
  const buses = await prisma.vehicle.findMany({
    where: { status: VehicleStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: buses.map((bus) => ({
      id: bus.id,
      registration: bus.registration,
      type: bus.type,
      capacity: bus.capacity ?? undefined,
      status: bus.status,
    })),
  });
});

app.get("/vehicles", async (_, res) => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: vehicles.map((vehicle) => ({
      id: vehicle.id,
      registration: vehicle.registration,
      type: vehicle.type,
      capacity: vehicle.capacity ?? undefined,
      status: vehicle.status,
    })),
  });
});

app.post("/admin/routes", async (req, res) => {
  const { code, name, city } = req.body ?? {};
  if (!code || !name || !city) {
    res.status(400).json({ success: false, message: "code, name and city are required" });
    return;
  }

  const route = await prisma.route.create({
    data: {
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      city: String(city).trim(),
    },
    include: { stops: { orderBy: { sequence: "asc" } } },
  });

  res.status(201).json({
    success: true,
    data: {
      id: route.id,
      code: route.code,
      name: route.name,
      city: route.city,
      isActive: route.isActive,
      stops: route.stops,
    },
  });
});

app.post("/admin/stops", async (req, res) => {
  const { routeId, name, latitude, longitude } = req.body ?? {};
  const resolvedLatitude = Number(latitude);
  const resolvedLongitude = Number(longitude);
  if (
    !routeId ||
    !name ||
    Number.isNaN(resolvedLatitude) ||
    Number.isNaN(resolvedLongitude)
  ) {
    res
      .status(400)
      .json({ success: false, message: "routeId, name, latitude and longitude are required" });
    return;
  }

  const existing = await prisma.routeStop.findMany({
    where: { routeId: String(routeId) },
    orderBy: { sequence: "desc" },
    take: 1,
  });
  const nextSequence = (existing[0]?.sequence ?? 0) + 1;

  const stop = await prisma.routeStop.create({
    data: {
      routeId: String(routeId),
      name: String(name).trim(),
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
      sequence: nextSequence,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: stop.id,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
    },
  });
});

app.post("/admin/drivers", async (req, res) => {
  const { name, email, phone, licenseNo, password } = req.body ?? {};
  if (!name || !email) {
    res.status(400).json({ success: false, message: "name and email are required" });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedName = String(name).trim();

  const user = await prisma.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      password:
        typeof password === "string" && password.length >= 6
          ? password
          : crypto.randomUUID().replace(/-/g, "").slice(0, 16),
      role: "DRIVER",
      isActive: true,
    },
  });

  const driver = await prisma.driverProfile.create({
    data: {
      userId: user.id,
      phone: typeof phone === "string" ? phone.trim() || null : null,
      licenseNo: typeof licenseNo === "string" ? licenseNo.trim() || null : null,
    },
    include: { user: true },
  });

  res.status(201).json({
    success: true,
    data: {
      id: driver.id,
      userId: driver.userId,
      name: driver.user.name,
      phone: driver.phone ?? undefined,
      licenseNo: driver.licenseNo ?? undefined,
    },
  });
});

app.post("/admin/vehicles", async (req, res) => {
  const { registration, type, capacity, status } = req.body ?? {};
  if (!registration || !type) {
    res.status(400).json({ success: false, message: "registration and type are required" });
    return;
  }

  const resolvedStatus = Object.values(VehicleStatus).includes(status)
    ? status
    : VehicleStatus.ACTIVE;

  const vehicle = await prisma.vehicle.create({
    data: {
      registration: String(registration).trim().toUpperCase(),
      type: String(type).trim(),
      capacity: typeof capacity === "number" ? capacity : undefined,
      status: resolvedStatus,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: vehicle.id,
      registration: vehicle.registration,
      type: vehicle.type,
      capacity: vehicle.capacity ?? undefined,
      status: vehicle.status,
    },
  });
});

app.patch("/admin/vehicles/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  if (!Object.values(VehicleStatus).includes(status)) {
    res.status(400).json({ success: false, message: "invalid vehicle status" });
    return;
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { status },
  });

  res.json({
    success: true,
    data: {
      id: vehicle.id,
      registration: vehicle.registration,
      type: vehicle.type,
      capacity: vehicle.capacity ?? undefined,
      status: vehicle.status,
    },
  });
});

app.post("/telemetry", async (req, res) => {
  const telemetry = parseTelemetry(req.body);
  if (!telemetry) {
    res.status(400).json({
      success: false,
      message: "Invalid telemetry payload.",
    });
    return;
  }

  const event = {
    ...telemetry,
    recordedAt: telemetry.recordedAt || new Date().toISOString(),
  };

  activeBuses.set(event.vehicleId, event);

  try {
    await prisma.locationHistory.create({
      data: {
        vehicleId: event.vehicleId,
        tripId: event.tripId,
        latitude: event.latitude,
        longitude: event.longitude,
        speed: event.speed,
        recordedAt: new Date(event.recordedAt),
      },
    });

    await connectProducer();
    await producer.send({
      topic: KAFKA_TOPIC,
      messages: [{ key: event.vehicleId, value: JSON.stringify(event) }],
    });

    res.status(202).json({
      success: true,
      message: "Telemetry queued for realtime broadcast.",
      data: event,
    });
  } catch (error) {
    console.error("Failed to publish telemetry to Kafka", error);
    res.status(502).json({
      success: false,
      message: "Failed to publish telemetry.",
    });
  }
});

const start = async () => {
  await prismaService.connect();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

void start();
