import apiClient from './apiClient';
import { UserRole } from '../types/auth';
import {
  AttendanceItem,
  DashboardPayload,
  DashboardSection,
  EmployeeLite,
  GoalItem,
  LeaveBalanceItem,
  LeaveItem,
  NotificationListItem,
  PayrollHistoryItem,
  PerformanceCycleItem,
  PerformanceReviewItem,
  ROLE_DASHBOARD_KIND,
} from '../types/dashboard';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const toArray = <T>(payload: T[] | ApiEnvelope<T[]> | undefined | null): T[] => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
};

const toNestedArray = <T>(
  payload: ApiEnvelope<{ items?: T[] }> | { items?: T[] } | undefined | null,
): T[] => {
  if (!payload) {
    return [];
  }
  if ('data' in payload && payload.data) {
    return payload.data.items ?? [];
  }
  if ('items' in payload) {
    return payload.items ?? [];
  }
  return [];
};

const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const getEmployeeCore = async (userId: string) => {
  const [attendanceRes, leaveBalanceRes, leavesRes, notificationRes, payrollRes, myGoalsRes, myReviewRes] =
    await Promise.allSettled([
      apiClient.get<AttendanceItem[] | ApiEnvelope<AttendanceItem[]>>('/attendance/my'),
      apiClient.get<{ balances: LeaveBalanceItem[] } | ApiEnvelope<{ balances: LeaveBalanceItem[] }>>(
        '/leaves/balance/my',
      ),
      apiClient.get<LeaveItem[] | ApiEnvelope<LeaveItem[]>>('/leaves/my'),
      apiClient.get<{ items: NotificationListItem[] } | ApiEnvelope<{ items: NotificationListItem[] }>>(
        '/notifications',
      ),
      apiClient.get<PayrollHistoryItem[] | ApiEnvelope<PayrollHistoryItem[]>>(`/payroll/history/${userId}`),
      apiClient.get<GoalItem[] | ApiEnvelope<GoalItem[]>>('/performance/goals/my-goals'),
      apiClient.get<PerformanceReviewItem[] | ApiEnvelope<PerformanceReviewItem[]>>('/performance/reviews/all'),
    ]);

  const attendance =
    attendanceRes.status === 'fulfilled' ? toArray(attendanceRes.value.data) : ([] as AttendanceItem[]);
  const leaveBalance =
    leaveBalanceRes.status === 'fulfilled'
      ? leaveBalanceRes.value.data && 'data' in leaveBalanceRes.value.data
        ? leaveBalanceRes.value.data.data?.balances ?? []
        : (leaveBalanceRes.value.data as { balances?: LeaveBalanceItem[] })?.balances ?? []
      : ([] as LeaveBalanceItem[]);
  const leaves = leavesRes.status === 'fulfilled' ? toArray(leavesRes.value.data) : ([] as LeaveItem[]);
  const notifications =
    notificationRes.status === 'fulfilled' ? toNestedArray(notificationRes.value.data) : ([] as NotificationListItem[]);
  const payroll =
    payrollRes.status === 'fulfilled' ? toArray(payrollRes.value.data) : ([] as PayrollHistoryItem[]);
  const goals = myGoalsRes.status === 'fulfilled' ? toArray(myGoalsRes.value.data) : ([] as GoalItem[]);
  const reviews =
    myReviewRes.status === 'fulfilled' ? toArray(myReviewRes.value.data) : ([] as PerformanceReviewItem[]);

  return { attendance, leaveBalance, leaves, notifications, payroll, goals, reviews };
};

const pending = (title: string, message: string): DashboardSection => ({
  key: `${title.toLowerCase().replace(/\s+/g, '-')}-pending`,
  title,
  subtitle: 'Pending backend endpoint mapping',
  pending: { title, message },
});

const buildEmployeePayload = async (userId: string): Promise<DashboardPayload> => {
  const { leaveBalance, leaves, notifications, payroll } = await getEmployeeCore(userId);
  const totalLeaveRemaining = leaveBalance.reduce((sum, item) => sum + (item.remaining ?? 0), 0);
  const pendingLeaves = leaves.filter(item => item.status === 'Pending').length;
  const unreadNotifications = notifications.filter(item => !item.isRead).length;
  const latestPayroll = payroll[0];

  return {
    kind: 'employee',
    title: 'Employee Dashboard',
    subtitle: 'Mirror of web EmployeeDashboard sections and actions',
    sections: [
      {
        key: 'employee-stats',
        title: 'Stats',
        subtitle: 'Leave Balance, Document Requests, Payroll Status, Tasks Assigned',
        metrics: [
          { key: 'leave-balance', label: 'Leave Balance', value: String(totalLeaveRemaining), hint: 'Days remaining' },
          {
            key: 'document-requests',
            label: 'Document Requests',
            value: String(unreadNotifications),
            hint: 'Unread employee notifications',
          },
          {
            key: 'payroll-status',
            label: 'Payroll Status',
            value: latestPayroll?.status ?? 'N/A',
            hint: latestPayroll ? `${latestPayroll.month} ${latestPayroll.year}` : 'No payroll history',
          },
          { key: 'tasks-assigned', label: 'Tasks Assigned', value: 'N/A', hint: 'Pending endpoint' },
        ],
      },
      {
        key: 'employee-actions',
        title: 'Action Bar',
        subtitle: 'Apply for Leave, Request Document, View Attendance, Download Payslip',
        actions: [
          { key: 'apply-leave', label: 'Apply for Leave', description: 'Available via /leaves/apply' },
          { key: 'request-document', label: 'Request Document', description: 'Pending endpoint' },
          { key: 'view-attendance', label: 'View Attendance', description: 'Available via /attendance/my' },
          { key: 'download-payslip', label: 'Download Payslip', description: 'Available via payroll history/slip' },
        ],
      },
      {
        key: 'employee-tabs',
        title: 'Tabs',
        subtitle: 'My Profile, Leave Balance, Documents, Payroll',
        metrics: [
          { key: 'tab-profile', label: 'My Profile', value: 'Available', hint: '/auth/profile' },
          { key: 'tab-leave', label: 'Leave Balance', value: String(totalLeaveRemaining), hint: `${pendingLeaves} pending` },
          { key: 'tab-docs', label: 'Documents', value: 'Pending', hint: 'Pending endpoint' },
          { key: 'tab-payroll', label: 'Payroll', value: String(payroll.length), hint: 'Payroll records' },
        ],
      },
    ],
  };
};

