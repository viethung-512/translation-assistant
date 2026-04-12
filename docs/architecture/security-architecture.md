# Security Architecture

**Version**: 0.1.0

API key storage, data protection, and CSP strategy.

---

## API Key Management

### Current (v0.1.0): localStorage

**Storage**:
```typescript
// SettingsStore persists to localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(..., {
    name: 'translation-assistant-settings',
    partialize: (state) => ({
      apiKey: state.apiKey,
      // ... other settings
    }),
  })
);
```

**Key Location**: `localStorage['translation-assistant-settings']`

**Format**:
```json
{
  "state": {
    "apiKey": "sk-...",
    "sourceLang": "en",
    "targetLang": "es",
    "outputMode": "tts"
  },
  "version": 0
}
```

**Risk Assessment**:
- **XSS Vulnerability**: If attacker injects JavaScript, can steal from localStorage
- **Mitigation**: Tauri app (not web); served from native binary only, no internet-facing endpoints
- **Clear Text**: API key not encrypted in localStorage
- **Mitigation**: Tauri sandbox; only app process can access localStorage

### Future (v1.0+): Platform Keychain

Migrate to encrypted storage via Tauri plugin:

```typescript
// Future implementation
import { secureStorage } from '@tauri-apps/plugin-keychain';

await secureStorage.set('soniox-api-key', apiKey);
const key = await secureStorage.get('soniox-api-key');
```

**Benefits**:
- Encrypted at rest (platform-native encryption)
- OS-level access control
- Survives app uninstall
- Better compliance (meets financial/healthcare standards)

---

## Data Protection

### Audio Data

**Never Persisted**: Raw audio is discarded after transcription.

**Flow**:
```
Microphone → AudioWorklet → PCM chunks → Soniox WebSocket → Soniox servers
                                    ↓
                            (discarded, not stored locally)
```

**User Data Exposure**: None (audio never written to disk).

### Transcripts

**Storage**: Plain text files in `~/Documents/TranslationAssistant/`

**Permissions**: User controls via OS file permissions

**Encryption**: None (future: optional Tauri Stronghold)

**Backup**: No automatic cloud backup (future: optional S3/OneDrive integration)

### Session State

**Ephemeral**: SessionStore resets on recording stop. No persistence.

**Memory**: Cleared when app closes (managed by OS process cleanup).

---

## Network Security

### WebSocket (Soniox)

```
Protocol: wss:// (TLS 1.3)
Endpoint: api.soniox.com
Port: 443 (HTTPS only)
```

**Certificate Validation**:
- Browser validates Soniox SSL certificate
- Self-signed certificates rejected
- Mitigates MITM attacks

**Data in Transit**:
- PCM audio encrypted by TLS 1.3
- Tokens encrypted by TLS 1.3
- No plaintext transmission

### Tauri IPC

**Local Only**: Process-to-process communication (no network).

**No Serialization**: Direct memory access within same binary.

**Security**: Tauri enforces capability-based access control.

---

## Content Security Policy (CSP)

**Current**: CSP disabled (`null`) to support AudioWorklet and Web Audio API.

```json
// src-tauri/tauri.conf.json
"security": {
  "csp": null
}
```

**Rationale**:
- AudioWorklet requires `script-src 'self'`
- Web Audio API requires media permissions
- Tauri app (not web); CSP less critical for isolated binary

**Future** (v1.0+): Re-enable strict CSP if AudioWorklet becomes standard.

---

## Capability System (Tauri)

App declares minimal permissions:

```json
// src-tauri/capabilities/default.json
{
  "default": {
    "allow": [
      "tauri:core:window:allow-create",
      "tauri:core:fs:allow-read-dir:Documents/TranslationAssistant/*",
      "tauri:core:fs:allow-write:Documents/TranslationAssistant/*"
    ],
    "deny": []
  }
}
```

**Restrictions**:
- ✓ Can read/write transcript directory
- ✗ Cannot execute shell commands
- ✗ Cannot access system directories
- ✗ Cannot read clipboard
- ✗ Cannot access camera (separate permission)

