import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Kafka } from "kafkajs";
import { PrismaService } from "db/client";

dotenv.config({ override: true });
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
    latitude: body.latitude as number,
    longitude: body.longitude as number,
    speed: typeof body.speed === "number" ? body.speed : 0,
    recordedAt: typeof body.recordedAt === "string" ? body.recordedAt : undefined,
  };
};

app.get("/health", (_, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.get("/buses/active", (_, res) => {
  void (async () => {
    const buses = await prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: buses });
  })().catch((error) => {
    console.error("Failed to fetch active buses", error);
    res.status(500).json({ success: false, message: "Failed to fetch active buses." });
  });
});

app.get("/routes", (_, res) => {
  void (async () => {
    const routes = await prisma.route.findMany({
      include: {
        stops: {
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: routes });
  })().catch((error) => {
    console.error("Failed to fetch routes", error);
    res.status(500).json({ success: false, message: "Failed to fetch routes." });
  });
});

app.get("/stops", (_, res) => {
  void (async () => {
    const stops = await prisma.routeStop.findMany({
      orderBy: [{ routeId: "asc" }, { sequence: "asc" }],
    });
    res.json({ success: true, data: stops });
  })().catch((error) => {
    console.error("Failed to fetch stops", error);
    res.status(500).json({ success: false, message: "Failed to fetch stops." });
  });
});

app.get("/drivers", (_, res) => {
  void (async () => {
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
        phone: driver.phone,
        licenseNo: driver.licenseNo,
      })),
    });
  })().catch((error) => {
    console.error("Failed to fetch drivers", error);
    res.status(500).json({ success: false, message: "Failed to fetch drivers." });
  });
});

app.get("/assignments", (_, res) => {
  void (async () => {
    const assignments = await prisma.vehicleAssignment.findMany({
      include: {
        vehicle: true,
        route: true,
        driver: {
          include: { user: true },
        },
      },
      orderBy: { startDate: "desc" },
    });
    res.json({
      success: true,
      data: assignments.map((assignment) => ({
        id: assignment.id,
        vehicleId: assignment.vehicleId,
        routeId: assignment.routeId,
        driverId: assignment.driverId,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        vehicleRegistration: assignment.vehicle.registration,
        routeCode: assignment.route.code,
        driverName: assignment.driver.user.name,
      })),
    });
  })().catch((error) => {
    console.error("Failed to fetch assignments", error);
    res.status(500).json({ success: false, message: "Failed to fetch assignments." });
  });
});

app.post("/admin/routes", (req, res) => {
  void (async () => {
    const body = req.body as { code?: string; name?: string; city?: string };
    const code = body.code?.trim().toUpperCase();
    const name = body.name?.trim();
    const city = body.city?.trim();
    if (!code || !name || !city) {
      res.status(400).json({ success: false, message: "code, name and city are required." });
      return;
    }

    const route = await prisma.route.create({
      data: {
        code,
        name,
        city,
      },
      include: { stops: true },
    });
    res.status(201).json({ success: true, data: route });
  })().catch((error: any) => {
    console.error("Failed to create route", error);
    if (error?.code === "P2002") {
      res.status(409).json({ success: false, message: "Route code already exists." });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create route." });
  });
});

app.post("/admin/stops", (req, res) => {
  void (async () => {
    const body = req.body as {
      routeId?: string;
      name?: string;
      latitude?: number;
      longitude?: number;
      sequence?: number;
    };
    const routeId = body.routeId?.trim();
    const name = body.name?.trim();
    if (!routeId || !name || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
      res.status(400).json({
        success: false,
        message: "routeId, name, latitude and longitude are required.",
      });
      return;
    }

    const existingCount = await prisma.routeStop.count({ where: { routeId } });
    const stop = await prisma.routeStop.create({
      data: {
        routeId,
        name,
        latitude: body.latitude,
        longitude: body.longitude,
        sequence: body.sequence ?? existingCount + 1,
      },
    });
    res.status(201).json({ success: true, data: stop });
  })().catch((error: any) => {
    console.error("Failed to create stop", error);
    if (error?.code === "P2003") {
      res.status(404).json({ success: false, message: "Route not found for stop." });
      return;
    }
    if (error?.code === "P2002") {
      res.status(409).json({ success: false, message: "Sequence already exists for this route." });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create stop." });
  });
});

app.post("/admin/vehicles", (req, res) => {
  void (async () => {
    const body = req.body as {
      registration?: string;
      type?: string;
      capacity?: number;
      status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
    };
    const registration = body.registration?.trim().toUpperCase();
    const type = body.type?.trim();
    if (!registration || !type) {
      res.status(400).json({ success: false, message: "registration and type are required." });
      return;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registration,
        type,
        capacity: typeof body.capacity === "number" ? body.capacity : undefined,
        status: body.status ?? "ACTIVE",
      },
    });
    res.status(201).json({ success: true, data: vehicle });
  })().catch((error: any) => {
    console.error("Failed to create vehicle", error);
    if (error?.code === "P2002") {
      res.status(409).json({ success: false, message: "Vehicle registration already exists." });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create vehicle." });
  });
});

app.post("/admin/drivers", (req, res) => {
  void (async () => {
    const body = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      licenseNo?: string;
    };
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "name, email and password are required." });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: "DRIVER",
        driverProfile: {
          create: {
            phone: body.phone?.trim() || null,
            licenseNo: body.licenseNo?.trim() || null,
          },
        },
      },
      include: { driverProfile: true },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.driverProfile?.id,
        userId: user.id,
        name: user.name,
        phone: user.driverProfile?.phone,
        licenseNo: user.driverProfile?.licenseNo,
      },
    });
  })().catch((error: any) => {
    console.error("Failed to create driver", error);
    if (error?.code === "P2002") {
      res.status(409).json({ success: false, message: "Driver email already exists." });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create driver." });
  });
});

app.post("/admin/assignments", (req, res) => {
  void (async () => {
    const body = req.body as {
      vehicleId?: string;
      routeId?: string;
      driverId?: string;
      startDate?: string;
      endDate?: string;
    };
    const vehicleId = body.vehicleId?.trim();
    const routeId = body.routeId?.trim();
    const driverId = body.driverId?.trim();
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (!vehicleId || !routeId || !driverId) {
      res.status(400).json({ success: false, message: "vehicleId, routeId and driverId are required." });
      return;
    }

    const assignment = await prisma.vehicleAssignment.create({
      data: { vehicleId, routeId, driverId, startDate, endDate },
    });
    res.status(201).json({ success: true, data: assignment });
  })().catch((error: any) => {
    console.error("Failed to create assignment", error);
    if (error?.code === "P2003") {
      res.status(404).json({ success: false, message: "Vehicle, route or driver not found." });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create assignment." });
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
