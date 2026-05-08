import { PrismaService } from '../packages/db/prisma/index';

const prismaService = new PrismaService();
const prisma = prismaService.getClient();
const API_URL = 'http://localhost:3009/api/v1/location/update';

// Utility to calculate intermediate points
function interpolate(lat1: number, lon1: number, lat2: number, lon2: number, steps: number) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = lat1 + (lat2 - lat1) * fraction;
    const lon = lon1 + (lon2 - lon1) * fraction;
    points.push({ latitude: lat, longitude: lon });
  }
  return points;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('--- Setting up Simulation Data ---');

  // 1. (Removed college setup as model was removed)

  // 2. Find or Create Driver "Luffy"
  let driver = await prisma.user.findFirst({
    where: { name: { contains: 'luffy', mode: 'insensitive' } },
    include: { driverProfile: true }
  });
  if (!driver) {
    driver = await prisma.user.create({
      data: {
        name: 'Monkey D. Luffy',
        email: 'luffy@example.com',
        password: 'password123',
        role: 'DRIVER',
        driverProfile: { create: { phone: '1234567890' } }
      },
      include: { driverProfile: true }
    });
    console.log('Created Driver:', driver.name);
  } else {
    if (!driver.driverProfile) {
      await prisma.driverProfile.create({ data: { userId: driver.id } });
      driver = await prisma.user.findUniqueOrThrow({ where: { id: driver.id }, include: { driverProfile: true } });
    }
    console.log('Found Driver:', driver.name);
  }

  // 3. Find or Create Vehicle
  let vehicle = await prisma.vehicle.findFirst({
    where: { registration: 'TN 38 PIRATE' }
  });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        registration: 'TN 38 PIRATE',
        capacity: 40,
        type: 'Bus'
      }
    });
    console.log('Created Vehicle:', vehicle.registration);
  } else {
    console.log('Found Vehicle:', vehicle.registration);
  }

  // 4. Create the simulation Route
  let route = await prisma.route.findFirst({
    where: { code: 'GRAND_LINE' }
  });
  if (!route) {
    route = await prisma.route.create({
      data: {
        code: 'GRAND_LINE',
        startLocation: 'Gandhipuram Town Bus Stand',
        destinationLocation: 'PSG College of Technology',
        startLat: 11.0168,
        startLng: 76.9558,
        destLat: 11.0241,
        destLng: 76.9636,
        city: 'Coimbatore',
        stops: {
          create: [
            {
              name: 'Hopes College',
              latitude: 11.0274,
              longitude: 76.9533,
              sequence: 1
            }
          ]
        }
      }
    });
    console.log('Created Route:', route.code);
  } else {
    console.log('Found Route:', route.code);
  }

  // 5. Create Assignment
  let assignment = await prisma.vehicleAssignment.findFirst({
    where: { driverId: driver.driverProfile!.id, routeId: route.id, vehicleId: vehicle.id }
  });
  if (!assignment) {
    assignment = await prisma.vehicleAssignment.create({
      data: {
        driverId: driver.driverProfile!.id,
        routeId: route.id,
        vehicleId: vehicle.id,
        startDate: new Date()
      }
    });
    console.log('Created Assignment');
  }

  // 6. Stop any existing running trips for this vehicle
  await prisma.trip.updateMany({
    where: { vehicleId: vehicle.id, status: 'RUNNING' },
    data: { status: 'COMPLETED', endedAt: new Date() }
  });

  // 7. Start a new Trip
  const trip = await prisma.trip.create({
    data: {
      routeId: route.id,
      vehicleId: vehicle.id,
      status: 'RUNNING',
      startedAt: new Date()
    }
  });
  console.log('Started new Trip ID:', trip.id);

  // --- SIMULATION LOOP ---
  console.log('\n--- Starting Simulation ---');

  // Points: Gandhipuram -> Hopes -> PSG
  const leg1 = interpolate(11.0168, 76.9558, 11.0274, 76.9533, 20); // 20 steps
  const leg2 = interpolate(11.0274, 76.9533, 11.0241, 76.9636, 15); // 15 steps

  const fullPath = [
    ...leg1.map(p => ({ ...p, stopsCrossed: 0, targetSpeed: 30 })),
    ...leg2.map(p => ({ ...p, stopsCrossed: 1, targetSpeed: 45 }))
  ];

  for (let i = 0; i < fullPath.length; i++) {
    const point = fullPath[i];
    if (!point) continue;

    // Vary the speed slightly for realism
    const speed = point.targetSpeed + (Math.random() * 10 - 5);

    const payload = {
      vehicleId: vehicle.id,
      tripId: trip.id,
      latitude: point.latitude,
      longitude: point.longitude,
      speed: speed,
      status: 'ACTIVE',
      stopsCrossed: point.stopsCrossed
    };

    console.log(`[Step ${i+1}/${fullPath.length}] Sending GPS: Lat ${point.latitude.toFixed(5)}, Lng ${point.longitude.toFixed(5)} | Speed: ${speed.toFixed(1)} km/h | Stops: ${point.stopsCrossed}`);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('Failed to send update:', await res.text());
      }
    } catch (err) {
      console.error('Error sending update:', err);
    }

    // Wait 2.5 seconds between updates
    await sleep(2500);
  }

  // End the trip
  await prisma.trip.update({
    where: { id: trip.id },
    data: { status: 'COMPLETED', endedAt: new Date() }
  });

  console.log('\n--- Simulation Finished ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
