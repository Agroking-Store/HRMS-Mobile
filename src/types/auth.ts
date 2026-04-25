export const USER_ROLES = [
  'ADMIN',
  'SUPER_ADMIN',
  'CEO',
  'COUNTRY_MANAGER',
  'OPERATIONS_MANAGER',
  'FINANCE_MANAGER',
  'HR_MANAGER',
  'HR_OFFICER',
  'PAYROLL_OFFICER',
  'PROJECT_MANAGER',
  'DEPARTMENT_MANAGER',
  'DIRECT_MANAGER',
  'EMPLOYEE',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  data: User;
}
