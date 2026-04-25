export type PayslipStatus = 'Processed' | 'Pending';

export interface PayslipSummary {
  id: string;
  month: number;
  year: number;
  netSalary: number;
  grossSalary: number;
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
