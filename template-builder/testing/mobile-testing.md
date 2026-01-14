# Mobile Testing Templates

Production-ready mobile testing patterns with Appium, Detox, and device farm integration.

## Overview

- **Native App Testing**: iOS and Android automation
- **Mobile Web Testing**: Responsive and PWA testing
- **Device Farms**: AWS Device Farm, Firebase Test Lab
- **Performance Testing**: Mobile-specific metrics

## Quick Start

```bash
# Appium
npm install -g appium
npm install -D webdriverio @wdio/appium-service

# Detox (React Native)
npm install -D detox jest-circus

# Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# iOS Simulator
xcrun simctl list devices
```

## Detox React Native Testing

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_5_API_34' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
```

```typescript
// e2e/login.test.ts
import { device, element, by, expect, waitFor } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@email.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('error-message')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('welcome-message'))).toBeVisible();
  });

  it('should handle keyboard correctly', async () => {
    await element(by.id('email-input')).tap();

    // Keyboard should be visible
    await expect(element(by.id('email-input'))).toBeFocused();

    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).tap();

    // Focus should move
    await expect(element(by.id('password-input'))).toBeFocused();

    // Dismiss keyboard
    await device.pressBack(); // Android
    // or
    // await element(by.id('password-input')).tapReturnKey(); // iOS
  });
});

describe('Navigation', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should navigate to profile', async () => {
    await element(by.id('profile-tab')).tap();
    await expect(element(by.id('profile-screen'))).toBeVisible();
  });

  it('should navigate to settings', async () => {
    await element(by.id('settings-button')).tap();
    await expect(element(by.id('settings-screen'))).toBeVisible();
  });

  it('should go back', async () => {
    await device.pressBack();
    await expect(element(by.id('profile-screen'))).toBeVisible();
  });

  it('should handle deep links', async () => {
    await device.openURL({ url: 'myapp://product/123' });
    await expect(element(by.id('product-screen'))).toBeVisible();
    await expect(element(by.text('Product 123'))).toBeVisible();
  });
});

describe('Gestures', () => {
  it('should handle swipe', async () => {
    await element(by.id('carousel')).swipe('left');
    await expect(element(by.id('slide-2'))).toBeVisible();
  });

  it('should handle scroll', async () => {
    await element(by.id('scroll-view')).scroll(200, 'down');
    await expect(element(by.id('item-10'))).toBeVisible();
  });

  it('should handle long press', async () => {
    await element(by.id('list-item')).longPress();
    await expect(element(by.id('context-menu'))).toBeVisible();
  });

  it('should handle pinch zoom', async () => {
    await element(by.id('image')).pinch(1.5); // Zoom in
    await element(by.id('image')).pinch(0.5); // Zoom out
  });
});
```

## Appium Testing

```typescript
// appium/capabilities.ts
export const iosCapabilities = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': 'iPhone 15',
  'appium:platformVersion': '17.0',
  'appium:app': './apps/MyApp.app',
  'appium:noReset': false,
  'appium:fullReset': false,
};

export const androidCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Pixel 5',
  'appium:platformVersion': '14',
  'appium:app': './apps/app-debug.apk',
  'appium:appPackage': 'com.myapp',
  'appium:appActivity': '.MainActivity',
  'appium:noReset': false,
};
```

```typescript
// appium/login.test.ts
import { remote, RemoteOptions } from 'webdriverio';
import { iosCapabilities, androidCapabilities } from './capabilities';

