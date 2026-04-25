import apiClient from './apiClient';
import {
  ApplyLeavePayload,
  AttendanceRecord,
  Holiday,
  LeaveBalance,
  LeaveBalanceItem,
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

const extractValue = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
};

export const getMyAttendance = async (): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get<AttendanceRecord[] | ApiEnvelope<AttendanceRecord[]>>('/attendance/my');
  return extractList(response.data);
};

export const getLeaveBalance = async (): Promise<LeaveBalance> => {
  const response = await apiClient.get<LeaveBalance | ApiEnvelope<LeaveBalance>>('/leaves/balance/my');
  const payload = extractValue(response.data);
  return {
    ...payload,
    balances: (payload.balances ?? []).map((item: LeaveBalanceItem) => ({
      leaveType: item.leaveType,
      allocated: Number(item.allocated ?? 0),
      used: Number(item.used ?? 0),
      remaining: Number(item.remaining ?? 0),
      carriedForward: Number(item.carriedForward ?? 0),
    })),
  };
};

export const getMyLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const response = await apiClient.get<LeaveRequest[] | ApiEnvelope<LeaveRequest[]>>('/leaves/my');
  return extractList(response.data);
};

export const applyLeave = async (payload: ApplyLeavePayload): Promise<void> => {
  await apiClient.post('/leaves/apply', payload);
};

export const getHolidays = async (): Promise<Holiday[]> => {
  const response = await apiClient.get<Holiday[] | ApiEnvelope<Holiday[]>>('/holidays');
  return extractList(response.data);
};
