# Pair Programming Template

## Overview
Comprehensive pair programming setup with VS Code Live Share, screen sharing tools, remote collaboration, and pairing best practices.

## Quick Start
```bash
# VS Code Live Share
code --install-extension ms-vsliveshare.vsliveshare

# Start session
# Cmd+Shift+P > Live Share: Start Collaboration Session
```

## VS Code Live Share Configuration

### .vscode/liveshare.json
```json
{
  // Session settings
  "liveshare.connectionMode": "auto",
  "liveshare.guestApprovalRequired": true,
  "liveshare.anonymousGuestApproval": "reject",

  // Audio settings
  "liveshare.audio": true,

  // Sharing settings
  "liveshare.shareExternalFiles": true,
  "liveshare.autoShareServers": true,
  "liveshare.autoShareTerminals": false,

  // Focus settings
  "liveshare.focusBehavior": "prompt",
  "liveshare.allowGuestTaskControl": true,
  "liveshare.allowGuestDebugControl": true,

  // Excluded files
  "liveshare.excludedFiles": [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/coverage/**",
    "**/.env*"
  ],

  // Read-only files
  "liveshare.readOnlyFiles": [
    "**/package-lock.json",
    "**/yarn.lock",
    "**/pnpm-lock.yaml"
  ]
}
```

### .vscode/settings.json (Live Share extensions)
```json
{
  "liveshare.presence": true,
  "liveshare.showInStatusBar": "whileCollaborating",
  "liveshare.nameTagVisibility": "always",
  "liveshare.launcherClient": "visualStudioCode",

  // Shared servers
  "liveshare.sharedServers": [
    { "port": 3000, "name": "Web App" },
    { "port": 3001, "name": "API Server" },
    { "port": 5432, "name": "Database" }
  ],

  // Audio
  "liveshare.audioEnabled": true,
  "liveshare.audioPushToTalk": false,

  // Extensions to recommend for guests
  "liveshare.extensionPacksRequiredForGuest": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

## Pairing Session Scripts

### scripts/pair-session.sh
```bash
#!/usr/bin/env bash
# scripts/pair-session.sh - Start a pairing session

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║       Pair Programming Session         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Start required services
echo "🚀 Starting development services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services..."
sleep 5

# Open VS Code
echo "📝 Opening VS Code..."
code .

# Start dev server in background
echo "🖥️ Starting development server..."
npm run dev &

# Display session info
echo ""
echo "═══════════════════════════════════════"
echo "Session Ready!"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Quick Start:"
echo "   1. Start Live Share: Cmd+Shift+P > Live Share"
echo "   2. Share the session link with your pair"
echo ""
echo "🔗 Services:"
echo "   Web App: http://localhost:3000"
echo "   API: http://localhost:3001"
echo "   DB Studio: npx prisma studio"
echo ""
echo "📝 Pairing Tips:"
echo "   - Switch roles every 15-25 minutes"
echo "   - Use 'Follow participant' for sync"
echo "   - Take breaks every hour"
echo ""
```

### scripts/pair-timer.ts
```typescript
#!/usr/bin/env ts-node
// scripts/pair-timer.ts - Pomodoro-style pairing timer

import * as readline from 'readline';

interface PairingSession {
  driver: string;
  navigator: string;
  rotationMinutes: number;
  breakMinutes: number;
  rotationsBeforeBreak: number;
}

class PairingTimer {
  private session: PairingSession;
  private currentRotation: number = 0;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(session: PairingSession) {
    this.session = session;
  }

  start(): void {
    console.log('\n🎯 Pairing Session Started!\n');
    this.printStatus();
    this.startRotation();
  }

  private startRotation(): void {
    this.isRunning = true;
    const minutes = this.session.rotationMinutes;
    let remaining = minutes * 60;

    console.log(`\n⏱️  ${minutes} minute rotation started`);
    this.printRoles();

    this.timer = setInterval(() => {
      remaining--;

      // Warning at 2 minutes
      if (remaining === 120) {
        this.notify('2 minutes remaining - prepare to switch!');
      }

      // Warning at 30 seconds
      if (remaining === 30) {
        this.notify('30 seconds - get ready to switch roles!');
      }

      if (remaining <= 0) {
        this.onRotationComplete();
      }
    }, 1000);
  }

  private onRotationComplete(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.currentRotation++;

    // Swap roles
    const temp = this.session.driver;
    this.session.driver = this.session.navigator;
    this.session.navigator = temp;

    this.notify('🔄 Time to switch roles!');
    console.log('\n═══════════════════════════════════');
    console.log('       SWITCH ROLES!');
    console.log('═══════════════════════════════════\n');
    this.printRoles();

    // Check for break
    if (this.currentRotation % this.session.rotationsBeforeBreak === 0) {
      this.startBreak();
    } else {
      // Continue with next rotation
      setTimeout(() => {
        if (this.isRunning) {
          this.startRotation();
        }
      }, 5000);
    }
  }

