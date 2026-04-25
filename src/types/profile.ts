import { UserRole } from './auth';

export interface ProfileDetail {
  id: string;
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  phoneNumber: string;
  gender?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string | null;
  currentShift?: unknown;
}

export interface UpdateMyProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}
