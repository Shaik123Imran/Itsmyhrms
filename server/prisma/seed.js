import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';
import { ROLES } from '../src/config/roles.js';

const PASSWORD = 'password';

const users = [
  {
    email: 'ceo@itshrms.com',
    name: 'Aarav Mehta',
    role: ROLES.SUPER_ADMIN,
    employee: {
      employeeCode: 'EMP-1001',
      department: 'Executive',
      designation: 'Chief Executive Officer',
      branch: 'Bengaluru HQ',
      workMode: 'Office',
    },
  },
  {
    email: 'hr@itshrms.com',
    name: 'Priya Sharma',
    role: ROLES.HR,
    employee: {
      employeeCode: 'EMP-1042',
      department: 'Human Resources',
      designation: 'HR Head',
      branch: 'Bengaluru HQ',
      workMode: 'Office',
    },
  },
  {
    email: 'pm@itshrms.com',
    name: 'Rohan Verma',
    role: ROLES.MANAGER,
    employee: {
      employeeCode: 'EMP-1038',
      department: 'Delivery',
      designation: 'Project Manager',
      branch: 'Bengaluru HQ',
      workMode: 'Hybrid',
    },
  },
  {
    email: 'emp@itshrms.com',
    name: 'Neha Kapoor',
    role: ROLES.EMPLOYEE,
    employee: {
      employeeCode: 'EMP-1024',
      department: 'Engineering',
      designation: 'Software Engineer',
      branch: 'Bengaluru HQ',
      workMode: 'Hybrid',
    },
  },
  {
    email: 'finance@itshrms.com',
    name: 'Meera Iyer',
    role: ROLES.FINANCE,
    employee: {
      employeeCode: 'EMP-1007',
      department: 'Finance',
      designation: 'Finance Manager',
      branch: 'Remote',
      workMode: 'Remote',
    },
  },
  {
    email: 'sales@itshrms.com',
    name: 'Arjun Nair',
    role: ROLES.SALES_MARKETING,
    employee: {
      employeeCode: 'EMP-1019',
      department: 'Sales',
      designation: 'Account Executive',
      branch: 'Mumbai Office',
      workMode: 'Office',
    },
  },
  {
    email: 'client@itshrms.com',
    name: 'Kiran Shah',
    role: ROLES.CLIENT,
  },
];

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10);

  for (const entry of users) {
    const user = await prisma.user.upsert({
      where: { email: entry.email },
      update: { password, name: entry.name, role: entry.role },
      create: {
        email: entry.email,
        password,
        name: entry.name,
        role: entry.role,
      },
    });

    if (!entry.employee) {
      continue;
    }

    const employee = {
      ...entry.employee,
      status: 'Active',
      joinedOn: new Date(),
    };

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        employeeCode: employee.employeeCode,
        department: employee.department,
        designation: employee.designation,
        status: employee.status,
        branch: employee.branch,
        workMode: employee.workMode,
      },
      create: {
        userId: user.id,
        ...employee,
      },
    });
  }

  console.log(`Seeded ${users.length} users with role-based access`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
