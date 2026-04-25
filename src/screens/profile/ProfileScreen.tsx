import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../../services/profileService';
import { EmergencyContact, ProfileDetail } from '../../types/profile';
import { User } from '../../types/auth';

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || '--';
  }
  return parsed.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toUser = (profile: ProfileDetail): User => ({
  id: profile.id,
  employeeCode: profile.employeeCode,
  email: profile.email,
  firstName: profile.firstName,
  lastName: profile.lastName,
  role: profile.role,
  department: profile.department,
  phoneNumber: profile.phoneNumber,
  isActive: profile.isActive,
});

export default function ProfileScreen() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const hydrateEditableFields = useCallback((data: ProfileDetail) => {
    setPhoneNumber(data.phoneNumber ?? '');
    setAddress(data.address ?? '');
    setEmergencyName(data.emergencyContact?.name ?? '');
    setEmergencyPhone(data.emergencyContact?.phone ?? '');
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyProfile();
      setProfile(response);
      hydrateEditableFields(response);
    } catch {
      setError('Unable to load profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [hydrateEditableFields]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const initials = useMemo(() => {
    if (!profile) {
      return '--';
    }
    const first = profile.firstName?.trim().charAt(0) ?? '';
    const last = profile.lastName?.trim().charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || '--';
  }, [profile]);

  const handleToggleEdit = () => {
    if (profile && !isEditing) {
      hydrateEditableFields(profile);
      setSaveError('');
    }
    setIsEditing(prev => !prev);
  };

  const handleSave = async () => {
    if (!profile) {
      return;
    }
    if (!phoneNumber.trim() || !address.trim() || !emergencyName.trim() || !emergencyPhone.trim()) {
      setSaveError('All editable fields are required.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    const emergencyContact: EmergencyContact = {
      name: emergencyName.trim(),
      phone: emergencyPhone.trim(),
    };
    try {
      const updated = await updateMyProfile({
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        emergencyContact,
      });
      setProfile(updated);
      const updatedUser = toUser(updated);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await setUser(updatedUser);
      setIsEditing(false);
    } catch {
      setSaveError('Unable to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

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
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.emptyText}>Profile details are unavailable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.nameText}>
          {profile.firstName} {profile.lastName}
        </Text>
        <Text style={styles.subText}>{profile.role.replaceAll('_', ' ')}</Text>
        <Text style={styles.subText}>{profile.email}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleToggleEdit}>
          <Text style={styles.secondaryButtonText}>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</Text>
        </TouchableOpacity>
        {isEditing ? (
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save</Text>}
          </TouchableOpacity>
        ) : null}
      </View>

      {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Info</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Employee Code</Text>
          <Text style={styles.fieldValue}>{profile.employeeCode}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{profile.email}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Phone</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.phoneNumber || '--'}</Text>
          )}
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Address</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.address || '--'}</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Employment Info</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Designation</Text>
          <Text style={styles.fieldValue}>{profile.designation || '--'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Department</Text>
          <Text style={styles.fieldValue}>{profile.department || '--'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Joining Date</Text>
          <Text style={styles.fieldValue}>{formatDate(profile.joiningDate)}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Active</Text>
          <Text style={styles.fieldValue}>{profile.isActive ? 'Yes' : 'No'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emergency Contact</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholder="Contact name"
              placeholderTextColor="#9CA3AF"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.emergencyContact?.name || '--'}</Text>
          )}
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Phone</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              placeholder="Contact phone"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.emergencyContact?.phone || '--'}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}
        onPress={() => void handleLogout()}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.logoutText}>Logout</Text>}
      </TouchableOpacity>
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#01696f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 14,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#01696f',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  logoutButton: {
    marginTop: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#F3F4F6',
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
});
