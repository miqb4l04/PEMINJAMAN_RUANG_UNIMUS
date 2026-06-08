import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Baris import process TELAH DIHAPUS agar tidak ada lagi error ts(2591)

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database...');

  // 1. Hash password menggunakan await (Non-blocking, Best Practice Node.js)
  const defaultPassword = await bcrypt.hash('admin123', 10);

  // 2. Buat Akun Admin RT
  console.log('⏳ Memproses akun Admin RT...');
  await prisma.user.upsert({
    where: { email: 'adminrt@unimus.ac.id' },
    update: { 
      password: defaultPassword,
      name: 'Admin RT Pusat'
    },
    create: {
      email: 'adminrt@unimus.ac.id',
      name: 'Admin RT Pusat',
      password: defaultPassword, 
      role: 'ADMIN_RT',
    },
  });

  // 3. Buat Akun Kepala RT 
  console.log('⏳ Memproses akun Kepala RT...');
  await prisma.user.upsert({
    where: { email: 'kepalart@unimus.ac.id' },
    update: { 
      password: defaultPassword,
      name: 'Bapak Kepala RT'
    },
    create: {
      email: 'kepalart@unimus.ac.id',
      name: 'Bapak Kepala RT',
      password: defaultPassword,
      role: 'KEPALA_RT',
    },
  });

  // 4. Buat Akun Mahasiswa 1
  console.log('⏳ Memproses akun Mahasiswa 1...');
  await prisma.user.upsert({
    where: { email: 'mahasiswa1@unimus.ac.id' },
    update: { 
      password: defaultPassword,
      name: 'Budi (BEM Fakultas)'
    },
    create: {
      email: 'mahasiswa1@unimus.ac.id',
      name: 'Budi (BEM Fakultas)',
      password: defaultPassword, 
      role: 'MAHASISWA',
    },
  });

  // 5. Buat Akun Mahasiswa 2 (BARU)
  console.log('⏳ Memproses akun Mahasiswa 2...');
  await prisma.user.upsert({
    where: { email: 'mahasiswa2@unimus.ac.id' },
    update: { 
      password: defaultPassword,
      name: 'Siti Aminah (UKM Olahraga)'
    },
    create: {
      email: 'mahasiswa2@unimus.ac.id',
      name: 'Siti Aminah (UKM Olahraga)',
      password: defaultPassword, 
      role: 'MAHASISWA',
    },
  });

  // 6. Buat Akun Mahasiswa 3 (BARU)
  console.log('⏳ Memproses akun Mahasiswa 3...');
  await prisma.user.upsert({
    where: { email: 'mahasiswa3@unimus.ac.id' },
    update: { 
      password: defaultPassword,
      name: 'Andi Pratama (HIMA Teknik)'
    },
    create: {
      email: 'mahasiswa3@unimus.ac.id',
      name: 'Andi Pratama (HIMA Teknik)',
      password: defaultPassword, 
      role: 'MAHASISWA',
    },
  });

  // 7. Tampilkan hasil di terminal dengan cantik dan informatif
  console.log('\n✅ SEEDING BERHASIL! Database telah siap digunakan.');
  console.log('======================================================');
  console.log('Gunakan kredensial berikut untuk Login di Web SIPRUS:');
  console.log('👑 STAFF:');
  console.log(' ├─ ROLE ADMIN RT  -> Email: adminrt@unimus.ac.id');
  console.log(' └─ ROLE KEPALA RT -> Email: kepalart@unimus.ac.id');
  console.log('');
  console.log('🎓 MAHASISWA (Pilih salah satu untuk testing):');
  console.log(' ├─ Mahasiswa 1 -> Email: mahasiswa1@unimus.ac.id');
  console.log(' ├─ Mahasiswa 2 -> Email: mahasiswa2@unimus.ac.id');
  console.log(' └─ Mahasiswa 3 -> Email: mahasiswa3@unimus.ac.id');
  console.log('');
  console.log('🔑 PASSWORD UNTUK SEMUA AKUN: admin123');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error fatal saat seeding database:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });