import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, CalendarCheck, ChartNoAxesColumn, LayoutDashboard, User, Wallet } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import PayrollScreen from '../screens/payroll/PayrollScreen';
import PerformanceScreen from '../screens/performance/PerformanceScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { NotificationProvider, useNotification } from '../context/NotificationContext';
import { UserRole } from '../types/auth';

const Tab = createBottomTabNavigator();

interface TabConfig {
  name: string;
  component: React.ComponentType;
  shortLabel: string;
}

const BASE_TABS: TabConfig[] = [
  { name: 'Dashboard', component: DashboardScreen, shortLabel: 'Home' },
  { name: 'Notifications', component: NotificationsScreen, shortLabel: 'Alerts' },
  { name: 'Profile', component: ProfileScreen, shortLabel: 'Profile' },
];

const MODULE_ACCESS: Record<UserRole, { attendance: boolean; payroll: boolean; performance: boolean }> = {
  ADMIN: { attendance: false, payroll: false, performance: false },
  SUPER_ADMIN: { attendance: false, payroll: false, performance: false },
  CEO: { attendance: true, payroll: false, performance: false },
  COUNTRY_MANAGER: { attendance: true, payroll: false, performance: false },
  OPERATIONS_MANAGER: { attendance: true, payroll: false, performance: false },
  FINANCE_MANAGER: { attendance: true, payroll: true, performance: false },
  HR_MANAGER: { attendance: true, payroll: true, performance: true },
  HR_OFFICER: { attendance: true, payroll: true, performance: false },
  PAYROLL_OFFICER: { attendance: false, payroll: true, performance: false },
  PROJECT_MANAGER: { attendance: true, payroll: false, performance: false },
  DEPARTMENT_MANAGER: { attendance: true, payroll: false, performance: true },
  DIRECT_MANAGER: { attendance: true, payroll: false, performance: true },
  EMPLOYEE: { attendance: true, payroll: true, performance: true },
};

function AppTabs() {
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotification();

  const renderTabIcon = (routeName: string, color: string) => {
    const iconSize = 22;
    if (routeName === 'Dashboard') {
      return <LayoutDashboard size={iconSize} color={color} />;
    }
    if (routeName === 'Attendance') {
      return <CalendarCheck size={iconSize} color={color} />;
    }
    if (routeName === 'Payroll') {
      return <Wallet size={iconSize} color={color} />;
    }
    if (routeName === 'Notifications') {
      return <Bell size={iconSize} color={color} />;
    }
    if (routeName === 'Performance') {
      return <ChartNoAxesColumn size={iconSize} color={color} />;
    }
    return <User size={iconSize} color={color} />;
  };

  useFocusEffect(
    React.useCallback(() => {
      void refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

  const access = user ? MODULE_ACCESS[user.role] : null;
  const tabs: TabConfig[] = [BASE_TABS[0]];
  if (access?.attendance) {
    tabs.push({ name: 'Attendance', component: AttendanceScreen, shortLabel: 'Attend' });
  }
  if (access?.payroll) {
    tabs.push({ name: 'Payroll', component: PayrollScreen, shortLabel: 'Payroll' });
  }
  if (access?.performance) {
    tabs.push({ name: 'Performance', component: PerformanceScreen, shortLabel: 'Perform' });
  }
  tabs.push(BASE_TABS[1], BASE_TABS[2]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => (
          <View style={styles.iconContainer}>
            {renderTabIcon(route.name, color)}
            {route.name === 'Notifications' && unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
          </View>
        ),
        tabBarLabel: ({ color }) => (
          <Text style={[styles.tabLabel, { color }]}>
            {tabs.find(tab => tab.name === route.name)?.shortLabel ?? route.name}
          </Text>
        ),
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#01696f',
        tabBarInactiveTintColor: '#6B7280',
      })}
    >
      {tabs.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NotificationProvider>
      <AppTabs />
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabBar: {
    height: 70,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});