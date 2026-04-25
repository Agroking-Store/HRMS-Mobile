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
  AttendanceStatus,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
} from '../../types/attendance';

type AttendanceTab = 'My Attendance' | 'Leave' | 'Holidays';

const TABS: AttendanceTab[] = ['My Attendance', 'Leave', 'Holidays'];

const DEFAULT_LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Unpaid Leave'];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: '#10B981',
  Absent: '#EF4444',
  Late: '#F59E0B',
  'Half Day': '#F59E0B',
  'On Leave': '#3B82F6',
};

const LEAVE_STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  Pending: '#F59E0B',
  Approved: '#10B981',
  Rejected: '#EF4444',
};

const HOLIDAY_COLORS: Record<Holiday['type'], string> = {
  Public: '#01696f',
  Optional: '#6B7280',
};

const formatMonthLabel = (month: number, year: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

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

export default function AttendanceScreen() {
  const now = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<AttendanceTab>('My Attendance');

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidaysError, setHolidaysError] = useState('');

  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const leaveTypeOptions = useMemo(() => {
    const fromBalance = leaveBalances.map(item => item.leaveType);
    const all = [...fromBalance, ...DEFAULT_LEAVE_TYPES];
    return Array.from(new Set(all));
  }, [leaveBalances]);

  useEffect(() => {
    if (!leaveType && leaveTypeOptions.length > 0) {
      setLeaveType(leaveTypeOptions[0]);
    }
  }, [leaveType, leaveTypeOptions]);

  const fetchAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    setAttendanceError('');
    try {
      const records = await getMyAttendance(month, year);
      setAttendanceRecords(records);
    } catch {
      setAttendanceError('Unable to load attendance records. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  }, [month, year]);

  const fetchLeaveData = useCallback(async () => {
    setLeaveLoading(true);
    setLeaveError('');
    try {
      const [balances, requests] = await Promise.all([getLeaveBalance(), getMyLeaveRequests()]);
      setLeaveBalances(balances);
      setLeaveRequests(requests);
    } catch {
      setLeaveError('Unable to load leave details. Please try again.');
    } finally {
      setLeaveLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    setHolidaysError('');
    try {
      const holidayList = await getHolidays(year);
      setHolidays(holidayList);
    } catch {
      setHolidaysError('Unable to load holidays. Please try again.');
    } finally {
      setHolidaysLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (activeTab === 'My Attendance') {
      fetchAttendance();
    }
  }, [activeTab, fetchAttendance]);

  useEffect(() => {
    if (activeTab === 'Leave') {
      fetchLeaveData();
    }
  }, [activeTab, fetchLeaveData]);

  useEffect(() => {
    if (activeTab === 'Holidays') {
      fetchHolidays();
    }
  }, [activeTab, fetchHolidays]);

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(prev => prev - 1);
      return;
    }
    setMonth(prev => prev - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(prev => prev + 1);
      return;
    }
    setMonth(prev => prev + 1);
  };

  const resetApplyLeaveForm = () => {
    setLeaveType(leaveTypeOptions[0] ?? '');
    setStartDate('');
    setEndDate('');
    setReason('');
    setApplyError('');
  };

  const handleOpenApplyLeave = () => {
    resetApplyLeaveForm();
    setIsApplyModalVisible(true);
  };

  const handleSubmitLeave = async () => {
    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      setApplyError('All fields are required.');
      return;
    }
    const payload: ApplyLeavePayload = {
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    };
    setIsSubmittingLeave(true);
    setApplyError('');
    try {
      await applyLeave(payload);
      setIsApplyModalVisible(false);
      resetApplyLeaveForm();
      await fetchLeaveData();
    } catch {
      setApplyError('Unable to submit leave request. Please try again.');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const renderLoading = () => (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color="#01696f" />
    </View>
  );

  const renderError = (message: string, onRetry: () => void) => (
    <View style={styles.stateContainer}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = (message: string) => (
    <View style={styles.stateContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderAttendanceContent = () => {
    if (attendanceLoading) {
      return renderLoading();
    }
    if (attendanceError) {
      return renderError(attendanceError, fetchAttendance);
    }
    if (attendanceRecords.length === 0) {
      return renderEmpty('No attendance records found for this month.');
    }
    return (
      <View style={styles.sectionContent}>
        {attendanceRecords.map(record => (
          <View key={`${record.date}-${record.status}`} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{formatDate(record.date)}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[record.status] }]}>
                <Text style={styles.badgeText}>{record.status}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>Check In: {record.checkIn ?? '--'}</Text>
            <Text style={styles.cardMeta}>Check Out: {record.checkOut ?? '--'}</Text>
            <Text style={styles.cardMeta}>Working Hours: {record.workingHours}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLeaveContent = () => {
    if (leaveLoading) {
      return renderLoading();
    }
    if (leaveError) {
      return renderError(leaveError, fetchLeaveData);
    }
    return (
      <View style={styles.sectionContent}>
        <View style={styles.leaveHeaderRow}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleOpenApplyLeave}>
            <Text style={styles.primaryButtonText}>Apply Leave</Text>
          </TouchableOpacity>
        </View>
        {leaveBalances.length === 0 ? (
          renderEmpty('No leave balance available.')
        ) : (
          leaveBalances.map(item => (
            <View key={item.leaveType} style={styles.card}>
              <Text style={styles.cardTitle}>{item.leaveType}</Text>
              <View style={styles.rowWrap}>
                <Text style={styles.cardMeta}>Total: {item.total}</Text>
                <Text style={styles.cardMeta}>Used: {item.used}</Text>
                <Text style={styles.cardMeta}>Remaining: {item.remaining}</Text>
              </View>
            </View>
          ))
        )}
        <Text style={styles.sectionTitle}>Leave Requests</Text>
        {leaveRequests.length === 0 ? (
          renderEmpty('No leave requests submitted yet.')
        ) : (
          leaveRequests.map((request, index) => (
            <View key={`${request.leaveType}-${request.startDate}-${index}`} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{request.leaveType}</Text>
                <View style={[styles.badge, { backgroundColor: LEAVE_STATUS_COLORS[request.status] }]}>
                  <Text style={styles.badgeText}>{request.status}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {formatDate(request.startDate)} - {formatDate(request.endDate)}
              </Text>
              <Text style={styles.cardMeta}>{request.reason}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderHolidaysContent = () => {
    if (holidaysLoading) {
      return renderLoading();
    }
    if (holidaysError) {
      return renderError(holidaysError, fetchHolidays);
    }
    if (holidays.length === 0) {
      return renderEmpty('No holidays found for this year.');
    }
    return (
      <View style={styles.sectionContent}>
        {holidays.map(holiday => (
          <View key={`${holiday.name}-${holiday.date}`} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>{holiday.name}</Text>
                <Text style={styles.cardMeta}>
                  {formatDate(holiday.date)} | {holiday.day}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: HOLIDAY_COLORS[holiday.type] }]}>
                <Text style={styles.badgeText}>{holiday.type}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'My Attendance' && (
        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.monthButton} onPress={handlePreviousMonth}>
            <Text style={styles.monthButtonText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatMonthLabel(month, year)}</Text>
          <TouchableOpacity style={styles.monthButton} onPress={handleNextMonth}>
            <Text style={styles.monthButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {activeTab === 'My Attendance' && renderAttendanceContent()}
        {activeTab === 'Leave' && renderLeaveContent()}
        {activeTab === 'Holidays' && renderHolidaysContent()}
      </ScrollView>

      <Modal
        visible={isApplyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Apply Leave</Text>
            <Text style={styles.fieldLabel}>Leave Type</Text>
            <View style={styles.leaveTypeRow}>
              {leaveTypeOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.leaveTypeChip, leaveType === option && styles.leaveTypeChipActive]}
                  onPress={() => setLeaveType(option)}
                >
                  <Text
                    style={[
                      styles.leaveTypeChipText,
                      leaveType === option && styles.leaveTypeChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={[styles.input, styles.reasonInput]}
              placeholder="Enter reason"
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
            />
            {applyError ? <Text style={styles.errorText}>{applyError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setIsApplyModalVisible(false)}
                disabled={isSubmittingLeave}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, isSubmittingLeave && styles.disabledButton]}
                onPress={handleSubmitLeave}
                disabled={isSubmittingLeave}
              >
                {isSubmittingLeave ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  monthHeader: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monthButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#01696f',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  sectionContent: {
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
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
  stateContainer: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#01696f',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  leaveTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  leaveTypeChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  leaveTypeChipActive: {
    backgroundColor: '#01696f',
    borderColor: '#01696f',
  },
  leaveTypeChipText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  leaveTypeChipTextActive: {
    color: '#FFFFFF',
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
  reasonInput: {
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
  disabledButton: {
    opacity: 0.7,
  },
  flexOne: {
    flex: 1,
  },
});
