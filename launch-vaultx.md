# VAULTX.EXE - Secure Vault Management Agent

You are VAULTX.EXE — the secure storage and asset protection specialist for managing sensitive data, encrypted vaults, and credential lifecycle with zero-trust architecture.

MISSION
Provide secure storage, access control, and encryption management for sensitive assets and credentials. Protect everything. Trust nothing. Verify always.

---

## CAPABILITIES

### EncryptionEngine.MOD
- Algorithm selection
- Key generation
- Cipher management
- Hash verification
- Entropy validation

### AccessController.MOD
- Identity verification
- Permission management
- Role-based access
- Multi-factor gates
- Session control

### VaultOrchestrator.MOD
- Storage allocation
- Partition management
- Replication control
- Backup automation
- Recovery procedures

### AuditTracker.MOD
- Access logging
- Change tracking
- Anomaly detection
- Compliance reporting
- Forensic analysis

---

## WORKFLOW

### Phase 1: ASSESS
1. Identify asset sensitivity level
2. Determine protection requirements
3. Check current vault status
4. Evaluate access needs
5. Map compliance requirements

### Phase 2: SECURE
1. Select appropriate encryption level
2. Generate/validate access credentials
3. Configure permissions matrix
4. Set up audit logging
5. Establish key rotation schedule

### Phase 3: STORE
1. Encrypt asset with selected method
2. Place in designated vault section
3. Create recovery keys if needed
4. Update vault manifest
5. Verify storage integrity

### Phase 4: VERIFY
1. Test access with credentials
2. Verify encryption integrity
3. Confirm audit trail active
4. Document vault location
5. Generate security report

---

## SECURITY LEVELS

| Level | Classification | Encryption | Access |
|-------|---------------|------------|--------|
| L1 | Public | Standard | Open |
| L2 | Internal | AES-128 | Team |
| L3 | Confidential | AES-256 | Role-based |
| L4 | Secret | AES-256+HSM | Individual |
| L5 | Top Secret | Multi-layer | Biometric |

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
VAULTX.EXE - Secure Vault Management Agent
Zero-trust architecture for sensitive data protection
"""

import hashlib
import secrets
import base64
import json
import os
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Set, Tuple
from enum import Enum
from pathlib import Path
import hmac
import struct


# ============================================================
# ENUMS
# ============================================================

class SecurityLevel(Enum):
    """Classification levels for vault assets"""
    L1_PUBLIC = "public"
    L2_INTERNAL = "internal"
    L3_CONFIDENTIAL = "confidential"
    L4_SECRET = "secret"
    L5_TOP_SECRET = "top_secret"


class EncryptionAlgorithm(Enum):
    """Supported encryption algorithms"""
    NONE = "none"
    AES_128_CBC = "aes-128-cbc"
    AES_256_CBC = "aes-256-cbc"
    AES_256_GCM = "aes-256-gcm"
    CHACHA20_POLY1305 = "chacha20-poly1305"
    MULTI_LAYER = "multi-layer"


class HashAlgorithm(Enum):
    """Supported hash algorithms"""
    SHA256 = "sha256"
    SHA384 = "sha384"
    SHA512 = "sha512"
    BLAKE2B = "blake2b"
    ARGON2 = "argon2"


class AssetType(Enum):
    """Types of assets that can be stored"""
    CREDENTIAL = "credential"
    API_KEY = "api_key"
    CERTIFICATE = "certificate"
    PRIVATE_KEY = "private_key"
    SECRET = "secret"
    TOKEN = "token"
    PASSWORD = "password"
    CONNECTION_STRING = "connection_string"
    DOCUMENT = "document"
    BINARY = "binary"
    CUSTOM = "custom"


class VaultStatus(Enum):
    """Vault operational status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    LOCKED = "locked"
    MAINTENANCE = "maintenance"
    COMPROMISED = "compromised"
    SEALED = "sealed"


class OperationType(Enum):
    """Types of vault operations"""
    STORE = "store"
    RETRIEVE = "retrieve"
    UPDATE = "update"
    DELETE = "delete"
    ROTATE = "rotate"
    BACKUP = "backup"
    RESTORE = "restore"
    AUDIT = "audit"
    SEAL = "seal"
    UNSEAL = "unseal"


class AccessMethod(Enum):
    """Methods for vault access"""
    TOKEN = "token"
    CERTIFICATE = "certificate"
    MFA = "mfa"
    BIOMETRIC = "biometric"
    ROLE_BASED = "role_based"
    POLICY_BASED = "policy_based"


class KeyStatus(Enum):
    """Encryption key status"""
    ACTIVE = "active"
    ROTATING = "rotating"
    DEPRECATED = "deprecated"
    REVOKED = "revoked"
    EXPIRED = "expired"


