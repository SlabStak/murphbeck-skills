# Flutter Application Template

## Overview
Production-ready Flutter application with clean architecture, Riverpod state management, GoRouter navigation, and Material 3 design. Supports iOS, Android, Web, and Desktop platforms from a single codebase.

## Quick Start

```bash
# Create new Flutter project
flutter create my_app --org com.yourcompany --platforms=ios,android,web

# Or use this template
git clone https://github.com/template-builder/flutter-app my_app
cd my_app

# Get dependencies
flutter pub get

# Run on connected device
flutter run

# Run on specific platform
flutter run -d chrome   # Web
flutter run -d macos    # macOS
flutter run -d windows  # Windows

# Build for production
flutter build apk --release
flutter build ios --release
flutter build web --release
```

## Project Structure

```
flutter_app/
├── android/
├── ios/
├── linux/
├── macos/
├── web/
├── windows/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_constants.dart
│   │   │   ├── api_constants.dart
│   │   │   └── storage_keys.dart
│   │   ├── errors/
│   │   │   ├── exceptions.dart
│   │   │   └── failures.dart
│   │   ├── network/
│   │   │   ├── api_client.dart
│   │   │   ├── api_interceptors.dart
│   │   │   └── network_info.dart
│   │   ├── storage/
│   │   │   ├── secure_storage.dart
│   │   │   └── local_storage.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── colors.dart
│   │   │   └── typography.dart
│   │   └── utils/
│   │       ├── extensions.dart
│   │       ├── validators.dart
│   │       └── formatters.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── datasources/
│   │   │   │   │   ├── auth_local_datasource.dart
│   │   │   │   │   └── auth_remote_datasource.dart
│   │   │   │   ├── models/
│   │   │   │   │   ├── user_model.dart
│   │   │   │   │   └── token_model.dart
│   │   │   │   └── repositories/
│   │   │   │       └── auth_repository_impl.dart
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── auth_repository.dart
│   │   │   │   └── usecases/
│   │   │   │       ├── login_usecase.dart
│   │   │   │       ├── register_usecase.dart
│   │   │   │       └── logout_usecase.dart
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── auth_provider.dart
│   │   │       ├── screens/
│   │   │       │   ├── login_screen.dart
│   │   │       │   ├── register_screen.dart
│   │   │       │   └── forgot_password_screen.dart
│   │   │       └── widgets/
│   │   │           ├── login_form.dart
│   │   │           └── social_login_buttons.dart
│   │   ├── home/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       ├── screens/
│   │   │       │   └── home_screen.dart
│   │   │       └── widgets/
│   │   ├── profile/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   └── settings/
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   ├── routing/
│   │   ├── app_router.dart
│   │   ├── route_names.dart
│   │   └── route_guards.dart
│   └── shared/
│       ├── providers/
│       │   ├── shared_providers.dart
│       │   └── theme_provider.dart
│       └── widgets/
│           ├── app_button.dart
│           ├── app_text_field.dart
│           ├── app_card.dart
│           ├── loading_overlay.dart
│           └── error_widget.dart
├── test/
│   ├── unit/
│   │   └── auth/
│   │       └── auth_repository_test.dart
│   ├── widget/
│   │   └── login_screen_test.dart
│   └── integration/
│       └── app_test.dart
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
├── .env.example
├── analysis_options.yaml
├── pubspec.yaml
└── CLAUDE.md
```

## Configuration Files

### pubspec.yaml
```yaml
name: flutter_app
description: A production-ready Flutter application
version: 1.0.0+1
publish_to: 'none'

environment:
  sdk: '>=3.2.0 <4.0.0'
  flutter: '>=3.16.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.0
  riverpod_annotation: ^2.3.0

  # Navigation
  go_router: ^13.0.0

  # Networking
  dio: ^5.4.0
  retrofit: ^4.1.0
  connectivity_plus: ^5.0.0

  # Storage
  shared_preferences: ^2.2.0
  flutter_secure_storage: ^9.0.0
  hive: ^2.2.0
  hive_flutter: ^1.1.0

  # UI
  flutter_svg: ^2.0.0
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  flutter_animate: ^4.3.0

  # Forms
  flutter_form_builder: ^9.1.0
  form_builder_validators: ^9.1.0

  # Utilities
  intl: ^0.18.0
  uuid: ^4.2.0
  equatable: ^2.0.0
  dartz: ^0.10.0
  freezed_annotation: ^2.4.0
  json_annotation: ^4.8.0
  logger: ^2.0.0
  url_launcher: ^6.2.0

  # Firebase (optional)
  # firebase_core: ^2.24.0
  # firebase_auth: ^4.16.0
  # firebase_messaging: ^14.7.0
  # firebase_analytics: ^10.8.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.0
  freezed: ^2.4.0
  json_serializable: ^6.7.0
  riverpod_generator: ^2.3.0
  retrofit_generator: ^8.1.0
  mockito: ^5.4.0
  bloc_test: ^9.1.0
  integration_test:
    sdk: flutter

flutter:
  uses-material-design: true

  assets:
    - assets/images/
    - assets/icons/

  fonts:
    - family: Inter
      fonts:
        - asset: assets/fonts/Inter-Regular.ttf
        - asset: assets/fonts/Inter-Medium.ttf
          weight: 500
        - asset: assets/fonts/Inter-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Inter-Bold.ttf
          weight: 700
```

### analysis_options.yaml
```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  errors:
    invalid_annotation_target: ignore
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"

linter:
  rules:
    - always_declare_return_types
    - avoid_empty_else
    - avoid_print
    - avoid_relative_lib_imports
    - avoid_returning_null_for_void
    - avoid_unnecessary_containers
    - avoid_web_libraries_in_flutter
    - cancel_subscriptions
    - close_sinks
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_final_fields
    - prefer_final_locals
    - prefer_single_quotes
    - require_trailing_commas
    - sort_child_properties_last
    - sort_constructors_first
    - use_key_in_widget_constructors
```

### .env.example
```bash
# API Configuration
API_BASE_URL=https://api.example.com
API_KEY=your-api-key

# Environment
ENV=development

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_CRASH_REPORTING=false

# Firebase (optional)
# FIREBASE_PROJECT_ID=your-project-id
```

## Main Entry Point

### lib/main.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app.dart';
import 'core/storage/local_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Hive
  await Hive.initFlutter();

  // Initialize local storage
  await LocalStorage.init();

  // Initialize Firebase (optional)
  // await Firebase.initializeApp();

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}
```

### lib/app.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/theme/app_theme.dart';
import 'routing/app_router.dart';
import 'shared/providers/theme_provider.dart';

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Flutter App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
```

## Theme Configuration

### lib/core/theme/app_theme.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'colors.dart';
import 'typography.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: AppColors.backgroundLight,
      textTheme: AppTypography.textTheme,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: AppColors.backgroundDark,
      textTheme: AppTypography.textTheme,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        color: AppColors.surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}
```

### lib/core/theme/colors.dart
```dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary Colors
  static const Color primary = Color(0xFF3B82F6);
  static const Color primaryLight = Color(0xFF60A5FA);
  static const Color primaryDark = Color(0xFF2563EB);

  // Secondary Colors
  static const Color secondary = Color(0xFF8B5CF6);
  static const Color secondaryLight = Color(0xFFA78BFA);
  static const Color secondaryDark = Color(0xFF7C3AED);

  // Neutral Colors
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF111827);
  static const Color surfaceLight = Color(0xFFF9FAFB);
  static const Color surfaceDark = Color(0xFF1F2937);
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color borderDark = Color(0xFF374151);

  // Text Colors
  static const Color textPrimaryLight = Color(0xFF1F2937);
  static const Color textSecondaryLight = Color(0xFF6B7280);
  static const Color textPrimaryDark = Color(0xFFF9FAFB);
  static const Color textSecondaryDark = Color(0xFF9CA3AF);

  // Semantic Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
}
```

## Router Configuration

### lib/routing/app_router.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/auth/presentation/screens/forgot_password_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';
import '../features/settings/presentation/screens/settings_screen.dart';
import '../shared/widgets/scaffold_with_nav_bar.dart';
import 'route_names.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: RouteNames.home,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) {
        return RouteNames.login;
      }

      if (isAuthenticated && isAuthRoute) {
        return RouteNames.home;
      }

      return null;
    },
    routes: [
      // Auth Routes
      GoRoute(
        path: RouteNames.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteNames.register,
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: RouteNames.forgotPassword,
        name: 'forgotPassword',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // Main App Routes with Bottom Navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          // Home Branch
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.home,
                name: 'home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          // Profile Branch
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.profile,
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
          // Settings Branch
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.settings,
                name: 'settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.matchedLocation}'),
      ),
    ),
  );
});
```

### lib/routing/route_names.dart
```dart
class RouteNames {
  RouteNames._();

  // Auth Routes
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String forgotPassword = '/auth/forgot-password';

  // Main Routes
  static const String home = '/';
  static const String profile = '/profile';
  static const String settings = '/settings';

  // Detail Routes
  static const String itemDetail = '/item/:id';
}
```

## Auth Feature

### lib/features/auth/domain/entities/user.dart
```dart
import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String email;
  final String name;
  final String? avatar;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.email,
    required this.name,
    this.avatar,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, email, name, avatar, createdAt];
}
```

### lib/features/auth/data/models/user_model.dart
```dart
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain/entities/user.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class UserModel with _$UserModel {
  const UserModel._();

  const factory UserModel({
    required String id,
    required String email,
    required String name,
    String? avatar,
    @JsonKey(name: 'created_at') required DateTime createdAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  User toEntity() => User(
        id: id,
        email: email,
        name: name,
        avatar: avatar,
        createdAt: createdAt,
      );
}
```

### lib/features/auth/presentation/providers/auth_provider.dart
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../../../core/storage/secure_storage.dart';

part 'auth_provider.freezed.dart';

@freezed
class AuthState with _$AuthState {
  const factory AuthState({
    User? user,
    @Default(false) bool isAuthenticated,
    @Default(false) bool isLoading,
    String? error,
  }) = _AuthState;
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    secureStorage: ref.read(secureStorageProvider),
  );
});

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<AuthState>>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

class AuthNotifier extends StateNotifier<AsyncValue<AuthState>> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AsyncValue.loading()) {
    _init();
  }

  Future<void> _init() async {
    state = const AsyncValue.loading();
    try {
      final user = await _repository.getCurrentUser();
      state = AsyncValue.data(AuthState(
        user: user,
        isAuthenticated: user != null,
      ));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login(String email, String password) async {
    state = AsyncValue.data(state.value!.copyWith(isLoading: true, error: null));
    try {
      final user = await _repository.login(email, password);
      state = AsyncValue.data(AuthState(
        user: user,
        isAuthenticated: true,
      ));
    } catch (e) {
      state = AsyncValue.data(state.value!.copyWith(
        isLoading: false,
        error: e.toString(),
      ));
    }
  }

  Future<void> register(String name, String email, String password) async {
    state = AsyncValue.data(state.value!.copyWith(isLoading: true, error: null));
    try {
      final user = await _repository.register(name, email, password);
      state = AsyncValue.data(AuthState(
        user: user,
        isAuthenticated: true,
      ));
    } catch (e) {
      state = AsyncValue.data(state.value!.copyWith(
        isLoading: false,
        error: e.toString(),
      ));
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AsyncValue.data(AuthState());
  }
}
```

### lib/features/auth/presentation/screens/login_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/colors.dart';
import '../../../../routing/route_names.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      await ref.read(authStateProvider.notifier).login(
            _emailController.text.trim(),
            _passwordController.text,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isLoading = authState.valueOrNull?.isLoading ?? false;
    final error = authState.valueOrNull?.error;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),

                // Header
                Text(
                  'Welcome Back',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to continue',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                ),
                const SizedBox(height: 40),

                // Error Banner
                if (error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      error,
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Email Field
                AppTextField(
                  controller: _emailController,
                  label: 'Email',
                  hint: 'you@example.com',
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Email is required';
                    }
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                        .hasMatch(value)) {
                      return 'Enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password Field
                AppTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: '••••••••',
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _handleLogin(),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Password is required';
                    }
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),

                // Forgot Password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push(RouteNames.forgotPassword),
                    child: const Text('Forgot password?'),
                  ),
                ),
                const SizedBox(height: 24),

                // Login Button
                AppButton(
                  text: 'Sign In',
                  onPressed: _handleLogin,
                  isLoading: isLoading,
                ),
                const SizedBox(height: 24),

                // Register Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    TextButton(
                      onPressed: () => context.push(RouteNames.register),
                      child: const Text('Create one'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

## Shared Widgets

### lib/shared/widgets/app_button.dart
```dart
import 'package:flutter/material.dart';

import '../../core/theme/colors.dart';

enum AppButtonVariant { primary, secondary, outline, text }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool isLoading;
  final bool isFullWidth;
  final IconData? icon;
  final double? width;
  final double height;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.isLoading = false,
    this.isFullWidth = true,
    this.icon,
    this.width,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    final button = _buildButton(context);

    if (isFullWidth) {
      return SizedBox(
        width: double.infinity,
        height: height,
        child: button,
      );
    }

    return SizedBox(
      width: width,
      height: height,
      child: button,
    );
  }

  Widget _buildButton(BuildContext context) {
    switch (variant) {
      case AppButtonVariant.primary:
        return ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
          ),
          child: _buildChild(),
        );
      case AppButtonVariant.secondary:
        return ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.secondary,
            foregroundColor: Colors.white,
          ),
          child: _buildChild(),
        );
      case AppButtonVariant.outline:
        return OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          child: _buildChild(),
        );
      case AppButtonVariant.text:
        return TextButton(
          onPressed: isLoading ? null : onPressed,
          child: _buildChild(),
        );
    }
  }

  Widget _buildChild() {
    if (isLoading) {
      return const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(text),
        ],
      );
    }

    return Text(text);
  }
}
```

### lib/shared/widgets/app_text_field.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTextField extends StatefulWidget {
  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final String? errorText;
  final bool obscureText;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final List<TextInputFormatter>? inputFormatters;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final void Function(String)? onFieldSubmitted;
  final Widget? prefix;
  final Widget? suffix;
  final int maxLines;
  final bool enabled;
  final bool autofocus;

  const AppTextField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.errorText,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.inputFormatters,
    this.validator,
    this.onChanged,
    this.onFieldSubmitted,
    this.prefix,
    this.suffix,
    this.maxLines = 1,
    this.enabled = true,
    this.autofocus = false,
  });

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: widget.controller,
          obscureText: _obscureText,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          inputFormatters: widget.inputFormatters,
          validator: widget.validator,
          onChanged: widget.onChanged,
          onFieldSubmitted: widget.onFieldSubmitted,
          maxLines: widget.obscureText ? 1 : widget.maxLines,
          enabled: widget.enabled,
          autofocus: widget.autofocus,
          decoration: InputDecoration(
            hintText: widget.hint,
            errorText: widget.errorText,
            prefixIcon: widget.prefix,
            suffixIcon: widget.obscureText
                ? IconButton(
                    icon: Icon(
                      _obscureText ? Icons.visibility_off : Icons.visibility,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureText = !_obscureText;
                      });
                    },
                  )
                : widget.suffix,
          ),
        ),
      ],
    );
  }
}
```

### lib/shared/widgets/scaffold_with_nav_bar.dart
```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ScaffoldWithNavBar extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const ScaffoldWithNavBar({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
```

## Network Layer

### lib/core/network/api_client.dart
```dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  dio.interceptors.addAll([
    AuthInterceptor(ref.read(secureStorageProvider)),
    LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ),
  ]);

  return dio;
});

class AuthInterceptor extends Interceptor {
  final SecureStorage _secureStorage;

  AuthInterceptor(this._secureStorage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Handle token expiration
      _secureStorage.deleteToken();
    }
    handler.next(err);
  }
}
```

## Storage

### lib/core/storage/secure_storage.dart
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage();
});

class SecureStorage {
  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> setToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<void> setRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
```

## Testing

### test/widget/login_screen_test.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_app/features/auth/presentation/screens/login_screen.dart';
import 'package:flutter_app/features/auth/presentation/providers/auth_provider.dart';

void main() {
  group('LoginScreen', () {
    testWidgets('renders login form', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );

      expect(find.text('Welcome Back'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
    });

    testWidgets('shows validation errors on empty submit', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LoginScreen(),
          ),
        ),
      );

      await tester.tap(find.text('Sign In'));
      await tester.pump();

      expect(find.text('Email is required'), findsOneWidget);
      expect(find.text('Password is required'), findsOneWidget);
    });

    testWidgets('navigates to register screen', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: const LoginScreen(),
            routes: {
              '/auth/register': (_) => const Scaffold(body: Text('Register')),
            },
          ),
        ),
      );

      await tester.tap(find.text('Create one'));
      await tester.pumpAndSettle();

      expect(find.text('Register'), findsOneWidget);
    });
  });
}
```

## CLAUDE.md Integration

```markdown
# Flutter Application

## Overview
This is a production-ready Flutter application using clean architecture, Riverpod state management, and GoRouter navigation.

## Key Technologies
- **Flutter 3.16+**: Latest stable version
- **Riverpod**: State management with code generation
- **GoRouter**: Declarative routing with deep linking
- **Dio**: HTTP client with interceptors
- **Freezed**: Immutable data classes
- **Hive**: Local database storage

## Project Structure (Clean Architecture)
- `lib/core/` - Core utilities, theme, network, storage
- `lib/features/` - Feature modules with data/domain/presentation layers
- `lib/routing/` - Navigation configuration
- `lib/shared/` - Shared widgets and providers

## Commands
- `flutter pub get` - Get dependencies
- `flutter run` - Run on connected device
- `flutter build apk --release` - Build Android APK
- `flutter build ios --release` - Build iOS
- `flutter test` - Run tests
- `dart run build_runner build` - Generate code

## Architecture Layers
- **Domain**: Entities, Repositories (abstract), Use cases
- **Data**: Models, Repositories (implementation), Data sources
- **Presentation**: Providers, Screens, Widgets

## Code Generation
Run after modifying freezed/json_serializable classes:
```bash
dart run build_runner build --delete-conflicting-outputs
```

## AI Assistance Guidelines
- Follow clean architecture patterns
- Use Riverpod for state management
- Generate code for models with freezed
- Use GoRouter for navigation
- Keep widgets small and focused
```

## AI Suggestions

1. **Add offline-first architecture** - Implement Hive for local caching with network sync
2. **Set up Firebase integration** - Add Authentication, Crashlytics, and Analytics
3. **Implement push notifications** - Use firebase_messaging for cross-platform notifications
4. **Add internationalization** - Use flutter_localizations with ARB files
5. **Implement dark/light theme** - Add system theme detection and manual toggle
6. **Add biometric authentication** - Use local_auth for fingerprint/face authentication
7. **Set up CI/CD with Codemagic** - Automate builds and releases
8. **Add performance monitoring** - Implement Firebase Performance or custom metrics
9. **Implement responsive layouts** - Use LayoutBuilder for tablet/desktop support
10. **Add accessibility features** - Implement Semantics widgets for screen readers
