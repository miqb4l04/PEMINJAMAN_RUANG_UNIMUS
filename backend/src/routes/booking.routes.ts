import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { createBooking, validateBooking, editBooking, transferBooking, getAllBookings, getMyHistory } from '../controllers/booking.controller.js';

const router = Router();

router.post('/', verifyToken, createBooking);
router.put('/:id/validate', verifyToken, validateBooking);
router.put('/:id/edit', verifyToken, editBooking);
router.put('/:id/transfer', verifyToken, transferBooking);
router.get('/all', verifyToken, getAllBookings);
router.get('/history', verifyToken, getMyHistory);

export default router;