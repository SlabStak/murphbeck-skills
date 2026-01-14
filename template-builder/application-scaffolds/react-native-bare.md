# React Native Bare Workflow Template

## Overview
Production-ready React Native application using the bare workflow (without Expo managed). Features full native code access, React Navigation, TypeScript, and native module integration for maximum flexibility and performance.

## Quick Start

```bash
# Create new React Native project
npx react-native@latest init MyApp

# Or use this template
npx react-native@latest init MyApp --template react-native-template-typescript

# Navigate to project
cd MyApp

# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
react-native-bare/
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── java/com/myapp/
│   │   │       │   ├── MainActivity.kt
│   │   │       │   ├── MainApplication.kt
│   │   │       │   └── modules/
│   │   │       │       └── CustomModule.kt
│   │   │       ├── res/
│   │   │       └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── build.gradle
│   ├── gradle.properties
│   └── settings.gradle
├── ios/
│   ├── MyApp/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   ├── LaunchScreen.storyboard
│   │   └── Images.xcassets/
│   ├── MyApp.xcodeproj/
│   ├── MyApp.xcworkspace/
│   └── Podfile
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── AppNavigator.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── index.ts
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── main/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   └── DetailsScreen.tsx
│   │   └── index.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── linking.ts
│   ├── store/
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   ├── userSlice.ts
│   │   └── hooks.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   └── user.ts
│   │   ├── storage/
│   │   │   └── secureStorage.ts
│   │   └── native/
│   │       └── nativeModules.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAppState.ts
│   │   ├── useKeyboard.ts
│   │   └── useDeepLink.ts
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── navigation.ts
│   │   ├── api.ts
│   │   └── env.d.ts
│   └── utils/
│       ├── validation.ts
│       ├── format.ts
│       └── platform.ts
├── __tests__/
│   ├── components/
│   │   └── Button.test.tsx
│   └── screens/
│       └── HomeScreen.test.tsx
├── e2e/
│   ├── firstTest.e2e.js
│   └── jest.config.js
├── .env.example
├── .env
├── app.json
├── babel.config.js
├── index.js
├── jest.config.js
├── metro.config.js
├── package.json
├── react-native.config.js
├── tsconfig.json
└── CLAUDE.md
```

## Configuration Files

### package.json
```json
{
  "name": "MyApp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "detox test --configuration ios.sim.debug",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "clean": "watchman watch-del-all && rm -rf node_modules && rm -rf $TMPDIR/react-* && npm install",
    "clean:android": "cd android && ./gradlew clean && cd ..",
    "clean:ios": "cd ios && rm -rf Pods && pod install && cd ..",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "cd ios && xcodebuild -workspace MyApp.xcworkspace -scheme MyApp -configuration Release"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-community/netinfo": "^11.2.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@reduxjs/toolkit": "^2.0.0",
    "axios": "^1.6.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-config": "^1.5.0",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-keychain": "^8.1.0",
    "react-native-reanimated": "^3.6.0",
    "react-native-safe-area-context": "^4.8.0",
    "react-native-screens": "^3.29.0",
    "react-native-splash-screen": "^3.3.0",
    "react-native-svg": "^14.1.0",
    "react-redux": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "@babel/runtime": "^7.23.0",
    "@react-native/babel-preset": "^0.73.0",
    "@react-native/eslint-config": "^0.73.0",
    "@react-native/metro-config": "^0.73.0",
    "@react-native/typescript-config": "^0.73.0",
    "@testing-library/react-native": "^12.4.0",
    "@types/jest": "^29.5.0",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.7.0",
    "detox": "^20.14.0",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.0",
    "react-test-renderer": "18.2.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### tsconfig.json
```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@navigation/*": ["src/navigation/*"],
      "@services/*": ["src/services/*"],
      "@store/*": ["src/store/*"],
      "@hooks/*": ["src/hooks/*"],
      "@theme/*": ["src/theme/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*", "index.js", "__tests__/**/*"]
}
```

### babel.config.js
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@services': './src/services',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@theme': './src/theme',
          '@types': './src/types',
          '@utils': './src/utils',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
```

### metro.config.js
```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

### react-native.config.js
```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
};
```

### .env.example
```bash
# API Configuration
API_URL=https://api.example.com
API_KEY=your-api-key

# Environment
APP_ENV=development

# Feature Flags
FEATURE_DARK_MODE=true
FEATURE_BIOMETRICS=true

# Analytics
ANALYTICS_KEY=your-analytics-key

# Sentry
SENTRY_DSN=your-sentry-dsn
```

## Entry Point

### index.js
```javascript
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

## App Component

### src/app/App.tsx
```tsx
import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { store } from '@store/index';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppNavigator } from '@navigation/AppNavigator';
import { linking } from '@navigation/linking';

// Ignore specific warnings
LogBox.ignoreLogs(['ViewPropTypes will be removed']);

export default function App() {
  useEffect(() => {
    // Hide splash screen after app is ready
    SplashScreen.hide();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer
        linking={linking}
        theme={{
          dark: isDark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.notification,
          },
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}
```

## Navigation

