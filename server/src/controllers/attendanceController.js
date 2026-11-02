import prisma from '../config/db.js';

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

async function getEmployeeForUser(userId) {
  return prisma.employee.findUnique({ where: { userId } });
}

export async function punchIn(req, res) {
  try {
    const employee = await getEmployeeForUser(req.user.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const today = startOfDay();
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });

    if (existing?.checkIn) {
      return res
        .status(400)
        .json({ message: 'You have already punched in today' });
    }

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkIn: new Date(), status: 'Present' },
      });
      return res.status(201).json(updated);
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: today,
        checkIn: new Date(),
        status: 'Present',
      },
    });

    return res.status(201).json(attendance);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function punchOut(req, res) {
  try {
    const employee = await getEmployeeForUser(req.user.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const today = startOfDay();
    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });

    if (!attendance?.checkIn) {
      return res
        .status(400)
        .json({ message: 'You need to punch in before punching out' });
    }

    if (attendance.checkOut) {
      return res
        .status(400)
        .json({ message: 'You have already punched out today' });
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMyAttendance(req, res) {
  try {
    const employee = await getEmployeeForUser(req.user.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const records = await prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: { date: 'desc' },
    });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
