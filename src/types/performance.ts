export type AppraisalCycleStatus = 'Draft' | 'Active' | 'Closed';

export interface AppraisalCycle {
  _id: string;
  name: string;
  status: AppraisalCycleStatus;
  startDate: string;
  endDate: string;
}

export type PerformanceReviewStatus = 'Pending' | 'Submitted' | 'Reviewed';

export interface PerformanceReview {
  _id: string;
  cycleId: string;
  cycleName: string;
  rating: number | null;
  status: PerformanceReviewStatus;
  feedback: string | null;
  reviewedAt: string | null;
}

export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface GoalItem {
  _id: string;
  title: string;
  description: string;
  status: GoalStatus;
  dueDate: string;
}