### src/navigation/AppNavigator.tsx
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '@store/hooks';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { DetailsScreen } from '@screens/main/DetailsScreen';
import type { RootStackParamList } from '@types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Details"
            component={DetailsScreen}
            options={{
              headerShown: true,
              presentation: 'card',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

### src/navigation/AuthNavigator.tsx
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { RegisterScreen } from '@screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '@screens/auth/ForgotPasswordScreen';
import type { AuthStackParamList } from '@types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
}
```

### src/navigation/TabNavigator.tsx
```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/context/ThemeContext';
import { HomeScreen } from '@screens/main/HomeScreen';
import { ProfileScreen } from '@screens/main/ProfileScreen';
import { SettingsScreen } from '@screens/main/SettingsScreen';
import type { TabParamList } from '@types/navigation';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? 'settings' : 'settings-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

### src/navigation/linking.ts
```typescript
import { LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';
import type { RootStackParamList } from '@types/navigation';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        screens: {
          Home: 'home',
          Profile: 'profile',
          Settings: 'settings',
        },
      },
      Details: 'details/:id',
    },
  },
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }
    return null;
  },
  subscribe(listener) {
    // Listen for incoming links from deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    return () => {
      subscription.remove();
    };
  },
};
```

### src/types/navigation.ts
```typescript
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  Details: { id: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

## Redux Store

### src/store/index.ts
```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### src/store/authSlice.ts
```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@services/api/auth';
import { secureStorage } from '@services/storage/secureStorage';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = await secureStorage.getToken();
      if (!token) {
        return { user: null, token: null };
      }

      const user = await authApi.getMe(token);
      return { user, token };
    } catch (error) {
      await secureStorage.removeToken();
      return rejectWithValue('Session expired');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const { user, token } = await authApi.login(credentials);
      await secureStorage.setToken(token);
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const { user, token } = await authApi.register(data);
      await secureStorage.setToken(token);
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await secureStorage.removeToken();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = !!action.payload.token;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
```

### src/store/hooks.ts
```typescript
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## Screens

### src/screens/auth/LoginScreen.tsx
```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/context/ThemeContext';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login, clearError } from '@store/authSlice';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import type { AuthStackParamList } from '@types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

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
    dispatch(login({ email, password }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Sign in to continue
            </Text>
          </View>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorBackground }]}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.form}>
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

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotButton}
            >
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              loading={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Create one
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
```

### src/screens/main/HomeScreen.tsx
```tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useAppSelector } from '@store/hooks';
import { Card } from '@components/ui/Card';

export function HomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Fetch fresh data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            Welcome, {user?.name || 'User'}!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            What would you like to do today?
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {[
              { title: 'Explore', icon: '🔍' },
              { title: 'Messages', icon: '💬' },
              { title: 'Favorites', icon: '❤️' },
              { title: 'Settings', icon: '⚙️' },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('Details', { id: String(index) })}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Activity
          </Text>
          {[1, 2, 3].map((item) => (
            <Card key={item} style={styles.activityCard}>
              <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                Activity {item}
              </Text>
              <Text style={[styles.activityDesc, { color: theme.colors.textSecondary }]}>
                Some description of the activity
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityCard: {
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityDesc: {
    fontSize: 14,
    marginTop: 4,
  },
});
```

## Services

### src/services/api/client.ts
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Config from 'react-native-config';
import { secureStorage } from '@services/storage/secureStorage';

const API_URL = Config.API_URL || 'https://api.example.com';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await secureStorage.removeToken();
          // Navigate to login or dispatch logout action
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### src/services/storage/secureStorage.ts
```typescript
import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'auth_token';
const SERVICE_NAME = 'MyAppSecureStorage';

class SecureStorage {
  async setToken(token: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(TOKEN_KEY, token, {
        service: SERVICE_NAME,
      });
      return true;
    } catch (error) {
      console.error('Error storing token:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_NAME,
      });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  async removeToken(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE_NAME });
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  }

  async hasBiometrics(): Promise<boolean> {
    const biometryType = await Keychain.getSupportedBiometryType();
    return biometryType !== null;
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_NAME,
        authenticationPrompt: {
          title: 'Authenticate',
          subtitle: 'Verify your identity',
          cancel: 'Cancel',
        },
      });
      return !!credentials;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }
}

export const secureStorage = new SecureStorage();
```

## UI Components

### src/components/ui/Button.tsx
```tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.disabled;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.text;
      default:
        return '#ffffff';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return theme.colors.primary;
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: 12, paddingVertical: 8 };
      case 'lg':
        return { paddingHorizontal: 24, paddingVertical: 16 };
      default:
        return { paddingHorizontal: 16, paddingVertical: 12 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
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
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
```

### src/components/ui/Input.tsx
```tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
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
  const { theme } = useTheme();
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecure = () => setIsSecure(!isSecure);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.card,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
        ]}
      >
        {leftIcon && (
          <Icon name={leftIcon} size={20} color={theme.colors.textSecondary} />
        )}
        <TextInput
          style={[styles.input, { color: theme.colors.text }, style]}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecure}>
            <Icon
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Icon name={rightIcon} size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
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
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
});
```

## Theme

### src/theme/index.ts
```typescript
export const lightTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#ffffff',
    card: '#f9fafb',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    errorBackground: '#fef2f2',
    success: '#10b981',
    warning: '#f59e0b',
    notification: '#ef4444',
    disabled: '#d1d5db',
  },
};

