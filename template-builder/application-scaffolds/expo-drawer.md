# Expo Drawer Navigation Template

## Overview
Production-ready Expo application with drawer-based navigation using Expo Router. Features TypeScript, customizable drawer with gestures, authentication flows, and a dashboard-style layout ideal for admin panels and complex apps.

## Quick Start

```bash
# Create new Expo project
npx create-expo-app@latest my-drawer-app

# Or use this template
npx degit template-builder/expo-drawer my-drawer-app
cd my-drawer-app

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Project Structure

```
expo-drawer/
├── app/
│   ├── (drawer)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   ├── analytics.tsx
│   │   ├── users/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── settings/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── notifications.tsx
│   │   │   └── security.tsx
│   │   └── help.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── modal.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── assets/
│   ├── fonts/
│   └── images/
├── components/
│   ├── drawer/
│   │   ├── CustomDrawerContent.tsx
│   │   ├── DrawerHeader.tsx
│   │   ├── DrawerItem.tsx
│   │   └── DrawerSection.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── DataTable.tsx
│   │   ├── Chart.tsx
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── RecentActivity.tsx
│   │   └── QuickActions.tsx
│   └── Themed.tsx
├── constants/
│   ├── Colors.ts
│   ├── Layout.ts
│   └── Navigation.ts
├── context/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── DrawerContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDrawer.ts
│   └── useColorScheme.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── analytics.ts
├── types/
│   └── navigation.ts
├── .env.example
├── app.json
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Configuration Files

### package.json
```json
{
  "name": "expo-drawer-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "test": "jest"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-navigation/drawer": "^6.6.0",
    "@react-navigation/native": "^6.1.0",
    "expo": "~51.0.0",
    "expo-constants": "~16.0.0",
    "expo-font": "~12.0.0",
    "expo-haptics": "~13.0.0",
    "expo-image": "~1.12.0",
    "expo-router": "~3.5.0",
    "expo-secure-store": "~13.0.0",
    "expo-splash-screen": "~0.27.0",
    "expo-status-bar": "~1.12.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "~4.10.0",
    "react-native-screens": "~3.31.0",
    "victory-native": "^37.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.0",
    "typescript": "~5.3.0"
  }
}
```

### app.json
```json
{
  "expo": {
    "name": "DrawerApp",
    "slug": "drawer-app",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/images/icon.png",
    "scheme": "drawer",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1f2937"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.drawerapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#1f2937"
      },
      "package": "com.yourcompany.drawerapp"
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Root Layout

### app/_layout.tsx
```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useTheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Details',
          }}
        />
      </Stack>
    </>
  );
}
```

## Drawer Layout

### app/(drawer)/_layout.tsx
```tsx
import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { CustomDrawerContent } from '@/components/drawer/CustomDrawerContent';
import Colors from '@/constants/Colors';
import { Redirect } from 'expo-router';

