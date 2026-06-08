// prisma/seedGedung.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log("Mulai menanam data gedung...");

  const csvFile = fs.readFileSync(path.join(__dirname, 'ruang.csv'), 'utf-8');
  const records = parse(csvFile, { columns: true, skip_empty_lines: true });

  // Ambil list unik kode gedung dari CSV
  const uniqueGedungCodes = [...new Set(records.map((r: any) => r.gedung))];

  for (const kode of uniqueGedungCodes) {
    if (!kode) continue;
    await prisma.gedung.upsert({
      where: { kode: kode as string },
      update: {},
      create: {
        kode: kode as string,
        nama: `Gedung ${kode}`, // Nama default
        lokasi: "Kampus",
      },
    });
    console.log(`✅ Gedung ${kode} berhasil dibuat/ditemukan.`);
  }
  console.log("Selesai menanam gedung!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });