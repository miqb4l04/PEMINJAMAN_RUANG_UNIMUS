import { Router } from 'express';
import { verifyToken, authorize } from '../middleware/auth.js';
import { getGedung, createGedung, updateGedung, deleteGedung } from '../controllers/gedung.controller.js';

const router = Router();

router.get('/', verifyToken, getGedung);
router.post('/', verifyToken, authorize('ADMIN_RT'), createGedung);
router.put('/:id', verifyToken, authorize('ADMIN_RT'), updateGedung);
router.delete('/:id', verifyToken, authorize('ADMIN_RT'), deleteGedung);

export default router;