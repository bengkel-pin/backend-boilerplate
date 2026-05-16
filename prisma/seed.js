const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@indahjayabangunan.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@indahjayabangunan.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seed berhasil. Admin user:', admin.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