export const darkTheme = {
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    error: '#f87171',
    errorBackground: '#450a0a',
    success: '#34d399',
    warning: '#fbbf24',
    notification: '#f87171',
    disabled: '#4b5563',
  },
};

export type Theme = typeof lightTheme;
```

### src/context/ThemeContext.tsx
```tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '@theme/index';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(THEME_KEY, newMode);
  };

  const isDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, mode, setMode, toggleTheme }}>
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

## Native Modules (Android Example)

### android/app/src/main/java/com/myapp/modules/CustomModule.kt
```kotlin
package com.myapp.modules

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class CustomModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CustomModule"

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val result: WritableMap = Arguments.createMap()
            result.putString("model", android.os.Build.MODEL)
            result.putString("manufacturer", android.os.Build.MANUFACTURER)
            result.putString("version", android.os.Build.VERSION.RELEASE)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun vibrate(duration: Int) {
        val vibrator = reactApplicationContext.getSystemService(
            android.content.Context.VIBRATOR_SERVICE
        ) as android.os.Vibrator

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            vibrator.vibrate(
                android.os.VibrationEffect.createOneShot(
                    duration.toLong(),
                    android.os.VibrationEffect.DEFAULT_AMPLITUDE
                )
            )
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration.toLong())
        }
    }
}
```

### src/services/native/nativeModules.ts
```typescript
import { NativeModules, Platform } from 'react-native';

const { CustomModule } = NativeModules;

interface DeviceInfo {
  model: string;
  manufacturer: string;
  version: string;
}

export const nativeModules = {
  async getDeviceInfo(): Promise<DeviceInfo | null> {
    if (Platform.OS === 'android' && CustomModule) {
      try {
        return await CustomModule.getDeviceInfo();
      } catch (error) {
        console.error('Error getting device info:', error);
        return null;
      }
    }
    return null;
  },

  vibrate(duration: number = 100): void {
    if (Platform.OS === 'android' && CustomModule) {
      CustomModule.vibrate(duration);
    }
  },
};
```

## Testing

### __tests__/components/Button.test.tsx
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@components/ui/Button';
import { ThemeProvider } from '@/context/ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Press me" onPress={() => {}} />,
      { wrapper }
    );
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Press me" onPress={onPress} />,
      { wrapper }
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Press me" onPress={onPress} disabled />,
      { wrapper }
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Press me" onPress={() => {}} loading />,
      { wrapper }
    );
    expect(queryByText('Press me')).toBeNull();
  });
});
```

## CLAUDE.md Integration

```markdown
# React Native Bare Workflow Application

## Overview
This is a production-ready React Native application using the bare workflow. Full native code access for maximum flexibility and performance.

## Key Technologies
- **React Native 0.73**: Latest stable version
- **React Navigation 6**: Navigation library
- **Redux Toolkit**: State management
- **TypeScript**: Full type safety
- **react-native-keychain**: Secure storage
- **axios**: HTTP client

## Project Structure
- `src/` - JavaScript/TypeScript source code
- `android/` - Android native code
- `ios/` - iOS native code
- `src/screens/` - Screen components
- `src/navigation/` - Navigation configuration
- `src/store/` - Redux store and slices
- `src/services/` - API and native services
- `src/components/` - Reusable components

## Commands
- `npm start` - Start Metro bundler
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests
- `npm run lint` - Run linter

## Native Module Integration
Custom native modules in:
- Android: `android/app/src/main/java/com/myapp/modules/`
- iOS: `ios/MyApp/`

## Environment Variables
Using react-native-config:
- Create `.env` file from `.env.example`
- Access via `Config.VARIABLE_NAME`

## Common Patterns

### Navigation
Uses React Navigation with typed routes for type-safe navigation.

### State Management
Redux Toolkit with async thunks for API calls.

### Secure Storage
react-native-keychain for sensitive data like tokens.

## AI Assistance Guidelines
- Follow bare workflow patterns
- Use native modules for platform-specific features
- Test on both iOS and Android
- Use TypeScript for all new code
```

## AI Suggestions

1. **Add CodePush integration** - Enable over-the-air updates without app store releases
2. **Implement crash reporting** - Add Sentry or Crashlytics for error tracking
3. **Add performance monitoring** - Implement Flipper or React Native Performance
4. **Set up CI/CD** - Configure Fastlane for automated builds and releases
5. **Add push notifications** - Implement Firebase Cloud Messaging or OneSignal
6. **Implement deep linking** - Configure branch.io or Firebase Dynamic Links
7. **Add biometric authentication** - Implement Face ID/Touch ID with react-native-keychain
8. **Set up analytics** - Add Firebase Analytics or Mixpanel
9. **Implement offline persistence** - Add WatermelonDB or Realm for local database
10. **Add app shortcuts** - Implement iOS Siri Shortcuts and Android App Shortcuts