const buildHrPayload = async (): Promise<DashboardPayload> => {
  const [allAttendanceRes, allLeavesRes, recentHiresRes, activeOnboardingRes, manageOnboardingRes] =
    await Promise.allSettled([
      apiClient.get<AttendanceItem[] | ApiEnvelope<AttendanceItem[]>>('/attendance/all'),
      apiClient.get<LeaveItem[] | ApiEnvelope<LeaveItem[]>>('/leaves/all'),
      apiClient.get<EmployeeLite[] | ApiEnvelope<EmployeeLite[]>>('/employees/recent-hires'),
      apiClient.get<EmployeeLite[] | ApiEnvelope<EmployeeLite[]>>('/employees/active-onboarding'),
      apiClient.get<EmployeeLite[] | ApiEnvelope<EmployeeLite[]>>('/employees/manage-onboarding'),
    ]);

  const allAttendance =
    allAttendanceRes.status === 'fulfilled' ? toArray(allAttendanceRes.value.data) : ([] as AttendanceItem[]);
  const allLeaves = allLeavesRes.status === 'fulfilled' ? toArray(allLeavesRes.value.data) : ([] as LeaveItem[]);
  const recentHires = recentHiresRes.status === 'fulfilled' ? toArray(recentHiresRes.value.data) : ([] as EmployeeLite[]);
  const activeOnboarding =
    activeOnboardingRes.status === 'fulfilled' ? toArray(activeOnboardingRes.value.data) : ([] as EmployeeLite[]);
  const manageOnboarding =
    manageOnboardingRes.status === 'fulfilled' ? toArray(manageOnboardingRes.value.data) : ([] as EmployeeLite[]);

  return {
    kind: 'hr',
    title: 'HR Dashboard',
    subtitle: 'Mirror of web HRDashboard tabs and cards',
    sections: [
      {
        key: 'hr-stats',
        title: 'Stats',
        subtitle: 'Total Employees, Leave Requests, Document Requests, Recruitment',
        metrics: [
          { key: 'employees', label: 'Total Employees', value: String(allAttendance.length), hint: 'From /attendance/all' },
          {
            key: 'leave-requests',
            label: 'Leave Requests',
            value: String(allLeaves.filter(item => item.status === 'Pending').length),
            hint: 'Pending approvals',
          },
          { key: 'document-requests', label: 'Document Requests', value: 'Pending', hint: 'Pending endpoint' },
          { key: 'recruitment', label: 'Recruitment', value: String(recentHires.length), hint: 'Recent hires' },
        ],
      },
      pending('Recruitment Pipeline', 'No clear endpoint in approved route set for candidate pipeline'),
      {
        key: 'hr-leave-management',
        title: 'Leave Management',
        subtitle: 'Overview of employee leave requests and balances',
        metrics: [
          { key: 'total-leaves', label: 'Total Leave Requests', value: String(allLeaves.length), hint: 'From /leaves/all' },
          {
            key: 'pending-leaves',
            label: 'Pending Approvals',
            value: String(allLeaves.filter(item => item.status === 'Pending').length),
            hint: 'Requires action',
          },
          {
            key: 'approved-leaves',
            label: 'Approved Leaves',
            value: String(allLeaves.filter(item => item.status === 'Approved').length),
            hint: 'Processed',
          },
        ],
      },
      pending('Document Requests', 'No clear document request endpoint in approved route set'),
      {
        key: 'hr-employee-overview',
        title: 'Employee Overview',
        subtitle: 'Summary of employee data and updates',
        metrics: [
          { key: 'recent-hires', label: 'Recent Hires', value: String(recentHires.length), hint: '/employees/recent-hires' },
          {
            key: 'active-onboarding',
            label: 'Active Onboarding',
            value: String(activeOnboarding.length),
            hint: '/employees/active-onboarding',
          },
          {
            key: 'manage-onboarding',
            label: 'Manage Onboarding',
            value: String(manageOnboarding.length),
            hint: '/employees/manage-onboarding',
          },
        ],
      },
    ],
  };
};

const buildManagerPayload = async (): Promise<DashboardPayload> => {
  const [allLeavesRes, correctionRes, overtimeRes] = await Promise.allSettled([
    apiClient.get<LeaveItem[] | ApiEnvelope<LeaveItem[]>>('/leaves/all'),
    apiClient.get<{ data?: unknown[] } | ApiEnvelope<{ data?: unknown[] }>>('/attendance/correction-requests'),
    apiClient.get<{ data?: unknown[] } | ApiEnvelope<{ data?: unknown[] }>>('/attendance/overtime-pending'),
  ]);

  const allLeaves = allLeavesRes.status === 'fulfilled' ? toArray(allLeavesRes.value.data) : ([] as LeaveItem[]);
  const correctionCount =
    correctionRes.status === 'fulfilled'
      ? Array.isArray(correctionRes.value.data.data)
        ? correctionRes.value.data.data.length
        : 0
      : 0;
  const overtimeCount =
    overtimeRes.status === 'fulfilled'
      ? Array.isArray(overtimeRes.value.data.data)
        ? overtimeRes.value.data.data.length
        : 0
      : 0;

  return {
    kind: 'manager',
    title: 'Manager Dashboard',
    subtitle: 'Mirror of web ManagerDashboard tabs',
    sections: [
      {
        key: 'manager-stats',
        title: 'Stats',
        subtitle: 'Team Size, Pending Approvals, Tasks Completed, Team Performance',
        metrics: [
          { key: 'team-size', label: 'Team Size', value: String(allLeaves.length), hint: 'Derived from leave records' },
          {
            key: 'pending-approvals',
            label: 'Pending Approvals',
            value: String(allLeaves.filter(item => item.status === 'Pending').length + correctionCount + overtimeCount),
            hint: 'Leaves + corrections + overtime',
          },
          { key: 'tasks-completed', label: 'Tasks Completed', value: 'Pending', hint: 'Pending endpoint' },
          { key: 'team-performance', label: 'Team Performance', value: 'Pending', hint: 'Pending endpoint' },
        ],
      },
      pending('Team Overview', 'No clear endpoint in approved route set for task performance rows'),
      {
        key: 'manager-pending',
        title: 'Pending Approvals',
        subtitle: 'Leave Requests, Overtime, Correction Requests',
        metrics: [
          {
            key: 'leave-requests',
            label: 'Leave Requests',
            value: String(allLeaves.filter(item => item.status === 'Pending').length),
            hint: '/leaves/all',
          },
          { key: 'overtime', label: 'Overtime', value: String(overtimeCount), hint: '/attendance/overtime-pending' },
          {
            key: 'corrections',
            label: 'Correction Requests',
            value: String(correctionCount),
            hint: '/attendance/correction-requests',
          },
        ],
      },
      pending('Task Management', 'No clear endpoint in approved route set for manager task board'),
    ],
  };
};

