import dotenv from 'dotenv';
dotenv.config(); // Wajib di paling atas agar terbaca

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export default prisma;