import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  applyLeave,
  getHolidays,
  getLeaveBalance,
  getMyAttendance,
  getMyLeaveRequests,
} from '../../services/attendanceService';
import {
  ApplyLeavePayload,
  AttendanceRecord,
  Holiday,
  LeaveBalance,
  LeaveRequest,
} from '../../types/attendance';
import { getApiErrorMessage } from '../../utils/apiError';

type AttendanceTab = 'My Attendance' | 'My Leaves' | 'Holidays' | 'Leave Approvals';

const TABS_EMPLOYEE: AttendanceTab[] = ['My Attendance', 'My Leaves', 'Holidays'];
const TABS_APPROVER: AttendanceTab[] = ['My Attendance', 'My Leaves', 'Holidays', 'Leave Approvals'];
const TABS_HOLIDAYS_ONLY: AttendanceTab[] = ['Holidays'];

const SELF_ATTENDANCE_ROLES = new Set(['EMPLOYEE', 'HR_OFFICER', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'DIRECT_MANAGER']);
const APPROVER_ROLES = new Set(['HR_MANAGER', 'DEPARTMENT_MANAGER', 'DIRECT_MANAGER']);

const STATUS_COLOR: Record<string, string> = {
  Present: '#10B981',
  Absent: '#EF4444',
  Late: '#F59E0B',
  'Half Day': '#F97316',
  'On Leave': '#3B82F6',
  Holiday: '#01696f',
};

const LEAVE_STATUS_COLOR: Record<string, string> = {
  Pending: '#F59E0B',
  Approved: '#10B981',
  Rejected: '#EF4444',
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toTime = (value?: string) => {
  if (!value) {
    return '--';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AttendanceScreen() {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const tabs = useMemo(() => {
    if (APPROVER_ROLES.has(role)) {
      return TABS_APPROVER;
    }
    if (SELF_ATTENDANCE_ROLES.has(role)) {
      return TABS_EMPLOYEE;
    }
    return TABS_HOLIDAYS_ONLY;
  }, [role]);

  const [activeTab, setActiveTab] = useState<AttendanceTab>(tabs[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [applyVisible, setApplyVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [activeTab, tabs]);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const records = await getMyAttendance();
      setAttendance(records);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to load attendance records.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [balanceRes, requestsRes] = await Promise.all([getLeaveBalance(), getMyLeaveRequests()]);
      setLeaveBalance(balanceRes);
      setLeaveRequests(requestsRes);
      if (!leaveType && balanceRes.balances.length > 0) {
        setLeaveType(balanceRes.balances[0].leaveType);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to load leave data.'));
    } finally {
      setLoading(false);
    }
  }, [leaveType]);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const holidayList = await getHolidays();
      setHolidays(holidayList);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to load holidays.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'My Attendance') {
      void loadAttendance();
    } else if (activeTab === 'My Leaves') {
      void loadLeaves();
    } else if (activeTab === 'Holidays') {
      void loadHolidays();
    }
  }, [activeTab, loadAttendance, loadHolidays, loadLeaves]);

  const submitLeave = async () => {
    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      setApplyError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setApplyError('');
    const payload: ApplyLeavePayload = {
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    };
    try {
      await applyLeave(payload);
      setApplyVisible(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      await loadLeaves();
    } catch (err: unknown) {
      setApplyError(getApiErrorMessage(err, 'Unable to submit leave request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderLoading = () => (
    <View style={styles.stateWrap}>
      <ActivityIndicator size="large" color="#01696f" />
    </View>
  );

  const renderError = () => (
    <View style={styles.stateWrap}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  const renderAttendance = () => {
    if (loading) {
      return renderLoading();
    }
    if (error) {
      return renderError();
    }
    if (attendance.length === 0) {
      return (
        <View style={styles.stateWrap}>
          <Text style={styles.mutedText}>No attendance records found.</Text>
        </View>
      );
    }
    return (
      <View style={styles.listWrap}>
        {attendance.map(item => (
          <View key={item._id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{formatDate(item.date)}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] ?? '#6B7280' }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.metaText}>Clock In: {toTime(item.clockIn)}</Text>
            <Text style={styles.metaText}>Clock Out: {toTime(item.clockOut)}</Text>
            <Text style={styles.metaText}>Total Hours: {item.totalHours ?? 0}</Text>
            <Text style={styles.metaText}>Break Minutes: {item.totalBreakMinutes ?? 0}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLeaves = () => {
    if (loading) {
      return renderLoading();
    }
    if (error) {
      return renderError();
    }
    return (
      <View style={styles.listWrap}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setApplyVisible(true)}>
            <Text style={styles.primaryButtonText}>Apply Leave</Text>
          </TouchableOpacity>
        </View>
        {leaveBalance?.balances?.length ? (
          leaveBalance.balances.map(item => (
            <View key={item.leaveType} style={styles.card}>
              <Text style={styles.cardTitle}>{item.leaveType}</Text>
              <Text style={styles.metaText}>Allocated: {item.allocated}</Text>
              <Text style={styles.metaText}>Used: {item.used}</Text>
              <Text style={styles.metaText}>Remaining: {item.remaining}</Text>
            </View>
          ))
        ) : (
          <View style={styles.stateWrap}>
            <Text style={styles.mutedText}>No leave balance found.</Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>My Leave Requests</Text>
        {leaveRequests.length ? (
          leaveRequests.map(item => (
            <View key={item._id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.leaveType}</Text>
                <View style={[styles.badge, { backgroundColor: LEAVE_STATUS_COLOR[item.status] ?? '#6B7280' }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.metaText}>
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
              <Text style={styles.metaText}>Total Days: {item.totalDays}</Text>
              <Text style={styles.metaText}>{item.reason}</Text>
            </View>
          ))
        ) : (
          <View style={styles.stateWrap}>
            <Text style={styles.mutedText}>No leave requests found.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHolidays = () => {
    if (loading) {
      return renderLoading();
    }
    if (error) {
      return renderError();
    }
    if (holidays.length === 0) {
      return (
        <View style={styles.stateWrap}>
          <Text style={styles.mutedText}>No holidays found.</Text>
        </View>
      );
    }
    return (
      <View style={styles.listWrap}>
        {holidays.map(item => (
          <View key={item._id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.metaText}>{formatDate(item.date)}</Text>
            <Text style={styles.metaText}>Type: {item.type}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLeaveApprovals = () => {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.pendingTitle}>Pending Endpoint</Text>
        <Text style={styles.mutedText}>
          Leave approvals requires GET /leaves/pending, which is not present in leave routes.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'My Attendance' && renderAttendance()}
        {activeTab === 'My Leaves' && renderLeaves()}
        {activeTab === 'Holidays' && renderHolidays()}
        {activeTab === 'Leave Approvals' && renderLeaveApprovals()}
      </ScrollView>

      <Modal visible={applyVisible} transparent animationType="slide" onRequestClose={() => setApplyVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Apply Leave</Text>
            <Text style={styles.label}>Leave Type</Text>
            <TextInput
              style={styles.input}
              value={leaveType}
              onChangeText={setLeaveType}
              placeholder="Leave type"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            {applyError ? <Text style={styles.errorText}>{applyError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setApplyVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={submitLeave} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabButtonActive: {
    backgroundColor: '#01696f',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  listWrap: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stateWrap: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  mutedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#01696f',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
});
