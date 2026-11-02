import express from 'express';
import {
  punchIn,
  punchOut,
  getMyAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { SELF_SERVICE_ROLES } from '../config/roles.js';

const router = express.Router();

router.post(
  '/punch-in',
  protect,
  authorizeRoles(...SELF_SERVICE_ROLES),
  punchIn,
);
router.post(
  '/punch-out',
  protect,
  authorizeRoles(...SELF_SERVICE_ROLES),
  punchOut,
);
router.get(
  '/me',
  protect,
  authorizeRoles(...SELF_SERVICE_ROLES),
  getMyAttendance,
);

export default router;
