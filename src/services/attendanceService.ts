import apiClient from './apiClient';
import {
  ApplyLeavePayload,
  AttendanceRecord,
  Holiday,
  LeaveBalance,
  LeaveRequest,
} from '../types/attendance';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const extractList = <T>(payload: T[] | ApiEnvelope<T[]>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
};

export const getMyAttendance = async (month: number, year: number): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get<AttendanceRecord[] | ApiEnvelope<AttendanceRecord[]>>(
    '/attendance/my',
    {
      params: { month, year },
    },
  );
  return extractList(response.data);
};

export const getLeaveBalance = async (): Promise<LeaveBalance[]> => {
  const response = await apiClient.get<LeaveBalance[] | ApiEnvelope<LeaveBalance[]>>('/leave/balance');
  return extractList(response.data);
};

export const getMyLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const response = await apiClient.get<LeaveRequest[] | ApiEnvelope<LeaveRequest[]>>('/leave/my');
  return extractList(response.data);
};

export const applyLeave = async (payload: ApplyLeavePayload): Promise<void> => {
  await apiClient.post('/leave/apply', payload);
};

export const getHolidays = async (year: number): Promise<Holiday[]> => {
  const response = await apiClient.get<Holiday[] | ApiEnvelope<Holiday[]>>('/holiday', {
    params: { year },
  });
  return extractList(response.data);
};
