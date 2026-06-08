import { Router } from 'express';

import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import gedungRoutes from './gedung.routes.js';
import ruangRoutes from './ruang.routes.js';
import notificationRoutes from './notification.routes.js';
const router = Router();

router.use('/auth', authRoutes);
router.use('/booking', bookingRoutes);
router.use('/gedung', gedungRoutes);
router.use('/ruang', ruangRoutes);
router.use('/notifications', notificationRoutes);

export default router;