import { Router } from 'express';
import { verifyToken, authorize } from '../middleware/auth.js';
import { getRuang, createRuang, updateRuang, deleteRuang, getAvailableRuang } from '../controllers/ruang.controller.js';

const router = Router();

router.get('/available', verifyToken, getAvailableRuang); // Harus ditaruh sebelum '/:id'
router.get('/', verifyToken, getRuang);
router.post('/', verifyToken, authorize('ADMIN_RT'), createRuang);
router.put('/:id', verifyToken, authorize('ADMIN_RT'), updateRuang);
router.delete('/:id', verifyToken, authorize('ADMIN_RT'), deleteRuang);

export default router;