export default function DrawerLayout() {
  const { colorScheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const colors = Colors[colorScheme ?? 'light'];

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const isLargeScreen = width >= 768;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        drawerStyle: {
          backgroundColor: colors.card,
          width: isLargeScreen ? 280 : '80%',
        },
        drawerType: isLargeScreen ? 'permanent' : 'front',
        drawerActiveBackgroundColor: colors.tint + '20',
        drawerActiveTintColor: colors.tint,
        drawerInactiveTintColor: colors.text,
        swipeEnabled: !isLargeScreen,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="dashboard"
        options={{
          drawerLabel: 'Dashboard',
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          drawerLabel: 'Analytics',
          title: 'Analytics',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="users"
        options={{
          drawerLabel: 'Users',
          title: 'Users',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="help"
        options={{
          drawerLabel: 'Help & Support',
          title: 'Help & Support',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

import { Ionicons } from '@expo/vector-icons';
```

## Custom Drawer Content

### components/drawer/CustomDrawerContent.tsx
```tsx
import { View, StyleSheet, Image, Pressable } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { colorScheme, toggleColorScheme } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* User Profile Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: user?.avatar || 'https://via.placeholder.com/60' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {user?.name || 'User'}
            </ThemedText>
            <ThemedText style={styles.email} numberOfLines={1}>
              {user?.email || 'user@example.com'}
            </ThemedText>
            <View style={styles.roleBadge}>
              <ThemedText style={styles.roleText}>
                {user?.role || 'Member'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <DrawerItemList {...props} />

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Additional Actions */}
        <View style={styles.additionalSection}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>

          {/* Theme Toggle */}
          <Pressable
            style={styles.actionItem}
            onPress={toggleColorScheme}
          >
            <Ionicons
              name={colorScheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={22}
              color={colors.text}
            />
            <ThemedText style={styles.actionText}>
              {colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </ThemedText>
          </Pressable>
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>

        <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  email: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 10,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    marginHorizontal: 16,
  },
  additionalSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionText: {
    fontSize: 15,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 12,
    textAlign: 'center',
  },
});
```

## Dashboard Screen

### app/(drawer)/dashboard.tsx
```tsx
import { StyleSheet, ScrollView, RefreshControl, useWindowDimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { ThemedView } from '@/components/navigation/ThemedView';
import { ThemedText } from '@/components/Themed';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card } from '@/components/ui/Card';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const stats = [
    { title: 'Total Users', value: '12,453', change: '+12%', icon: 'people' },
    { title: 'Revenue', value: '$45.2K', change: '+8%', icon: 'cash' },
    { title: 'Orders', value: '892', change: '+24%', icon: 'cart' },
    { title: 'Conversion', value: '3.24%', change: '+2.1%', icon: 'trending-up' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Banner */}
      <Card style={styles.banner}>
        <ThemedText type="title" style={styles.bannerTitle}>
          Dashboard Overview
        </ThemedText>
        <ThemedText style={styles.bannerSubtitle}>
          Here's what's happening with your business today
        </ThemedText>
      </Card>

      {/* Stats Grid */}
      <ThemedView
        style={[
          styles.statsGrid,
          isLargeScreen && styles.statsGridLarge,
        ]}
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </ThemedView>

      {/* Main Content */}
      <ThemedView
        style={[
          styles.mainContent,
          isLargeScreen && styles.mainContentLarge,
        ]}
      >
        {/* Recent Activity */}
        <ThemedView style={[styles.section, isLargeScreen && styles.sectionLarge]}>
          <RecentActivity />
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={[styles.section, isLargeScreen && styles.sectionSmall]}>
          <QuickActions />
        </ThemedView>
      </ThemedView>

      {/* Charts Section */}
      <ThemedView style={styles.chartsSection}>
        <Card>
          <ThemedText type="subtitle">Revenue Overview</ThemedText>
          <ThemedView style={styles.chartPlaceholder}>
            <ThemedText style={styles.chartText}>
              Chart Component Here
            </ThemedText>
          </ThemedView>
        </Card>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  banner: {
    marginBottom: 20,
    backgroundColor: '#3b82f6',
  },
  bannerTitle: {
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#fff',
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statsGridLarge: {
    gap: 16,
  },
  mainContent: {
    gap: 16,
    marginBottom: 20,
  },
  mainContentLarge: {
    flexDirection: 'row',
  },
  section: {
    flex: 1,
  },
  sectionLarge: {
    flex: 2,
  },
  sectionSmall: {
    flex: 1,
  },
  chartsSection: {
    marginBottom: 20,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 12,
  },
  chartText: {
    opacity: 0.5,
  },
});
```

## Dashboard Components

### components/dashboard/StatCard.tsx
```tsx
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/Themed';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isPositive = change.startsWith('+');

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
          <Ionicons name={icon} size={20} color={colors.tint} />
        </View>
        <View
          style={[
            styles.changeContainer,
            { backgroundColor: isPositive ? '#10b98120' : '#ef444420' },
          ]}
        >
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={isPositive ? '#10b981' : '#ef4444'}
          />
          <ThemedText
            style={[
              styles.changeText,
              { color: isPositive ? '#10b981' : '#ef4444' },
            ]}
          >
            {change}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="title" style={styles.value}>
        {value}
      </ThemedText>
      <ThemedText style={styles.title}>{title}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 150,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 28,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    opacity: 0.6,
  },
});
```

### components/dashboard/RecentActivity.tsx
```tsx
import { StyleSheet, FlatList, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/Themed';
import { ThemedView } from '@/components/navigation/ThemedView';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

const activities = [
  {
    id: '1',
    type: 'order',
    message: 'New order #1234 received',
    time: '5 min ago',
    status: 'success',
  },
  {
    id: '2',
    type: 'user',
    message: 'New user john@example.com signed up',
    time: '12 min ago',
    status: 'info',
  },
  {
    id: '3',
    type: 'payment',
    message: 'Payment of $150 processed',
    time: '1 hour ago',
    status: 'success',
  },
  {
    id: '4',
    type: 'alert',
    message: 'Low inventory alert for Product X',
    time: '2 hours ago',
    status: 'warning',
  },
  {
    id: '5',
    type: 'error',
    message: 'Failed login attempt detected',
    time: '3 hours ago',
    status: 'error',
  },
];

export function RecentActivity() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  const statusColors = {
    success: '#10b981',
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  return (
    <Card>
      <ThemedText type="subtitle" style={styles.title}>
        Recent Activity
      </ThemedText>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        renderItem={({ item }) => (
          <ThemedView style={styles.activityItem}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColors[item.status as keyof typeof statusColors] },
              ]}
            />
            <ThemedView style={styles.activityContent}>
              <ThemedText numberOfLines={2}>{item.message}</ThemedText>
              <ThemedText style={styles.time}>{item.time}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  separator: {
    height: 1,
  },
});
```

### components/dashboard/QuickActions.tsx
```tsx
import { StyleSheet, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/Themed';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

const actions = [
  {
    id: '1',
    title: 'Add User',
    icon: 'person-add-outline',
    href: '/(drawer)/users',
    color: '#3b82f6',
  },
  {
    id: '2',
    title: 'New Order',
    icon: 'add-circle-outline',
    href: '/modal',
    color: '#10b981',
  },
  {
    id: '3',
    title: 'Reports',
    icon: 'document-text-outline',
    href: '/(drawer)/analytics',
    color: '#8b5cf6',
  },
  {
    id: '4',
    title: 'Settings',
    icon: 'settings-outline',
    href: '/(drawer)/settings',
    color: '#f59e0b',
  },
];

export function QuickActions() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = (href: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(href as any);
  };

  return (
    <Card>
      <ThemedText type="subtitle" style={styles.title}>
        Quick Actions
      </ThemedText>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.actionItem,
              { backgroundColor: colors.background },
              pressed && styles.pressed,
            ]}
            onPress={() => handlePress(action.href)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: action.color + '20' },
              ]}
            >
              <Ionicons
                name={action.icon as any}
                size={24}
                color={action.color}
              />
            </View>
            <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionItem: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
```

## Users Management

### app/(drawer)/users/_layout.tsx
```tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

export default function UsersLayout() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'User Details',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
```

### app/(drawer)/users/index.tsx
```tsx
import { StyleSheet, FlatList, Pressable, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/navigation/ThemedView';
import { ThemedText } from '@/components/Themed';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'active' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'Viewer', status: 'inactive' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'active' },
  { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', role: 'Viewer', status: 'pending' },
];

export default function UsersScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [search, setSearch] = useState('');

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    active: '#10b981',
    inactive: '#6b7280',
    pending: '#f59e0b',
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.header}>
        <Input
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
          leftIcon="search-outline"
          style={styles.searchInput}
        />
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/modal')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(drawer)/users/${item.id}`)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Card style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>
                    {item.name.charAt(0)}
                  </ThemedText>
                </View>
                <View style={styles.userDetails}>
                  <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                  <ThemedText style={styles.email}>{item.email}</ThemedText>
                </View>
              </View>
              <View style={styles.userMeta}>
                <View style={styles.roleBadge}>
                  <ThemedText style={styles.roleText}>{item.role}</ThemedText>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusColors[item.status as keyof typeof statusColors] },
                  ]}
                />
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <ThemedView style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.tabIconDefault} />
            <ThemedText style={styles.emptyText}>No users found</ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  separator: {
    height: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  email: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    opacity: 0.5,
  },
});
```

## Settings Nested Navigation

### app/(drawer)/settings/_layout.tsx
```tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

