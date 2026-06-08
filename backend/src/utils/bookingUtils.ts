import { prisma } from '../config/prisma.js';

export async function isRoomAvailable(ruangId: number, tanggal: string, mulai: string, selesai: string, excludeBookingId?: number): Promise<boolean> {
  try {
    // TANGGAL SEKARANG DIKIRIM SEBAGAI STRING MURNI SESUAI DATABASE ANDA
    const bookings = await prisma.booking.findMany({
      where: {
        ruangId: ruangId,
        tanggal: tanggal 
      }
    });

    const activeBookings = bookings.filter((b: any) => {
      const s = (b.status || '').toString().toUpperCase();
      if (s.includes('TOLAK') || s.includes('BATAL')) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      return true; 
    });

    return !activeBookings.some((b: any) => mulai < b.waktuSelesai && selesai > b.waktuMulai);
  } catch (error) {
    console.error("Error isRoomAvailable:", error);
    return false;
  }
}