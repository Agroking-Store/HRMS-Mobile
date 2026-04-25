import apiClient from './apiClient';
import { AppraisalCycle, GoalItem, PerformanceReview } from '../types/performance';

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

export const getMyAppraisalCycles = async (): Promise<AppraisalCycle[]> => {
  const response = await apiClient.get<AppraisalCycle[] | ApiEnvelope<AppraisalCycle[]>>(
    '/performance/cycles',
  );
  return extractList(response.data);
};

export const getMyReviews = async (): Promise<PerformanceReview[]> => {
  const response = await apiClient.get<PerformanceReview[] | ApiEnvelope<PerformanceReview[]>>(
    '/performance/my-reviews',
  );
  return extractList(response.data);
};

export const getMyGoals = async (): Promise<GoalItem[]> => {
  const response = await apiClient.get<GoalItem[] | ApiEnvelope<GoalItem[]>>('/goals');
  return extractList(response.data);
};
