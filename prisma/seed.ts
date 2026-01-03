import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Admin',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Manager',
    },
  });

  const waiterRole = await prisma.role.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Waiter',
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'Cashier',
    },
  });

  console.log('Roles created:', {
    adminRole,
    managerRole,
    waiterRole,
    cashierRole,
  });

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping creation');
  } else {
    // Create base entity for admin user
    const adminBaseEntity = await prisma.baseEntity.create({
      data: {
        created_at: new Date(),
        created_by: null, // Self-created
        isdeleted: false,
      },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const adminUser = await prisma.user.create({
      data: {
        fullname: 'System Administrator',
        username: 'admin',
        password: hashedPassword,
        is_active: true,
        base_entity_id: adminBaseEntity.id,
      },
    });

    // Assign admin role to admin user
    await prisma.userRole.create({
      data: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    });

    console.log('Admin user created:');
    console.log('  Username: admin');
    console.log('  Password: Admin@123');
    console.log('  Role: Admin');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
