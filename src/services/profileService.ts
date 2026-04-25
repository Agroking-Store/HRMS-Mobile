import apiClient from './apiClient';
import { ProfileDetail } from '../types/profile';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const extractValue = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }
  return payload as T;
};

export const getMyProfile = async (): Promise<ProfileDetail> => {
  const response = await apiClient.get<ProfileDetail | ApiEnvelope<ProfileDetail>>('/employee/my-profile');
  return extractValue(response.data);
};

export const updateMyProfile = async (
  payload: Partial<ProfileDetail>,
): Promise<ProfileDetail> => {
  const response = await apiClient.put<ProfileDetail | ApiEnvelope<ProfileDetail>>(
    '/employee/my-profile',
    payload,
  );
  return extractValue(response.data);
};