  private startBreak(): void {
    const breakMinutes = this.session.breakMinutes;

    console.log(`\n☕ Break time! ${breakMinutes} minutes`);
    this.notify(`☕ Take a ${breakMinutes} minute break!`);

    setTimeout(() => {
      if (this.isRunning) {
        this.notify('Break over - ready to continue?');
        console.log('\n🎯 Break over! Starting next rotation...');
        this.startRotation();
      }
    }, breakMinutes * 60 * 1000);
  }

  private printRoles(): void {
    console.log(`\n  🎮 Driver:    ${this.session.driver}`);
    console.log(`  🧭 Navigator: ${this.session.navigator}\n`);
  }

  private printStatus(): void {
    console.log('Session Configuration:');
    console.log(`  Rotation: ${this.session.rotationMinutes} minutes`);
    console.log(`  Break: ${this.session.breakMinutes} minutes every ${this.session.rotationsBeforeBreak} rotations`);
  }

  private notify(message: string): void {
    // System notification (macOS)
    const { execSync } = require('child_process');
    try {
      execSync(`osascript -e 'display notification "${message}" with title "Pair Programming"'`);
    } catch {
      // Fallback: just log
    }
    console.log(`\n🔔 ${message}\n`);
  }

  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
    }
    console.log('\n⏹️  Session ended');
    console.log(`   Total rotations: ${this.currentRotation}`);
  }
}

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n🎯 Pair Programming Timer\n');

  const driver = await question('Driver name: ');
  const navigator = await question('Navigator name: ');
  const rotationMinutes = parseInt(await question('Rotation duration (minutes) [20]: ') || '20');
  const breakMinutes = parseInt(await question('Break duration (minutes) [5]: ') || '5');
  const rotationsBeforeBreak = parseInt(await question('Rotations before break [4]: ') || '4');

  rl.close();

  const timer = new PairingTimer({
    driver,
    navigator,
    rotationMinutes,
    breakMinutes,
    rotationsBeforeBreak
  });

  // Handle exit
  process.on('SIGINT', () => {
    timer.stop();
    process.exit();
  });

  timer.start();
}

main();
```

## Mob Programming Setup

### scripts/mob-session.ts
```typescript
// scripts/mob-session.ts - Mob programming rotation

interface MobParticipant {
  name: string;
  role: 'driver' | 'navigator' | 'mob';
}

interface MobSession {
  participants: string[];
  rotationMinutes: number;
  currentDriverIndex: number;
  currentNavigatorIndex: number;
}

class MobTimer {
  private session: MobSession;
  private timer: NodeJS.Timeout | null = null;

  constructor(participants: string[], rotationMinutes: number = 10) {
    this.session = {
      participants,
      rotationMinutes,
      currentDriverIndex: 0,
      currentNavigatorIndex: 1
    };
  }

  start(): void {
    console.log('\n👥 Mob Programming Session Started!\n');
    this.printRoles();
    this.startRotation();
  }

  private startRotation(): void {
    const minutes = this.session.rotationMinutes;
    let remaining = minutes * 60;

    console.log(`\n⏱️  ${minutes} minute rotation`);

    this.timer = setInterval(() => {
      remaining--;

      if (remaining === 60) {
        this.notify('1 minute remaining!');
      }

      if (remaining <= 0) {
        this.rotate();
      }
    }, 1000);
  }

  private rotate(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    const { participants } = this.session;

    // Rotate positions
    this.session.currentDriverIndex =
      (this.session.currentDriverIndex + 1) % participants.length;
    this.session.currentNavigatorIndex =
      (this.session.currentNavigatorIndex + 1) % participants.length;

    console.log('\n═══════════════════════════════════');
    console.log('         ROTATE!');
    console.log('═══════════════════════════════════\n');

    this.notify('🔄 Time to rotate!');
    this.printRoles();

    // Continue
    setTimeout(() => this.startRotation(), 5000);
  }

  private printRoles(): void {
    const { participants, currentDriverIndex, currentNavigatorIndex } = this.session;

    console.log('Current Roles:');
    console.log(`  🎮 Driver:    ${participants[currentDriverIndex]}`);
    console.log(`  🧭 Navigator: ${participants[currentNavigatorIndex]}`);
    console.log('  👥 Mob:');

    participants.forEach((p, i) => {
      if (i !== currentDriverIndex && i !== currentNavigatorIndex) {
        console.log(`     - ${p}`);
      }
    });
    console.log();
  }

  private notify(message: string): void {
    console.log(`\n🔔 ${message}\n`);
  }
}

// Example usage
const mob = new MobTimer(['Alice', 'Bob', 'Charlie', 'Diana'], 10);
mob.start();
```

## Collaboration Guidelines

### docs/pairing-guidelines.md
```markdown
# Pair Programming Guidelines

## Roles

### Driver
- Controls the keyboard and mouse
- Writes the code
- Focuses on tactical decisions
- Asks for clarification when needed

