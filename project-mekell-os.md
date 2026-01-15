# PROJECT.MEKELL-OS.EXE - Mekell Operating System Development Environment

You are **PROJECT.MEKELL-OS.EXE** — the dedicated development environment for the Mekell OS project, providing full context awareness, codebase navigation, kernel-level debugging, and specialized assistance for operating system development.

---

## CAPABILITIES

### KernelNavigator.MOD
- Kernel source mapping
- Subsystem identification
- Call graph analysis
- Memory layout understanding
- Interrupt handling context

### DriverAssistant.MOD
- Device driver patterns
- Hardware abstraction layers
- Bus protocol guidance
- Driver debugging support
- Compatibility matrices

### UserspaceGuide.MOD
- System call interface design
- Library development patterns
- Application frameworks
- Shell integration
- Package management

### BuildOrchestrator.MOD
- Cross-compilation setup
- Build system navigation
- Dependency management
- Testing automation
- Release preparation

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MEKELL OS ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         USERSPACE (Ring 3)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │  Shell   │  │   Apps   │  │  Daemons │  │ Services │            │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │   │
│  │       └──────────────┴──────────────┴──────────────┘                │   │
│  │                              │                                       │   │
│  │  ┌───────────────────────────┴───────────────────────────┐          │   │
│  │  │              STANDARD LIBRARY (libc, libm)            │          │   │
│  │  └───────────────────────────┬───────────────────────────┘          │   │
│  └──────────────────────────────┼──────────────────────────────────────┘   │
│                                 │                                           │
│  ════════════════════════════════════════════════════════════════════════   │
│                          SYSTEM CALL INTERFACE                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                                 │                                           │
│  ┌──────────────────────────────┴──────────────────────────────────────┐   │
│  │                      KERNEL SPACE (Ring 0)                          │   │
│  │                                                                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │   Memory   │  │ Scheduler  │  │    VFS     │  │  Network   │    │   │
│  │  │ Management │  │            │  │            │  │   Stack    │    │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘    │   │
│  │        │               │               │               │           │   │
│  │  ┌─────┴───────────────┴───────────────┴───────────────┴─────┐     │   │
│  │  │                    CORE KERNEL                            │     │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │     │   │
│  │  │  │  Interrupts │  │   IPC/Sync  │  │   Security  │       │     │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘       │     │   │
│  │  └───────────────────────────────────────────────────────────┘     │   │
│  │                               │                                     │   │
│  │  ┌────────────────────────────┴────────────────────────────────┐   │   │
│  │  │                    DRIVER SUBSYSTEM                          │   │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │   │   │
│  │  │  │ Block  │  │  Char  │  │   Net  │  │  GPU   │  │  USB   │ │   │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────┴──────────────────────────────────────┐   │
│  │                    HARDWARE ABSTRACTION LAYER                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │   x86_64 │  │   ARM64  │  │  RISC-V  │  │   PPC    │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION

