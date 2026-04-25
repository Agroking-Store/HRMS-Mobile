import apiClient from './apiClient';
import { LoginResponse } from '../types/auth';

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};