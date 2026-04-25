import apiClient from './apiClient';
import { AppraisalCycle, GoalItem, PerformanceReview } from '../types/performance';
import { UserRole } from '../types/auth';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const extractList = <T>(payload: T[] | ApiEnvelope<T[]>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
};

const toCycle = (item: Record<string, unknown>): AppraisalCycle => ({
  _id: String(item._id ?? ''),
  name: String(item.name ?? ''),
  status: String(item.status ?? 'Draft') as AppraisalCycle['status'],
  startDate: String(item.startDate ?? ''),
  endDate: String(item.endDate ?? ''),
});

const toReview = (item: Record<string, unknown>): PerformanceReview => ({
  _id: String(item._id ?? ''),
  cycleId:
    typeof item.cycleId === 'string'
      ? item.cycleId
      : String((item.cycleId as { _id?: string } | null)?._id ?? ''),
  cycleName:
    typeof item.cycleName === 'string'
      ? item.cycleName
      : String((item.cycleId as { name?: string } | null)?.name ?? ''),
  rating: typeof item.overallRating === 'number' ? item.overallRating : null,
  status:
    item.status === 'MANAGER_REVIEW_DONE' || item.status === 'HR_REVIEWED'
      ? 'Submitted'
      : item.status === 'FINAL_APPROVED' || item.status === 'FEEDBACK_RELEASED'
        ? 'Reviewed'
        : 'Pending',
  feedback:
    typeof item.adminFeedback === 'string'
      ? item.adminFeedback
      : typeof item.managerComments === 'string'
        ? item.managerComments
        : null,
  reviewedAt:
    typeof item.feedbackReleasedAt === 'string'
      ? item.feedbackReleasedAt
      : typeof item.approvedAt === 'string'
        ? item.approvedAt
        : null,
});

const toGoal = (item: Record<string, unknown>): GoalItem => ({
  _id: String(item._id ?? ''),
  title: String(item.title ?? ''),
  description: String(item.description ?? ''),
  status:
    item.status === 'NOT_STARTED'
      ? 'Not Started'
      : item.status === 'IN_PROGRESS'
        ? 'In Progress'
        : 'Completed',
  dueDate: String(item.targetDate ?? item.dueDate ?? ''),
});

export const getCycles = async (): Promise<AppraisalCycle[]> => {
  const response = await apiClient.get<AppraisalCycle[] | ApiEnvelope<AppraisalCycle[]>>('/performance/cycles');
  return extractList(response.data).map(item => toCycle(item as unknown as Record<string, unknown>));
};

export const getReviews = async (): Promise<PerformanceReview[]> => {
  const response = await apiClient.get<PerformanceReview[] | ApiEnvelope<PerformanceReview[]>>(
    '/performance/reviews/all',
  );
  return extractList(response.data).map(item => toReview(item as unknown as Record<string, unknown>));
};

const TEAM_GOAL_ROLES = new Set<UserRole>(['HR_MANAGER', 'DEPARTMENT_MANAGER', 'DIRECT_MANAGER', 'ADMIN']);

export const getGoals = async (role?: UserRole): Promise<GoalItem[]> => {
  const endpoint = role && TEAM_GOAL_ROLES.has(role) ? '/performance/goals/team-goals' : '/performance/goals/my-goals';
  const response = await apiClient.get<GoalItem[] | ApiEnvelope<GoalItem[]>>(endpoint);
  return extractList(response.data).map(item => toGoal(item as unknown as Record<string, unknown>));
};