describe('Mobile App Tests', () => {
  const platforms = [
    { name: 'iOS', capabilities: iosCapabilities },
    { name: 'Android', capabilities: androidCapabilities },
  ];

  platforms.forEach(({ name, capabilities }) => {
    describe(`${name} Platform`, () => {
      let driver: WebdriverIO.Browser;

      beforeAll(async () => {
        const options: RemoteOptions = {
          hostname: 'localhost',
          port: 4723,
          path: '/',
          capabilities,
        };
        driver = await remote(options);
      }, 120000);

      afterAll(async () => {
        await driver?.deleteSession();
      });

      it('should login successfully', async () => {
        // Wait for app to load
        const emailInput = await driver.$('~email-input');
        await emailInput.waitForDisplayed({ timeout: 10000 });

        // Enter credentials
        await emailInput.setValue('test@example.com');

        const passwordInput = await driver.$('~password-input');
        await passwordInput.setValue('password123');

        // Hide keyboard
        if (name === 'Android') {
          await driver.hideKeyboard();
        }

        // Tap login
        const loginButton = await driver.$('~login-button');
        await loginButton.click();

        // Verify success
        const homeScreen = await driver.$('~home-screen');
        await homeScreen.waitForDisplayed({ timeout: 10000 });

        expect(await homeScreen.isDisplayed()).toBe(true);
      });

      it('should handle orientation changes', async () => {
        await driver.setOrientation('LANDSCAPE');
        await driver.pause(500);

        // Verify layout adjusts
        const header = await driver.$('~header');
        expect(await header.isDisplayed()).toBe(true);

        await driver.setOrientation('PORTRAIT');
      });

      it('should handle background/foreground', async () => {
        await driver.background(5); // Background for 5 seconds

        // App should restore state
        const homeScreen = await driver.$('~home-screen');
        expect(await homeScreen.isDisplayed()).toBe(true);
      });
    });
  });
});
```

## Maestro Testing

```yaml
# .maestro/login.yaml
appId: com.myapp
---
- launchApp

- assertVisible: "Login"

- tapOn:
    id: "email-input"
- inputText: "test@example.com"

- tapOn:
    id: "password-input"
- inputText: "password123"

- hideKeyboard

- tapOn:
    id: "login-button"

- assertVisible:
    id: "home-screen"
    timeout: 10000

- assertVisible: "Welcome"
```

```yaml
# .maestro/navigation.yaml
appId: com.myapp
---
- launchApp:
    clearState: false

# Navigate to profile
- tapOn:
    id: "profile-tab"

- assertVisible:
    id: "profile-screen"

# Scroll to settings
- scroll:
    direction: DOWN

- tapOn: "Settings"

- assertVisible:
    id: "settings-screen"

# Toggle dark mode
- tapOn:
    id: "dark-mode-toggle"

- assertVisible:
    text: "Dark Mode Enabled"

# Go back
- back

- assertVisible:
    id: "profile-screen"
```

```yaml
# .maestro/gestures.yaml
appId: com.myapp
---
- launchApp

# Swipe carousel
- swipe:
    direction: LEFT
    start: 90%, 50%
    end: 10%, 50%

- assertVisible:
    id: "slide-2"

# Pull to refresh
- swipe:
    direction: DOWN
    start: 50%, 20%
    end: 50%, 80%

- assertVisible: "Refreshing..."

# Long press for context menu
- longPressOn:
    id: "list-item-1"

- assertVisible:
    id: "context-menu"
```

## AWS Device Farm Integration

```yaml
# devicefarm/testspec.yml
version: 0.1

phases:
  install:
    commands:
      - export APPIUM_VERSION=2.0.0
      - npm install -g appium@$APPIUM_VERSION
      - appium driver install uiautomator2
      - appium driver install xcuitest

  pre_test:
    commands:
      - cd $DEVICEFARM_TEST_PACKAGE_PATH
      - npm install

  test:
    commands:
      - cd $DEVICEFARM_TEST_PACKAGE_PATH
      - npm test

  post_test:
    commands:
      - cp -r reports $DEVICEFARM_LOG_DIR

artifacts:
  - $DEVICEFARM_LOG_DIR
```

```typescript
// devicefarm/run-tests.ts
import {
  DeviceFarmClient,
  CreateUploadCommand,
  ScheduleRunCommand,
  GetRunCommand,
} from '@aws-sdk/client-device-farm';
import * as fs from 'fs';

