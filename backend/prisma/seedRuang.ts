// prisma/seedRuang.ts
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- INTERFACE UNTUK BARIS CSV ----------
interface RuangCsvRow {
  kode: string;
  gedung: string;
  pengguna?: string;   // optional, karena mungkin kosong
  lantai: string;
  kap: string;
  jenis?: string;
  ket?: string;        // fasilitas
}

// ---------- KONEKSI DATABASE ----------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL tidak ditemukan di file .env!");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log("=======================================");
  console.log("🌱 Memulai penanaman data ruangan...");
  console.log("=======================================");

  // 1. Cari file CSV yang mengandung kata "ruang"
  let matchedFile = '';
  try {
    const filesInDir = fs.readdirSync(__dirname);
    const found = filesInDir.find(file =>
      file.toLowerCase().includes('ruang') && file.toLowerCase().includes('csv')
    );
    if (!found) {
      console.error(`❌ ERROR: Tidak ada file CSV tentang ruang di folder prisma.`);
      process.exit(1);
    }
    matchedFile = found;
  } catch (err) {
    console.error("❌ ERROR: Gagal membaca isi folder prisma.", err);
    process.exit(1);
  }

  const csvFilePath = path.join(__dirname, matchedFile);
  console.log(`✅ File CSV ditemukan: ${matchedFile}`);

  // 2. Baca dan parse CSV dengan type assertion
  const csvFile = fs.readFileSync(csvFilePath, 'utf-8');
  const records = parse(csvFile, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  }) as RuangCsvRow[];

  let successCount = 0;
  let failCount = 0;

  // 3. Proses setiap baris
  for (const row of records) {
    // Lewati baris yang tidak memiliki kode atau gedung
    if (!row.kode || !row.gedung) continue;

    // Auto-build gedung (lengkap dengan lokasi "Kampus UNIMUS")
    const gedung = await prisma.gedung.upsert({
      where: { kode: row.gedung },
      update: {},
      create: {
        kode: row.gedung,
        nama: `Gedung ${row.gedung}`,
        lokasi: "Kampus UNIMUS"
      }
    });

    if (gedung) {
      await prisma.ruang.upsert({
        where: { kode: row.kode },
        update: {
          nama: row.pengguna || '-',
          lantai: parseInt(row.lantai) || 0,
          kapasitas: parseInt(row.kap) || 0,
          jenis: row.jenis || '-',
          fasilitas: row.ket || null,
        },
        create: {
          kode: row.kode,
          nama: row.pengguna || '-',
          gedungId: gedung.id,
          lantai: parseInt(row.lantai) || 0,
          kapasitas: parseInt(row.kap) || 0,
          jenis: row.jenis || '-',
          fasilitas: row.ket || null,
        },
      });
      console.log(`✅ Sukses: Ruang ${row.kode} -> Gedung ${row.gedung}`);
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log("=======================================");
  console.log(`🎉 SELESAI TOTAL!`);
  console.log(`📊 Berhasil : ${successCount} ruang dimasukkan/diupdate.`);
  console.log(`📊 Gagal    : ${failCount} ruang.`);
  console.log("=======================================");
}

main()
  .catch((e) => {
    console.error("🔥 Terjadi Kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });