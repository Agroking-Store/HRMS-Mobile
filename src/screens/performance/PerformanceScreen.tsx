import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getMyAppraisalCycles,
  getMyGoals,
  getMyReviews,
} from '../../services/performanceService';
import {
  AppraisalCycle,
  AppraisalCycleStatus,
  GoalItem,
  GoalStatus,
  PerformanceReview,
  PerformanceReviewStatus,
} from '../../types/performance';

type PerformanceTab = 'Appraisal Cycles' | 'My Reviews' | 'Goals';

const TABS: PerformanceTab[] = ['Appraisal Cycles', 'My Reviews', 'Goals'];

const CYCLE_STATUS_COLORS: Record<AppraisalCycleStatus, string> = {
  Draft: '#6B7280',
  Active: '#01696f',
  Closed: '#EF4444',
};

const REVIEW_STATUS_COLORS: Record<PerformanceReviewStatus, string> = {
  Pending: '#F59E0B',
  Submitted: '#01696f',
  Reviewed: '#10B981',
};

const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  'Not Started': '#6B7280',
  'In Progress': '#01696f',
  Completed: '#10B981',
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

const formatRating = (rating: number | null) => {
  if (rating === null) {
    return 'Not Rated';
  }
  return `${rating.toFixed(1)} / 5`;
};

const renderState = (
  kind: 'loading' | 'error' | 'empty',
  message: string,
  onRetry?: () => void,
) => {
  if (kind === 'loading') {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#01696f" />
      </View>
    );
  }

  if (kind === 'error') {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorText}>{message}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stateContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
};

export default function PerformanceScreen() {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('Appraisal Cycles');

  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [cyclesError, setCyclesError] = useState('');

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState('');

  const fetchCycles = useCallback(async () => {
    setCyclesLoading(true);
    setCyclesError('');
    try {
      const response = await getMyAppraisalCycles();
      const sorted = [...response].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
      setCycles(sorted);
    } catch {
      setCyclesError('Unable to load appraisal cycles. Please try again.');
    } finally {
      setCyclesLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const response = await getMyReviews();
      setReviews(response);
    } catch {
      setReviewsError('Unable to load reviews. Please try again.');
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError('');
    try {
      const response = await getMyGoals();
      const sorted = [...response].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
      setGoals(sorted);
    } catch {
      setGoalsError('Unable to load goals. Please try again.');
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Appraisal Cycles') {
      void fetchCycles();
    }
  }, [activeTab, fetchCycles]);

  useEffect(() => {
    if (activeTab === 'My Reviews') {
      void fetchReviews();
    }
  }, [activeTab, fetchReviews]);

  useEffect(() => {
    if (activeTab === 'Goals') {
      void fetchGoals();
    }
  }, [activeTab, fetchGoals]);

  const renderCycles = () => {
    if (cyclesLoading) {
      return renderState('loading', '');
    }
    if (cyclesError) {
      return renderState('error', cyclesError, () => {
        void fetchCycles();
      });
    }
    if (cycles.length === 0) {
      return renderState('empty', 'No appraisal cycles available.');
    }
    return (
      <View style={styles.sectionContent}>
        {cycles.map(cycle => (
          <View key={cycle._id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{cycle.name}</Text>
              <View style={[styles.badge, { backgroundColor: CYCLE_STATUS_COLORS[cycle.status] }]}>
                <Text style={styles.badgeText}>{cycle.status}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>
              {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderReviews = () => {
    if (reviewsLoading) {
      return renderState('loading', '');
    }
    if (reviewsError) {
      return renderState('error', reviewsError, () => {
        void fetchReviews();
      });
    }
    if (reviews.length === 0) {
      return renderState('empty', 'No performance reviews available.');
    }
    return (
      <View style={styles.sectionContent}>
        {reviews.map(review => (
          <View key={review._id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{review.cycleName}</Text>
              <View style={[styles.badge, { backgroundColor: REVIEW_STATUS_COLORS[review.status] }]}>
                <Text style={styles.badgeText}>{review.status}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>Rating: {formatRating(review.rating)}</Text>
            <Text style={styles.cardMeta} numberOfLines={2}>
              Feedback: {review.feedback?.trim() ? review.feedback : 'No feedback yet'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGoals = () => {
    if (goalsLoading) {
      return renderState('loading', '');
    }
    if (goalsError) {
      return renderState('error', goalsError, () => {
        void fetchGoals();
      });
    }
    if (goals.length === 0) {
      return renderState('empty', 'No goals available.');
    }
    return (
      <View style={styles.sectionContent}>
        {goals.map(goal => (
          <View key={goal._id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <View style={[styles.badge, { backgroundColor: GOAL_STATUS_COLORS[goal.status] }]}>
                <Text style={styles.badgeText}>{goal.status}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>{goal.description}</Text>
            <Text style={styles.cardMeta}>Due: {formatDate(goal.dueDate)}</Text>
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
            style={[styles.tabButton, tab === activeTab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, tab === activeTab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {activeTab === 'Appraisal Cycles' && renderCycles()}
        {activeTab === 'My Reviews' && renderReviews()}
        {activeTab === 'Goals' && renderGoals()}
      </ScrollView>
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
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabButtonActive: {
    backgroundColor: '#01696f',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  sectionContent: {
    gap: 10,
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
    flex: 1,
  },
  cardMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stateContainer: {
    minHeight: 260,
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
});