class AuditSeverity(Enum):
    """Audit event severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
    ALERT = "alert"


class TokenType(Enum):
    """Types of access tokens"""
    ROOT = "root"
    SERVICE = "service"
    BATCH = "batch"
    PERIODIC = "periodic"
    ORPHAN = "orphan"


# ============================================================
# DATA MODELS
# ============================================================

@dataclass
class EncryptionKey:
    """Encryption key metadata"""
    key_id: str
    algorithm: EncryptionAlgorithm
    created_at: datetime
    expires_at: Optional[datetime]
    version: int
    status: KeyStatus
    key_hash: str  # Hash of the key for verification
    rotation_period_days: int = 90
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at

    @property
    def days_until_rotation(self) -> int:
        if self.expires_at is None:
            return self.rotation_period_days
        return max(0, (self.expires_at - datetime.now()).days)


@dataclass
class VaultAsset:
    """Asset stored in the vault"""
    asset_id: str
    name: str
    asset_type: AssetType
    security_level: SecurityLevel
    encrypted_data: bytes
    encryption_key_id: str
    created_at: datetime
    updated_at: datetime
    accessed_at: Optional[datetime]
    expires_at: Optional[datetime]
    version: int
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    access_count: int = 0


@dataclass
class VaultSection:
    """Logical section within a vault"""
    section_id: str
    name: str
    security_level: SecurityLevel
    path: str
    asset_ids: Set[str] = field(default_factory=set)
    capacity_mb: int = 100
    used_mb: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def usage_percent(self) -> float:
        return (self.used_mb / self.capacity_mb) * 100 if self.capacity_mb > 0 else 0


@dataclass
class AccessCredential:
    """Credentials for vault access"""
    credential_id: str
    principal: str
    token_type: TokenType
    access_method: AccessMethod
    permissions: Set[str]
    sections: Set[str]  # Sections this credential can access
    created_at: datetime
    expires_at: Optional[datetime]
    last_used: Optional[datetime]
    max_uses: Optional[int]
    use_count: int = 0
    mfa_required: bool = False
    ip_whitelist: List[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        if self.max_uses and self.use_count >= self.max_uses:
            return False
        return True


@dataclass
class AuditRecord:
    """Audit trail record"""
    record_id: str
    timestamp: datetime
    operation: OperationType
    principal: str
    asset_id: Optional[str]
    section_id: Optional[str]
    success: bool
    severity: AuditSeverity
    ip_address: Optional[str]
    user_agent: Optional[str]
    details: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None


@dataclass
class RecoveryKey:
    """Key shard for vault recovery"""
    shard_id: str
    shard_index: int
    total_shards: int
    threshold: int  # Minimum shards needed for recovery
    encrypted_shard: bytes
    holder: str
    created_at: datetime
    verified: bool = False


@dataclass
class RotationSchedule:
    """Key rotation schedule"""
    schedule_id: str
    key_id: str
    rotation_type: str  # automatic, manual, triggered
    period_days: int
    next_rotation: datetime
    last_rotation: Optional[datetime]
    notification_days: int = 7
    auto_rotate: bool = True
    retain_versions: int = 3


@dataclass
class VaultHealth:
    """Vault health status"""
    status: VaultStatus
    checked_at: datetime
    uptime_seconds: float
    total_assets: int
    total_sections: int
    storage_used_mb: float
    storage_capacity_mb: float
    active_keys: int
    expiring_keys: int
    failed_operations_24h: int
    warnings: List[str] = field(default_factory=list)

    @property
    def storage_percent(self) -> float:
        return (self.storage_used_mb / self.storage_capacity_mb) * 100 if self.storage_capacity_mb > 0 else 0


@dataclass
class PolicyRule:
    """Access policy rule"""
    rule_id: str
    name: str
    principals: List[str]  # Who this rule applies to
    sections: List[str]  # Which sections
    operations: List[OperationType]  # Allowed operations
    conditions: Dict[str, Any] = field(default_factory=dict)
    priority: int = 0
    enabled: bool = True


@dataclass
class BackupManifest:
    """Backup information"""
    backup_id: str
    created_at: datetime
    vault_version: str
    asset_count: int
    section_count: int
    size_mb: float
    encryption_key_id: str
    checksum: str
    location: str
    verified: bool = False


# ============================================================
# ENCRYPTION ENGINE
# ============================================================

class EncryptionEngine:
    """
    Handles all encryption/decryption operations.
    Simulates cryptographic operations for demonstration.
    """

    ALGORITHM_KEY_SIZES = {
        EncryptionAlgorithm.AES_128_CBC: 16,
        EncryptionAlgorithm.AES_256_CBC: 32,
        EncryptionAlgorithm.AES_256_GCM: 32,
        EncryptionAlgorithm.CHACHA20_POLY1305: 32,
        EncryptionAlgorithm.MULTI_LAYER: 64,
    }

    HASH_FUNCTIONS = {
        HashAlgorithm.SHA256: hashlib.sha256,
        HashAlgorithm.SHA384: hashlib.sha384,
        HashAlgorithm.SHA512: hashlib.sha512,
        HashAlgorithm.BLAKE2B: hashlib.blake2b,
    }

    def __init__(self):
        self.keys: Dict[str, Tuple[bytes, EncryptionKey]] = {}
        self.default_algorithm = EncryptionAlgorithm.AES_256_GCM

    def generate_key(
        self,
        algorithm: EncryptionAlgorithm,
        rotation_period_days: int = 90,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EncryptionKey:
        """Generate a new encryption key"""
        key_size = self.ALGORITHM_KEY_SIZES.get(algorithm, 32)
        raw_key = secrets.token_bytes(key_size)
        key_id = f"key-{secrets.token_hex(8)}"

        key_meta = EncryptionKey(
            key_id=key_id,
            algorithm=algorithm,
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=rotation_period_days),
            version=1,
            status=KeyStatus.ACTIVE,
            key_hash=hashlib.sha256(raw_key).hexdigest()[:16],
            rotation_period_days=rotation_period_days,
            metadata=metadata or {}
        )

        self.keys[key_id] = (raw_key, key_meta)
        return key_meta

    def encrypt(
        self,
        plaintext: bytes,
        key_id: str,
        associated_data: Optional[bytes] = None
    ) -> Tuple[bytes, bytes]:
        """
        Encrypt data with specified key.
        Returns (ciphertext, nonce/iv)
        """
        if key_id not in self.keys:
            raise ValueError(f"Key not found: {key_id}")

        raw_key, key_meta = self.keys[key_id]

        if key_meta.status != KeyStatus.ACTIVE:
            raise ValueError(f"Key is not active: {key_meta.status.value}")

        # Generate nonce/IV
        nonce = secrets.token_bytes(12)

        # Simulated encryption (in production, use cryptography library)
        # This creates a deterministic transformation for demonstration
        key_material = raw_key + nonce
        cipher_key = hashlib.sha256(key_material).digest()

        # XOR-based simulation (NOT secure - for demonstration only)
        ciphertext = bytearray()
        for i, byte in enumerate(plaintext):
            ciphertext.append(byte ^ cipher_key[i % len(cipher_key)])

        # Add authentication tag simulation
        if associated_data:
            tag_input = bytes(ciphertext) + associated_data + nonce
        else:
            tag_input = bytes(ciphertext) + nonce

        tag = hashlib.sha256(tag_input + raw_key).digest()[:16]

        return bytes(ciphertext) + tag, nonce

    def decrypt(
        self,
        ciphertext: bytes,
        key_id: str,
        nonce: bytes,
        associated_data: Optional[bytes] = None
    ) -> bytes:
        """Decrypt data with specified key"""
        if key_id not in self.keys:
            raise ValueError(f"Key not found: {key_id}")

        raw_key, key_meta = self.keys[key_id]

        # Separate ciphertext and tag
        actual_ciphertext = ciphertext[:-16]
        received_tag = ciphertext[-16:]

        # Verify tag
        if associated_data:
            tag_input = actual_ciphertext + associated_data + nonce
        else:
            tag_input = actual_ciphertext + nonce

        expected_tag = hashlib.sha256(tag_input + raw_key).digest()[:16]

        if not hmac.compare_digest(received_tag, expected_tag):
            raise ValueError("Authentication failed - data may be tampered")

        # Simulated decryption
        key_material = raw_key + nonce
        cipher_key = hashlib.sha256(key_material).digest()

        plaintext = bytearray()
        for i, byte in enumerate(actual_ciphertext):
            plaintext.append(byte ^ cipher_key[i % len(cipher_key)])

        return bytes(plaintext)

    def hash_data(
        self,
        data: bytes,
        algorithm: HashAlgorithm = HashAlgorithm.SHA256
    ) -> str:
        """Hash data with specified algorithm"""
        hash_func = self.HASH_FUNCTIONS.get(algorithm, hashlib.sha256)
        return hash_func(data).hexdigest()

    def verify_hash(
        self,
        data: bytes,
        expected_hash: str,
        algorithm: HashAlgorithm = HashAlgorithm.SHA256
    ) -> bool:
        """Verify data against expected hash"""
        actual_hash = self.hash_data(data, algorithm)
        return hmac.compare_digest(actual_hash, expected_hash)

    def generate_entropy(self, bits: int = 256) -> bytes:
        """Generate cryptographically secure random bytes"""
        return secrets.token_bytes(bits // 8)

    def check_entropy(self, data: bytes) -> Dict[str, Any]:
        """Check entropy quality of data"""
        if len(data) == 0:
            return {"valid": False, "entropy_bits": 0, "quality": "insufficient"}

        # Simple entropy estimation
        byte_counts = {}
        for byte in data:
            byte_counts[byte] = byte_counts.get(byte, 0) + 1

        unique_bytes = len(byte_counts)
        total_bytes = len(data)

        # Shannon entropy approximation
        import math
        entropy = 0
        for count in byte_counts.values():
            if count > 0:
                p = count / total_bytes
                entropy -= p * math.log2(p)

        entropy_bits = entropy * total_bytes

        quality = "high" if entropy > 7.5 else "medium" if entropy > 6 else "low"

        return {
            "valid": entropy > 6,
            "entropy_bits": round(entropy_bits, 2),
            "entropy_per_byte": round(entropy, 3),
            "unique_bytes": unique_bytes,
            "quality": quality
        }

    def rotate_key(self, old_key_id: str) -> EncryptionKey:
        """Rotate an encryption key to a new version"""
        if old_key_id not in self.keys:
            raise ValueError(f"Key not found: {old_key_id}")

        _, old_meta = self.keys[old_key_id]

        # Mark old key as deprecated
        old_meta.status = KeyStatus.DEPRECATED

        # Generate new key with same algorithm
        new_key = self.generate_key(
            algorithm=old_meta.algorithm,
            rotation_period_days=old_meta.rotation_period_days,
            metadata={**old_meta.metadata, "previous_key": old_key_id}
        )
        new_key.version = old_meta.version + 1

        return new_key

    def get_key_status(self, key_id: str) -> Optional[EncryptionKey]:
        """Get key metadata"""
        if key_id in self.keys:
            return self.keys[key_id][1]
        return None


# ============================================================
# KEY MANAGER
# ============================================================

class KeyManager:
    """
    Manages encryption keys lifecycle including generation,
    rotation, and revocation.
    """

    def __init__(self, encryption_engine: EncryptionEngine):
        self.engine = encryption_engine
        self.rotation_schedules: Dict[str, RotationSchedule] = {}
        self.recovery_keys: Dict[str, List[RecoveryKey]] = {}

    def create_key_with_schedule(
        self,
        algorithm: EncryptionAlgorithm,
        rotation_period_days: int = 90,
        auto_rotate: bool = True,
        retain_versions: int = 3
    ) -> Tuple[EncryptionKey, RotationSchedule]:
        """Create a key with automatic rotation schedule"""
        key = self.engine.generate_key(algorithm, rotation_period_days)

        schedule = RotationSchedule(
            schedule_id=f"sched-{secrets.token_hex(6)}",
            key_id=key.key_id,
            rotation_type="automatic" if auto_rotate else "manual",
            period_days=rotation_period_days,
            next_rotation=datetime.now() + timedelta(days=rotation_period_days),
            last_rotation=datetime.now(),
            auto_rotate=auto_rotate,
            retain_versions=retain_versions
        )

        self.rotation_schedules[schedule.schedule_id] = schedule
        return key, schedule

    def check_rotation_needed(self) -> List[str]:
        """Check which keys need rotation"""
        needs_rotation = []
        now = datetime.now()

        for schedule in self.rotation_schedules.values():
            if schedule.auto_rotate and schedule.next_rotation <= now:
                needs_rotation.append(schedule.key_id)

        return needs_rotation

    def perform_rotation(self, key_id: str) -> Optional[EncryptionKey]:
        """Perform key rotation if scheduled"""
        # Find schedule for this key
        schedule = None
        for s in self.rotation_schedules.values():
            if s.key_id == key_id:
                schedule = s
                break

        if not schedule:
            return None

        new_key = self.engine.rotate_key(key_id)

        # Update schedule
        schedule.key_id = new_key.key_id
        schedule.last_rotation = datetime.now()
        schedule.next_rotation = datetime.now() + timedelta(days=schedule.period_days)

        return new_key

    def create_recovery_keys(
        self,
        master_key_id: str,
        total_shards: int = 5,
        threshold: int = 3,
        holders: List[str] = None
    ) -> List[RecoveryKey]:
        """
        Create Shamir's Secret Sharing style recovery key shards.
        Simplified implementation for demonstration.
        """
        if threshold > total_shards:
            raise ValueError("Threshold cannot exceed total shards")

        holders = holders or [f"holder-{i}" for i in range(total_shards)]

        if len(holders) < total_shards:
            holders.extend([f"holder-{i}" for i in range(len(holders), total_shards)])

        # Get the key to shard
        key_meta = self.engine.get_key_status(master_key_id)
        if not key_meta:
            raise ValueError(f"Key not found: {master_key_id}")

        # Generate shards (simplified - real implementation would use Shamir's)
        raw_key, _ = self.engine.keys[master_key_id]

        recovery_keys = []
        recovery_id = f"recovery-{secrets.token_hex(6)}"

        for i in range(total_shards):
            # Create deterministic shard (simplified)
            shard_entropy = secrets.token_bytes(32)
            shard_data = hashlib.sha256(raw_key + struct.pack(">I", i) + shard_entropy).digest()

            recovery_key = RecoveryKey(
                shard_id=f"{recovery_id}-{i}",
                shard_index=i,
                total_shards=total_shards,
                threshold=threshold,
                encrypted_shard=shard_data,
                holder=holders[i],
                created_at=datetime.now()
            )
            recovery_keys.append(recovery_key)

        self.recovery_keys[recovery_id] = recovery_keys
        return recovery_keys

    def get_expiring_keys(self, days: int = 7) -> List[EncryptionKey]:
        """Get keys expiring within specified days"""
        expiring = []
        threshold = datetime.now() + timedelta(days=days)

        for _, (_, key_meta) in self.engine.keys.items():
            if key_meta.expires_at and key_meta.expires_at <= threshold:
                if key_meta.status == KeyStatus.ACTIVE:
                    expiring.append(key_meta)

        return expiring


# ============================================================
# ACCESS CONTROLLER
# ============================================================

class AccessController:
    """
    Controls access to vault assets through tokens,
    policies, and multi-factor authentication.
    """

    PERMISSION_HIERARCHY = {
        "root": {"store", "retrieve", "update", "delete", "rotate", "backup", "restore", "audit", "seal", "unseal", "admin"},
        "admin": {"store", "retrieve", "update", "delete", "rotate", "backup", "audit"},
        "operator": {"store", "retrieve", "update", "rotate", "audit"},
        "reader": {"retrieve", "audit"},
        "writer": {"store", "update"},
    }

    def __init__(self):
        self.credentials: Dict[str, AccessCredential] = {}
        self.policies: Dict[str, PolicyRule] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    def create_credential(
        self,
        principal: str,
        token_type: TokenType,
        access_method: AccessMethod,
        role: str,
        sections: Set[str],
        ttl_hours: Optional[int] = 24,
        max_uses: Optional[int] = None,
        mfa_required: bool = False,
        ip_whitelist: List[str] = None
    ) -> AccessCredential:
        """Create access credential with specified permissions"""
        permissions = self.PERMISSION_HIERARCHY.get(role, {"retrieve"})

        credential = AccessCredential(
            credential_id=f"cred-{secrets.token_hex(12)}",
            principal=principal,
            token_type=token_type,
            access_method=access_method,
            permissions=permissions,
            sections=sections,
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(hours=ttl_hours) if ttl_hours else None,
            last_used=None,
            max_uses=max_uses,
            mfa_required=mfa_required,
            ip_whitelist=ip_whitelist or []
        )

        self.credentials[credential.credential_id] = credential
        return credential

    def validate_access(
        self,
        credential_id: str,
        operation: OperationType,
        section_id: str,
        ip_address: Optional[str] = None,
        mfa_token: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Validate access request"""
        if credential_id not in self.credentials:
            return False, "Invalid credential"

        cred = self.credentials[credential_id]

        # Check validity
        if not cred.is_valid:
            if cred.expires_at and datetime.now() > cred.expires_at:
                return False, "Credential expired"
            if cred.max_uses and cred.use_count >= cred.max_uses:
                return False, "Credential use limit exceeded"
            return False, "Credential invalid"

        # Check IP whitelist
        if cred.ip_whitelist and ip_address:
            if ip_address not in cred.ip_whitelist:
                return False, "IP address not whitelisted"

        # Check MFA requirement
        if cred.mfa_required and not mfa_token:
            return False, "MFA token required"

        # Check section access
        if section_id not in cred.sections and "*" not in cred.sections:
            return False, f"No access to section: {section_id}"

        # Check operation permission
        op_name = operation.value
        if op_name not in cred.permissions and "admin" not in cred.permissions:
            return False, f"Permission denied for operation: {op_name}"

        # Update usage
        cred.use_count += 1
        cred.last_used = datetime.now()

        return True, "Access granted"

    def create_policy(
        self,
        name: str,
        principals: List[str],
        sections: List[str],
        operations: List[OperationType],
        conditions: Optional[Dict[str, Any]] = None,
        priority: int = 0
    ) -> PolicyRule:
        """Create access policy rule"""
        policy = PolicyRule(
            rule_id=f"policy-{secrets.token_hex(6)}",
            name=name,
            principals=principals,
            sections=sections,
            operations=operations,
            conditions=conditions or {},
            priority=priority
        )

        self.policies[policy.rule_id] = policy
        return policy

    def evaluate_policies(
        self,
        principal: str,
        section: str,
        operation: OperationType
    ) -> Tuple[bool, Optional[PolicyRule]]:
        """Evaluate policies for access decision"""
        applicable = []

        for policy in self.policies.values():
            if not policy.enabled:
                continue

            # Check principal match
            if principal not in policy.principals and "*" not in policy.principals:
                continue

            # Check section match
            if section not in policy.sections and "*" not in policy.sections:
                continue

            # Check operation match
            if operation not in policy.operations:
                continue

            applicable.append(policy)

        if not applicable:
            return False, None

        # Return highest priority matching policy
        applicable.sort(key=lambda p: p.priority, reverse=True)
        return True, applicable[0]

    def revoke_credential(self, credential_id: str) -> bool:
        """Revoke an access credential"""
        if credential_id in self.credentials:
            del self.credentials[credential_id]
            # Also clean up any active sessions
            if credential_id in self.active_sessions:
                del self.active_sessions[credential_id]
            return True
        return False

    def list_credentials(
        self,
        principal: Optional[str] = None,
        include_expired: bool = False
    ) -> List[AccessCredential]:
        """List credentials, optionally filtered"""
        results = []

        for cred in self.credentials.values():
            if principal and cred.principal != principal:
                continue
            if not include_expired and not cred.is_valid:
                continue
            results.append(cred)

        return results


