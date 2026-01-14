# Expo Tabs Navigation Template

## Overview
Production-ready Expo application with tab-based navigation using Expo Router. Features TypeScript, authentication flows, push notifications, and native device features with a modern bottom tab interface.

## Quick Start

```bash
# Create new Expo project with tabs
npx create-expo-app@latest my-tabs-app --template tabs

# Or use this template
npx degit template-builder/expo-tabs my-tabs-app
cd my-tabs-app

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Build for production
eas build --platform all
```

## Project Structure

```
expo-tabs/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── explore.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── modal.tsx
│   ├── [id].tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── assets/
│   ├── fonts/
│   │   └── SpaceMono-Regular.ttf
│   └── images/
│       ├── icon.png
│       ├── splash.png
│       ├── adaptive-icon.png
│       └── favicon.png
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   └── index.ts
│   ├── navigation/
│   │   ├── TabBarIcon.tsx
│   │   └── ThemedView.tsx
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── Themed.tsx
├── constants/
│   ├── Colors.ts
│   ├── Layout.ts
│   └── Config.ts
├── context/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useColorScheme.ts
│   ├── useNotifications.ts
│   ├── useLocation.ts
│   └── useThemeColor.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── storage.ts
│   └── notifications.ts
├── types/
│   ├── auth.ts
│   ├── api.ts
│   └── navigation.ts
├── utils/
│   ├── validation.ts
│   ├── format.ts
│   └── helpers.ts
├── .env.example
├── app.json
├── babel.config.js
├── eas.json
├── metro.config.js
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Configuration Files

### package.json
```json
{
  "name": "expo-tabs-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "build:dev": "eas build --profile development",
    "build:preview": "eas build --profile preview",
    "build:prod": "eas build --profile production",
    "submit": "eas submit"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-navigation/native": "^6.1.0",
    "expo": "~51.0.0",
    "expo-auth-session": "~5.5.0",
    "expo-camera": "~15.0.0",
    "expo-constants": "~16.0.0",
    "expo-device": "~6.0.0",
    "expo-font": "~12.0.0",
    "expo-haptics": "~13.0.0",
    "expo-image": "~1.12.0",
    "expo-image-picker": "~15.0.0",
    "expo-linking": "~6.3.0",
    "expo-location": "~17.0.0",
    "expo-notifications": "~0.28.0",
    "expo-router": "~3.5.0",
    "expo-secure-store": "~13.0.0",
    "expo-splash-screen": "~0.27.0",
    "expo-status-bar": "~1.12.0",
    "expo-system-ui": "~3.0.0",
    "expo-web-browser": "~13.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "~4.10.0",
    "react-native-screens": "~3.31.0",
    "zod": "^3.22.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@testing-library/react-native": "^12.4.0",
    "@types/jest": "^29.5.0",
    "@types/react": "~18.2.0",
    "jest": "^29.7.0",
    "jest-expo": "~51.0.0",
    "typescript": "~5.3.0"
  }
}
```

### app.json
```json
{
  "expo": {
    "name": "ExpoTabsApp",
    "slug": "expo-tabs-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "expotabs",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.expotabs",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to take photos.",
        "NSPhotoLibraryUsageDescription": "This app accesses photos to let you share them.",
        "NSLocationWhenInUseUsageDescription": "This app uses your location for nearby features."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.expotabs",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### eas.json
```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "preview"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@hooks/*": ["./hooks/*"],
      "@context/*": ["./context/*"],
      "@services/*": ["./services/*"],
      "@constants/*": ["./constants/*"],
      "@types/*": ["./types/*"],
      "@utils/*": ["./utils/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

### .env.example
```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_API_KEY=your-api-key

# Authentication
EXPO_PUBLIC_AUTH_DOMAIN=auth.example.com
EXPO_PUBLIC_AUTH_CLIENT_ID=your-client-id

# Push Notifications
EXPO_PUBLIC_PUSH_PROJECT_ID=your-project-id

# Analytics
EXPO_PUBLIC_ANALYTICS_ID=your-analytics-id

# Feature Flags
EXPO_PUBLIC_FEATURE_DARK_MODE=true
EXPO_PUBLIC_FEATURE_NOTIFICATIONS=true
```

## Root Layout

### app/_layout.tsx
```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@context/AuthContext';
import { ThemeProvider, useTheme } from '@context/ThemeContext';
import { NotificationProvider } from '@context/NotificationContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <RootLayoutNav />
            </NotificationProvider>
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
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
```

## Tabs Layout

### app/(tabs)/_layout.tsx
```tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { TabBarIcon } from '@components/navigation/TabBarIcon';
import Colors from '@constants/Colors';

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'compass' : 'compass-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### app/(tabs)/index.tsx
```tsx
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { Link } from 'expo-router';
import { ThemedView } from '@components/navigation/ThemedView';
import { ThemedText } from '@components/Themed';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@context/ThemeContext';

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const { colorScheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Fetch fresh data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.content}>
        {/* Welcome Section */}
        <ThemedView style={styles.welcomeSection}>
          <ThemedText type="title">
            {isAuthenticated ? `Welcome, ${user?.name}!` : 'Welcome!'}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            What would you like to do today?
          </ThemedText>
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.actionsGrid}>
          <QuickActionCard
            title="Explore"
            description="Discover new content"
            icon="compass"
            href="/(tabs)/explore"
          />
          <QuickActionCard
            title="Profile"
            description="View your profile"
            icon="person"
            href="/(tabs)/profile"
          />
          <QuickActionCard
            title="Settings"
            description="Customize your app"
            icon="settings"
            href="/(tabs)/settings"
          />
          <QuickActionCard
            title="Help"
            description="Get support"
            icon="help-circle"
            href="/modal"
          />
        </ThemedView>

        {/* Featured Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Featured</ThemedText>
          <Card style={styles.featuredCard}>
            <ThemedText type="defaultSemiBold">New Features Available</ThemedText>
            <ThemedText style={styles.cardText}>
              Check out the latest updates and improvements we've made.
            </ThemedText>
            <Button title="Learn More" onPress={() => {}} variant="primary" />
          </Card>
        </ThemedView>

        {/* Recent Activity */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
          {[1, 2, 3].map((item) => (
            <Card key={item} style={styles.activityCard}>
              <ThemedText type="defaultSemiBold">Activity {item}</ThemedText>
              <ThemedText>Some description of the activity</ThemedText>
            </Card>
          ))}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href as any} asChild>
      <Card style={styles.actionCard} pressable>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={styles.actionDescription}>{description}</ThemedText>
      </Card>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    minHeight: 100,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  featuredCard: {
    marginTop: 12,
    gap: 12,
  },
  cardText: {
    opacity: 0.7,
  },
  activityCard: {
    marginTop: 12,
  },
});
```

### app/(tabs)/profile.tsx
```tsx
import { StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@components/navigation/ThemedView';
import { ThemedText } from '@components/Themed';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { useAuth } from '@hooks/useAuth';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Handle image upload
      console.log('Selected image:', result.assets[0].uri);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centered}>
          <ThemedText type="title">Not Logged In</ThemedText>
          <ThemedText style={styles.subtitle}>
            Please login to view your profile
          </ThemedText>
          <Button
            title="Login"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
          />
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        {/* Profile Header */}
        <ThemedView style={styles.header}>
          <Avatar
            size={100}
            source={user?.avatar}
            fallback={user?.name?.[0] || 'U'}
            onPress={handlePickImage}
          />
          <ThemedText type="title" style={styles.name}>
            {user?.name}
          </ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </ThemedView>

        {/* Stats */}
        <ThemedView style={styles.statsRow}>
          <StatItem label="Posts" value="42" />
          <StatItem label="Followers" value="1.2K" />
          <StatItem label="Following" value="256" />
        </ThemedView>

        {/* Bio Section */}
        <Card style={styles.section}>
          <ThemedText type="subtitle">Bio</ThemedText>
          <ThemedText style={styles.bio}>
            {user?.bio || 'No bio added yet. Tap to add one.'}
          </ThemedText>
        </Card>

        {/* Account Actions */}
        <ThemedView style={styles.actions}>
          <Button
            title="Edit Profile"
            onPress={() => router.push('/modal')}
            variant="outline"
          />
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="danger"
          />
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.statItem}>
      <ThemedText type="title">{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    marginTop: 16,
  },
  email: {
    opacity: 0.6,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.6,
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  bio: {
    opacity: 0.7,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
});
```

### app/(tabs)/settings.tsx
```tsx
import { StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { ThemedView } from '@components/navigation/ThemedView';
import { ThemedText } from '@components/Themed';
import { Card } from '@components/ui/Card';
import { useTheme } from '@context/ThemeContext';
import { useNotifications } from '@hooks/useNotifications';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useTheme();
  const { enabled: notificationsEnabled, toggleNotifications } = useNotifications();

  const handleThemeChange = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColorScheme(value ? 'dark' : 'light');
  };

  const handleNotificationToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleNotifications(value);
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        {/* Appearance */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Appearance</ThemedText>
          <Card style={styles.settingCard}>
            <SettingRow
              title="Dark Mode"
              description="Use dark theme"
              value={colorScheme === 'dark'}
              onValueChange={handleThemeChange}
            />
          </Card>
        </ThemedView>

        {/* Notifications */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Notifications</ThemedText>
          <Card style={styles.settingCard}>
            <SettingRow
              title="Push Notifications"
              description="Receive push notifications"
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
            />
            <Divider />
            <SettingRow
              title="Email Notifications"
              description="Receive email updates"
              value={true}
              onValueChange={() => {}}
            />
          </Card>
        </ThemedView>

        {/* Privacy */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Privacy</ThemedText>
          <Card style={styles.settingCard}>
            <SettingRow
              title="Analytics"
              description="Help improve the app"
              value={true}
              onValueChange={() => {}}
            />
            <Divider />
            <SettingRow
              title="Personalization"
              description="Personalized recommendations"
              value={true}
              onValueChange={() => {}}
            />
          </Card>
        </ThemedView>

        {/* About */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          <Card style={styles.settingCard}>
            <ThemedView style={styles.aboutRow}>
              <ThemedText>Version</ThemedText>
              <ThemedText style={styles.aboutValue}>1.0.0</ThemedText>
            </ThemedView>
            <Divider />
            <ThemedView style={styles.aboutRow}>
              <ThemedText>Build</ThemedText>
              <ThemedText style={styles.aboutValue}>2024.1.1</ThemedText>
            </ThemedView>
          </Card>
        </ThemedView>

        {/* Danger Zone */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.dangerTitle}>
            Danger Zone
          </ThemedText>
          <Card style={styles.dangerCard}>
            <ThemedText>Delete Account</ThemedText>
            <ThemedText style={styles.dangerDescription}>
              Permanently delete your account and all data
            </ThemedText>
          </Card>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

function SettingRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <ThemedView style={styles.settingRow}>
      <ThemedView style={styles.settingInfo}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={styles.settingDescription}>{description}</ThemedText>
      </ThemedView>
      <Switch value={value} onValueChange={onValueChange} />
    </ThemedView>
  );
}

function Divider() {
  return <ThemedView style={styles.divider} />;
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
  settingCard: {
    marginTop: 8,
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  aboutValue: {
    opacity: 0.6,
  },
  dangerTitle: {
    color: '#ef4444',
  },
  dangerCard: {
    marginTop: 8,
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  dangerDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});
```

## Auth Layout and Screens

### app/(auth)/_layout.tsx
```tsx
import { Stack } from 'expo-router';
import { useTheme } from '@context/ThemeContext';
import Colors from '@constants/Colors';

export default function AuthLayout() {
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
        name="login"
        options={{ title: 'Sign In', headerShown: false }}
      />
      <Stack.Screen
        name="register"
        options={{ title: 'Create Account', headerShown: false }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ title: 'Reset Password' }}
      />
    </Stack>
  );
}
```

### app/(auth)/login.tsx
```tsx
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@components/navigation/ThemedView';
import { ThemedText } from '@components/Themed';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({ form: 'Invalid email or password' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ThemedView style={styles.content}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to continue
            </ThemedText>
          </ThemedView>

          {errors.form && (
            <ThemedView style={styles.errorBanner}>
              <ThemedText style={styles.errorText}>{errors.form}</ThemedText>
            </ThemedView>
          )}

          <ThemedView style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <ThemedText style={styles.forgotPassword}>
                Forgot password?
              </ThemedText>
            </Link>

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              variant="primary"
            />
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ThemedText>Don't have an account? </ThemedText>
            <Link href="/(auth)/register" asChild>
              <ThemedText style={styles.link}>Create one</ThemedText>
            </Link>
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
  },
  form: {
    gap: 16,
  },
  forgotPassword: {
    color: '#3b82f6',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  link: {
    color: '#3b82f6',
  },
});
```

## Context Providers

### context/AuthContext.tsx
```tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const { user: userData, token } = await response.json();

      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData)),
      ]);

      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const { user: userData, token } = await response.json();

      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData)),
      ]);

      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### context/NotificationContext.tsx
```tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  enabled: boolean;
  toggleNotifications: (enabled: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [enabled, setEnabled] = useState(false);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        setEnabled(true);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const toggleNotifications = async (enable: boolean) => {
    if (enable) {
      const token = await registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        setEnabled(true);
      }
    } else {
      setEnabled(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        enabled,
        toggleNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}
```

## UI Components

### components/ui/Button.tsx
```tsx
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#3b82f6' : '#fff'} />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#3b82f6',
  },
  secondary: {
    backgroundColor: '#8b5cf6',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#3b82f6',
  },
  dangerText: {
    color: '#fff',
  },
  ghostText: {
    color: '#3b82f6',
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
});
```

### components/ui/Input.tsx
```tsx
import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import Colors from '@constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecure = () => setIsSecure(!isSecure);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderColor: error ? '#ef4444' : colors.border,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={colors.tabIconDefault} />
        )}
        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={colors.tabIconDefault}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecure}>
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.tabIconDefault}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={colors.tabIconDefault} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.tabIconDefault }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
});
```

### components/ui/Card.tsx
```tsx
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import Colors from '@constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
}