export default function SettingsLayout() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="security" options={{ title: 'Security' }} />
    </Stack>
  );
}
```

### app/(drawer)/settings/index.tsx
```tsx
import { StyleSheet, ScrollView, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/navigation/ThemedView';
import { ThemedText } from '@/components/Themed';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', href: '/(drawer)/settings/profile' },
      { icon: 'notifications-outline', label: 'Notifications', href: '/(drawer)/settings/notifications' },
      { icon: 'shield-outline', label: 'Security', href: '/(drawer)/settings/security' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'language-outline', label: 'Language', href: '/modal' },
      { icon: 'globe-outline', label: 'Region', href: '/modal' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', href: '/(drawer)/help' },
      { icon: 'chatbubble-outline', label: 'Contact Us', href: '/modal' },
      { icon: 'document-text-outline', label: 'Terms of Service', href: '/modal' },
      { icon: 'lock-closed-outline', label: 'Privacy Policy', href: '/modal' },
    ],
  },
];

export default function SettingsScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <Card style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  style={({ pressed }) => [
                    styles.settingItem,
                    pressed && styles.pressed,
                    itemIndex < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push(item.href as any)}
                >
                  <View style={styles.itemLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={colors.text}
                    />
                    <ThemedText>{item.label}</ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.tabIconDefault}
                  />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
```

## Context Providers

### context/ThemeContext.tsx
```tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'app-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    systemScheme ?? 'light'
  );

  useEffect(() => {
    loadStoredTheme();
  }, []);

  const loadStoredTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') {
        setColorSchemeState(stored);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    await AsyncStorage.setItem(THEME_KEY, scheme);
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{ colorScheme, setColorScheme, toggleColorScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

## UI Components

### components/ui/DataTable.tsx
```tsx
import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { ThemedText } from '@/components/Themed';
import { ThemedView } from '@/components/navigation/ThemedView';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface Column<T> {
  key: keyof T;
  title: string;
  width?: number | string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowPress,
}: DataTableProps<T>) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background }]}>
        {columns.map((column) => (
          <View
            key={String(column.key)}
            style={[styles.cell, column.width ? { width: column.width } : { flex: 1 }]}
          >
            <ThemedText type="defaultSemiBold" style={styles.headerText}>
              {column.title}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Body */}
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => onRowPress?.(item)}
            style={({ pressed }) => [
              styles.row,
              index % 2 === 0 && { backgroundColor: colors.card },
              pressed && styles.pressed,
            ]}
          >
            {columns.map((column) => (
              <View
                key={String(column.key)}
                style={[styles.cell, column.width ? { width: column.width } : { flex: 1 }]}
              >
                {column.render ? (
                  column.render(item[column.key], item)
                ) : (
                  <ThemedText numberOfLines={1}>
                    {String(item[column.key])}
                  </ThemedText>
                )}
              </View>
            ))}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 13,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pressed: {
    opacity: 0.7,
  },
  cell: {
    justifyContent: 'center',
    paddingRight: 8,
  },
});
```

## CLAUDE.md Integration

```markdown
# Expo Drawer Navigation Application

## Overview
This is a production-ready Expo application using drawer navigation with Expo Router. Ideal for dashboard-style apps, admin panels, and complex applications requiring nested navigation.

## Key Technologies
- **Expo SDK 51**: Latest Expo features
- **Expo Router**: File-based routing with drawer support
- **React Navigation Drawer**: Customizable drawer navigation
- **TypeScript**: Full type safety
- **Victory Native**: Charts and data visualization

## Project Structure
- `app/(drawer)/` - Drawer navigator screens
- `app/(auth)/` - Authentication screens
- `components/drawer/` - Custom drawer components
- `components/dashboard/` - Dashboard-specific components
- `components/ui/` - Reusable UI components

## Navigation
- Drawer navigation with custom content
- Nested stack navigation within drawer screens
- Responsive layout (permanent drawer on tablets)

## Commands
- `npx expo start` - Start development server
- `npx expo run:ios` - Run on iOS
- `npx expo run:android` - Run on Android
- `eas build` - Build for production

## Common Patterns

### Protected Routes
Auth check in drawer layout redirects to login if not authenticated.

### Responsive Drawer
```tsx
const isLargeScreen = width >= 768;
drawerType: isLargeScreen ? 'permanent' : 'front'
```

### Custom Drawer Content
Implement `CustomDrawerContent` for user profile, theme toggle, and logout.

## AI Assistance Guidelines
- Use Expo Router drawer for navigation
- Implement responsive layouts for tablet support
- Use custom drawer content for enhanced UX
- Follow file-based routing conventions
```

## AI Suggestions

1. **Add gesture-based navigation** - Implement swipe gestures for common actions
2. **Implement role-based access** - Show/hide drawer items based on user permissions
3. **Add badge notifications** - Display unread counts on drawer items
4. **Implement collapsible sections** - Group drawer items into expandable categories
5. **Add search functionality** - Global search accessible from drawer
6. **Implement offline mode** - Cache dashboard data for offline viewing
7. **Add data export** - Export reports as CSV/PDF
8. **Set up real-time updates** - WebSocket integration for live dashboard
9. **Add keyboard shortcuts** - Desktop keyboard navigation support
10. **Implement mini drawer** - Collapsed drawer showing only icons on large screens
