/**
 * Reset Script — deletes Routes, Stops, Vehicles and related data.
 * Keeps Users and DriverProfiles. Skips tables that don't exist yet.
 *
 * Run with: bun run scripts/reset-data.ts
 */
import { PrismaService } from '../packages/db/prisma/index';

const prismaService = new PrismaService();
const prisma = prismaService.getClient();

async function tryDelete(label: string, fn: () => Promise<{ count: number }>) {
  try {
    const r = await fn();
    console.log(`✅ Deleted ${r.count} ${label} records`);
  } catch (e: any) {
    if (e.message?.includes('does not exist')) {
      console.log(`⏭️  Skipped ${label} (table not yet migrated)`);
    } else {
      throw e;
    }
  }
}

async function main() {
  console.log('🗑️  Starting data reset...\n');

  await tryDelete('DriverStop',        () => prisma.driverStop.deleteMany({}));
  await tryDelete('VehicleAssignment', () => prisma.vehicleAssignment.deleteMany({}));
  await tryDelete('LocationHistory',   () => prisma.locationHistory.deleteMany({}));
  await tryDelete('Trip',              () => prisma.trip.deleteMany({}));
  await tryDelete('RouteStop',         () => prisma.routeStop.deleteMany({}));
  await tryDelete('Route',             () => prisma.route.deleteMany({}));

  // Reset assignedRouteId on all driver profiles
  try {
    const r = await prisma.driverProfile.updateMany({ data: { assignedRouteId: null } });
    console.log(`✅ Reset assignedRouteId on ${r.count} DriverProfile records`);
  } catch { console.log('⏭️  Skipped DriverProfile reset'); }

  await tryDelete('Vehicle', () => prisma.vehicle.deleteMany({}));

  console.log('\n🎉 Reset complete. Users and DriverProfiles are preserved.');
}

main()
  .catch((e) => { console.error('❌ Reset failed:', e.message); process.exit(1); })
  .finally(() => prismaService.disconnect());
