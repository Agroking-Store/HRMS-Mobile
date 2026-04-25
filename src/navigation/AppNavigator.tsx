import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, CalendarCheck, ChartNoAxesColumn, LayoutDashboard, User, Wallet } from 'lucide-react-native';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import PayrollScreen from '../screens/payroll/PayrollScreen';
import PerformanceScreen from '../screens/performance/PerformanceScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { NotificationProvider, useNotification } from '../context/NotificationContext';

const Tab = createBottomTabNavigator();

function AppTabs() {
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
        tabBarActiveTintColor: '#01696f',
        tabBarInactiveTintColor: '#6B7280',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Payroll" component={PayrollScreen} />
      <Tab.Screen name="Performance" component={PerformanceScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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