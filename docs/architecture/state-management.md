# State Management

**Version**: 0.1.0

Zustand stores, data flow, and persistence strategy.

---

## SessionStore (Ephemeral)

Tracks active recording state. Resets when recording stops.

```typescript
interface SessionState {
  recording: boolean;
  connected: boolean;
  interimToken: string;
  finalTokens: TranscriptLine[];
  error: Error | null;
  
  setRecording(v: boolean): void;
  setConnected(v: boolean): void;
  setInterimToken(token: string): void;
  addFinalToken(line: TranscriptLine): void;
  setError(err: Error | null): void;
  reset(): void;
}

export const useSessionStore = create<SessionState>((set) => ({
  recording: false,
  connected: false,
  interimToken: '',
  finalTokens: [],
  error: null,
  
  setRecording: (recording) => set({ recording }),
  setConnected: (connected) => set({ connected }),
  setInterimToken: (interimToken) => set({ interimToken }),
  addFinalToken: (token) =>
    set((s) => ({ finalTokens: [...s.finalTokens, token] })),
  setError: (error) => set({ error }),
  reset: () => set({
    recording: false,
    connected: false,
    interimToken: '',
    finalTokens: [],
    error: null,
  }),
}));
```

**Lifecycle**:
- App starts → all false/empty
- User clicks Record → setRecording(true)
- WebSocket connects → setConnected(true)
- Tokens arrive → setInterimToken, addFinalToken
- User clicks Stop → setRecording(false), reset() on cleanup

**Why ephemeral?**
- No need to persist tokens (already saved to disk)
- Simpler to test (no localStorage mocking)
- Faster app startup (no hydration)

---

## SettingsStore (Persistent)

User preferences surviving app restart.

```typescript
interface SettingsState {
  apiKey: string;
  sourceLang: string;
  targetLang: string;
  outputMode: 'text' | 'tts';
  
  setApiKey(key: string): void;
  setLanguages(source: string, target: string): void;
  setOutputMode(mode: 'text' | 'tts'): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      sourceLang: 'en',
      targetLang: 'es',
      outputMode: 'text' as const,
      
      setApiKey: (apiKey) => set({ apiKey }),
      setLanguages: (sourceLang, targetLang) =>
        set({ sourceLang, targetLang }),
      setOutputMode: (outputMode) => set({ outputMode }),
    }),
    {
      name: 'translation-assistant-settings',
      partialize: (state) => ({
        apiKey: state.apiKey,
        sourceLang: state.sourceLang,
        targetLang: state.targetLang,
        outputMode: state.outputMode,
      }),
    }
  )
);
```

**Persistence**:
- Uses Zustand `persist` middleware
- Stored in `localStorage` under key `translation-assistant-settings`
- Auto-hydrates on app start

**Migration Path**:
- v0.1.0: localStorage (simple, cross-platform)
- v1.0+: Platform keychain via Tauri plugin (more secure)

---

## Data Dependencies

```
App.tsx
  ├─ useSessionStore (read: recording, connected, interimToken, finalTokens, error)
  ├─ useSettingsStore (read: apiKey, sourceLang, targetLang, outputMode)
  └─ useTranslationSession hook (orchestrates both stores)
      ├─ AudioCapture (dispatch chunks)
      ├─ SonioxClient (receive tokens via callbacks)
      └─ Tauri IPC (save transcript on stop)
```

---

## Component Usage Patterns

### Reading State (Selectors)

Prefer explicit selectors to minimize re-renders:

```typescript
// ✓ Good: re-renders only when recording changes
const recording = useSessionStore((s) => s.recording);

// ✗ Avoid: re-renders on any store change
const store = useSessionStore();
const recording = store.recording;
```

### Updating State

```typescript
// ✓ Good: dispatch via store method
useSessionStore.setState({ interimToken: 'Hello' });

// Or use dedicated method
useSessionStore.getState().setInterimToken('Hello');
```

### Local vs Store State

Use `useState` for component-local state (settings panel visibility):

```typescript
const [isSettingsOpen, setIsSettingsOpen] = useState(false);

// Don't do this:
// const isOpen = useUIStore().isSettingsOpen; // Overkill for temporary UI state
```

---

## Error State Handling

Errors dispatch to SessionStore for display in ErrorBanner:

```typescript
try {
  await audioCapture.start();
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  useSessionStore.setState({
    error: new Error(`Failed to start: ${message}`),
  });
}
```

**ErrorBanner** listens to error state:

```typescript
const error = useSessionStore((s) => s.error);
return error ? <ErrorBanner message={error.message} onDismiss={() => ...} /> : null;
```

---

## State Serialization

SessionStore is transient (not serialized). SettingsStore serializes to localStorage:

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

For future schema migrations:
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

## Future Enhancements

**v0.2.0**:
- Add transcript history store (paginated list)
- Separate provider settings (API key per provider)

**v1.0+**:
- Migrate to platform keychain (more secure)
- Add analytics store (opt-in usage tracking)

---

## References

- [System Architecture Overview](./overview.md)
- [Code Standards — State Management](../code-standards.md#state-management-patterns)
