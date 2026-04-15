# State Management

**Version**: 0.2.0 (SDK Migration)  
**Last Updated**: April 2026

Hook-local state, Zustand stores, and persistence strategy.

---

## Session State (Hook-Local, Ephemeral)

**v0.1.0**: Centralized Zustand SessionStore  
**v0.2.0**: Hook-local state within `useTranslationSession`

### Current Implementation

```typescript
export function useTranslationSession() {
  // Hook-local accumulation state (replaces Zustand session-store)
  const [finalLines, setFinalLines] = useState<TranscriptLine[]>([]);
  const [interimOriginal, setInterimOriginal] = useState('');
  const [interimTranslated, setInterimTranslated] = useState('');
  
  // Mutable refs buffer inside onResult to avoid stale closure reads
  const interimOriginalRef = useRef('');
  const interimTranslatedRef = useRef('');
  
  // ... SDK hook configuration
  
  return {
    // Recording status
    recordingStatus: toRecordingStatus(recording.status),
    connectionStatus: toConnectionStatus(recording.status),
    permissionStatus,
    
    // Tokens
    finalLines,
    interimOriginal,
    interimTranslated,
    
    // Actions
    startRecording: async () => { /* ... */ },
    stopRecording: async () => { /* ... */ },
    
    // Error
    error: recordingError || permissionError,
  };
}
```

### State Shape

| Property | Type | Lifetime | Notes |
|----------|------|----------|-------|
| `recordingStatus` | 'idle'\|'recording'\|'stopping' | Per session | Maps SDK status string |
| `connectionStatus` | 'disconnected'\|'connecting'\|'connected' | Per session | Maps SDK connection state |
| `permissionStatus` | 'granted'\|'denied'\|'prompt' | App lifetime | From `useMicrophonePermission` |
| `finalLines` | `TranscriptLine[]` | Per session | Committed transcript lines |
| `interimOriginal` | string | Per session | Partial transcription (original) |
| `interimTranslated` | string | Per session | Partial transcription (translated) |
| `error` | `Error \| null` | Per session | Recording or permission error |

### Lifecycle

- **App starts**: finalLines=[], interim fields empty, error=null
- **User clicks Record**: recordingStatus='recording', connectionStatus='connecting'
- **SDK connects**: connectionStatus='connected'
- **Tokens arrive**: interimOriginal/interimTranslated update rapidly; finalLines updates on complete token
- **User clicks Stop**: recordingStatus='stopping' → 'idle', hook state resets
- **Next session**: Clean state, ready to record again

### Why Hook-Local (not Zustand)?

✓ **Simpler**: No store boilerplate; state lives where it's used  
✓ **Sufficient**: Single recording session at a time  
✓ **Clear Ownership**: `useTranslationSession` owns the entire session lifecycle  
✓ **Easier to Test**: No store setup/teardown mocking  

⚠️ **Limitation**: Cannot easily share session state across unrelated components (not needed currently)

**Future Migration Path**: If session features grow (e.g., pause/resume, multiple concurrent recordings), migrate to Zustand store.

---

## SettingsStore (Persistent via Zustand)

User preferences surviving app restart.

### Current Implementation

```typescript
interface SettingsState {
  apiKey: string;
  sourceLanguage: string;
  targetLanguage: string;
  outputMode: 'text' | 'tts';
  
  setApiKey(key: string): void;
  setLanguages(source: string, target: string): void;
  setOutputMode(mode: 'text' | 'tts'): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      outputMode: 'text' as const,
      
      setApiKey: (apiKey) => set({ apiKey }),
      setLanguages: (sourceLanguage, targetLanguage) =>
        set({ sourceLanguage, targetLanguage }),
      setOutputMode: (outputMode) => set({ outputMode }),
    }),
    {
      name: 'translation-assistant-settings',
      partialize: (state) => ({
        apiKey: state.apiKey,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        outputMode: state.outputMode,
      }),
    }
  )
);
```

### Persistence

- Uses Zustand `persist` middleware
- Stored in `localStorage` under key `translation-assistant-settings`
- Auto-hydrates on app start

### API Key Handling

