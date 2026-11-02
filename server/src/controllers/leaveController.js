import prisma from '../config/db.js';

const LEAVE_STATUSES = ['Approved', 'Rejected', 'Pending'];

const employeeInclude = {
  include: {
    user: { select: { id: true, name: true, email: true, role: true } },
  },
};

export async function applyLeave(req, res) {
  try {
    const { type, startDate, endDate, reason } = req.body || {};

    if (!type || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'Type, start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date provided' });
    }

    if (end < start) {
      return res
        .status(400)
        .json({ message: 'End date cannot be before start date' });
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.leave.create({
      data: {
        employeeId: employee.id,
        type,
        startDate: start,
        endDate: end,
        days,
        status: 'Pending',
        reason: reason || null,
        appliedOn: new Date(),
      },
      include: { employee: employeeInclude },
    });

    return res.status(201).json(leave);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getAllLeaves(req, res) {
  try {
    const { status } = req.query;

    const leaves = await prisma.leave.findMany({
      where: status ? { status } : undefined,
      include: { employee: employeeInclude },
      orderBy: { appliedOn: 'desc' },
    });

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function updateLeaveStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!LEAVE_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed statuses: ${LEAVE_STATUSES.join(', ')}`,
      });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: Number(id) },
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const updated = await prisma.leave.update({
      where: { id: leave.id },
      data: {
        status,
        reviewedOn: status === 'Pending' ? null : new Date(),
      },
      include: { employee: employeeInclude },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
