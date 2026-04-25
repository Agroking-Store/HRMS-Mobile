export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';

export interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  workingHours: string;
}

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
}

export type HolidayType = 'Public' | 'Optional';

export interface Holiday {
  name: string;
  date: string;
  day: string;
  type: HolidayType;
}

export interface ApplyLeavePayload {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}
