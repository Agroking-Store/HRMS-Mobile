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
import { useAuth } from '../../context/AuthContext';
import { getMyPayslips, getPayslipDetail } from '../../services/payrollService';
import { PayslipDetail, PayslipSummary, PayslipStatus } from '../../types/payroll';

const STATUS_COLORS: Record<PayslipStatus, string> = {
  Processed: '#10B981',
  Pending: '#F59E0B',
};

const TEAM_PAYROLL_ROLES = new Set(['PAYROLL_OFFICER', 'FINANCE_MANAGER', 'ADMIN', 'SUPER_ADMIN']);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

const formatPeriod = (month: number, year: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

export default function PayrollScreen() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, PayslipDetail>>({});
  const [detailLoadingMap, setDetailLoadingMap] = useState<Record<string, boolean>>({});
  const [detailErrorMap, setDetailErrorMap] = useState<Record<string, string>>({});

  const hasTeamPayrollAccess = user ? TEAM_PAYROLL_ROLES.has(user.role) : false;

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyPayslips();
      const sorted = [...response].sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        return b.month - a.month;
      });
      setPayslips(sorted);
    } catch {
      setError('Unable to load payslips. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPayslips();
    }, [fetchPayslips]),
  );

  const fetchDetail = useCallback(async (payslipId: string) => {
    setDetailLoadingMap(prev => ({ ...prev, [payslipId]: true }));
    setDetailErrorMap(prev => ({ ...prev, [payslipId]: '' }));
    try {
      const detail = await getPayslipDetail(payslipId);
      setDetailMap(prev => ({ ...prev, [payslipId]: detail }));
    } catch {
      setDetailErrorMap(prev => ({
        ...prev,
        [payslipId]: 'Unable to load payslip details. Please retry.',
      }));
    } finally {
      setDetailLoadingMap(prev => ({ ...prev, [payslipId]: false }));
    }
  }, []);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Payroll</Text>
      <Text style={styles.headerSubtitle}>Your monthly salary statements and breakdown.</Text>

      {hasTeamPayrollAccess ? (
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>Team Payroll Access</Text>
          <Text style={styles.bannerText}>
            Full team payroll controls and reports are available on the web portal.
          </Text>
        </View>
      ) : null}

      {renderTopState}

      {renderTopState === null && (
        <View style={styles.listContainer}>
          {payslips.map(payslip => {
            const isExpanded = expandedId === payslip.id;
            const detail = detailMap[payslip.id];
            const detailLoading = detailLoadingMap[payslip.id];
            const detailError = detailErrorMap[payslip.id];

            return (
              <View key={payslip.id} style={styles.card}>
                <Pressable onPress={() => void handleTogglePayslip(payslip.id)}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.periodText}>{formatPeriod(payslip.month, payslip.year)}</Text>
                    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[payslip.status] }]}>
                      <Text style={styles.badgeText}>{payslip.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.netSalary}>{formatCurrency(payslip.netSalary)}</Text>
                  <Text style={styles.metaText}>
                    Gross: {formatCurrency(payslip.grossSalary)} | Deductions:{' '}
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
                          onPress={() => void fetchDetail(payslip.id)}
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
    </ScrollView>
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
  bannerCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  bannerText: {
    fontSize: 14,
    color: '#047857',
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
});