**User Prompt**: Microphone permission requested by browser (OS-level).

---

## Dependency Security

### JavaScript Dependencies

```json
{
  "react": "^18.3.1",
  "zustand": "^5.0.12",
  "@tauri-apps/api": "^2"
}
```

**Strategy**:
- Pin minor version (e.g., `^18.3.1` allows 18.x.x, not 19.0.0)
- Quarterly dependency audit
- Subscribe to security advisories (npm audit, snyk)

### Rust Dependencies

```toml
[dependencies]
tauri = { version = "2", features = [...] }
serde = "1"
```

**Strategy**:
- Use `cargo audit` for vulnerability scanning
- Security updates applied immediately
- Minimal dependencies (reduce attack surface)

---

## Encryption Roadmap

### v0.1.0 (Current)

- ✗ API key: cleartext localStorage
- ✗ Transcripts: plaintext files
- ✓ Network: TLS 1.3

### v0.2.0

- [ ] Evaluate Tauri Stronghold for API key
- [ ] Implement optional transcript encryption

### v1.0+

- [ ] Platform keychain for API key (required)
- [ ] Optional per-transcript encryption
- [ ] Audit with security firm

---

## Privacy Policy (High-Level)

**Data Collection**:
- ✗ No telemetry by default
- ✗ No analytics tracking
- ✗ No phone-home calls
- ✓ Only Soniox API calls (user controls via API key)

**Data Retention**:
- Audio: Never persisted locally
- Transcripts: Stored locally; user controls deletion
- Settings: Stored locally; user can clear

**User Control**:
- Can view all stored files (~/Documents/TranslationAssistant/)
- Can delete transcripts manually
- Can revoke API key in Settings

---

## Authentication

No user accounts; authentication via Soniox API key:

```typescript
// Auth sent to Soniox on WebSocket connect
const authMsg = {
  auth: {
    api_key: apiKey, // User-provided
  },
};
this.ws?.send(JSON.stringify(authMsg));
```

**Invalid Key Behavior**:
- Soniox rejects connection
- Error callback fires
- User sees "Invalid API key" error in UI
- User must update in Settings

---

## Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|-----------|
| API key theft (XSS) | Low | High | Tauri sandbox; no internet exposure |
| API key theft (physical access) | Low | Medium | OS file permissions; future: keychain encryption |
| MITM on WebSocket | Very Low | High | TLS 1.3 certificate validation |
| Audio data theft | Low | High | Never persisted; only in-memory during session |
| Transcript theft | Low | Medium | File permissions (user controls) |
| Tauri command injection | Very Low | High | Type-safe Rust; no shell execution |
| Soniox server compromise | Very Low | Critical | Out of our control; user chooses provider |

---

## Security Checklist (Pre-Release)

- [x] No cleartext credentials in config files
- [x] API key not logged to console
- [x] Tauri capabilities minimized
- [x] File I/O sandboxed to app directory
- [x] WebSocket uses TLS 1.3
- [x] No shell execution from TypeScript
- [x] No eval() or dynamic code generation
- [x] Dependencies pinned (no `*` version)
- [ ] Security audit (planned for v1.0)
- [ ] Privacy policy published (planned for GA)

---

## Compliance Considerations

**GDPR** (future, if EU users):
- [ ] Privacy policy with data retention terms
- [ ] User right to data export
- [ ] User right to deletion

**HIPAA** (future, if healthcare use):
- [ ] Encrypted transcript storage
- [ ] Access logs
- [ ] Business associate agreement with Soniox

**SOC 2** (future, if enterprise customers):
- [ ] Security audit
- [ ] Incident response plan
- [ ] Vulnerability disclosure policy

---

## Reporting Security Issues

**Future Process**:
1. Email: security@translation-assistant.app (when domain acquired)
2. Do not disclose publicly until patch available
3. 90-day disclosure window
4. Bug bounty program (considered for v1.0)

---

## References

- [System Architecture Overview](./overview.md)
- [Soniox Provider](./soniox-provider.md)
- [Tauri Integration](./tauri-integration.md)
- [Code Standards — Security](../code-standards.md#security-best-practices)