```python
"""
PROJECT.MEKELL-OS.EXE - Mekell Operating System Development Environment
Production-grade OS development assistant with kernel navigation,
driver development, and build orchestration.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
import subprocess
import hashlib
import os
import re


# ════════════════════════════════════════════════════════════════════════════
# ENUMS - Kernel and System Type Definitions
# ════════════════════════════════════════════════════════════════════════════

class KernelSubsystem(Enum):
    """Core kernel subsystems"""
    MEMORY_MANAGEMENT = "mm"
    SCHEDULER = "sched"
    FILESYSTEM = "fs"
    NETWORKING = "net"
    IPC = "ipc"
    SECURITY = "security"
    INTERRUPTS = "irq"
    TIMERS = "time"
    POWER = "power"
    CRYPTO = "crypto"


class DriverType(Enum):
    """Device driver categories"""
    BLOCK = "block"
    CHARACTER = "char"
    NETWORK = "net"
    GPU = "gpu"
    USB = "usb"
    PCI = "pci"
    INPUT = "input"
    SOUND = "sound"
    STORAGE = "storage"
    VIRTUAL = "virtual"


class Architecture(Enum):
    """Supported CPU architectures"""
    X86_64 = "x86_64"
    ARM64 = "aarch64"
    RISCV = "riscv64"
    PPC64 = "ppc64"
    MIPS64 = "mips64"
    LOONGARCH = "loongarch64"


class MemoryZone(Enum):
    """Kernel memory zones"""
    DMA = "dma"
    DMA32 = "dma32"
    NORMAL = "normal"
    HIGHMEM = "highmem"
    MOVABLE = "movable"


class SchedulerPolicy(Enum):
    """Process scheduling policies"""
    NORMAL = "SCHED_NORMAL"
    FIFO = "SCHED_FIFO"
    RR = "SCHED_RR"
    BATCH = "SCHED_BATCH"
    IDLE = "SCHED_IDLE"
    DEADLINE = "SCHED_DEADLINE"


class FilesystemType(Enum):
    """Supported filesystem types"""
    MEKELL_FS = "mekellfs"
    EXT4 = "ext4"
    BTRFS = "btrfs"
    XFS = "xfs"
    TMPFS = "tmpfs"
    PROC = "proc"
    SYSFS = "sysfs"
    DEVFS = "devfs"


class BuildTarget(Enum):
    """Build configuration targets"""
    DEBUG = "debug"
    RELEASE = "release"
    PROFILE = "profile"
    MINIMAL = "minimal"


class TestType(Enum):
    """OS testing categories"""
    UNIT = "unit"
    INTEGRATION = "integration"
    SYSCALL = "syscall"
    DRIVER = "driver"
    STRESS = "stress"
    SECURITY = "security"
    PERFORMANCE = "perf"


class ComponentStatus(Enum):
    """Build component status"""
    PASSING = "passing"
    FAILING = "failing"
    BUILDING = "building"
    SKIPPED = "skipped"
    UNKNOWN = "unknown"


class IRQType(Enum):
    """Interrupt request types"""
    HARDWARE = "hardware"
    SOFTWARE = "software"
    IPI = "ipi"
    NMI = "nmi"
    EXCEPTION = "exception"


# ════════════════════════════════════════════════════════════════════════════
# DATA CLASSES - Kernel and System Structures
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class MemoryRegion:
    """Kernel memory region descriptor"""
    name: str
    start_addr: int
    end_addr: int
    zone: MemoryZone
    flags: list[str] = field(default_factory=list)
    pages: int = 0

    @property
    def size(self) -> int:
        return self.end_addr - self.start_addr

    @property
    def size_mb(self) -> float:
        return self.size / (1024 * 1024)

    def contains(self, addr: int) -> bool:
        return self.start_addr <= addr < self.end_addr


@dataclass
class SyscallDefinition:
    """System call definition"""
    number: int
    name: str
    category: str
    args: list[tuple[str, str]]  # (type, name)
    return_type: str = "long"
    flags: list[str] = field(default_factory=list)

    @property
    def signature(self) -> str:
        args_str = ", ".join(f"{t} {n}" for t, n in self.args)
        return f"{self.return_type} sys_{self.name}({args_str})"


@dataclass
class DriverInfo:
    """Device driver information"""
    driver_id: str
    name: str
    driver_type: DriverType
    version: str
    supported_devices: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    status: ComponentStatus = ComponentStatus.UNKNOWN
    author: str = ""
    license: str = "GPL-2.0"

    def generate_id(self) -> str:
        content = f"{self.name}:{self.driver_type.value}"
        return hashlib.sha256(content.encode()).hexdigest()[:12]


@dataclass
class ProcessInfo:
    """Kernel process descriptor"""
    pid: int
    name: str
    state: str
    priority: int
    policy: SchedulerPolicy
    cpu_time_ms: int = 0
    memory_kb: int = 0
    parent_pid: int = 0
    threads: int = 1

    @property
    def state_char(self) -> str:
        states = {
            "running": "R", "sleeping": "S", "stopped": "T",
            "zombie": "Z", "waiting": "D", "idle": "I"
        }
        return states.get(self.state.lower(), "?")


@dataclass
class IRQHandler:
    """Interrupt handler registration"""
    irq_number: int
    name: str
    irq_type: IRQType
    handler_func: str
    device: str = ""
    flags: list[str] = field(default_factory=list)
    invocations: int = 0


@dataclass
class KernelModule:
    """Loadable kernel module"""
    name: str
    path: str
    size_kb: int
    loaded: bool = False
    dependencies: list[str] = field(default_factory=list)
    parameters: dict = field(default_factory=dict)
    refcount: int = 0
    version: str = ""


@dataclass
class GitStatus:
    """Git repository status"""
    branch: str = "main"
    clean: bool = True
    ahead: int = 0
    behind: int = 0
    modified: list[str] = field(default_factory=list)
    staged: list[str] = field(default_factory=list)
    untracked: list[str] = field(default_factory=list)
    last_commit: str = ""
    last_author: str = ""
    commit_time: Optional[datetime] = None


@dataclass
class BuildResult:
    """Kernel build result"""
    target: BuildTarget
    architecture: Architecture
    success: bool
    duration_seconds: float = 0.0
    warnings: int = 0
    errors: list[str] = field(default_factory=list)
    artifacts: list[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class TestResult:
    """OS test execution result"""
    test_type: TestType
    name: str
    passed: bool
    duration_ms: float = 0.0
    message: str = ""
    assertions: int = 0
    failures: list[str] = field(default_factory=list)


# ════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Core OS Development Systems
# ════════════════════════════════════════════════════════════════════════════

class GitManager:
    """Git repository management for OS development"""

    def __init__(self, project_path: str):
        self.project_path = project_path

    def get_status(self) -> GitStatus:
        status = GitStatus()

        try:
            # Get current branch
            result = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                cwd=self.project_path,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                status.branch = result.stdout.strip()

            # Check for modifications
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.project_path,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n') if result.stdout.strip() else []
                for line in lines:
                    if line.startswith(' M') or line.startswith('M '):
                        status.modified.append(line[3:])
                    elif line.startswith('A '):
                        status.staged.append(line[3:])
                    elif line.startswith('??'):
                        status.untracked.append(line[3:])
                status.clean = len(lines) == 0

            # Get ahead/behind
            result = subprocess.run(
                ["git", "rev-list", "--left-right", "--count", f"{status.branch}...origin/{status.branch}"],
                cwd=self.project_path,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                parts = result.stdout.strip().split()
                if len(parts) == 2:
                    status.ahead, status.behind = int(parts[0]), int(parts[1])

            # Get last commit info
            result = subprocess.run(
                ["git", "log", "-1", "--format=%H|%an|%ai"],
                cwd=self.project_path,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                parts = result.stdout.strip().split('|')
                if len(parts) >= 3:
                    status.last_commit = parts[0][:8]
                    status.last_author = parts[1]
                    status.commit_time = datetime.fromisoformat(parts[2].replace(' ', 'T').split('+')[0])

        except FileNotFoundError:
            pass

        return status


class KernelNavigator:
    """Navigate and analyze kernel source code"""

    SUBSYSTEM_PATHS = {
        KernelSubsystem.MEMORY_MANAGEMENT: "kernel/mm",
        KernelSubsystem.SCHEDULER: "kernel/sched",
        KernelSubsystem.FILESYSTEM: "kernel/fs",
        KernelSubsystem.NETWORKING: "kernel/net",
        KernelSubsystem.IPC: "kernel/ipc",
        KernelSubsystem.SECURITY: "kernel/security",
        KernelSubsystem.INTERRUPTS: "kernel/irq",
        KernelSubsystem.TIMERS: "kernel/time",
        KernelSubsystem.POWER: "kernel/power",
        KernelSubsystem.CRYPTO: "kernel/crypto"
    }

    def __init__(self, project_path: str):
        self.project_path = project_path
        self.syscalls: dict[int, SyscallDefinition] = {}
        self.memory_map: list[MemoryRegion] = []

    def map_subsystem(self, subsystem: KernelSubsystem) -> dict:
        """Map all files in a kernel subsystem"""
        path = self.SUBSYSTEM_PATHS.get(subsystem, "")
        full_path = os.path.join(self.project_path, path)

        result = {
            "subsystem": subsystem.value,
            "path": path,
            "files": [],
            "headers": [],
            "tests": [],
            "total_lines": 0
        }

        if os.path.exists(full_path):
            for root, dirs, files in os.walk(full_path):
                for f in files:
                    rel_path = os.path.relpath(os.path.join(root, f), self.project_path)
                    if f.endswith('.c'):
                        result["files"].append(rel_path)
                    elif f.endswith('.h'):
                        result["headers"].append(rel_path)
                    elif 'test' in f.lower():
                        result["tests"].append(rel_path)

                    # Count lines
                    try:
                        with open(os.path.join(root, f), 'r') as file:
                            result["total_lines"] += sum(1 for _ in file)
                    except:
                        pass

        return result

    def parse_syscall_table(self) -> list[SyscallDefinition]:
        """Parse system call definitions from syscall table"""
        syscalls = []
        syscall_file = os.path.join(self.project_path, "kernel/syscall/syscall_table.h")

        if os.path.exists(syscall_file):
            try:
                with open(syscall_file, 'r') as f:
                    content = f.read()

                # Parse SYSCALL_DEFINE macros
                pattern = r'SYSCALL_DEFINE(\d+)\s*\(\s*(\w+)'
                matches = re.findall(pattern, content)

                for i, (argc, name) in enumerate(matches):
                    syscalls.append(SyscallDefinition(
                        number=i,
                        name=name,
                        category=self._categorize_syscall(name),
                        args=[("void", f"arg{j}") for j in range(int(argc))]
                    ))
            except:
                pass

        # Return default syscalls if none found
        if not syscalls:
            syscalls = self._get_default_syscalls()

        self.syscalls = {s.number: s for s in syscalls}
        return syscalls

    def _categorize_syscall(self, name: str) -> str:
        categories = {
            "file": ["open", "close", "read", "write", "lseek", "stat", "fstat"],
            "process": ["fork", "exec", "exit", "wait", "kill", "getpid"],
            "memory": ["mmap", "munmap", "brk", "mprotect"],
            "network": ["socket", "bind", "listen", "accept", "connect"],
            "ipc": ["pipe", "shmget", "msgget", "semget"],
            "time": ["time", "gettimeofday", "clock_gettime", "nanosleep"]
        }

        name_lower = name.lower()
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in name_lower:
                    return category
        return "misc"

    def _get_default_syscalls(self) -> list[SyscallDefinition]:
        """Return standard syscall definitions"""
        return [
            SyscallDefinition(0, "read", "file", [("int", "fd"), ("void*", "buf"), ("size_t", "count")]),
            SyscallDefinition(1, "write", "file", [("int", "fd"), ("const void*", "buf"), ("size_t", "count")]),
            SyscallDefinition(2, "open", "file", [("const char*", "path"), ("int", "flags"), ("mode_t", "mode")]),
            SyscallDefinition(3, "close", "file", [("int", "fd")]),
            SyscallDefinition(4, "stat", "file", [("const char*", "path"), ("struct stat*", "buf")]),
            SyscallDefinition(5, "fstat", "file", [("int", "fd"), ("struct stat*", "buf")]),
            SyscallDefinition(9, "mmap", "memory", [("void*", "addr"), ("size_t", "len"), ("int", "prot"), ("int", "flags")]),
            SyscallDefinition(10, "mprotect", "memory", [("void*", "addr"), ("size_t", "len"), ("int", "prot")]),
            SyscallDefinition(11, "munmap", "memory", [("void*", "addr"), ("size_t", "len")]),
            SyscallDefinition(57, "fork", "process", []),
            SyscallDefinition(59, "execve", "process", [("const char*", "path"), ("char**", "argv"), ("char**", "envp")]),
            SyscallDefinition(60, "exit", "process", [("int", "status")]),
        ]

    def analyze_memory_layout(self) -> list[MemoryRegion]:
        """Analyze kernel memory layout"""
        regions = [
            MemoryRegion("kernel_text", 0xFFFFFFFF80000000, 0xFFFFFFFF81000000, MemoryZone.NORMAL, ["RX"]),
            MemoryRegion("kernel_data", 0xFFFFFFFF81000000, 0xFFFFFFFF82000000, MemoryZone.NORMAL, ["RW"]),
            MemoryRegion("kernel_bss", 0xFFFFFFFF82000000, 0xFFFFFFFF83000000, MemoryZone.NORMAL, ["RW"]),
            MemoryRegion("kernel_heap", 0xFFFFFFFF83000000, 0xFFFFFFFF90000000, MemoryZone.NORMAL, ["RW"]),
            MemoryRegion("vmalloc_area", 0xFFFFFFFF90000000, 0xFFFFFFFFA0000000, MemoryZone.MOVABLE, ["RW"]),
            MemoryRegion("direct_map", 0xFFFF888000000000, 0xFFFF888100000000, MemoryZone.NORMAL, ["RW"]),
            MemoryRegion("dma_zone", 0x0000000000000000, 0x0000000001000000, MemoryZone.DMA, ["RW"]),
            MemoryRegion("dma32_zone", 0x0000000001000000, 0x0000000100000000, MemoryZone.DMA32, ["RW"]),
        ]
        self.memory_map = regions
        return regions


class DriverManager:
    """Manage device drivers"""

    DRIVER_PATHS = {
        DriverType.BLOCK: "drivers/block",
        DriverType.CHARACTER: "drivers/char",
        DriverType.NETWORK: "drivers/net",
        DriverType.GPU: "drivers/gpu",
        DriverType.USB: "drivers/usb",
        DriverType.PCI: "drivers/pci",
        DriverType.INPUT: "drivers/input",
        DriverType.SOUND: "drivers/sound",
        DriverType.STORAGE: "drivers/storage",
        DriverType.VIRTUAL: "drivers/virtual"
    }

    def __init__(self, project_path: str):
        self.project_path = project_path
        self.drivers: dict[str, DriverInfo] = {}
        self.modules: dict[str, KernelModule] = {}

    def scan_drivers(self) -> list[DriverInfo]:
        """Scan all device drivers in the project"""
        drivers = []

        for driver_type, path in self.DRIVER_PATHS.items():
            full_path = os.path.join(self.project_path, path)
            if os.path.exists(full_path):
                for item in os.listdir(full_path):
                    item_path = os.path.join(full_path, item)
                    if os.path.isdir(item_path):
                        driver = DriverInfo(
                            driver_id="",
                            name=item,
                            driver_type=driver_type,
                            version="1.0.0",
                            status=ComponentStatus.UNKNOWN
                        )
                        driver.driver_id = driver.generate_id()

                        # Check for status based on files
                        if os.path.exists(os.path.join(item_path, "Makefile")):
                            driver.status = ComponentStatus.PASSING

                        drivers.append(driver)

        self.drivers = {d.driver_id: d for d in drivers}
        return drivers

    def get_driver_template(self, driver_type: DriverType) -> str:
        """Generate driver template code"""
        templates = {
            DriverType.BLOCK: self._block_driver_template(),
            DriverType.CHARACTER: self._char_driver_template(),
            DriverType.NETWORK: self._net_driver_template(),
        }
        return templates.get(driver_type, self._generic_driver_template())

    def _block_driver_template(self) -> str:
        return '''
/* Block Device Driver Template */
#include <linux/module.h>
#include <linux/blkdev.h>
#include <linux/genhd.h>

#define DEVICE_NAME "mekell_blk"
#define SECTOR_SIZE 512
#define NUM_SECTORS 1024

static struct gendisk *disk;
static struct request_queue *queue;

static void handle_request(struct request_queue *q) {
    struct request *req;
    while ((req = blk_fetch_request(q)) != NULL) {
        // Process block request
        __blk_end_request_all(req, 0);
    }
}

static int __init blk_init(void) {
    // Initialize block device
    return 0;
}

static void __exit blk_exit(void) {
    // Cleanup block device
}

module_init(blk_init);
module_exit(blk_exit);
MODULE_LICENSE("GPL");
'''

    def _char_driver_template(self) -> str:
        return '''
/* Character Device Driver Template */
#include <linux/module.h>
#include <linux/fs.h>
#include <linux/cdev.h>

#define DEVICE_NAME "mekell_chr"

static int major;
static struct cdev cdev;

static int dev_open(struct inode *inode, struct file *file) { return 0; }
static int dev_release(struct inode *inode, struct file *file) { return 0; }
static ssize_t dev_read(struct file *f, char __user *buf, size_t len, loff_t *off) { return 0; }
static ssize_t dev_write(struct file *f, const char __user *buf, size_t len, loff_t *off) { return len; }

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = dev_open,
    .release = dev_release,
    .read = dev_read,
    .write = dev_write,
};

static int __init chr_init(void) {
    // Register character device
    return 0;
}

static void __exit chr_exit(void) {
    // Unregister character device
}

module_init(chr_init);
module_exit(chr_exit);
MODULE_LICENSE("GPL");
'''

    def _net_driver_template(self) -> str:
        return '''
/* Network Device Driver Template */
#include <linux/module.h>
#include <linux/netdevice.h>
#include <linux/etherdevice.h>

#define DEVICE_NAME "mekell_net"

static struct net_device *dev;

static int net_open(struct net_device *dev) { return 0; }
static int net_stop(struct net_device *dev) { return 0; }
static netdev_tx_t net_tx(struct sk_buff *skb, struct net_device *dev) {
    dev_kfree_skb(skb);
    return NETDEV_TX_OK;
}

static struct net_device_ops netdev_ops = {
    .ndo_open = net_open,
    .ndo_stop = net_stop,
    .ndo_start_xmit = net_tx,
};

static int __init net_init(void) {
    // Allocate and register network device
    return 0;
}

static void __exit net_exit(void) {
    // Unregister network device
}

module_init(net_init);
module_exit(net_exit);
MODULE_LICENSE("GPL");
'''

    def _generic_driver_template(self) -> str:
        return '''
/* Generic Driver Template */
#include <linux/module.h>
#include <linux/init.h>

#define DRIVER_NAME "mekell_drv"

static int __init drv_init(void) {
    printk(KERN_INFO "%s: initialized\\n", DRIVER_NAME);
    return 0;
}

static void __exit drv_exit(void) {
    printk(KERN_INFO "%s: exited\\n", DRIVER_NAME);
}

module_init(drv_init);
module_exit(drv_exit);
MODULE_LICENSE("GPL");
MODULE_AUTHOR("Mekell OS Team");
MODULE_DESCRIPTION("Generic Mekell OS Driver");
'''


class BuildOrchestrator:
    """Orchestrate kernel builds"""

    BUILD_CONFIGS = {
        BuildTarget.DEBUG: {"CONFIG_DEBUG_INFO": "y", "CONFIG_DEBUG_KERNEL": "y", "CONFIG_OPTIMIZE": "0"},
        BuildTarget.RELEASE: {"CONFIG_DEBUG_INFO": "n", "CONFIG_OPTIMIZE": "2"},
        BuildTarget.PROFILE: {"CONFIG_DEBUG_INFO": "y", "CONFIG_PROFILE": "y", "CONFIG_OPTIMIZE": "2"},
        BuildTarget.MINIMAL: {"CONFIG_MODULES": "n", "CONFIG_OPTIMIZE": "s"}
    }

    ARCH_TOOLCHAINS = {
        Architecture.X86_64: {"CC": "gcc", "AS": "as", "LD": "ld", "ARCH": "x86_64"},
        Architecture.ARM64: {"CC": "aarch64-linux-gnu-gcc", "AS": "aarch64-linux-gnu-as", "LD": "aarch64-linux-gnu-ld", "ARCH": "arm64"},
        Architecture.RISCV: {"CC": "riscv64-linux-gnu-gcc", "AS": "riscv64-linux-gnu-as", "LD": "riscv64-linux-gnu-ld", "ARCH": "riscv"},
        Architecture.PPC64: {"CC": "powerpc64-linux-gnu-gcc", "AS": "powerpc64-linux-gnu-as", "LD": "powerpc64-linux-gnu-ld", "ARCH": "powerpc"}
    }

    def __init__(self, project_path: str):
        self.project_path = project_path
        self.build_history: list[BuildResult] = []

    def configure(self, target: BuildTarget, arch: Architecture) -> bool:
        """Configure kernel build"""
        config = self.BUILD_CONFIGS.get(target, {})
        toolchain = self.ARCH_TOOLCHAINS.get(arch, {})

        config_path = os.path.join(self.project_path, ".config")

        # Generate config file
        config_lines = [f"{k}={v}" for k, v in config.items()]
        config_lines.extend([f"{k}={v}" for k, v in toolchain.items()])

        try:
            with open(config_path, 'w') as f:
                f.write('\n'.join(config_lines))
            return True
        except:
            return False

    def build(self, target: BuildTarget, arch: Architecture, jobs: int = 4) -> BuildResult:
        """Execute kernel build"""
        start_time = datetime.now()
        result = BuildResult(target=target, architecture=arch, success=False)

        self.configure(target, arch)

        toolchain = self.ARCH_TOOLCHAINS.get(arch, {})
        env = os.environ.copy()
        env.update(toolchain)

        try:
            proc = subprocess.run(
                ["make", f"-j{jobs}"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                env=env,
                timeout=3600
            )

            result.success = proc.returncode == 0

            # Parse warnings and errors
            for line in proc.stderr.split('\n'):
                if 'warning:' in line.lower():
                    result.warnings += 1
                elif 'error:' in line.lower():
                    result.errors.append(line.strip())

            # Find artifacts
            if result.success:
                for artifact in ["vmlinux", "bzImage", "Image", "zImage"]:
                    artifact_path = os.path.join(self.project_path, artifact)
                    if os.path.exists(artifact_path):
                        result.artifacts.append(artifact)

        except subprocess.TimeoutExpired:
            result.errors.append("Build timed out after 1 hour")
        except FileNotFoundError:
            result.errors.append("Make not found")
        except Exception as e:
            result.errors.append(str(e))

        result.duration_seconds = (datetime.now() - start_time).total_seconds()
        self.build_history.append(result)

        return result

    def clean(self) -> bool:
        """Clean build artifacts"""
        try:
            subprocess.run(
                ["make", "clean"],
                cwd=self.project_path,
                capture_output=True
            )
            return True
        except:
            return False


class TestRunner:
    """Run OS test suites"""

    TEST_PATHS = {
        TestType.UNIT: "tests/unit",
        TestType.INTEGRATION: "tests/integration",
        TestType.SYSCALL: "tests/syscall",
        TestType.DRIVER: "tests/driver",
        TestType.STRESS: "tests/stress",
        TestType.SECURITY: "tests/security",
        TestType.PERFORMANCE: "tests/perf"
    }

    def __init__(self, project_path: str):
        self.project_path = project_path
        self.results: list[TestResult] = []

    def run_tests(self, test_type: TestType) -> list[TestResult]:
        """Run specific test suite"""
        results = []
        test_path = os.path.join(self.project_path, self.TEST_PATHS.get(test_type, "tests"))

        if os.path.exists(test_path):
            for test_file in os.listdir(test_path):
                if test_file.startswith("test_") and test_file.endswith(".c"):
                    start_time = datetime.now()

                    # Compile and run test
                    test_name = test_file[:-2]
                    binary_path = os.path.join(test_path, test_name)

                    try:
                        # Compile
                        compile_result = subprocess.run(
                            ["gcc", "-o", binary_path, os.path.join(test_path, test_file)],
                            capture_output=True,
                            text=True
                        )

                        if compile_result.returncode == 0:
                            # Run
                            run_result = subprocess.run(
                                [binary_path],
                                capture_output=True,
                                text=True,
                                timeout=60
                            )

                            result = TestResult(
                                test_type=test_type,
                                name=test_name,
                                passed=run_result.returncode == 0,
                                duration_ms=(datetime.now() - start_time).total_seconds() * 1000,
                                message=run_result.stdout[:500] if run_result.stdout else ""
                            )
                        else:
                            result = TestResult(
                                test_type=test_type,
                                name=test_name,
                                passed=False,
                                message=f"Compilation failed: {compile_result.stderr[:200]}"
                            )
                    except Exception as e:
                        result = TestResult(
                            test_type=test_type,
                            name=test_name,
                            passed=False,
                            message=str(e)
                        )

                    results.append(result)

        self.results.extend(results)
        return results

    def run_all_tests(self) -> dict[TestType, list[TestResult]]:
        """Run all test suites"""
        all_results = {}
        for test_type in TestType:
            all_results[test_type] = self.run_tests(test_type)
        return all_results


# ════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ════════════════════════════════════════════════════════════════════════════

class MekellOSEngine:
    """Main orchestrator for Mekell OS development environment"""

    PROJECT_CONFIG = {
        "name": "Mekell OS",
        "version": "0.1.0",
        "type": "Operating System",
        "languages": ["C", "Assembly", "Rust"],
        "path": "~/Projects/mekell-os"
    }

    SUBSYSTEMS = {
        KernelSubsystem.MEMORY_MANAGEMENT: ["page_alloc.c", "vmalloc.c", "slub.c", "mmap.c"],
        KernelSubsystem.SCHEDULER: ["core.c", "fair.c", "rt.c", "deadline.c"],
        KernelSubsystem.FILESYSTEM: ["vfs.c", "namei.c", "inode.c", "file.c"],
        KernelSubsystem.NETWORKING: ["socket.c", "tcp.c", "udp.c", "ip.c"],
        KernelSubsystem.IPC: ["pipe.c", "shm.c", "msg.c", "sem.c"],
        KernelSubsystem.SECURITY: ["security.c", "capability.c", "selinux.c"],
        KernelSubsystem.INTERRUPTS: ["irq.c", "softirq.c", "tasklet.c"],
    }

    def __init__(self, project_path: str = None):
        self.project_path = project_path or os.path.expanduser(self.PROJECT_CONFIG["path"])

        # Initialize components
        self.git = GitManager(self.project_path)
        self.navigator = KernelNavigator(self.project_path)
        self.drivers = DriverManager(self.project_path)
        self.builder = BuildOrchestrator(self.project_path)
        self.tester = TestRunner(self.project_path)

    def initialize(self) -> dict:
        """Initialize the development environment"""
        return {
            "project": self.PROJECT_CONFIG,
            "git_status": self.git.get_status(),
            "subsystems": len(self.SUBSYSTEMS),
            "syscalls": len(self.navigator.parse_syscall_table()),
            "drivers": len(self.drivers.scan_drivers()),
            "memory_regions": len(self.navigator.analyze_memory_layout()),
            "ready": True
        }

    def get_subsystem_status(self) -> dict[KernelSubsystem, dict]:
        """Get status of all kernel subsystems"""
        status = {}
        for subsystem in KernelSubsystem:
            info = self.navigator.map_subsystem(subsystem)
            status[subsystem] = {
                "path": info["path"],
                "files": len(info["files"]),
                "headers": len(info["headers"]),
                "tests": len(info["tests"]),
                "lines": info["total_lines"]
            }
        return status

    def build_kernel(self, target: BuildTarget = BuildTarget.DEBUG,
                     arch: Architecture = Architecture.X86_64) -> BuildResult:
        """Build the kernel"""
        return self.builder.build(target, arch)

    def run_tests(self, test_type: TestType = None) -> list[TestResult]:
        """Run tests"""
        if test_type:
            return self.tester.run_tests(test_type)
        else:
            all_results = self.tester.run_all_tests()
            return [r for results in all_results.values() for r in results]

    def get_project_metrics(self) -> dict:
        """Get project metrics"""
        subsystem_status = self.get_subsystem_status()
        total_files = sum(s["files"] for s in subsystem_status.values())
        total_lines = sum(s["lines"] for s in subsystem_status.values())

        return {
            "subsystems": len(KernelSubsystem),
            "drivers": len(self.drivers.drivers),
            "syscalls": len(self.navigator.syscalls),
            "memory_regions": len(self.navigator.memory_map),
            "total_source_files": total_files,
            "total_lines": total_lines,
            "architectures_supported": len(Architecture),
            "build_history": len(self.builder.build_history),
            "test_results": len(self.tester.results)
        }


# ════════════════════════════════════════════════════════════════════════════
# REPORTER - Visual Output Generation
# ════════════════════════════════════════════════════════════════════════════

class MekellOSReporter:
    """Generate visual reports for Mekell OS development"""

    STATUS_ICONS = {
        ComponentStatus.PASSING: "●",
        ComponentStatus.FAILING: "○",
        ComponentStatus.BUILDING: "◐",
        ComponentStatus.SKIPPED: "◌",
        ComponentStatus.UNKNOWN: "?"
    }

    SUBSYSTEM_ICONS = {
        KernelSubsystem.MEMORY_MANAGEMENT: "🧠",
        KernelSubsystem.SCHEDULER: "⏱️",
        KernelSubsystem.FILESYSTEM: "📁",
        KernelSubsystem.NETWORKING: "🌐",
        KernelSubsystem.IPC: "📨",
        KernelSubsystem.SECURITY: "🔒",
        KernelSubsystem.INTERRUPTS: "⚡",
        KernelSubsystem.TIMERS: "⏰",
        KernelSubsystem.POWER: "🔋",
        KernelSubsystem.CRYPTO: "🔐"
    }

    def __init__(self, engine: MekellOSEngine):
        self.engine = engine

    def generate_status_report(self) -> str:
        """Generate comprehensive status report"""
        git = self.engine.git.get_status()
        metrics = self.engine.get_project_metrics()

        state = "●" if git.clean else "◐"
        state_text = "clean" if git.clean else "modified"

        report = f"""
PROJECT: MEKELL OS
═══════════════════════════════════════════════════
Environment: Development
Status: Active
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
═══════════════════════════════════════════════════

PROJECT STATUS
────────────────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│       MEKELL OS CONTEXT                         │
│                                                 │
│  Path: {self.engine.project_path:<35} │
│  Branch: {git.branch:<33} │
│  State: {state} {state_text:<33} │
│                                                 │
│  Uncommitted: {len(git.modified):<5} files                      │
│  Last Commit: {git.last_commit:<33} │
│  Author: {git.last_author:<33} │
└─────────────────────────────────────────────────┘

KERNEL SUBSYSTEMS
────────────────────────────────────────────────────
"""
        subsystems = self.engine.get_subsystem_status()
        for subsys, info in subsystems.items():
            icon = self.SUBSYSTEM_ICONS.get(subsys, "○")
            report += f"  {icon} {subsys.value:<20} {info['files']:>3} files  {info['lines']:>6} lines\n"

        report += f"""
ARCHITECTURE SUPPORT
────────────────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│  /kernel/arch                                   │
"""
        for arch in Architecture:
            report += f"│  ├── /{arch.value:<42} │\n"

        report += f"""└─────────────────────────────────────────────────┘

DRIVER SUBSYSTEM
────────────────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│  /drivers                                       │
"""
        for driver_type in DriverType:
            path = DriverManager.DRIVER_PATHS.get(driver_type, "")
            count = len([d for d in self.engine.drivers.drivers.values() if d.driver_type == driver_type])
            report += f"│  ├── /{driver_type.value:<12} [{count:>2} drivers]             │\n"

        report += f"""└─────────────────────────────────────────────────┘

PROJECT METRICS
────────────────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│  Subsystems:        {metrics['subsystems']:<26} │
│  System Calls:      {metrics['syscalls']:<26} │
│  Drivers:           {metrics['drivers']:<26} │
│  Source Files:      {metrics['total_source_files']:<26} │
│  Lines of Code:     {metrics['total_lines']:<26} │
│  Architectures:     {metrics['architectures_supported']:<26} │
└─────────────────────────────────────────────────┘

MEMORY LAYOUT
────────────────────────────────────────────────────
"""
        for region in self.engine.navigator.memory_map[:5]:
            report += f"  0x{region.start_addr:016X} - 0x{region.end_addr:016X}  {region.name}\n"

        report += """
Ready for development assistance.
"""
        return report

    def generate_build_report(self, result: BuildResult) -> str:
        """Generate build result report"""
        status = "● SUCCESS" if result.success else "○ FAILED"

        report = f"""
BUILD RESULT
═══════════════════════════════════════════════════
Target: {result.target.value}
Architecture: {result.architecture.value}
Status: {status}
Duration: {result.duration_seconds:.1f}s
═══════════════════════════════════════════════════

SUMMARY
────────────────────────────────────────────────────
  Warnings: {result.warnings}
  Errors: {len(result.errors)}
  Artifacts: {len(result.artifacts)}
"""
        if result.artifacts:
            report += "\nARTIFACTS\n"
            for artifact in result.artifacts:
                report += f"  ✓ {artifact}\n"

        if result.errors:
            report += "\nERRORS\n"
            for error in result.errors[:10]:
                report += f"  ✗ {error[:70]}\n"

        return report


# ════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Mekell OS Development Environment")
    parser.add_argument("--project-path", default=None, help="Path to project")

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    subparsers.add_parser("status", help="Show project status")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build kernel")
    build_parser.add_argument("--target", choices=["debug", "release", "profile", "minimal"], default="debug")
    build_parser.add_argument("--arch", choices=["x86_64", "arm64", "riscv", "ppc64"], default="x86_64")
    build_parser.add_argument("-j", "--jobs", type=int, default=4)

    # Test command
    test_parser = subparsers.add_parser("test", help="Run tests")
    test_parser.add_argument("--type", choices=["unit", "integration", "syscall", "driver", "stress", "security", "perf"])

    # Clean command
    subparsers.add_parser("clean", help="Clean build artifacts")

    # Driver command
    driver_parser = subparsers.add_parser("driver", help="Driver management")
    driver_parser.add_argument("action", choices=["list", "template"])
    driver_parser.add_argument("--type", choices=["block", "char", "net", "gpu", "usb"])

    # Subsystem command
    subsystem_parser = subparsers.add_parser("subsystem", help="Analyze subsystem")
    subsystem_parser.add_argument("name", choices=["mm", "sched", "fs", "net", "ipc", "security", "irq"])

    args = parser.parse_args()

    engine = MekellOSEngine(args.project_path)
    reporter = MekellOSReporter(engine)

    if args.command == "status" or args.command is None:
        engine.initialize()
        print(reporter.generate_status_report())

    elif args.command == "build":
        target_map = {"debug": BuildTarget.DEBUG, "release": BuildTarget.RELEASE,
                      "profile": BuildTarget.PROFILE, "minimal": BuildTarget.MINIMAL}
        arch_map = {"x86_64": Architecture.X86_64, "arm64": Architecture.ARM64,
                    "riscv": Architecture.RISCV, "ppc64": Architecture.PPC64}

        result = engine.build_kernel(target_map[args.target], arch_map[args.arch])
        print(reporter.generate_build_report(result))

    elif args.command == "test":
        if args.type:
            type_map = {"unit": TestType.UNIT, "integration": TestType.INTEGRATION,
                       "syscall": TestType.SYSCALL, "driver": TestType.DRIVER,
                       "stress": TestType.STRESS, "security": TestType.SECURITY, "perf": TestType.PERFORMANCE}
            results = engine.run_tests(type_map[args.type])
        else:
            results = engine.run_tests()

        passed = sum(1 for r in results if r.passed)
        print(f"\nTest Results: {passed}/{len(results)} passed")
        for r in results:
            icon = "✓" if r.passed else "✗"
            print(f"  {icon} {r.name}: {r.message[:50] if r.message else 'OK'}")

    elif args.command == "clean":
        if engine.builder.clean():
            print("Build artifacts cleaned.")
        else:
            print("Clean failed.")

    elif args.command == "driver":
        if args.action == "list":
            engine.drivers.scan_drivers()
            for driver in engine.drivers.drivers.values():
                print(f"  {driver.name} ({driver.driver_type.value}): {driver.status.value}")
        elif args.action == "template" and args.type:
            type_map = {"block": DriverType.BLOCK, "char": DriverType.CHARACTER,
                       "net": DriverType.NETWORK, "gpu": DriverType.GPU, "usb": DriverType.USB}
            print(engine.drivers.get_driver_template(type_map[args.type]))

    elif args.command == "subsystem":
        subsys_map = {"mm": KernelSubsystem.MEMORY_MANAGEMENT, "sched": KernelSubsystem.SCHEDULER,
                      "fs": KernelSubsystem.FILESYSTEM, "net": KernelSubsystem.NETWORKING,
                      "ipc": KernelSubsystem.IPC, "security": KernelSubsystem.SECURITY,
                      "irq": KernelSubsystem.INTERRUPTS}
        info = engine.navigator.map_subsystem(subsys_map[args.name])
        print(f"\nSubsystem: {args.name}")
        print(f"  Path: {info['path']}")
        print(f"  Source files: {len(info['files'])}")
        print(f"  Headers: {len(info['headers'])}")
        print(f"  Tests: {len(info['tests'])}")
        print(f"  Total lines: {info['total_lines']}")


if __name__ == "__main__":
    main()
```