const client = new DeviceFarmClient({ region: 'us-west-2' });
const PROJECT_ARN = process.env.DEVICE_FARM_PROJECT_ARN!;
const DEVICE_POOL_ARN = process.env.DEVICE_FARM_DEVICE_POOL_ARN!;

async function runTests() {
  // Upload app
  const appUpload = await client.send(
    new CreateUploadCommand({
      projectArn: PROJECT_ARN,
      name: 'app.apk',
      type: 'ANDROID_APP',
    })
  );

  await uploadFile(appUpload.upload!.url!, './apps/app-release.apk');

  // Upload test package
  const testUpload = await client.send(
    new CreateUploadCommand({
      projectArn: PROJECT_ARN,
      name: 'tests.zip',
      type: 'APPIUM_NODE_TEST_PACKAGE',
    })
  );

  await uploadFile(testUpload.upload!.url!, './tests.zip');

  // Schedule run
  const run = await client.send(
    new ScheduleRunCommand({
      projectArn: PROJECT_ARN,
      appArn: appUpload.upload!.arn,
      devicePoolArn: DEVICE_POOL_ARN,
      name: `Test Run ${new Date().toISOString()}`,
      test: {
        type: 'APPIUM_NODE',
        testPackageArn: testUpload.upload!.arn,
        testSpecArn: process.env.TEST_SPEC_ARN,
      },
    })
  );

  // Wait for completion
  let status = 'RUNNING';
  while (status === 'RUNNING' || status === 'PENDING') {
    await new Promise((r) => setTimeout(r, 30000));
    const result = await client.send(
      new GetRunCommand({ arn: run.run!.arn })
    );
    status = result.run!.status!;
    console.log(`Status: ${status}`);
  }

  console.log(`Run completed with status: ${status}`);
}

async function uploadFile(url: string, filePath: string) {
  const fileContent = fs.readFileSync(filePath);
  await fetch(url, {
    method: 'PUT',
    body: fileContent,
  });
}

runTests().catch(console.error);
```

## Firebase Test Lab

```yaml
# .github/workflows/mobile.yml
name: Mobile Tests

on:
  pull_request:
    branches: [main]

jobs:
  detox-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install pods
        run: cd ios && pod install

      - name: Build iOS app
        run: npx detox build --configuration ios.sim.release

      - name: Run Detox tests
        run: npx detox test --configuration ios.sim.release

  detox-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup JDK
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Start emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          target: google_apis
          arch: x86_64
          script: npx detox test --configuration android.emu.release

  firebase-test-lab:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build APK
        run: cd android && ./gradlew assembleDebug

      - name: Authenticate with Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - name: Run Firebase Test Lab
        run: |
          gcloud firebase test android run \
            --app android/app/build/outputs/apk/debug/app-debug.apk \
            --test android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk \
            --device model=Pixel6,version=33 \
            --device model=Pixel7,version=34 \
            --timeout 30m
```

## CLAUDE.md Integration

```markdown
# Mobile Testing

## Commands
- `npx detox build` - Build app for testing
- `npx detox test` - Run Detox tests
- `maestro test .maestro/` - Run Maestro tests
- `appium` - Start Appium server

## Platforms
- iOS Simulator (iPhone 15)
- Android Emulator (Pixel 5)
- Real devices via Device Farm

## Test Types
- UI automation
- Gesture testing
- Deep link testing
- Performance testing

## Debugging
- `npx detox test --loglevel verbose`
- Screenshots on failure
- Video recording
```

## AI Suggestions

1. **Device coverage analysis** - Track tested device combinations
2. **Gesture recording** - Record and replay gestures
3. **Network simulation** - Test on slow connections
4. **Battery impact testing** - Measure battery consumption
5. **Memory profiling** - Detect memory leaks
6. **Crash analytics** - Integrate crash reporting
7. **A/B test validation** - Verify feature flags
8. **Accessibility testing** - Mobile a11y checks
9. **Localization testing** - Multi-language testing
10. **Performance benchmarks** - Track app performance metrics