const buildAdminPayload = async (): Promise<DashboardPayload> => {
  return {
    kind: 'admin',
    title: 'Admin Dashboard',
    subtitle: 'Mirror of web AdminDashboard stats and charts',
    sections: [
      pending('Admin Stats', 'No /admin/dashboard-stats endpoint in approved route set'),
      pending('Department Chart', 'No clear approved endpoint for department distribution'),
      pending('Role Distribution', 'No clear approved endpoint for role distribution'),
      pending('Gender Distribution', 'No clear approved endpoint for gender distribution'),
      pending('Pending Approvals Breakdown', 'No clear approved endpoint for pending approvals chart'),
    ],
  };
};

const buildExecutivePayload = async (): Promise<DashboardPayload> => {
  const [attendanceAllRes, payrollRunsRes, perfStatsRes] = await Promise.allSettled([
    apiClient.get<AttendanceItem[] | ApiEnvelope<AttendanceItem[]>>('/attendance/all'),
    apiClient.get<{ total?: number } | ApiEnvelope<{ total?: number }>>('/payroll/pending'),
    apiClient.get<{ totalReviews?: number; avgScore?: number } | ApiEnvelope<{ totalReviews?: number; avgScore?: number }>>(
      '/performance/analytics-summary',
    ),
  ]);

  const attendanceAll =
    attendanceAllRes.status === 'fulfilled' ? toArray(attendanceAllRes.value.data) : ([] as AttendanceItem[]);
  const payrollPendingTotal =
    payrollRunsRes.status === 'fulfilled'
      ? 'data' in payrollRunsRes.value.data && payrollRunsRes.value.data.data
        ? payrollRunsRes.value.data.data.total ?? 0
        : (payrollRunsRes.value.data as { total?: number })?.total ?? 0
      : 0;
  const perfStats =
    perfStatsRes.status === 'fulfilled'
      ? 'data' in perfStatsRes.value.data && perfStatsRes.value.data.data
        ? perfStatsRes.value.data.data
        : (perfStatsRes.value.data as { totalReviews?: number; avgScore?: number })
      : {};

  return {
    kind: 'executive',
    title: 'Executive Summary',
    subtitle: 'Mirror of web ExecutiveDashboard KPI sections',
    sections: [
      {
        key: 'executive-kpis',
        title: 'KPI Cards',
        subtitle:
          'Total Headcount, Active Today, On Leave Today, Open Requisitions, Monthly Payroll Cost, Avg Performance, Attrition',
        metrics: [
          { key: 'headcount', label: 'Total Headcount', value: String(attendanceAll.length), hint: '/attendance/all' },
          {
            key: 'active-today',
            label: 'Active Today',
            value: String(attendanceAll.filter(item => item.status === 'Present').length),
            hint: 'Attendance present count',
          },
          {
            key: 'on-leave',
            label: 'On Leave Today',
            value: String(attendanceAll.filter(item => item.status === 'Leave').length),
            hint: 'Attendance leave count',
          },
          { key: 'open-reqs', label: 'Open Requisitions', value: 'Pending', hint: 'Pending endpoint' },
          { key: 'monthly-payroll', label: 'Monthly Payroll Cost', value: formatInr(0), hint: 'Pending endpoint' },
          { key: 'avg-performance', label: 'Avg Performance Score', value: `${perfStats.avgScore ?? 0}/5`, hint: '/performance/analytics-summary' },
          { key: 'attrition-30', label: 'Attrition Rate (30d)', value: 'Pending', hint: 'Pending endpoint' },
          { key: 'attrition-90', label: 'Attrition Rate (90d)', value: 'Pending', hint: 'Pending endpoint' },
        ],
      },
      {
        key: 'executive-briefing',
        title: 'CEO Briefing',
        subtitle: 'High-level narrative summary',
        metrics: [
          { key: 'payroll-pending', label: 'Payroll Pending Employees', value: String(payrollPendingTotal), hint: '/payroll/pending' },
          { key: 'reviews', label: 'Performance Reviews', value: String(perfStats.totalReviews ?? 0), hint: '/performance/analytics-summary' },
        ],
      },
      pending('CEO Appraisal Dashboard Section', 'No dedicated approved endpoint mapping provided for this widget'),
    ],
  };
};