export function Card({ children, style, pressable, onPress }: CardProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
    style,
  ];

  if (pressable) {
    return (
      <Pressable
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
```

## Constants

### constants/Colors.ts
```typescript
const tintColorLight = '#3b82f6';
const tintColorDark = '#60a5fa';

export default {
  light: {
    text: '#1f2937',
    background: '#ffffff',
    card: '#ffffff',
    border: '#e5e7eb',
    tint: tintColorLight,
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f9fafb',
    background: '#111827',
    card: '#1f2937',
    border: '#374151',
    tint: tintColorDark,
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
  },
};
```

## Testing

### __tests__/components/Button.test.tsx
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Press me" onPress={() => {}} />
    );
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Press me" onPress={onPress} />
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Press me" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

## CLAUDE.md Integration

```markdown
# Expo Tabs Application

## Overview
This is a production-ready Expo application using file-based routing with Expo Router and bottom tab navigation.

## Key Technologies
- **Expo SDK 51**: Latest Expo features and APIs
- **Expo Router**: File-based navigation with typed routes
- **TypeScript**: Full type safety
- **Expo SecureStore**: Secure credential storage
- **Expo Notifications**: Push notification support
- **Zustand**: Lightweight state management

## Project Structure
- `app/` - Expo Router pages (file-based routing)
- `app/(tabs)/` - Tab navigator screens
- `app/(auth)/` - Authentication screens
- `components/` - Reusable UI components
- `context/` - React Context providers
- `hooks/` - Custom React hooks
- `services/` - API and external services
- `constants/` - App constants and themes

## Navigation
Uses Expo Router with groups:
- `(tabs)` - Bottom tab navigation (Home, Explore, Profile, Settings)
- `(auth)` - Authentication flows (Login, Register, Forgot Password)

## Commands
- `npx expo start` - Start development server
- `npx expo run:ios` - Run on iOS simulator
- `npx expo run:android` - Run on Android emulator
- `eas build` - Build for production
- `npm test` - Run tests

## Environment Variables
Prefix with `EXPO_PUBLIC_` for client access:
- `EXPO_PUBLIC_API_URL` - API base URL
- `EXPO_PUBLIC_AUTH_CLIENT_ID` - Auth client ID

## Common Patterns

### Protected Routes
Check auth in layout:
```tsx
const { isAuthenticated } = useAuth();
if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
```

### Deep Linking
Configured in app.json with scheme: `expotabs`
URL pattern: `expotabs://path/to/screen`

## AI Assistance Guidelines
- Use Expo Router for all navigation
- Use SecureStore for sensitive data
- Use Haptics for touch feedback
- Test on both iOS and Android
- Follow Expo SDK 51 conventions
```

## AI Suggestions

1. **Add biometric authentication** - Implement Face ID/Touch ID using expo-local-authentication
2. **Implement offline support** - Cache data with AsyncStorage and sync when online
3. **Add app shortcuts** - Implement iOS Siri Shortcuts and Android App Shortcuts
4. **Set up deep linking analytics** - Track deep link engagement with attribution
5. **Add skeleton loaders** - Implement shimmer placeholders for loading states
6. **Implement pull-to-refresh** - Add RefreshControl to all scrollable screens
7. **Add error boundaries** - Wrap screens with error boundaries and crash reporting
8. **Set up A/B testing** - Implement feature flags with remote config
9. **Add accessibility features** - Implement VoiceOver/TalkBack support
10. **Implement app review prompts** - Use StoreReview API at optimal moments
