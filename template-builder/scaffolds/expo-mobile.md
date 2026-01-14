# Expo Mobile App Scaffold

Complete React Native/Expo mobile app scaffold with navigation, state management, and native features.

## Directory Structure

```
my-app/
├── .claude/
│   ├── agents/
│   │   └── build-validator.md
│   └── settings.json
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── explore.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx
│   ├── +html.tsx
│   ├── +not-found.tsx
│   └── modal.tsx
├── assets/
│   ├── fonts/
│   │   └── SpaceMono-Regular.ttf
│   └── images/
│       ├── icon.png
│       ├── splash.png
│       └── adaptive-icon.png
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ThemedText.tsx
│   ├── Collapsible.tsx
│   ├── ExternalLink.tsx
│   ├── HapticTab.tsx
│   ├── ParallaxScrollView.tsx
│   └── ThemedView.tsx
├── constants/
│   └── Colors.ts
├── hooks/
│   ├── useColorScheme.ts
│   ├── useThemeColor.ts
│   └── useStorageState.ts
├── lib/
│   ├── api.ts
│   ├── storage.ts
│   └── supabase.ts
├── stores/
│   └── auth.ts
├── types/
│   └── index.ts
├── .env.local
├── .gitignore
├── app.json
├── babel.config.js
├── CLAUDE.md
├── eas.json
├── metro.config.js
├── package.json
└── tsconfig.json
```

## Key Files

### CLAUDE.md

```markdown
# Mobile Development Workflow

**Always use `bun`, not `npm`.**

## Commands
bun start              # Start Expo dev server
bun ios                # Run on iOS simulator
bun android            # Run on Android emulator
bun run lint           # Lint code
bun run typecheck      # TypeScript check
bun run test           # Run tests

## Code Style
- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions)
- Use Expo SDK features over bare RN when available
- Handle all platform differences explicitly

## Navigation
- Using Expo Router (file-based routing)
- Tabs in `app/(tabs)/`
- Modals as separate routes

## State Management
- Zustand for global state
- React Query for server state
- AsyncStorage for persistence

## Testing
- Simulator: iOS 17+, Android API 34+
- Always test on both platforms before PR
```

### app/_layout.tsx

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/useColorScheme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
```

### app/(tabs)/_layout.tsx

```tsx
import { Tabs } from 'expo-router'
import { Platform } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import { IconSymbol } from '@/components/ui/IconSymbol'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
```

### stores/auth.ts

```tsx
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type User = {
  id: string
  email: string
  name: string | null
}

type AuthState = {
  user: User | null
  token: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          // Replace with your auth logic
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const { user, token } = await response.json()
          set({ user, token, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signOut: () => {
        set({ user: null, token: null })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
```

### lib/api.ts

```tsx
import { useAuthStore } from '@/stores/auth'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
}

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options
  const token = useAuthStore.getState().token

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}

// React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: key,
    queryFn: () => api<T>(endpoint),
    ...options,
  })
}

export function useApiMutation<T, V>(
  endpoint: string,
  options?: {
    method?: RequestOptions['method']
    onSuccess?: (data: T) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: V) =>
      api<T>(endpoint, {
        method: options?.method || 'POST',
        body: variables,
      }),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
  })
}
```

### constants/Colors.ts

```tsx
const tintColorLight = '#0a7ea4'
const tintColorDark = '#fff'

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E6E8EB',
    card: '#F8F9FA',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2E3234',
    card: '#1C1E1F',
  },
}
```

### components/ui/Button.tsx

```tsx
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  style?: ViewStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const buttonStyles: ViewStyle[] = [
    styles.button,
    variant === 'primary' && { backgroundColor: colors.tint },
    variant === 'secondary' && { backgroundColor: colors.card },
    variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.tint,
    },
    disabled && { opacity: 0.5 },
    style,
  ].filter(Boolean) as ViewStyle[]

  const textStyles: TextStyle[] = [
    styles.text,
    variant === 'primary' && { color: '#fff' },
    variant === 'secondary' && { color: colors.text },
    variant === 'outline' && { color: colors.tint },
  ].filter(Boolean) as TextStyle[]

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyles,
        pressed && { opacity: 0.8 },
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={textStyles}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
})
```

### .claude/settings.json

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bunx prettier --write . || true"
          }
        ]
      }
    ]
  }
}
```

### .claude/agents/build-validator.md

```markdown
---
name: build-validator
description: Validates mobile app builds for iOS and Android
tools:
  - Bash
  - Read
  - Glob
---

# Build Validator Agent

## Role
Ensure mobile app builds successfully on both platforms before deployment.

## Workflow

1. **Typecheck**
   ```bash
   bun run typecheck
   ```

2. **Lint**
   ```bash
   bun run lint
   ```

3. **Test**
   ```bash
   bun run test
   ```

4. **iOS Build Check**
   ```bash
   eas build --platform ios --profile preview --local --no-wait
   ```

5. **Android Build Check**
   ```bash
   eas build --platform android --profile preview --local --no-wait
   ```

## Constraints
- Never skip typecheck
- Report all platform-specific issues
- Check for missing native dependencies
```

### app.json

```json
{
  "expo": {
    "name": "my-app",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.myapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.myapp"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### package.json

```json
{
  "name": "my-app",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@react-navigation/native": "^6.0.2",
    "@tanstack/react-query": "^5.0.0",
    "expo": "~52.0.0",
    "expo-constants": "~17.0.0",
    "expo-font": "~13.0.0",
    "expo-haptics": "~14.0.0",
    "expo-linking": "~7.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0",
    "expo-system-ui": "~4.0.0",
    "expo-web-browser": "~14.0.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.0.0",
    "react-native-web": "~0.19.13",
    "zustand": "^4.5.0",
    "@react-native-async-storage/async-storage": "1.23.1"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/jest": "^29.5.0",
    "@types/react": "~18.3.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "typescript": "~5.3.0"
  },
  "private": true
}
```

### eas.json

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
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
      "@/*": ["./*"]
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

## Setup Commands

```bash
# Create new Expo project
bunx create-expo-app@latest my-app --template tabs

# Navigate to project
cd my-app

# Install additional dependencies
bun add zustand @tanstack/react-query @react-native-async-storage/async-storage

# Create Claude Code structure
mkdir -p .claude/agents

# Initialize EAS
eas init

# Start development
bun start
```

## Features Included

- **Expo Router** - File-based navigation
- **Dark/Light Mode** - Automatic theme switching
- **Zustand** - Global state with persistence
- **React Query** - Server state management
- **Haptic Feedback** - Native feel interactions
- **TypeScript Strict** - Full type safety
- **EAS Build** - Cloud builds for both platforms

## Customization Points

1. **Colors**: Edit `constants/Colors.ts`
2. **Navigation**: Add/remove tabs in `app/(tabs)/`
3. **API URL**: Set `EXPO_PUBLIC_API_URL` in `.env.local`
4. **App Config**: Edit `app.json` for bundle ID, icons, etc.
5. **Auth**: Replace auth logic in `stores/auth.ts`
