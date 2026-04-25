export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave' | 'Holiday';
export type AttendanceState =
  | 'NOT_STARTED'
  | 'CHECKED_IN'
  | 'ON_BREAK'
  | 'CHECKED_OUT'
  | 'AUTO_CLOSED';

export interface AttendanceBreak {
  startTime: string;
  endTime?: string;
  totalMinutes?: number;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  status: AttendanceStatus;
  state: AttendanceState;
  breaks: AttendanceBreak[];
  totalBreakMinutes: number;
  totalHours: number;
  overtimeHours: number;
  isOtApproved: boolean;
  isLocked: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveBalanceItem {
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
  carriedForward?: number;
}

export interface LeaveBalance {
  _id: string;
  userId: string;
  year: number;
  balances: LeaveBalanceItem[];
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  _id: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveRequestStatus;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type HolidayType = 'National' | 'Regional' | 'Company' | string;

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: HolidayType;
  country?: string;
  isPaid?: boolean;
  year?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplyLeavePayload {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}
