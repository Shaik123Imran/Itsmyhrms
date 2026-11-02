import express from 'express';
import {
  getEmployees,
  createEmployee,
} from '../controllers/employeeController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { PEOPLE_ADMIN_ROLES, PEOPLE_READ_ROLES } from '../config/roles.js';

const router = express.Router();

router.get('/', protect, authorizeRoles(...PEOPLE_READ_ROLES), getEmployees);

router.post('/', protect, authorizeRoles(...PEOPLE_ADMIN_ROLES), createEmployee);

export default router;