### Navigator
- Reviews code as it's written
- Thinks about the bigger picture
- Suggests improvements and catches errors
- Keeps track of the goal

## Best Practices

### Communication
- Think out loud
- Ask questions freely
- Share your reasoning
- Give and receive feedback gracefully

### Rotation
- Switch roles every 15-25 minutes
- Take breaks every 1-2 hours
- Both partners should drive and navigate

### Setup
- Use the same editor/IDE
- Share terminal and server access
- Ensure both can see the screen clearly
- Use audio for remote pairing

## Common Patterns

### Ping Pong
1. One person writes a failing test
2. Other person makes it pass
3. First person refactors
4. Swap and repeat

### Strong Style
- "For an idea to go from your head to the computer,
   it must go through someone else's hands"
- Navigator dictates, driver types
- Forces communication and shared understanding

### Unstructured
- Natural flow between roles
- Good for exploration and learning
- Less formal but can lose balance

## Anti-patterns to Avoid

- **Backseat driving**: Navigator grabbing keyboard
- **Disengagement**: Silent watching or scrolling phone
- **Domination**: One person controlling everything
- **No breaks**: Coding for hours without rest

## Remote Pairing Tips

- Use high-quality audio (headset recommended)
- Share your screen, not just code
- Use cursor following features
- Take more frequent breaks
- Over-communicate intentions

## When to Pair

Good for:
- Complex problems
- Learning new codebases
- Knowledge sharing
- Design decisions
- Tricky bugs

Consider solo for:
- Simple, well-defined tasks
- Research and exploration
- Documentation
- Routine maintenance
```

## Session Retrospective

### scripts/pair-retro.ts
```typescript
// scripts/pair-retro.ts - Quick pairing retrospective

import * as readline from 'readline';
import * as fs from 'fs';

interface RetroItem {
  category: 'went-well' | 'improve' | 'action';
  text: string;
}

interface RetroSession {
  date: string;
  participants: string[];
  duration: string;
  items: RetroItem[];
}

async function runRetro(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n📝 Pairing Session Retrospective\n');

  const participants = (await question('Participants (comma-separated): ')).split(',').map(p => p.trim());
  const duration = await question('Session duration: ');

  const items: RetroItem[] = [];

  console.log('\n✅ What went well? (empty line to finish)');
  let input: string;
  while ((input = await question('  + ')) !== '') {
    items.push({ category: 'went-well', text: input });
  }

  console.log('\n🔧 What could be improved? (empty line to finish)');
  while ((input = await question('  - ')) !== '') {
    items.push({ category: 'improve', text: input });
  }

  console.log('\n🎯 Action items? (empty line to finish)');
  while ((input = await question('  → ')) !== '') {
    items.push({ category: 'action', text: input });
  }

  rl.close();

  const session: RetroSession = {
    date: new Date().toISOString().split('T')[0],
    participants,
    duration,
    items
  };

  // Save to file
  const filename = `pair-retro-${session.date}.json`;
  fs.writeFileSync(filename, JSON.stringify(session, null, 2));

  // Print summary
  console.log('\n═══════════════════════════════════');
  console.log('        Session Summary');
  console.log('═══════════════════════════════════\n');
  console.log(`Date: ${session.date}`);
  console.log(`Participants: ${participants.join(', ')}`);
  console.log(`Duration: ${duration}\n`);

  console.log('✅ Went Well:');
  items.filter(i => i.category === 'went-well').forEach(i => console.log(`   + ${i.text}`));

  console.log('\n🔧 To Improve:');
  items.filter(i => i.category === 'improve').forEach(i => console.log(`   - ${i.text}`));

  console.log('\n🎯 Actions:');
  items.filter(i => i.category === 'action').forEach(i => console.log(`   → ${i.text}`));

  console.log(`\n💾 Saved to ${filename}\n`);
}

runRetro();
```

## CLAUDE.md Integration

```markdown
## Pair Programming

### Starting a Session
1. Run `npm run pair:start`
2. Start Live Share in VS Code
3. Share link with your pair

### Roles
- **Driver**: Writes code
- **Navigator**: Reviews and guides

### Rotation Timer
```bash
npm run pair:timer
```

### Guidelines
- Switch every 15-25 minutes
- Think out loud
- Take breaks hourly
- Run retro after session

### Live Share Commands
- `Cmd+Shift+P` > Live Share: Start
- `Cmd+Shift+P` > Live Share: Follow
- `Cmd+Shift+P` > Live Share: Share Terminal
```

## AI Suggestions

1. **Smart matching** - Pair skill-based matching
2. **Session analytics** - Track pairing metrics
3. **Code replay** - Review session recordings
4. **Integration** - Calendar/Slack integration
5. **Remote tools** - Better remote pairing
6. **Knowledge tracking** - Track knowledge transfer
7. **Suggestion mode** - AI navigator assistance
8. **Retrospectives** - Automated retro summaries
9. **Scheduling** - Pairing session scheduler
10. **Onboarding** - Guided pairing for new devs