---

## USAGE EXAMPLES

### Initialize Environment
```bash
# Activate Mekell OS development context
/project-mekell-os

# Check project status
/project-mekell-os status
```

### Build Kernel
```bash
# Debug build for x86_64
/project-mekell-os build --target debug --arch x86_64

# Release build for ARM64
/project-mekell-os build --target release --arch arm64 -j 8

# Minimal build for embedded
/project-mekell-os build --target minimal
```

### Run Tests
```bash
# Run all tests
/project-mekell-os test

# Run syscall tests
/project-mekell-os test --type syscall

# Run driver tests
/project-mekell-os test --type driver
```

### Driver Development
```bash
# List all drivers
/project-mekell-os driver list

# Get block driver template
/project-mekell-os driver template --type block

# Get network driver template
/project-mekell-os driver template --type net
```

### Analyze Subsystems
```bash
# Analyze memory management
/project-mekell-os subsystem mm

# Analyze scheduler
/project-mekell-os subsystem sched

# Analyze filesystem layer
/project-mekell-os subsystem fs
```

---

## QUICK COMMANDS

| Command | Description |
|---------|-------------|
| `/project-mekell-os` | Activate project context |
| `/project-mekell-os status` | Show detailed status |
| `/project-mekell-os build` | Build kernel |
| `/project-mekell-os test` | Run test suite |
| `/project-mekell-os driver list` | List drivers |
| `/project-mekell-os clean` | Clean artifacts |

$ARGUMENTS
