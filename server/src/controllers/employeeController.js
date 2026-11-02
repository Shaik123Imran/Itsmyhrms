import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { ROLES, ROLE_VALUES } from '../config/roles.js';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
};

export async function getEmployees(req, res) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: userSelect },
        manager: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createEmployee(req, res) {
  try {
    const {
      email,
      password,
      name,
      role = ROLES.EMPLOYEE,
      employeeCode,
      department,
      designation,
      status = 'Active',
      managerId,
      branch,
      workMode,
      joinedOn,
    } = req.body || {};

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }

    if (!ROLE_VALUES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${ROLE_VALUES.join(', ')}`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name,
          role,
        },
      });

      return tx.employee.create({
        data: {
          userId: user.id,
          employeeCode: employeeCode || null,
          department: department || null,
          designation: designation || null,
          status,
          managerId: managerId ? Number(managerId) : null,
          branch: branch || null,
          workMode: workMode || null,
          joinedOn: joinedOn ? new Date(joinedOn) : new Date(),
        },
        include: { user: { select: userSelect } },
      });
    });

    return res.status(201).json(employee);
  } catch (error) {
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ message: 'A user with this email or employee code already exists' });
    }

    return res.status(500).json({ message: error.message });
  }
}
