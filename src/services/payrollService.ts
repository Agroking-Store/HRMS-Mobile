import apiClient from './apiClient';
import { PayslipDetail, PayslipSummary } from '../types/payroll';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const extractValue = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }
  return payload as T;
};

export const getMyPayslips = async (userId: string): Promise<PayslipSummary[]> => {
  const response = await apiClient.get<PayslipSummary[] | ApiEnvelope<PayslipSummary[]>>(
    `/payroll/history/${userId}`,
  );
  return extractValue(response.data);
};

export const getPayslipDetail = async (
  payrollId: string,
  employeeId: string,
): Promise<PayslipDetail> => {
  const response = await apiClient.get<PayslipDetail | ApiEnvelope<PayslipDetail>>(
    `/payroll/${payrollId}/slip/${employeeId}`,
  );
  const payload = extractValue(response.data) as unknown as {
    payroll: { month: number | string; year: number; status: string };
    slip: {
      netPay: number;
      grossPay: number;
      totalDeductions?: number;
      earnings?: Record<string, number>;
      deductions?: Record<string, number>;
    };
  };

  return {
    payrollId,
    month: payload.payroll.month,
    year: payload.payroll.year,
    status: payload.payroll.status as PayslipDetail['status'],
    netPay: payload.slip.netPay,
    grossPay: payload.slip.grossPay,
    totalDeductions: payload.slip.totalDeductions ?? 0,
    earnings: Object.entries(payload.slip.earnings ?? {}).map(([label, amount]) => ({ label, amount })),
    deductions: Object.entries(payload.slip.deductions ?? {}).map(([label, amount]) => ({ label, amount })),
  };
};
