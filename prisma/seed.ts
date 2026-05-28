// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai proses seeding...');
  const hashedPassword = bcrypt.hashSync('admin123', 10);

  // Buat Akun Admin RT
  const adminRT = await prisma.user.upsert({
    where: { email: 'adminrt@unimus.ac.id' },
    update: {},
    create: {
      email: 'adminrt@unimus.ac.id',
      name: 'Admin RT Pusat',
      password: hashedPassword, // Password-nya: admin123
      role: 'ADMIN_RT',
    },
  });

  // 2. Buat Akun Kepala RT 
  const kepalaRT = await prisma.user.upsert({
    where: { email: 'kepalart@unimus.ac.id' },
    update: {},
    create: {
      email: 'kepalart@unimus.ac.id',
      name: 'Bapak Kepala RT',
      password: hashedPassword,
      role: 'KEPALA_RT',
    },
  });

  // Buat Akun Mahasiswa
  const mahasiswa = await prisma.user.upsert({
    where: { email: 'mahasiswa@unimus.ac.id' },
    update: {},
    create: {
      email: 'mahasiswa@unimus.ac.id',
      name: 'Budi Mahasiswa',
      password: hashedPassword, // Password-nya: admin123
      role: 'MAHASISWA',
    },
  });

  console.log('Seeding berhasil! 🎉', { adminRT, mahasiswa });
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });