# Angular Application Template

## Overview
Enterprise-grade Angular application with TypeScript, standalone components, signals for reactivity, NgRx for state management, reactive forms, HttpClient with interceptors, and comprehensive testing with Jasmine and Cypress.

## Quick Start
```bash
# Create new project
ng new my-angular-app --standalone --routing --style=scss

# Install dependencies
cd my-angular-app
npm install @ngrx/store @ngrx/effects @ngrx/entity @ngrx/store-devtools
npm install @angular/cdk
npm install date-fns uuid
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/uuid

# Initialize Tailwind
npx tailwindcss init

# Development
ng serve

# Build
ng build
```

## Project Structure
```
my-angular-app/
├── angular.json
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── storage.service.ts
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       └── api.model.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── button/
│   │   │   │   │   └── button.component.ts
│   │   │   │   ├── input/
│   │   │   │   │   └── input.component.ts
│   │   │   │   ├── modal/
│   │   │   │   │   └── modal.component.ts
│   │   │   │   └── toast/
│   │   │   │       └── toast.component.ts
│   │   │   ├── directives/
│   │   │   │   └── click-outside.directive.ts
│   │   │   ├── pipes/
│   │   │   │   ├── date-format.pipe.ts
│   │   │   │   └── truncate.pipe.ts
│   │   │   └── validators/
│   │   │       └── custom.validators.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── login.component.ts
│   │   │   │   ├── register/
│   │   │   │   │   └── register.component.ts
│   │   │   │   └── store/
│   │   │   │       ├── auth.actions.ts
│   │   │   │       ├── auth.reducer.ts
│   │   │   │       ├── auth.effects.ts
│   │   │   │       └── auth.selectors.ts
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard.component.ts
│   │   │   ├── profile/
│   │   │   │   └── profile.component.ts
│   │   │   └── settings/
│   │   │       └── settings.component.ts
│   │   ├── layouts/
│   │   │   ├── main-layout/
│   │   │   │   └── main-layout.component.ts
│   │   │   ├── header/
│   │   │   │   └── header.component.ts
│   │   │   └── sidebar/
│   │   │       └── sidebar.component.ts
│   │   └── store/
│   │       ├── app.state.ts
│   │       └── app.reducer.ts
│   ├── assets/
│   │   └── images/
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
├── cypress/
│   ├── e2e/
│   │   └── auth.cy.ts
│   └── support/
│       └── commands.ts
└── package.json
```

## App Configuration
```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { appReducer } from './store/app.reducer';
import { AuthEffects } from './features/auth/store/auth.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
    provideStore(appReducer),
    provideEffects([AuthEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
    }),
  ],
};

// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
```

## Routes Configuration
```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
```

## Core Services
```typescript
// src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}

// src/app/core/services/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);

  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(this.storage.get('token'));

  user = this.userSignal.asReadonly();
  token = this.tokenSignal.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.setAuth(response);
      })
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap((response) => {
        this.setAuth(response);
      })
    );
  }

  logout(): void {
    this.api.post('/auth/logout', {}).subscribe({
      complete: () => this.clearAuth(),
      error: () => this.clearAuth(),
    });
  }

  fetchUser(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => {
        this.userSignal.set(user);
      })
    );
  }

  private setAuth(response: AuthResponse): void {
    this.storage.set('token', response.accessToken);
    this.storage.set('refreshToken', response.refreshToken);
    this.tokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);
  }

  private clearAuth(): void {
    this.storage.remove('token');
    this.storage.remove('refreshToken');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }
}

// src/app/core/services/storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
```

## HTTP Interceptors
```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const token = storage.get('token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};

// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storage = inject(StorageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        storage.remove('token');
        storage.remove('refreshToken');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
```

## Route Guards
```typescript
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};

// src/app/core/guards/guest.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
```

## NgRx Store
```typescript
// src/app/features/auth/store/auth.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User, LoginCredentials, RegisterData } from '../../../core/models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ credentials: LoginCredentials }>(),
    'Login Success': props<{ user: User; token: string }>(),
    'Login Failure': props<{ error: string }>(),

    'Register': props<{ data: RegisterData }>(),
    'Register Success': props<{ user: User; token: string }>(),
    'Register Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Logout Success': emptyProps(),

    'Load User': emptyProps(),
    'Load User Success': props<{ user: User }>(),
    'Load User Failure': props<{ error: string }>(),
  },
});

// src/app/features/auth/store/auth.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { User } from '../../../core/models/user.model';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, AuthActions.register, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, AuthActions.registerSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isLoading: false,
  })),
  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
  on(AuthActions.logoutSuccess, () => ({
    ...initialState,
    token: null,
  })),
  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
  }))
);

// src/app/features/auth/store/auth.effects.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { AuthActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((response) =>
            AuthActions.loginSuccess({
              user: response.user,
              token: response.accessToken,
            })
          ),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.error?.message || 'Login failed' }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => this.router.navigate(['/dashboard']))
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ data }) =>
        this.authService.register(data).pipe(
          map((response) =>
            AuthActions.registerSuccess({
              user: response.user,
              token: response.accessToken,
            })
          ),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: error.error?.message || 'Registration failed' }))
          )
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => this.authService.logout()),
      map(() => AuthActions.logoutSuccess())
    )
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      exhaustMap(() =>
        this.authService.fetchUser().pipe(
          map((user) => AuthActions.loadUserSuccess({ user })),
          catchError((error) =>
            of(AuthActions.loadUserFailure({ error: error.message }))
          )
        )
      )
    )
  );
}

// src/app/features/auth/store/auth.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(selectAuthState, (state) => state.user);
export const selectToken = createSelector(selectAuthState, (state) => state.token);
export const selectIsLoading = createSelector(selectAuthState, (state) => state.isLoading);
export const selectError = createSelector(selectAuthState, (state) => state.error);
export const selectIsAuthenticated = createSelector(
  selectUser,
  selectToken,
  (user, token) => !!user && !!token
);
```

## Shared Components
```typescript
// src/app/shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="onClick.emit($event)"
    >
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() loading = false;
  @Input() disabled = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const base =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants: Record<string, string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border-2 border-gray-300 hover:bg-gray-100 focus:ring-gray-500',
      ghost: 'hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    };

    return `${base} ${variants[this.variant]} ${sizes[this.size]}`;
  }
}

// src/app/shared/components/input/input.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [class]="inputClasses"
        [(ngModel)]="value"
        (ngModelChange)="onChange($event)"
        (blur)="onTouched()"
      />
      @if (error) {
        <p class="mt-1 text-sm text-red-500">{{ error }}</p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = `input-${Math.random().toString(36).slice(2)}`;
  @Input() type = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;

  value = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  get inputClasses(): string {
    const base =
      'w-full h-10 px-4 rounded-lg border transition-colors bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

    return this.error
      ? `${base} border-red-500 focus:ring-red-500`
      : `${base} border-gray-300 dark:border-gray-600 focus:ring-blue-500`;
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

## Feature Components
```typescript
// src/app/features/auth/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { AuthActions } from '../store/auth.actions';
import { selectIsLoading, selectError } from '../store/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    InputComponent,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        @if (error$ | async; as error) {
          <div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {{ error }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <app-input
            formControlName="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            [error]="getError('email')"
          />

          <app-input
            formControlName="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            [error]="getError('password')"
          />

          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2">
              <input type="checkbox" class="rounded border-gray-300" />
              <span class="text-sm">Remember me</span>
            </label>
            <a routerLink="/forgot-password" class="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <app-button
            type="submit"
            class="w-full"
            [loading]="isLoading$ | async"
            [disabled]="form.invalid"
          >
            Sign in
          </app-button>
        </form>

        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <a routerLink="/register" class="text-blue-600 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  isLoading$ = this.store.select(selectIsLoading);
  error$ = this.store.select(selectError);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  getError(field: string): string {
    const control = this.form.get(field);
    if (control?.touched && control.errors) {
      if (control.errors['required']) return `${field} is required`;
      if (control.errors['email']) return 'Invalid email address';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.store.dispatch(
        AuthActions.login({ credentials: this.form.getRawValue() })
      );
    }
  }
}

// src/app/features/dashboard/dashboard.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectUser } from '../auth/store/auth.selectors';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {{ (user$ | async)?.name }}!
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Here's what's happening with your projects.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (stat of stats; track stat.label) {
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
            </div>
          }
        </div>
      </div>
    </app-main-layout>
  `,
})
export class DashboardComponent {
  private store = inject(Store);
  user$ = this.store.select(selectUser);

  stats = [
    { label: 'Total Projects', value: '12' },
    { label: 'Active Tasks', value: '24' },
    { label: 'Completed', value: '89' },
    { label: 'Team Members', value: '6' },
  ];
}
```

## Testing
```typescript
// src/app/features/auth/login/login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { LoginComponent } from './login.component';
import { AuthActions } from '../store/auth.actions';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: MockStore;

  const initialState = {
    auth: {
      user: null,
      token: null,
      isLoading: false,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should validate email field', () => {
    const email = component.form.controls.email;
    email.setValue('invalid');
    expect(email.errors?.['email']).toBeTruthy();

    email.setValue('test@example.com');
    expect(email.errors).toBeNull();
  });

  it('should dispatch login action on valid submit', () => {
    const dispatchSpy = spyOn(store, 'dispatch');

    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
    });
    component.onSubmit();

    expect(dispatchSpy).toHaveBeenCalledWith(
      AuthActions.login({
        credentials: {
          email: 'test@example.com',
          password: 'password123',
        },
      })
    );
  });
});

// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('displays login form', () => {
    cy.contains('Welcome back');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('shows validation errors', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('email is required');
  });

  it('logs in successfully', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh',
      },
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
  });
});
```

## CLAUDE.md Integration
```markdown
# Angular Application

## Project Type
Angular 18+ application with standalone components, signals, NgRx, and TypeScript.

## Key Directories
- `src/app/core/` - Services, guards, interceptors, models
- `src/app/shared/` - Reusable components, directives, pipes
- `src/app/features/` - Feature modules with components and store
- `src/app/layouts/` - Layout components

## Commands
- `ng serve` - Start development server
- `ng build` - Build for production
- `ng test` - Run unit tests
- `ng e2e` - Run Cypress E2E tests
- `ng generate component` - Generate component

## Component Patterns
- All components are standalone
- Use signals for local reactive state
- Inject services with `inject()` function
- Use `@if` and `@for` control flow

## State Management
- NgRx Store for global state
- Actions, reducers, effects, selectors pattern
- Use `createActionGroup` for action definitions
- Signals for component-level state

## Forms
- Reactive forms with FormBuilder
- Typed forms with `nonNullable`
- Custom validators in shared/validators
```

## AI Suggestions

1. **Component library** - Integrate Angular CDK or PrimeNG for accessible components
2. **i18n setup** - Add @angular/localize for internationalization
3. **Server-side rendering** - Add Angular Universal for SSR and SEO
4. **Progressive Web App** - Add @angular/pwa for offline support
5. **State persistence** - Add ngrx-store-persist for automatic state persistence
6. **API caching** - Implement HTTP caching with interceptors
7. **Error tracking** - Integrate Sentry for error monitoring
8. **Component testing** - Add Spectator for better component testing DX
9. **Visual regression** - Add Chromatic or Percy for visual testing
10. **Bundle analysis** - Configure webpack-bundle-analyzer for optimization insights
