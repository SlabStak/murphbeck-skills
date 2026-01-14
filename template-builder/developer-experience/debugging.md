# Debugging Template

## Overview
Comprehensive debugging setup with VS Code configurations, browser DevTools, Node.js debugging, and logging best practices.

## Quick Start
```bash
# VS Code debugging
code --install-extension ms-vscode.js-debug

# Node.js inspector
node --inspect app.js

# Chrome DevTools
chrome://inspect
```

## VS Code Debug Configurations

### .vscode/launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    // Node.js debugging
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Node.js",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "skipFiles": ["<node_internals>/**", "node_modules/**"],
      "console": "integratedTerminal",
      "sourceMaps": true
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current File",
      "program": "${file}",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Process",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },

    // Next.js debugging
    {
      "type": "node-terminal",
      "name": "Next.js: Debug Server",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "type": "chrome",
      "name": "Next.js: Debug Client",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "type": "node-terminal",
      "name": "Next.js: Full Stack",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },

    // Jest debugging
    {
      "type": "node",
      "name": "Jest: Debug All",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "name": "Jest: Debug Current File",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${relativeFile}", "--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    },

    // Vitest debugging
    {
      "type": "node",
      "name": "Vitest: Debug Tests",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal"
    },

    // Python debugging
    {
      "type": "debugpy",
      "name": "Python: Debug Current File",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal",
      "justMyCode": true
    },
    {
      "type": "debugpy",
      "name": "Python: FastAPI",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload", "--port", "8000"],
      "jinja": true
    },
    {
      "type": "debugpy",
      "name": "Python: Django",
      "request": "launch",
      "program": "${workspaceFolder}/manage.py",
      "args": ["runserver", "--noreload"],
      "django": true
    },

    // Go debugging
    {
      "type": "go",
      "name": "Go: Debug Package",
      "request": "launch",
      "mode": "auto",
      "program": "${fileDirname}"
    },
    {
      "type": "go",
      "name": "Go: Debug Test",
      "request": "launch",
      "mode": "test",
      "program": "${fileDirname}"
    },

    // Rust debugging
    {
      "type": "lldb",
      "name": "Rust: Debug Binary",
      "request": "launch",
      "program": "${workspaceFolder}/target/debug/${workspaceFolderBasename}",
      "args": [],
      "cwd": "${workspaceFolder}",
      "preLaunchTask": "cargo build"
    },

    // Docker debugging
    {
      "type": "node",
      "name": "Docker: Debug Node.js",
      "request": "attach",
      "port": 9229,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "restart": true
    }
  ],
  "compounds": [
    {
      "name": "Full Stack (Server + Client)",
      "configurations": ["Next.js: Debug Server", "Next.js: Debug Client"]
    }
  ]
}
```

## Logging Configuration

### src/lib/logger.ts
```typescript
// src/lib/logger.ts

import pino from 'pino';

// Log levels
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Logger configuration
const config = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version
  },
  redact: {
    paths: ['password', 'secret', 'token', '*.password', '*.secret', '*.token'],
    censor: '[REDACTED]'
  }
};

// Create logger instance
export const logger = pino(config);

// Create child loggers for different modules
export function createLogger(module: string) {
  return logger.child({ module });
}

// Utility functions
export function logRequest(req: Request, meta?: Record<string, unknown>) {
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ...meta
  });
}

export function logResponse(
  res: Response,
  duration: number,
  meta?: Record<string, unknown>
) {
  logger.info({
    type: 'response',
    status: res.status,
    duration,
    ...meta
  });
}

export function logError(error: Error, meta?: Record<string, unknown>) {
  logger.error({
    type: 'error',
    message: error.message,
    stack: error.stack,
    ...meta
  });
}

// Performance logging
export function logPerformance(operation: string, duration: number) {
  logger.debug({
    type: 'performance',
    operation,
    duration,
    unit: 'ms'
  });
}

// Timer utility
export function createTimer(label: string) {
  const start = performance.now();

  return {
    end: (meta?: Record<string, unknown>) => {
      const duration = performance.now() - start;
      logPerformance(label, duration);
      return duration;
    }
  };
}
```

### src/lib/debug.ts
```typescript
// src/lib/debug.ts

import debug from 'debug';

// Create debug namespaces
export const debugApp = debug('app');
export const debugApi = debug('app:api');
export const debugDb = debug('app:db');
export const debugAuth = debug('app:auth');
export const debugCache = debug('app:cache');
export const debugSocket = debug('app:socket');

// Enable specific namespaces in development
if (process.env.NODE_ENV === 'development') {
  debug.enable('app:*');
}

// Debug utility function
export function createDebugger(namespace: string) {
  return debug(`app:${namespace}`);
}

// Conditional debug logging
export function debugIf(condition: boolean, ...args: unknown[]) {
  if (condition) {
    debugApp(...args);
  }
}

// Debug with timing
export function debugTimed(label: string, fn: () => void) {
  const start = Date.now();
  fn();
  const duration = Date.now() - start;
  debugApp(`${label}: ${duration}ms`);
}

// Debug async operations
export async function debugAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  debugApp(`${label}: starting`);

  try {
    const result = await fn();
    const duration = Date.now() - start;
    debugApp(`${label}: completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    debugApp(`${label}: failed after ${duration}ms`, error);
    throw error;
  }
}
```

## Browser Debugging

### src/lib/browser-debug.ts
```typescript
// src/lib/browser-debug.ts

// Console styling
const styles = {
  info: 'color: #2196F3; font-weight: bold',
  success: 'color: #4CAF50; font-weight: bold',
  warning: 'color: #FF9800; font-weight: bold',
  error: 'color: #f44336; font-weight: bold',
  debug: 'color: #9E9E9E; font-weight: bold'
};

// Styled console logging
export const devLog = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`%c[INFO] ${message}`, styles.info, ...args);
    }
  },

  success: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`%c[SUCCESS] ${message}`, styles.success, ...args);
    }
  },

  warning: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`%c[WARNING] ${message}`, styles.warning, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    console.error(`%c[ERROR] ${message}`, styles.error, ...args);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`%c[DEBUG] ${message}`, styles.debug, ...args);
    }
  },

  group: (label: string, fn: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },

  table: (data: unknown[], columns?: string[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.table(data, columns);
    }
  },

  time: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
    }
    return {
      end: () => {
        if (process.env.NODE_ENV === 'development') {
          console.timeEnd(label);
        }
      }
    };
  }
};

// Performance measurement
export function measurePerformance(label: string) {
  if (typeof window === 'undefined') return { end: () => 0 };

  const startMark = `${label}-start`;
  const endMark = `${label}-end`;

  performance.mark(startMark);

  return {
    end: () => {
      performance.mark(endMark);
      performance.measure(label, startMark, endMark);

      const entries = performance.getEntriesByName(label);
      const duration = entries[entries.length - 1]?.duration || 0;

      if (process.env.NODE_ENV === 'development') {
        devLog.debug(`${label}: ${duration.toFixed(2)}ms`);
      }

      // Cleanup
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(label);

      return duration;
    }
  };
}

// Network request debugging
export function debugFetch(url: string, options?: RequestInit) {
  const timer = measurePerformance(`fetch:${url}`);

  return fetch(url, options).then(
    response => {
      timer.end();
      devLog.info(`Fetch ${url}`, {
        status: response.status,
        ok: response.ok
      });
      return response;
    },
    error => {
      timer.end();
      devLog.error(`Fetch ${url} failed`, error);
      throw error;
    }
  );
}

// React component debugging
export function useDebugRender(componentName: string) {
  if (process.env.NODE_ENV !== 'development') return;

  const renderCount = React.useRef(0);
  renderCount.current++;

  React.useEffect(() => {
    devLog.debug(`${componentName} rendered (${renderCount.current})`);
  });
}

// State debugging hook
export function useDebugState<T>(
  initialState: T,
  name: string
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState(initialState);

  const setStateDebug: React.Dispatch<React.SetStateAction<T>> = action => {
    if (process.env.NODE_ENV === 'development') {
      const prevState = state;
      setState(prev => {
        const nextState = typeof action === 'function'
          ? (action as (prev: T) => T)(prev)
          : action;

        devLog.debug(`State "${name}" changed`, {
          prev: prevState,
          next: nextState
        });

        return nextState;
      });
    } else {
      setState(action);
    }
  };

  return [state, setStateDebug];
}
```

## Error Boundaries

### src/components/ErrorBoundary.tsx
```typescript
// src/components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to external service
    logger.error({
      type: 'react-error',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 border border-red-500 rounded bg-red-50">
          <h2 className="text-lg font-semibold text-red-700">
            Something went wrong
          </h2>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-2 text-sm text-red-600 overflow-auto">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Debug Panel Component

### src/components/DebugPanel.tsx
```typescript
// src/components/DebugPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface DebugPanelProps {
  data?: Record<string, unknown>;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function DebugPanel({
  data,
  position = 'bottom-right'
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [renderInfo, setRenderInfo] = useState({
    renderCount: 0,
    lastRender: new Date()
  });

  useEffect(() => {
    setRenderInfo(prev => ({
      renderCount: prev.renderCount + 1,
      lastRender: new Date()
    }));
  }, [data]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] font-mono text-xs`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-green-400 px-3 py-1 rounded-t border border-gray-700"
      >
        {isOpen ? '▼ Debug' : '▶ Debug'}
      </button>

      {isOpen && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-b border border-gray-700 max-w-md max-h-96 overflow-auto">
          <div className="mb-2 pb-2 border-b border-gray-700">
            <div>Renders: {renderInfo.renderCount}</div>
            <div>Last: {renderInfo.lastRender.toISOString()}</div>
          </div>

          {data && (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}

          <div className="mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={() => console.clear()}
              className="text-red-400 hover:text-red-300"
            >
              Clear Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## CLAUDE.md Integration

```markdown
## Debugging

### VS Code
- F5 - Start debugging
- F9 - Toggle breakpoint
- F10 - Step over
- F11 - Step into
- Shift+F11 - Step out

### Debug Commands
```bash
# Node.js
node --inspect src/index.js
node --inspect-brk src/index.js  # Break on start

# Chrome DevTools
chrome://inspect
```

### Logging
- Development: pino-pretty formatted
- Production: JSON structured logs
- Log levels: trace, debug, info, warn, error, fatal

### Environment Variables
```env
LOG_LEVEL=debug
DEBUG=app:*
NODE_ENV=development
```

### Browser DevTools
- Console: Styled logging with devLog
- Performance: measurePerformance()
- Network: debugFetch() wrapper
```

## AI Suggestions

1. **Breakpoint management** - Smart breakpoints
2. **Log analysis** - Parse and visualize logs
3. **Error tracking** - Integration with Sentry
4. **Performance profiling** - Automated profiling
5. **Memory debugging** - Leak detection
6. **Network inspection** - Request/response logging
7. **State debugging** - Redux DevTools integration
8. **Source maps** - Improved mapping
9. **Remote debugging** - Debug production
10. **Debug sessions** - Save/restore sessions
