import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPayload } from '../../services/dashboardService';
import { DashboardPayload, DashboardSection } from '../../types/dashboard';
import { getApiErrorMessage } from '../../utils/apiError';

const SectionCard = ({ section }: { section: DashboardSection }) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      {section.pending ? (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingTitle}>{section.pending.title}</Text>
          <Text style={styles.pendingText}>{section.pending.message}</Text>
        </View>
      ) : null}
      {section.metrics?.map(metric => (
        <View key={metric.key} style={styles.metricRow}>
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricHint}>{metric.hint}</Text>
          </View>
          <Text style={styles.metricValue}>{metric.value}</Text>
        </View>
      ))}
      {section.actions?.map(action => (
        <View key={action.key} style={styles.actionRow}>
          <Text style={styles.actionLabel}>{action.label}</Text>
          <Text style={styles.actionDescription}>{action.description}</Text>
        </View>
      ))}
    </View>
  );
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<DashboardPayload | null>(null);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!user) {
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const data = await getDashboardPayload(user.role, user.id);
        setPayload(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Unable to load dashboard.'));
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.emptyTitle}>No active session</Text>
        <Text style={styles.emptySubtitle}>Please log in again to view your dashboard.</Text>
      </SafeAreaView>
    );
  }

  if (loading && !payload) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#01696f" />
      </SafeAreaView>
    );
  }

  if (error && !payload) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void load(false)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <Text style={styles.headerTitle}>{payload?.title ?? 'Dashboard'}</Text>
        <Text style={styles.headerSubtitle}>{payload?.subtitle ?? ''}</Text>
        <View style={styles.userCard}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userMeta}>{user.role.replaceAll('_', ' ')}</Text>
          <Text style={styles.userMeta}>
            {user.employeeCode} | {user.department}
          </Text>
        </View>
        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        {(payload?.sections ?? []).map(section => (
          <SectionCard key={section.key} section={section} />
        ))}
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
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
  userCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  userMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  metricTextWrap: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  metricHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 14,
    color: '#01696f',
    fontWeight: '700',
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    gap: 2,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  pendingBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    padding: 10,
    gap: 4,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingText: {
    fontSize: 12,
    color: '#B45309',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  inlineError: {
    color: '#EF4444',
    fontSize: 13,
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
  emptyTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
