// prisma/seedRuang.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Perbaikan di sini
import { parse } from 'csv-parse/sync';

// Perbaikan: Membuat __dirname manual untuk ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Mulai menanam data ruangan...");

  // Sekarang __dirname sudah aman dipakai
  // Ubah menjadi seperti ini (hapus ../)
const csvFile = fs.readFileSync(path.join(__dirname, 'ruang.csv'), 'utf-8');
  const records = parse(csvFile, { columns: true, skip_empty_lines: true });

  for (const row of records) {
    // Mencari ID Gedung berdasarkan kode (A, B, dsb)
    const gedung = await prisma.gedung.findUnique({ where: { kode: row.gedung } });
    
    if (gedung) {
      await prisma.ruang.upsert({
        where: { kode: row.kode },
        update: {
          nama: row.pengguna,
          lantai: parseInt(row.lantai) || 0,
          kapasitas: parseInt(row.kap) || 0,
          jenis: row.jenis,
          fasilitas: row.ket,
        },
        create: {
          kode: row.kode,
          nama: row.pengguna,
          gedungId: gedung.id,
          lantai: parseInt(row.lantai) || 0,
          kapasitas: parseInt(row.kap) || 0,
          jenis: row.jenis,
          fasilitas: row.ket,
        },
      });
      console.log(`✅ Sukses: Ruang ${row.kode} di Gedung ${row.gedung}`);
    } else {
      console.warn(`❌ Gagal: Gedung dengan kode '${row.gedung}' tidak ditemukan. Pastikan data Gedung sudah diinput terlebih dahulu!`);
    }
  }
  console.log("Selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });