import { User } from './auth';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface ProfileDetail extends User {
  designation: string;
  joiningDate: string;
  address: string;
  emergencyContact: EmergencyContact;
  profilePhoto: string | null;
}