```typescript
// settings-store.ts: in-memory field
apiKey: '',

// secure-storage.ts: persistent storage (future: Tauri keychain)
export const getApiKey = async (): Promise<string | null> => {
  return localStorage.getItem('soniox-api-key');
};

export const saveApiKey = async (key: string): Promise<void> => {
  localStorage.setItem('soniox-api-key', key);
};

// useTranslationSession.ts: dual lookup
const apiKey = async () => {
  const stored = await getApiKey();
  const mem = useSettingsStore.getState().apiKey;
  return mem || stored; // Prefer in-memory, fallback to persistent
};
```

### Migration Path

- **v0.2.0**: `localStorage` (simple, cross-platform)
- **v1.0+**: Platform keychain via Tauri Stronghold (more secure)

---

## Component Usage Patterns

### Reading State (Selectors)

Prefer explicit selectors to minimize re-renders:

```typescript
// ✓ Good: re-renders only when outputMode changes
const outputMode = useSettingsStore((s) => s.outputMode);

// ✗ Avoid: re-renders on any store change
const store = useSettingsStore();
const outputMode = store.outputMode;
```

### Hook State from useTranslationSession

```typescript
const session = useTranslationSession();

// All fields available; component re-renders if any field changes
const {
  recordingStatus,
  connectionStatus,
  finalLines,
  interimOriginal,
  error,
  startRecording,
  stopRecording,
} = session;
```

### Local vs Store vs Hook State

| State Type | When to Use | Example |
|-----------|------------|---------|
| `useState` | Component-specific, temporary | Settings panel visibility toggle |
| `useSettingsStore` | Global app preferences | Language pair, API key, theme |
| Hook-local (useTranslationSession) | Session-scoped ephemeral | Transcript lines, interim tokens |

**Good Example**:
```typescript
const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Local
const outputMode = useSettingsStore((s) => s.outputMode);     // Persistent
const { recordingStatus } = useTranslationSession();            // Session
```

---

## Error State Handling

Errors in `useTranslationSession`:

```typescript
// Recording error from SDK
const recordingError = recording.error ? new Error(String(recording.error)) : null;

// Permission error from SDK
const permissionError = permissionStatus === 'denied' 
  ? new Error('Microphone permission denied. Grant in Settings → Privacy.')
  : null;

// Expose combined error
return {
  error: recordingError || permissionError,
};
```

**ErrorBanner Component** listens to error state:

```typescript
const { error } = useTranslationSession();
return error ? <ErrorBanner message={error.message} onDismiss={() => ...} /> : null;
```

---

## State Serialization

### SessionStore (Not Serialized)

Hook-local state is transient; resets on recording stop. No serialization needed.

### SettingsStore (Serialized to localStorage)

```json
{
  "state": {
    "apiKey": "sk-...",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "outputMode": "tts"
  },
  "version": 0
}
```

**Future Schema Migration**:
```typescript
persist(..., {
  version: 1,
  migrate: (state, version) => {
    if (version === 0) {
      // Transform old state format to new
      return { ...state, newField: 'default' };
    }
    return state;
  },
})
```

---

## Data Flow Dependencies

```
App.tsx
  ├─ useTranslationSession hook (read: all session state, call start/stop)
  ├─ useSettingsStore (read: outputMode, languages for SDK config)
  │
  └─ useTranslationSession internals:
      ├─ useRecording (SDK hook for STT + audio)
      ├─ useMicrophonePermission (SDK hook for mic access)
      ├─ getApiKey / saveApiKey (Tauri secure storage)
      ├─ writeTranscript (Tauri file I/O)
      └─ TtsService (Web Speech API)
```

---

## Removed (v0.1.0)

### Zustand SessionStore
- Tracked: recording, connected, interimToken, finalTokens, error
- **Why Removed**: Hook-local state sufficient for single session; eliminates store boilerplate
- **Code Location**: Was in `src/store/session-store.ts`

### use-microphone-permission Hook
- Custom permission state + request logic
- **Why Removed**: SDK provides `useMicrophonePermission`
- **Code Location**: Was in `src/hooks/use-microphone-permission.ts`

---

## Future Enhancements

**v0.3.0** (If Needed):
- Add transcript history store (paginated list of past sessions)
- Separate provider settings (config per STT provider if adding multi-provider)

**v1.0+**:
- Migrate API key to platform keychain (more secure)
- Add analytics store (opt-in usage tracking)

---

## References

- [System Architecture Overview](./overview.md)
- [Code Standards — State Management Patterns](../code-standards.md#state-management-patterns)
