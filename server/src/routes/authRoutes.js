import express from 'express';
import { loginUser } from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { ROLES } from '../config/roles.js';

const router = express.Router();

router.post('/login', loginUser);

router.get('/me', protect, (req, res) => res.json(req.user));

router.get(
  '/admin-only',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN),
  (req, res) => res.json({ message: 'Welcome Admin' }),
);

export default router;
