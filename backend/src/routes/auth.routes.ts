import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { 
  login, 
  loginGuest, 
  getMe, 
  updateProfile, 
  updatePassword 
} from '../controllers/auth.controller.js';

const router = Router();

// Endpoint Publik
router.post('/login', login);
router.post('/guest', loginGuest);

// Endpoint Terproteksi (Harus Login / Punya Token)
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/password', verifyToken, updatePassword);

export default router;