import express from 'express';
import {
  applyLeave,
  getAllLeaves,
  updateLeaveStatus,
} from '../controllers/leaveController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  APPROVER_ROLES,
  LEAVE_READ_ROLES,
  SELF_SERVICE_ROLES,
} from '../config/roles.js';

const router = express.Router();

router.post('/apply', protect, authorizeRoles(...SELF_SERVICE_ROLES), applyLeave);

router.get('/', protect, authorizeRoles(...LEAVE_READ_ROLES), getAllLeaves);

router.put(
  '/:id/status',
  protect,
  authorizeRoles(...APPROVER_ROLES),
  updateLeaveStatus,
);

export default router;