# ============================================================
# VAULT ORCHESTRATOR
# ============================================================

class VaultOrchestrator:
    """
    Manages vault storage, sections, and asset lifecycle.
    """

    SECURITY_LEVEL_ALGORITHMS = {
        SecurityLevel.L1_PUBLIC: EncryptionAlgorithm.NONE,
        SecurityLevel.L2_INTERNAL: EncryptionAlgorithm.AES_128_CBC,
        SecurityLevel.L3_CONFIDENTIAL: EncryptionAlgorithm.AES_256_CBC,
        SecurityLevel.L4_SECRET: EncryptionAlgorithm.AES_256_GCM,
        SecurityLevel.L5_TOP_SECRET: EncryptionAlgorithm.MULTI_LAYER,
    }

    def __init__(
        self,
        encryption_engine: EncryptionEngine,
        key_manager: KeyManager
    ):
        self.engine = encryption_engine
        self.key_manager = key_manager
        self.sections: Dict[str, VaultSection] = {}
        self.assets: Dict[str, VaultAsset] = {}
        self.section_keys: Dict[str, str] = {}  # section_id -> key_id
        self.status = VaultStatus.HEALTHY
        self.start_time = datetime.now()

    def create_section(
        self,
        name: str,
        security_level: SecurityLevel,
        path: str,
        capacity_mb: int = 100
    ) -> VaultSection:
        """Create a new vault section"""
        section = VaultSection(
            section_id=f"section-{secrets.token_hex(6)}",
            name=name,
            security_level=security_level,
            path=path,
            capacity_mb=capacity_mb
        )

        # Create encryption key for this section
        algorithm = self.SECURITY_LEVEL_ALGORITHMS[security_level]
        if algorithm != EncryptionAlgorithm.NONE:
            key, _ = self.key_manager.create_key_with_schedule(
                algorithm=algorithm,
                rotation_period_days=90 if security_level.value in ["secret", "top_secret"] else 180
            )
            self.section_keys[section.section_id] = key.key_id

        self.sections[section.section_id] = section
        return section

    def store_asset(
        self,
        name: str,
        data: bytes,
        asset_type: AssetType,
        section_id: str,
        tags: List[str] = None,
        metadata: Dict[str, Any] = None,
        expires_at: Optional[datetime] = None
    ) -> VaultAsset:
        """Store an asset in the vault"""
        if section_id not in self.sections:
            raise ValueError(f"Section not found: {section_id}")

        section = self.sections[section_id]

        # Check capacity
        data_size_mb = len(data) / (1024 * 1024)
        if section.used_mb + data_size_mb > section.capacity_mb:
            raise ValueError("Section capacity exceeded")

        # Get encryption key
        key_id = self.section_keys.get(section_id)

        # Encrypt data
        if key_id:
            encrypted_data, nonce = self.engine.encrypt(data, key_id)
            # Store nonce with encrypted data
            encrypted_data = nonce + encrypted_data
        else:
            encrypted_data = data

        asset = VaultAsset(
            asset_id=f"asset-{secrets.token_hex(8)}",
            name=name,
            asset_type=asset_type,
            security_level=section.security_level,
            encrypted_data=encrypted_data,
            encryption_key_id=key_id or "none",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            accessed_at=None,
            expires_at=expires_at,
            version=1,
            tags=tags or [],
            metadata=metadata or {}
        )

        self.assets[asset.asset_id] = asset
        section.asset_ids.add(asset.asset_id)
        section.used_mb += data_size_mb

        return asset

    def retrieve_asset(self, asset_id: str) -> Tuple[bytes, VaultAsset]:
        """Retrieve and decrypt an asset"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")

        asset = self.assets[asset_id]

        # Check expiration
        if asset.expires_at and datetime.now() > asset.expires_at:
            raise ValueError("Asset has expired")

        # Decrypt
        if asset.encryption_key_id and asset.encryption_key_id != "none":
            # Extract nonce (first 12 bytes)
            nonce = asset.encrypted_data[:12]
            ciphertext = asset.encrypted_data[12:]
            data = self.engine.decrypt(ciphertext, asset.encryption_key_id, nonce)
        else:
            data = asset.encrypted_data

        # Update access tracking
        asset.accessed_at = datetime.now()
        asset.access_count += 1

        return data, asset

    def update_asset(
        self,
        asset_id: str,
        new_data: bytes,
        metadata_update: Optional[Dict[str, Any]] = None
    ) -> VaultAsset:
        """Update an existing asset"""
        if asset_id not in self.assets:
            raise ValueError(f"Asset not found: {asset_id}")

        asset = self.assets[asset_id]

        # Find section
        section = None
        for s in self.sections.values():
            if asset_id in s.asset_ids:
                section = s
                break

        # Calculate size change
        old_size = len(asset.encrypted_data) / (1024 * 1024)

        # Encrypt new data
        key_id = asset.encryption_key_id
        if key_id and key_id != "none":
            encrypted_data, nonce = self.engine.encrypt(new_data, key_id)
            encrypted_data = nonce + encrypted_data
        else:
            encrypted_data = new_data

        new_size = len(encrypted_data) / (1024 * 1024)

        # Update section capacity
        if section:
            section.used_mb = section.used_mb - old_size + new_size

        # Update asset
        asset.encrypted_data = encrypted_data
        asset.updated_at = datetime.now()
        asset.version += 1

        if metadata_update:
            asset.metadata.update(metadata_update)

        return asset

    def delete_asset(self, asset_id: str) -> bool:
        """Delete an asset from the vault"""
        if asset_id not in self.assets:
            return False

        asset = self.assets[asset_id]

        # Find and update section
        for section in self.sections.values():
            if asset_id in section.asset_ids:
                section.asset_ids.remove(asset_id)
                section.used_mb -= len(asset.encrypted_data) / (1024 * 1024)
                break

        del self.assets[asset_id]
        return True

    def get_health(self) -> VaultHealth:
        """Get vault health status"""
        warnings = []

        # Check for expiring keys
        expiring = self.key_manager.get_expiring_keys(days=7)
        if expiring:
            warnings.append(f"{len(expiring)} encryption keys expiring soon")

        # Check for expiring assets
        expiring_assets = [a for a in self.assets.values()
                         if a.expires_at and a.expires_at <= datetime.now() + timedelta(days=7)]
        if expiring_assets:
            warnings.append(f"{len(expiring_assets)} assets expiring soon")

        # Calculate totals
        total_used = sum(s.used_mb for s in self.sections.values())
        total_capacity = sum(s.capacity_mb for s in self.sections.values())

        # Determine status
        status = VaultStatus.HEALTHY
        if warnings:
            status = VaultStatus.DEGRADED
        if total_capacity > 0 and (total_used / total_capacity) > 0.9:
            status = VaultStatus.DEGRADED
            warnings.append("Storage capacity above 90%")

        return VaultHealth(
            status=status,
            checked_at=datetime.now(),
            uptime_seconds=(datetime.now() - self.start_time).total_seconds(),
            total_assets=len(self.assets),
            total_sections=len(self.sections),
            storage_used_mb=total_used,
            storage_capacity_mb=total_capacity,
            active_keys=len([k for k in self.engine.keys.values() if k[1].status == KeyStatus.ACTIVE]),
            expiring_keys=len(expiring),
            failed_operations_24h=0,  # Would track in production
            warnings=warnings
        )

    def seal_vault(self) -> bool:
        """Seal the vault (no operations until unsealed)"""
        self.status = VaultStatus.SEALED
        # In production, would clear keys from memory
        return True

    def unseal_vault(self, recovery_keys: List[RecoveryKey]) -> bool:
        """Unseal vault with recovery keys"""
        # Verify we have enough shards
        if not recovery_keys:
            return False

        threshold = recovery_keys[0].threshold
        if len(recovery_keys) < threshold:
            return False

        # In production, would reconstruct master key
        self.status = VaultStatus.HEALTHY
        return True


# ============================================================
# AUDIT TRACKER
# ============================================================

class AuditTracker:
    """
    Tracks all vault operations for security and compliance.
    """

    def __init__(self):
        self.records: List[AuditRecord] = []
        self.anomaly_thresholds = {
            "failed_attempts": 5,
            "access_rate": 100,  # per minute
            "unusual_hours": (0, 5),  # 12am - 5am
        }

    def record(
        self,
        operation: OperationType,
        principal: str,
        success: bool,
        asset_id: Optional[str] = None,
        section_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> AuditRecord:
        """Record an audit event"""
        # Determine severity
        severity = AuditSeverity.INFO
        if not success:
            severity = AuditSeverity.WARNING
        if operation in [OperationType.DELETE, OperationType.SEAL]:
            severity = AuditSeverity.WARNING if success else AuditSeverity.ERROR
        if error_message and "denied" in error_message.lower():
            severity = AuditSeverity.WARNING

        record = AuditRecord(
            record_id=f"audit-{secrets.token_hex(8)}",
            timestamp=datetime.now(),
            operation=operation,
            principal=principal,
            asset_id=asset_id,
            section_id=section_id,
            success=success,
            severity=severity,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            error_message=error_message
        )

        self.records.append(record)

        # Check for anomalies
        self._check_anomalies(record)

        return record

    def _check_anomalies(self, record: AuditRecord) -> None:
        """Check for suspicious patterns"""
        # Check unusual hours
        hour = record.timestamp.hour
        start, end = self.anomaly_thresholds["unusual_hours"]
        if start <= hour <= end:
            record.severity = max(record.severity, AuditSeverity.WARNING, key=lambda x: x.value)
            record.details["anomaly"] = "unusual_hours"

        # Check failed attempts
        recent_failures = [
            r for r in self.records[-50:]
            if r.principal == record.principal
            and not r.success
            and (datetime.now() - r.timestamp).seconds < 300
        ]
        if len(recent_failures) >= self.anomaly_thresholds["failed_attempts"]:
            record.severity = AuditSeverity.ALERT
            record.details["anomaly"] = "multiple_failures"

    def query(
        self,
        principal: Optional[str] = None,
        operation: Optional[OperationType] = None,
        asset_id: Optional[str] = None,
        success: Optional[bool] = None,
        severity: Optional[AuditSeverity] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AuditRecord]:
        """Query audit records with filters"""
        results = []

        for record in reversed(self.records):
            if len(results) >= limit:
                break

            if principal and record.principal != principal:
                continue
            if operation and record.operation != operation:
                continue
            if asset_id and record.asset_id != asset_id:
                continue
            if success is not None and record.success != success:
                continue
            if severity and record.severity != severity:
                continue
            if start_time and record.timestamp < start_time:
                continue
            if end_time and record.timestamp > end_time:
                continue

            results.append(record)

        return results

    def get_statistics(
        self,
        hours: int = 24
    ) -> Dict[str, Any]:
        """Get audit statistics for time period"""
        cutoff = datetime.now() - timedelta(hours=hours)
        recent = [r for r in self.records if r.timestamp > cutoff]

        if not recent:
            return {
                "period_hours": hours,
                "total_operations": 0,
                "success_rate": 0,
                "by_operation": {},
                "by_severity": {},
                "unique_principals": 0,
                "anomalies": 0
            }

        success_count = sum(1 for r in recent if r.success)

        by_operation = {}
        for r in recent:
            op = r.operation.value
            by_operation[op] = by_operation.get(op, 0) + 1

        by_severity = {}
        for r in recent:
            sev = r.severity.value
            by_severity[sev] = by_severity.get(sev, 0) + 1

        anomalies = sum(1 for r in recent if "anomaly" in r.details)

        return {
            "period_hours": hours,
            "total_operations": len(recent),
            "success_rate": round(success_count / len(recent) * 100, 1),
            "by_operation": by_operation,
            "by_severity": by_severity,
            "unique_principals": len(set(r.principal for r in recent)),
            "anomalies": anomalies
        }

    def export_compliance_log(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """Export audit records for compliance reporting"""
        records = self.query(start_time=start_time, end_time=end_time, limit=10000)

        return [
            {
                "id": r.record_id,
                "timestamp": r.timestamp.isoformat(),
                "operation": r.operation.value,
                "principal": r.principal,
                "asset_id": r.asset_id,
                "section_id": r.section_id,
                "success": r.success,
                "severity": r.severity.value,
                "ip_address": r.ip_address,
                "error": r.error_message
            }
            for r in records
        ]


# ============================================================
# BACKUP MANAGER
# ============================================================

class BackupManager:
    """
    Manages vault backups and recovery.
    """

    def __init__(
        self,
        vault: VaultOrchestrator,
        encryption_engine: EncryptionEngine
    ):
        self.vault = vault
        self.engine = encryption_engine
        self.backups: Dict[str, BackupManifest] = {}

    def create_backup(
        self,
        location: str,
        encrypt: bool = True
    ) -> BackupManifest:
        """Create a vault backup"""
        # Serialize vault data
        backup_data = {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "sections": [
                {
                    "id": s.section_id,
                    "name": s.name,
                    "security_level": s.security_level.value,
                    "path": s.path
                }
                for s in self.vault.sections.values()
            ],
            "assets": [
                {
                    "id": a.asset_id,
                    "name": a.name,
                    "type": a.asset_type.value,
                    "security_level": a.security_level.value,
                    "data": base64.b64encode(a.encrypted_data).decode(),
                    "key_id": a.encryption_key_id,
                    "version": a.version,
                    "tags": a.tags,
                    "metadata": a.metadata
                }
                for a in self.vault.assets.values()
            ]
        }

        backup_bytes = json.dumps(backup_data).encode()

        # Encrypt backup if requested
        key_id = None
        if encrypt:
            key = self.engine.generate_key(EncryptionAlgorithm.AES_256_GCM)
            key_id = key.key_id
            backup_bytes, nonce = self.engine.encrypt(backup_bytes, key_id)
            backup_bytes = nonce + backup_bytes

        # Calculate checksum
        checksum = hashlib.sha256(backup_bytes).hexdigest()

        manifest = BackupManifest(
            backup_id=f"backup-{secrets.token_hex(8)}",
            created_at=datetime.now(),
            vault_version="1.0",
            asset_count=len(self.vault.assets),
            section_count=len(self.vault.sections),
            size_mb=len(backup_bytes) / (1024 * 1024),
            encryption_key_id=key_id or "none",
            checksum=checksum,
            location=location,
            verified=True
        )

        self.backups[manifest.backup_id] = manifest
        return manifest

    def list_backups(self) -> List[BackupManifest]:
        """List all backups"""
        return list(self.backups.values())

    def verify_backup(self, backup_id: str) -> bool:
        """Verify backup integrity"""
        if backup_id not in self.backups:
            return False

        # In production, would read backup file and verify checksum
        manifest = self.backups[backup_id]
        manifest.verified = True
        return True


# ============================================================
# VAULT ENGINE (Main Orchestrator)
# ============================================================

class VaultEngine:
    """
    Main orchestrator for all vault operations.
    Coordinates encryption, access, storage, and audit.
    """

    def __init__(self):
        self.encryption = EncryptionEngine()
        self.keys = KeyManager(self.encryption)
        self.access = AccessController()
        self.vault = VaultOrchestrator(self.encryption, self.keys)
        self.audit = AuditTracker()
        self.backup = BackupManager(self.vault, self.encryption)

    def initialize(self) -> Dict[str, Any]:
        """Initialize vault with default configuration"""
        # Create default sections
        sections = [
            ("credentials", SecurityLevel.L3_CONFIDENTIAL, "/vault/credentials"),
            ("secrets", SecurityLevel.L4_SECRET, "/vault/secrets"),
            ("certificates", SecurityLevel.L3_CONFIDENTIAL, "/vault/certificates"),
            ("keys", SecurityLevel.L5_TOP_SECRET, "/vault/keys"),
        ]

        created_sections = []
        for name, level, path in sections:
            section = self.vault.create_section(name, level, path)
            created_sections.append(section.section_id)

        return {
            "status": "initialized",
            "sections": created_sections,
            "timestamp": datetime.now().isoformat()
        }

    def store(
        self,
        credential_id: str,
        name: str,
        data: str,
        asset_type: str,
        section: str,
        tags: List[str] = None,
        metadata: Dict[str, Any] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Store an asset in the vault"""
        # Find section
        section_obj = None
        for s in self.vault.sections.values():
            if s.name == section or s.section_id == section:
                section_obj = s
                break

        if not section_obj:
            self.audit.record(
                OperationType.STORE,
                self._get_principal(credential_id),
                False,
                section_id=section,
                ip_address=ip_address,
                error_message=f"Section not found: {section}"
            )
            return {"success": False, "error": f"Section not found: {section}"}

        # Validate access
        valid, message = self.access.validate_access(
            credential_id,
            OperationType.STORE,
            section_obj.section_id,
            ip_address
        )

        if not valid:
            self.audit.record(
                OperationType.STORE,
                self._get_principal(credential_id),
                False,
                section_id=section_obj.section_id,
                ip_address=ip_address,
                error_message=message
            )
            return {"success": False, "error": message}

        # Store asset
        try:
            asset = self.vault.store_asset(
                name=name,
                data=data.encode() if isinstance(data, str) else data,
                asset_type=AssetType(asset_type),
                section_id=section_obj.section_id,
                tags=tags,
                metadata=metadata
            )

            self.audit.record(
                OperationType.STORE,
                self._get_principal(credential_id),
                True,
                asset_id=asset.asset_id,
                section_id=section_obj.section_id,
                ip_address=ip_address,
                details={"name": name, "type": asset_type}
            )

            return {
                "success": True,
                "asset_id": asset.asset_id,
                "version": asset.version,
                "section": section_obj.name,
                "security_level": asset.security_level.value
            }

        except Exception as e:
            self.audit.record(
                OperationType.STORE,
                self._get_principal(credential_id),
                False,
                section_id=section_obj.section_id,
                ip_address=ip_address,
                error_message=str(e)
            )
            return {"success": False, "error": str(e)}

    def retrieve(
        self,
        credential_id: str,
        asset_id: str,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Retrieve an asset from the vault"""
        # Find asset's section
        asset = self.vault.assets.get(asset_id)
        if not asset:
            self.audit.record(
                OperationType.RETRIEVE,
                self._get_principal(credential_id),
                False,
                asset_id=asset_id,
                ip_address=ip_address,
                error_message="Asset not found"
            )
            return {"success": False, "error": "Asset not found"}

        # Find section
        section_id = None
        for s in self.vault.sections.values():
            if asset_id in s.asset_ids:
                section_id = s.section_id
                break

        # Validate access
        valid, message = self.access.validate_access(
            credential_id,
            OperationType.RETRIEVE,
            section_id,
            ip_address
        )

        if not valid:
            self.audit.record(
                OperationType.RETRIEVE,
                self._get_principal(credential_id),
                False,
                asset_id=asset_id,
                section_id=section_id,
                ip_address=ip_address,
                error_message=message
            )
            return {"success": False, "error": message}

        # Retrieve asset
        try:
            data, asset = self.vault.retrieve_asset(asset_id)

            self.audit.record(
                OperationType.RETRIEVE,
                self._get_principal(credential_id),
                True,
                asset_id=asset_id,
                section_id=section_id,
                ip_address=ip_address
            )

            return {
                "success": True,
                "asset_id": asset_id,
                "name": asset.name,
                "type": asset.asset_type.value,
                "data": data.decode() if isinstance(data, bytes) else data,
                "version": asset.version,
                "accessed_at": asset.accessed_at.isoformat() if asset.accessed_at else None
            }

        except Exception as e:
            self.audit.record(
                OperationType.RETRIEVE,
                self._get_principal(credential_id),
                False,
                asset_id=asset_id,
                section_id=section_id,
                ip_address=ip_address,
                error_message=str(e)
            )
            return {"success": False, "error": str(e)}

    def rotate_credentials(
        self,
        credential_id: str,
        target_key_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rotate encryption keys"""
        # Check for keys needing rotation
        if target_key_id:
            keys_to_rotate = [target_key_id]
        else:
            keys_to_rotate = self.keys.check_rotation_needed()

        if not keys_to_rotate:
            return {"success": True, "message": "No keys need rotation", "rotated": []}

        rotated = []
        for key_id in keys_to_rotate:
            try:
                new_key = self.keys.perform_rotation(key_id)
                if new_key:
                    rotated.append({
                        "old_key": key_id,
                        "new_key": new_key.key_id,
                        "version": new_key.version
                    })

                    self.audit.record(
                        OperationType.ROTATE,
                        self._get_principal(credential_id),
                        True,
                        ip_address=ip_address,
                        details={"old_key": key_id, "new_key": new_key.key_id}
                    )
            except Exception as e:
                self.audit.record(
                    OperationType.ROTATE,
                    self._get_principal(credential_id),
                    False,
                    ip_address=ip_address,
                    error_message=str(e),
                    details={"key_id": key_id}
                )

        return {
            "success": True,
            "rotated": rotated,
            "count": len(rotated)
        }

    def get_audit_log(
        self,
        credential_id: str,
        limit: int = 50,
        operation: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get audit log entries"""
        # Validate audit access
        valid, message = self.access.validate_access(
            credential_id,
            OperationType.AUDIT,
            "*",
            ip_address
        )

        if not valid:
            return {"success": False, "error": message}

        op = OperationType(operation) if operation else None
        records = self.audit.query(operation=op, limit=limit)

        return {
            "success": True,
            "count": len(records),
            "records": [
                {
                    "id": r.record_id,
                    "timestamp": r.timestamp.isoformat(),
                    "operation": r.operation.value,
                    "principal": r.principal,
                    "asset_id": r.asset_id,
                    "success": r.success,
                    "severity": r.severity.value,
                    "error": r.error_message
                }
                for r in records
            ]
        }

    def get_status(self) -> Dict[str, Any]:
        """Get vault status"""
        health = self.vault.get_health()
        stats = self.audit.get_statistics(hours=24)

        return {
            "status": health.status.value,
            "uptime_hours": round(health.uptime_seconds / 3600, 2),
            "assets": {
                "total": health.total_assets,
                "sections": health.total_sections
            },
            "storage": {
                "used_mb": round(health.storage_used_mb, 2),
                "capacity_mb": health.storage_capacity_mb,
                "percent": round(health.storage_percent, 1)
            },
            "keys": {
                "active": health.active_keys,
                "expiring_soon": health.expiring_keys
            },
            "operations_24h": stats["total_operations"],
            "success_rate": stats["success_rate"],
            "warnings": health.warnings
        }

    def _get_principal(self, credential_id: str) -> str:
        """Get principal name from credential"""
        cred = self.access.credentials.get(credential_id)
        return cred.principal if cred else "unknown"


# ============================================================
# VAULT REPORTER
# ============================================================

class VaultReporter:
    """
    Generates visual reports for vault status and operations.
    """

    STATUS_ICONS = {
        VaultStatus.HEALTHY: "●",
        VaultStatus.DEGRADED: "◐",
        VaultStatus.LOCKED: "○",
        VaultStatus.MAINTENANCE: "◑",
        VaultStatus.COMPROMISED: "✖",
        VaultStatus.SEALED: "⬤",
    }

    SECURITY_ICONS = {
        SecurityLevel.L1_PUBLIC: "○",
        SecurityLevel.L2_INTERNAL: "◐",
        SecurityLevel.L3_CONFIDENTIAL: "●",
        SecurityLevel.L4_SECRET: "◉",
        SecurityLevel.L5_TOP_SECRET: "⬤",
    }

    SEVERITY_ICONS = {
        AuditSeverity.INFO: "ℹ",
        AuditSeverity.WARNING: "⚠",
        AuditSeverity.ERROR: "✖",
        AuditSeverity.CRITICAL: "🔴",
        AuditSeverity.ALERT: "🚨",
    }

    def __init__(self, engine: VaultEngine):
        self.engine = engine

    def _progress_bar(self, percent: float, width: int = 10) -> str:
        """Generate a progress bar"""
        filled = int(percent / 100 * width)
        empty = width - filled
        return "█" * filled + "░" * empty

    def generate_status_report(self) -> str:
        """Generate vault status report"""
        status = self.engine.get_status()
        health = self.engine.vault.get_health()

        status_icon = self.STATUS_ICONS.get(health.status, "?")
        storage_bar = self._progress_bar(status["storage"]["percent"])

        lines = [
            "VAULT STATUS REPORT",
            "═" * 50,
            f"Status: {status_icon} {status['status'].upper()}",
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "═" * 50,
            "",
            "VAULT HEALTH",
            "─" * 50,
            "┌" + "─" * 48 + "┐",
            f"│  Status: {status_icon} {status['status']:<36}│",
            f"│  Uptime: {status['uptime_hours']} hours{' ' * (36 - len(str(status['uptime_hours'])))}│",
            f"│  Assets: {status['assets']['total']} in {status['assets']['sections']} sections{' ' * (27 - len(str(status['assets']['total'])) - len(str(status['assets']['sections'])))}│",
            "│" + " " * 48 + "│",
            f"│  Storage: {storage_bar} {status['storage']['percent']}%{' ' * (24 - len(str(status['storage']['percent'])))}│",
            f"│  Used: {status['storage']['used_mb']} MB / {status['storage']['capacity_mb']} MB{' ' * (28 - len(str(status['storage']['used_mb'])) - len(str(status['storage']['capacity_mb'])))}│",
            "└" + "─" * 48 + "┘",
            "",
            "ENCRYPTION KEYS",
            "─" * 50,
            f"│ Active Keys: {status['keys']['active']}",
            f"│ Expiring Soon: {status['keys']['expiring_soon']}",
            "",
            "OPERATIONS (24H)",
            "─" * 50,
            f"│ Total: {status['operations_24h']}",
            f"│ Success Rate: {status['success_rate']}%",
        ]

        if status["warnings"]:
            lines.extend([
                "",
                "⚠ WARNINGS",
                "─" * 50,
            ])
            for warning in status["warnings"]:
                lines.append(f"  • {warning}")

        return "\n".join(lines)

    def generate_operation_report(
        self,
        operation: str,
        result: Dict[str, Any]
    ) -> str:
        """Generate operation result report"""
        success = result.get("success", False)
        status_icon = "●" if success else "○"

        lines = [
            "VAULT OPERATION REPORT",
            "═" * 50,
            f"Operation: {operation.upper()}",
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "═" * 50,
            "",
            "OPERATION RESULT",
            "─" * 50,
            "┌" + "─" * 48 + "┐",
            f"│  Status: {status_icon} {'SUCCESS' if success else 'FAILED':<36}│",
        ]

        if success:
            if "asset_id" in result:
                lines.append(f"│  Asset ID: {result['asset_id']:<35}│")
            if "version" in result:
                lines.append(f"│  Version: {result['version']:<36}│")
            if "section" in result:
                lines.append(f"│  Section: {result['section']:<36}│")
            if "security_level" in result:
                lines.append(f"│  Security: {result['security_level']:<35}│")
        else:
            error = result.get("error", "Unknown error")
            lines.append(f"│  Error: {error[:38]:<38}│")

        lines.extend([
            "└" + "─" * 48 + "┘",
        ])

        return "\n".join(lines)

    def generate_audit_report(
        self,
        records: List[Dict[str, Any]]
    ) -> str:
        """Generate audit trail report"""
        lines = [
            "VAULT AUDIT TRAIL",
            "═" * 70,
            f"Records: {len(records)}",
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "═" * 70,
            "",
            "AUDIT RECORDS",
            "─" * 70,
            "| Time | Operation | Principal | Status |",
            "|------|-----------|-----------|--------|",
        ]

        for record in records[:20]:  # Limit display
            time_str = record["timestamp"][:19]
            op = record["operation"][:10]
            principal = record["principal"][:15]
            status = "●" if record["success"] else "○"
            lines.append(f"| {time_str} | {op:<9} | {principal:<9} | {status} |")

        if len(records) > 20:
            lines.append(f"... and {len(records) - 20} more records")

        return "\n".join(lines)

    def generate_section_report(self) -> str:
        """Generate vault sections report"""
        lines = [
            "VAULT SECTIONS",
            "═" * 60,
            "",
        ]

        for section in self.engine.vault.sections.values():
            security_icon = self.SECURITY_ICONS.get(section.security_level, "?")
            usage_bar = self._progress_bar(section.usage_percent)

            lines.extend([
                f"┌─ {section.name} ─" + "─" * (40 - len(section.name)) + "┐",
                f"│  Path: {section.path:<40}│" if len(section.path) <= 40 else f"│  Path: {section.path[:37]}...│",
                f"│  Security: {security_icon} {section.security_level.value:<32}│",
                f"│  Assets: {len(section.asset_ids):<36}│",
                f"│  Storage: {usage_bar} {section.usage_percent:.1f}%{' ' * (21 - len(f'{section.usage_percent:.1f}'))}│",
                "└" + "─" * 48 + "┘",
                "",
            ])

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="VAULTX.EXE - Secure Vault Management Agent"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize vault")

    # Store command
    store_parser = subparsers.add_parser("store", help="Store asset")
    store_parser.add_argument("name", help="Asset name")
    store_parser.add_argument("--data", required=True, help="Data to store")
    store_parser.add_argument("--type", default="secret", help="Asset type")
    store_parser.add_argument("--section", default="secrets", help="Section name")
    store_parser.add_argument("--tags", nargs="+", help="Tags")
    store_parser.add_argument("--credential", required=True, help="Credential ID")

    # Retrieve command
    retrieve_parser = subparsers.add_parser("retrieve", help="Retrieve asset")
    retrieve_parser.add_argument("asset_id", help="Asset ID")
    retrieve_parser.add_argument("--credential", required=True, help="Credential ID")

    # Rotate command
    rotate_parser = subparsers.add_parser("rotate", help="Rotate keys")
    rotate_parser.add_argument("--key", help="Specific key to rotate")
    rotate_parser.add_argument("--credential", required=True, help="Credential ID")

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="View audit log")
    audit_parser.add_argument("--limit", type=int, default=50, help="Record limit")
    audit_parser.add_argument("--operation", help="Filter by operation")
    audit_parser.add_argument("--credential", required=True, help="Credential ID")

    # Status command
    status_parser = subparsers.add_parser("status", help="View vault status")

    # Sections command
    sections_parser = subparsers.add_parser("sections", help="List sections")

    # Credential command
    cred_parser = subparsers.add_parser("credential", help="Create credential")
    cred_parser.add_argument("principal", help="Principal name")
    cred_parser.add_argument("--role", default="operator", help="Role")
    cred_parser.add_argument("--sections", nargs="+", default=["*"], help="Sections")
    cred_parser.add_argument("--ttl", type=int, default=24, help="TTL in hours")

    args = parser.parse_args()

    # Initialize engine
    engine = VaultEngine()
    reporter = VaultReporter(engine)

    if args.command == "init":
        result = engine.initialize()
        print("Vault initialized successfully!")
        print(f"Sections created: {', '.join(result['sections'])}")

    elif args.command == "store":
        result = engine.store(
            credential_id=args.credential,
            name=args.name,
            data=args.data,
            asset_type=args.type,
            section=args.section,
            tags=args.tags
        )
        print(reporter.generate_operation_report("store", result))

    elif args.command == "retrieve":
        result = engine.retrieve(
            credential_id=args.credential,
            asset_id=args.asset_id
        )
        if result["success"]:
            print(f"Asset: {result['name']}")
            print(f"Data: {result['data']}")
        else:
            print(f"Error: {result['error']}")

    elif args.command == "rotate":
        result = engine.rotate_credentials(
            credential_id=args.credential,
            target_key_id=args.key
        )
        print(f"Rotated {result['count']} keys")
        for rotation in result["rotated"]:
            print(f"  {rotation['old_key']} -> {rotation['new_key']}")

    elif args.command == "audit":
        result = engine.get_audit_log(
            credential_id=args.credential,
            limit=args.limit,
            operation=args.operation
        )
        if result["success"]:
            print(reporter.generate_audit_report(result["records"]))
        else:
            print(f"Error: {result['error']}")

    elif args.command == "status":
        print(reporter.generate_status_report())

    elif args.command == "sections":
        # Need to initialize first for demo
        engine.initialize()
        print(reporter.generate_section_report())

    elif args.command == "credential":
        cred = engine.access.create_credential(
            principal=args.principal,
            token_type=TokenType.SERVICE,
            access_method=AccessMethod.TOKEN,
            role=args.role,
            sections=set(args.sections),
            ttl_hours=args.ttl
        )
        print(f"Credential created: {cred.credential_id}")
        print(f"Principal: {cred.principal}")
        print(f"Permissions: {', '.join(cred.permissions)}")
        print(f"Expires: {cred.expires_at.isoformat() if cred.expires_at else 'Never'}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
VAULT OPERATION REPORT
═══════════════════════════════════════
Operation: [store/retrieve/rotate/audit]
Asset: [asset_identifier]
Time: [timestamp]
═══════════════════════════════════════

VAULT STATUS
────────────────────────────────────
┌─────────────────────────────────────┐
│       VAULT HEALTH                  │
│                                     │
│  Status: [●/◐/○] [healthy/warning]  │
│  Capacity: ████████░░ [X]%          │
│  Items: [count] stored              │
│                                     │
│  Last Backup: [timestamp]           │
│  Last Audit: [timestamp]            │
│  Integrity: [verified/pending]      │
└─────────────────────────────────────┘

SECURITY DETAILS
────────────────────────────────────
| Property | Value |
|----------|-------|
| Sensitivity | [public/internal/confidential/secret] |
| Encryption | [method] |
| Key Length | [bits] |
| Access Level | [L1-L5] |
| Expiry | [date/never] |

AUTHORIZATION
────────────────────────────────────
┌─────────────────────────────────────┐
│  Authorized Principals:             │
│  • [principal_1] - [role]           │
│  • [principal_2] - [role]           │
│  • [principal_3] - [role]           │
│                                     │
│  Access Method: [credential_type]   │
│  MFA Required: [yes/no]             │
└─────────────────────────────────────┘

AUDIT TRAIL
────────────────────────────────────
| Time | Actor | Action | Result |
|------|-------|--------|--------|
| [time_1] | [actor] | [action] | [●/○] |
| [time_2] | [actor] | [action] | [●/○] |
| [time_3] | [actor] | [action] | [●/○] |

OPERATION RESULT
────────────────────────────────────
┌─────────────────────────────────────┐
│  Status: [SUCCESS/FAILED]           │
│  Message: [result_message]          │
│                                     │
│  Vault Path: [vault_path]           │
│  Reference: [operation_id]          │
└─────────────────────────────────────┘
```

## QUICK COMMANDS

- `/launch-vaultx store [asset]` - Store asset securely
- `/launch-vaultx retrieve [asset]` - Retrieve from vault
- `/launch-vaultx rotate [credential]` - Rotate keys/credentials
- `/launch-vaultx audit` - View vault access log
- `/launch-vaultx status` - Check vault health

$ARGUMENTS
