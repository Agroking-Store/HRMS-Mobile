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

export const getMyPayslips = async (): Promise<PayslipSummary[]> => {
  const response = await apiClient.get<PayslipSummary[] | ApiEnvelope<PayslipSummary[]>>(
    '/payroll/my-payslips',
  );
  return extractValue(response.data);
};

export const getPayslipDetail = async (payslipId: string): Promise<PayslipDetail> => {
  const response = await apiClient.get<PayslipDetail | ApiEnvelope<PayslipDetail>>(
    `/payroll/payslip/${payslipId}`,
  );
  return extractValue(response.data);
};
