import { UserRole } from './auth';

export type DashboardKind =
  | 'employee'
  | 'hr'
  | 'manager'
  | 'admin'
  | 'executive'
  | 'payroll'
  | 'project_manager';

export interface DashboardMetric {
  key: string;
  label: string;
  value: string;
  hint: string;
}

export interface DashboardAction {
  key: string;
  label: string;
  description: string;
}

export interface DashboardPendingState {
  title: string;
  message: string;
}

export interface DashboardSection {
  key: string;
  title: string;
  subtitle: string;
  metrics?: DashboardMetric[];
  actions?: DashboardAction[];
  pending?: DashboardPendingState;
}

export interface DashboardPayload {
  kind: DashboardKind;
  title: string;
  subtitle: string;
  sections: DashboardSection[];
}

export interface AttendanceItem {
  _id: string;
  date: string;
  status?: string;
  state?: string;
  totalHours?: number;
  overtimeHours?: number;
}

export interface LeaveBalanceItem {
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface LeaveItem {
  _id: string;
  status: string;
}

export interface NotificationListItem {
  _id: string;
  isRead: boolean;
}

export interface PayrollHistoryItem {
  payrollId: string;
  month: string | number;
  year: number;
  status: string;
  netPay: number;
}

export interface PerformanceCycleItem {
  _id: string;
  status?: string;
}

export interface PerformanceReviewItem {
  _id: string;
  status?: string;
}

export interface GoalItem {
  _id: string;
  status?: string;
}

export interface EmployeeLite {
  _id?: string;
}

export const ROLE_DASHBOARD_KIND: Record<UserRole, DashboardKind> = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'admin',
  CEO: 'executive',
  COUNTRY_MANAGER: 'executive',
  OPERATIONS_MANAGER: 'manager',
  FINANCE_MANAGER: 'payroll',
  HR_MANAGER: 'hr',
  HR_OFFICER: 'hr',
  PAYROLL_OFFICER: 'payroll',
  PROJECT_MANAGER: 'project_manager',
  DEPARTMENT_MANAGER: 'manager',
  DIRECT_MANAGER: 'manager',
  EMPLOYEE: 'employee',
};
