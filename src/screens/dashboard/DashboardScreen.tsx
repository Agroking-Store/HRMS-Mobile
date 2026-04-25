import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface DashboardTile {
  id: string;
  title: string;
  subtitle: string;
}

const ROLE_TILES: Record<UserRole, DashboardTile[]> = {
  ADMIN: [
    { id: 'workforce', title: 'Workforce Overview', subtitle: 'Headcount, attendance, and active staff' },
    { id: 'compliance', title: 'Compliance Queue', subtitle: 'Pending approvals and flagged records' },
    { id: 'operations', title: 'Operations Snapshot', subtitle: 'Cross-team productivity and utilization' },
  ],
  SUPER_ADMIN: [
    { id: 'org-health', title: 'Organization Health', subtitle: 'Global KPIs across departments' },
    { id: 'security', title: 'Access Governance', subtitle: 'Role assignments and audit checks' },
    { id: 'admin-tasks', title: 'Critical Tasks', subtitle: 'High-priority approvals requiring action' },
  ],
  CEO: [
    { id: 'executive-view', title: 'Executive Summary', subtitle: 'Company-level HR and payroll highlights' },
    { id: 'growth', title: 'Growth Indicators', subtitle: 'Hiring pace and retention movement' },
    { id: 'risk', title: 'Risk Monitor', subtitle: 'Escalations affecting workforce continuity' },
  ],
  COUNTRY_MANAGER: [
    { id: 'country-kpi', title: 'Country KPIs', subtitle: 'Performance and staffing by region' },
    { id: 'people-alerts', title: 'People Alerts', subtitle: 'Outstanding leave and shift exceptions' },
    { id: 'approvals', title: 'Regional Approvals', subtitle: 'Requests awaiting managerial decisions' },
  ],
  OPERATIONS_MANAGER: [
    { id: 'ops-capacity', title: 'Capacity Status', subtitle: 'Shift allocation and attendance trends' },
    { id: 'service-level', title: 'Service Coverage', subtitle: 'Department readiness and gaps' },
    { id: 'ops-actions', title: 'Action Queue', subtitle: 'Open staffing actions and follow-ups' },
  ],
  FINANCE_MANAGER: [
    { id: 'payroll-health', title: 'Payroll Health', subtitle: 'Processed cycles and pending validations' },
    { id: 'cost-overview', title: 'Cost Overview', subtitle: 'Compensation distribution by team' },
    { id: 'finance-alerts', title: 'Finance Alerts', subtitle: 'Discrepancies requiring intervention' },
  ],
  HR_MANAGER: [
    { id: 'people-insights', title: 'People Insights', subtitle: 'Attendance, leave, and active cases' },
    { id: 'talent-pipeline', title: 'Talent Pipeline', subtitle: 'Open requisitions and onboarding status' },
    { id: 'hr-approvals', title: 'HR Approvals', subtitle: 'Requests awaiting HR manager review' },
  ],
  HR_OFFICER: [
    { id: 'daily-ops', title: 'Daily Operations', subtitle: 'Attendance corrections and leave updates' },
    { id: 'employee-requests', title: 'Employee Requests', subtitle: 'Profile and document support tasks' },
    { id: 'follow-up', title: 'Follow-up Queue', subtitle: 'Cases pending completion' },
  ],
  PAYROLL_OFFICER: [
    { id: 'salary-cycle', title: 'Salary Cycle', subtitle: 'Current period processing status' },
    { id: 'exceptions', title: 'Payroll Exceptions', subtitle: 'Unresolved anomalies and rechecks' },
    { id: 'payout-readiness', title: 'Payout Readiness', subtitle: 'Verification progress before release' },
  ],
  PROJECT_MANAGER: [
    { id: 'team-availability', title: 'Team Availability', subtitle: 'Attendance and leave impact by project' },
    { id: 'deliverables', title: 'Delivery Alignment', subtitle: 'Resource readiness for milestones' },
    { id: 'manager-actions', title: 'Manager Actions', subtitle: 'Pending approvals and escalations' },
  ],
  DEPARTMENT_MANAGER: [
    { id: 'department-status', title: 'Department Status', subtitle: 'Staffing, attendance, and leave trends' },
    { id: 'workload', title: 'Workload Balance', subtitle: 'Distribution and utilization indicators' },
    { id: 'manager-pending', title: 'Pending Items', subtitle: 'Requests awaiting department action' },
  ],
  DIRECT_MANAGER: [
    { id: 'team-pulse', title: 'Team Pulse', subtitle: 'Daily attendance and active leave requests' },
    { id: 'review-items', title: 'Review Items', subtitle: 'Approvals and direct report updates' },
    { id: 'manager-focus', title: 'Focus Today', subtitle: 'Priority items for immediate attention' },
  ],
  EMPLOYEE: [
    { id: 'today-status', title: 'Today at a Glance', subtitle: 'Attendance and shift information' },
    { id: 'leave-balance', title: 'Leave Balance', subtitle: 'Available leave and recent requests' },
    { id: 'payroll-info', title: 'Payroll Snapshot', subtitle: 'Latest salary and deductions summary' },
  ],
};

export default function DashboardScreen() {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>No active session</Text>
        <Text style={styles.emptySubtitle}>Please log in again to view your dashboard.</Text>
      </View>
    );
  }

  const tiles = ROLE_TILES[user.role] ?? ROLE_TILES.EMPLOYEE;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcomeText}>Welcome back, {user.firstName}</Text>
      <Text style={styles.roleText}>{user.role.replaceAll('_', ' ')}</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.employeeCode}</Text>
          <Text style={styles.statLabel}>Employee Code</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.department}</Text>
          <Text style={styles.statLabel}>Department</Text>
        </View>
      </View>
      {tiles.map(tile => (
        <View key={tile.id} style={styles.tileCard}>
          <Text style={styles.tileTitle}>{tile.title}</Text>
          <Text style={styles.tileSubtitle}>{tile.subtitle}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#01696f',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
