export type PayslipStatus =
  | 'Generated'
  | 'Verified'
  | 'HR_Approved'
  | 'CEO_Approved'
  | 'Disbursed'
  | 'Locked'
  | 'Paid';

export interface PayslipSummary {
  payrollId: string;
  month: number | string;
  year: number;
  netPay: number;
  grossPay: number;
  totalDeductions: number;
  status: PayslipStatus;
}

export interface PayrollLineItem {
  label: string;
  amount: number;
}

export interface PayslipDetail extends PayslipSummary {
  earnings: PayrollLineItem[];
  deductions: PayrollLineItem[];
}