const buildPayrollPayload = async (userId: string): Promise<DashboardPayload> => {
  const [pendingRes, payrollHistoryRes, payrollComplianceRes] = await Promise.allSettled([
    apiClient.get<{ total?: number } | ApiEnvelope<{ total?: number }>>('/payroll/pending'),
    apiClient.get<PayrollHistoryItem[] | ApiEnvelope<PayrollHistoryItem[]>>(`/payroll/history/${userId}`),
    apiClient.get<{ totals?: { statutory?: number } } | ApiEnvelope<{ totals?: { statutory?: number } }>>(
      '/payroll/compliance/summary',
    ),
  ]);

  const pendingTotal =
    pendingRes.status === 'fulfilled'
      ? 'data' in pendingRes.value.data && pendingRes.value.data.data
        ? pendingRes.value.data.data.total ?? 0
        : (pendingRes.value.data as { total?: number })?.total ?? 0
      : 0;
  const payrollHistory =
    payrollHistoryRes.status === 'fulfilled' ? toArray(payrollHistoryRes.value.data) : ([] as PayrollHistoryItem[]);
  const statutory =
    payrollComplianceRes.status === 'fulfilled'
      ? 'data' in payrollComplianceRes.value.data && payrollComplianceRes.value.data.data
        ? payrollComplianceRes.value.data.data.totals?.statutory ?? 0
        : 0
      : 0;

  return {
    kind: 'payroll',
    title: 'Payroll Dashboard',
    subtitle: 'Mirror of web PayrollDashboard tabs',
    sections: [
      {
        key: 'payroll-stats',
        title: 'Stats',
        subtitle: 'Total Employees, Payroll Processed, Pending Payments, Total Deductions',
        metrics: [
          { key: 'total-employees', label: 'Total Employees', value: String(payrollHistory.length), hint: 'History records' },
          {
            key: 'processed',
            label: 'Payroll Processed',
            value: String(payrollHistory.filter(item => item.status !== 'Generated').length),
            hint: 'History statuses',
          },
          { key: 'pending-payments', label: 'Pending Payments', value: String(pendingTotal), hint: '/payroll/pending' },
          { key: 'total-deductions', label: 'Total Deductions', value: formatInr(statutory), hint: '/payroll/compliance/summary' },
        ],
      },
      {
        key: 'payroll-status-tab',
        title: 'Payroll Status',
        subtitle: 'Overview of current payroll processing',
        metrics: [
          { key: 'generated', label: 'Generated', value: String(payrollHistory.filter(item => item.status === 'Generated').length), hint: 'Status count' },
          { key: 'verified', label: 'Verified', value: String(payrollHistory.filter(item => item.status === 'Verified').length), hint: 'Status count' },
          { key: 'paid', label: 'Paid/Disbursed', value: String(payrollHistory.filter(item => item.status === 'Paid' || item.status === 'Disbursed' || item.status === 'Locked').length), hint: 'Status count' },
        ],
      },
      pending('Deductions', 'Detailed deduction type split endpoint mapping pending'),
      {
        key: 'payroll-history-tab',
        title: 'Payment History',
        subtitle: 'Record of processed payroll runs',
        metrics: payrollHistory.slice(0, 4).map(item => ({
          key: `run-${item.payrollId}`,
          label: `${item.month} ${item.year}`,
          value: formatInr(item.netPay ?? 0),
          hint: item.status,
        })),
      },
    ],
  };
};

