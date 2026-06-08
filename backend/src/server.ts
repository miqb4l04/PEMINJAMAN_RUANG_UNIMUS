import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import gedungRoutes from './routes/gedung.routes.js';
import ruangRoutes from './routes/ruang.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import bookingRoutes from './routes/booking.routes.js';

// Import Middleware Error
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Middleware Global
app.use(cors({
  origin: '*', // Sesuaikan dengan domain frontend Anda jika perlu
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Root Route
app.get('/', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'API SIPRUS UNIMUS v2.6 Berjalan Normal',
    timestamp: new Date().toISOString()
  });
});

// 3. Daftarkan Routes
// PENYESUAIAN: Menggunakan '/api/booking' (tanpa 's') agar sinkron dengan Frontend
app.use('/api/auth', authRoutes);
app.use('/api/gedung', gedungRoutes);
app.use('/api/ruang', ruangRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/booking', bookingRoutes); 

// 4. Penanganan Route 404 (Endpoint Tidak Ditemukan)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint tidak ditemukan',
    path: req.originalUrl 
  });
});

// 5. Global Error Handler (Paling Bawah)
app.use(errorHandler);

// 6. Start Server
app.listen(PORT, () => {
  console.log('================================================');
  console.log(`🚀 SIPRUS Backend berjalan di http://localhost:${PORT}`);
  console.log(`📡 Ready to handle requests...`);
  console.log('================================================');
});