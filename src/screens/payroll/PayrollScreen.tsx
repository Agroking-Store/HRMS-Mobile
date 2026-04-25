import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyPayslips, getPayslipDetail } from '../../services/payrollService';
import { PayslipDetail, PayslipSummary, PayslipStatus } from '../../types/payroll';
import { getApiErrorMessage } from '../../utils/apiError';

const STATUS_COLORS: Record<PayslipStatus, string> = {
  Generated: '#6B7280',
  Verified: '#3B82F6',
  HR_Approved: '#0EA5E9',
  CEO_Approved: '#8B5CF6',
  Disbursed: '#10B981',
  Locked: '#065F46',
  Paid: '#047857',
};

type PayrollTab = 'My Payslips' | 'Payroll Management';

const MANAGEMENT_ROLES = new Set(['PAYROLL_OFFICER', 'HR_MANAGER', 'ADMIN']);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

const formatPeriod = (month: number | string, year: number) => {
  if (typeof month === 'string') {
    return `${month} ${year}`;
  }
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const monthRank = (month: number | string) => {
  if (typeof month === 'number') {
    return month;
  }
  const parsed = new Date(`${month} 1, 2000`).getMonth();
  return Number.isNaN(parsed) ? 0 : parsed + 1;
};

export default function PayrollScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PayrollTab>('My Payslips');
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, PayslipDetail>>({});
  const [detailLoadingMap, setDetailLoadingMap] = useState<Record<string, boolean>>({});
  const [detailErrorMap, setDetailErrorMap] = useState<Record<string, string>>({});

  const hasManagementAccess = user ? MANAGEMENT_ROLES.has(user.role) : false;
  const hasSelfPayrollAccess = user ? user.role === 'EMPLOYEE' || MANAGEMENT_ROLES.has(user.role) : false;
  const tabs: PayrollTab[] = hasManagementAccess ? ['My Payslips', 'Payroll Management'] : ['My Payslips'];

  const fetchPayslips = useCallback(async () => {
    if (!hasSelfPayrollAccess) {
      setPayslips([]);
      setError('Payroll is restricted for your role in mobile app.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!user?.id) {
        setPayslips([]);
        setError('Unable to identify current user for payroll history.');
        return;
      }
      const response = await getMyPayslips(user.id);
      const sorted = [...response].sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        return monthRank(b.month) - monthRank(a.month);
      });
      setPayslips(sorted);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Unable to load payslips. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [hasSelfPayrollAccess, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchPayslips();
    }, [fetchPayslips]),
  );

  const fetchDetail = useCallback(async (payrollId: string) => {
    if (!user?.id) {
      return;
    }
    setDetailLoadingMap(prev => ({ ...prev, [payrollId]: true }));
    setDetailErrorMap(prev => ({ ...prev, [payrollId]: '' }));
    try {
      const detail = await getPayslipDetail(payrollId, user.id);
      setDetailMap(prev => ({ ...prev, [payrollId]: detail }));
    } catch (error: unknown) {
      setDetailErrorMap(prev => ({
        ...prev,
        [payrollId]: getApiErrorMessage(error, 'Unable to load payslip details. Please retry.'),
      }));
    } finally {
      setDetailLoadingMap(prev => ({ ...prev, [payrollId]: false }));
    }
  }, [user?.id]);

  const handleTogglePayslip = useCallback(
    async (payslipId: string) => {
      if (expandedId === payslipId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(payslipId);
      if (!detailMap[payslipId] && !detailLoadingMap[payslipId]) {
        await fetchDetail(payslipId);
      }
    },
    [detailLoadingMap, detailMap, expandedId, fetchDetail],
  );

  const renderTopState = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#01696f" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPayslips}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (payslips.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyText}>No payslips available yet.</Text>
        </View>
      );
    }
    return null;
  }, [error, fetchPayslips, loading, payslips.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Payroll</Text>
      <Text style={styles.headerSubtitle}>Your monthly salary statements and breakdown.</Text>

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

      {activeTab === 'My Payslips' ? (
        <>
          {renderTopState}

          {renderTopState === null && (
            <View style={styles.listContainer}>
              {payslips.map(payslip => {
                const isExpanded = expandedId === payslip.payrollId;
                const detail = detailMap[payslip.payrollId];
                const detailLoading = detailLoadingMap[payslip.payrollId];
                const detailError = detailErrorMap[payslip.payrollId];

                return (
                  <View key={payslip.payrollId} style={styles.card}>
                    <Pressable onPress={() => void handleTogglePayslip(payslip.payrollId)}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.periodText}>{formatPeriod(payslip.month, payslip.year)}</Text>
                        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[payslip.status] }]}>
                          <Text style={styles.badgeText}>{payslip.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.netSalary}>{formatCurrency(payslip.netPay)}</Text>
                      <Text style={styles.metaText}>
                        Gross: {formatCurrency(payslip.grossPay)} | Deductions:{' '}
                        {formatCurrency(payslip.totalDeductions)}
                      </Text>
                      <Text style={styles.expandHint}>{isExpanded ? 'Hide breakdown' : 'View breakdown'}</Text>
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.detailContainer}>
                        {detailLoading ? (
                          <View style={styles.inlineState}>
                            <ActivityIndicator size="small" color="#01696f" />
                          </View>
                        ) : null}

                        {!detailLoading && detailError ? (
                          <View style={styles.inlineState}>
                            <Text style={styles.errorText}>{detailError}</Text>
                            <TouchableOpacity
                              style={styles.retryButton}
                              onPress={() => void fetchDetail(payslip.payrollId)}
                            >
                              <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}

                        {!detailLoading && !detailError && detail ? (
                          <View style={styles.breakdownContainer}>
                            <Text style={styles.breakdownHeader}>Earnings</Text>
                            {detail.earnings.length === 0 ? (
                              <Text style={styles.emptyText}>No earnings data.</Text>
                            ) : (
                              detail.earnings.map((item, index) => (
                                <View key={`${item.label}-${index}`} style={styles.rowBetween}>
                                  <Text style={styles.lineItemLabel}>{item.label}</Text>
                                  <Text style={styles.lineItemAmount}>{formatCurrency(item.amount)}</Text>
                                </View>
                              ))
                            )}

                            <Text style={styles.breakdownHeader}>Deductions</Text>
                            {detail.deductions.length === 0 ? (
                              <Text style={styles.emptyText}>No deductions data.</Text>
                            ) : (
                              detail.deductions.map((item, index) => (
                                <View key={`${item.label}-${index}`} style={styles.rowBetween}>
                                  <Text style={styles.lineItemLabel}>{item.label}</Text>
                                  <Text style={styles.lineItemAmount}>{formatCurrency(item.amount)}</Text>
                                </View>
                              ))
                            )}
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      ) : (
        <View style={styles.stateContainer}>
          <Text style={styles.pendingTitle}>Pending Endpoint</Text>
          <Text style={styles.emptyText}>
            Payroll management and bulk actions are pending dedicated admin payroll endpoint confirmation.
          </Text>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  tabButtonActive: {
    backgroundColor: '#01696f',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
  netSalary: {
    fontSize: 18,
    fontWeight: '700',
    color: '#01696f',
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  expandHint: {
    fontSize: 12,
    color: '#01696f',
    fontWeight: '600',
  },
  detailContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  breakdownContainer: {
    gap: 8,
  },
  breakdownHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  lineItemLabel: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  lineItemAmount: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  stateContainer: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  inlineState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  retryButton: {
    backgroundColor: '#01696f',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
});