const buildProjectManagerPayload = async (): Promise<DashboardPayload> => {
  const [attendanceAllRes, overtimeRes] = await Promise.allSettled([
    apiClient.get<AttendanceItem[] | ApiEnvelope<AttendanceItem[]>>('/attendance/all'),
    apiClient.get<{ data?: unknown[] } | ApiEnvelope<{ data?: unknown[] }>>('/attendance/overtime-pending'),
  ]);

  const attendanceAll =
    attendanceAllRes.status === 'fulfilled' ? toArray(attendanceAllRes.value.data) : ([] as AttendanceItem[]);
  const overtimeCount =
    overtimeRes.status === 'fulfilled'
      ? Array.isArray(overtimeRes.value.data.data)
        ? overtimeRes.value.data.data.length
        : 0
      : 0;

  return {
    kind: 'project_manager',
    title: 'Project Manager Dashboard',
    subtitle: 'Mirror of web ProjectManagerDashboard sections',
    sections: [
      {
        key: 'pm-stats',
        title: 'Stats',
        subtitle: 'Total Projects, Team Members, Pending Tasks, Critical Issues',
        metrics: [
          { key: 'projects', label: 'Total Projects', value: 'Pending', hint: 'Pending endpoint' },
          { key: 'team-members', label: 'Team Members', value: String(attendanceAll.length), hint: '/attendance/all' },
          { key: 'pending-tasks', label: 'Pending Tasks', value: 'Pending', hint: 'Pending endpoint' },
          { key: 'critical-issues', label: 'Critical Issues', value: String(overtimeCount), hint: '/attendance/overtime-pending' },
        ],
      },
      pending('Recent Projects', 'No clear approved endpoint mapping for project progress list'),
      {
        key: 'pm-actions',
        title: 'Quick Actions',
        subtitle: 'View Task Board, Safety Incidents, Timesheet Approvals, Team Performance',
        actions: [
          { key: 'task-board', label: 'View Task Board', description: 'Pending endpoint' },
          { key: 'safety', label: 'Safety Incidents', description: 'Pending endpoint' },
          { key: 'timesheet', label: 'Timesheet Approvals', description: 'Pending endpoint' },
          { key: 'team-performance', label: 'Team Performance', description: 'Pending endpoint' },
        ],
      },
    ],
  };
};

export const getDashboardPayload = async (role: UserRole, userId: string): Promise<DashboardPayload> => {
  const kind = ROLE_DASHBOARD_KIND[role];
  if (kind === 'employee') {
    return buildEmployeePayload(userId);
  }
  if (kind === 'hr') {
    return buildHrPayload();
  }
  if (kind === 'manager') {
    return buildManagerPayload();
  }
  if (kind === 'admin') {
    return buildAdminPayload();
  }
  if (kind === 'executive') {
    return buildExecutivePayload();
  }
  if (kind === 'payroll') {
    return buildPayrollPayload(userId);
  }
  return buildProjectManagerPayload();
};
