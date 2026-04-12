# Translation Assistant — Code Standards

**Version**: 0.1.0  
**Last Updated**: April 2026

Coding conventions, architectural patterns, and quality guidelines for this project.

---

## Naming Conventions

### TypeScript/JavaScript

**Files**: kebab-case (e.g., `audio-capture.ts`, `use-translation-session.ts`)
- Components: `{component-name}.tsx`
- Hooks: `use-{hook-name}.ts`
- Utilities: `{utility-name}.ts`
- Services: `{service-name}-service.ts`

**Variables & Functions**: camelCase
```typescript
const recordingStatus = 'active';
function getTranscriptMetadata() { }
```

**Constants**: UPPER_SNAKE_CASE (only if truly immutable)
```typescript
const API_KEY_STORAGE_KEY = 'soniox-api-key';
const DEFAULT_LANGUAGE_PAIR = { source: 'en', target: 'es' };
```

**React Components**: PascalCase
```typescript
export const RecordButton = () => { };
export const TranslationDisplay = () => { };
```

**Zustand Stores**: descriptive, camelCase file; exports named `{Store}Store`
```typescript
// session-store.ts
export const useSessionStore = create(...)
```

**Types/Interfaces**: PascalCase
```typescript
interface STTProvider { }
type TranscriptLine = { source: string; translation: string };
```

### Rust

**Files**: snake_case (e.g., `soniox_client.rs`, `transcript.rs`)

**Functions/Methods**: snake_case
```rust
fn write_transcript(filename: &str, content: &str) -> Result<(), Error> { }
```

**Types/Structs**: PascalCase
```rust
struct TranscriptMetadata { }
impl TranscriptWriter { }
```

**Constants**: UPPER_SNAKE_CASE
```rust
const MAX_CHUNK_SIZE: usize = 32000;
```

---

## File Size Limits

| Category | Max LOC | Rationale |
|----------|---------|-----------|
| React components | 150 | Readability; consider splitting if 2+ major features |
| Custom hooks | 120 | Single responsibility; split if orchestrating multiple providers |
| Stores (Zustand) | 100 | State cohesion; one store per domain |
| Services/Utilities | 100 | Testability; encourage composition |
| Rust commands | 100 | Clarity; split complex I/O across modules |

**Current Compliance**: All files meet limits (largest: `settings-panel.tsx` at 150 LOC, `use-translation-session.ts` at 112 LOC).

---

## Component Patterns

### React Functional Components

All components are functional with hooks. No class components.

```typescript
import React from 'react';

interface Props {
  label: string;
  onPress: () => void;
}

export const RecordButton: React.FC<Props> = ({ label, onPress }) => {
  const [isActive, setIsActive] = React.useState(false);

  return (
    <button onClick={() => setIsActive(!isActive)}>
      {label}
    </button>
  );
};
```

### Props Typing

Always define props interface; use `React.FC<Props>` for clarity.

```typescript
interface TranslationDisplayProps {
  transcripts: TranscriptLine[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  transcripts,
  isLoading = false,
  onDelete,
}) => { };
```

### Hook Usage

- **Custom hooks**: Extract shared logic into `use-*` files; return destructured state + methods
- **Built-in hooks**: Use `useState`, `useEffect`, `useCallback`, `useMemo` as needed
- **Zustand**: Prefer store selectors to minimize re-renders

```typescript
// ✓ Good: explicit selector
const recording = useSessionStore((s) => s.recording);

// ✗ Avoid: re-renders on entire store change
const store = useSessionStore();
const recording = store.recording;
```

### Conditional Rendering

Prefer ternary or logical AND over if-statements in JSX.

```typescript
// ✓ Good
return error ? <ErrorBanner message={error} /> : <RecordButton />;

// ✓ Good (simple)
return isConnecting && <StatusBadge status="connecting" />;

// ✗ Avoid
if (error) {
  return <ErrorBanner message={error} />;
} else {
  return <RecordButton />;
}
```

### Key Prop

Always include `key` for list items; use stable IDs, not array indices.

```typescript
// ✓ Good
transcripts.map((t) => (
  <TranscriptLine key={t.id} transcript={t} />
))

// ✗ Avoid
transcripts.map((t, i) => (
  <TranscriptLine key={i} transcript={t} />
))
```

---

## State Management Patterns

### Zustand Stores

Create one store per domain. Use slices for large stores (not applicable to current 100 LOC limit).

```typescript
// session-store.ts
import { create } from 'zustand';

interface SessionState {
  recording: boolean;
  connected: boolean;
  interimToken: string;
  finalTokens: TranscriptLine[];
  error: Error | null;
  setRecording: (v: boolean) => void;
  setConnected: (v: boolean) => void;
  addToken: (t: TranscriptLine) => void;
  reset: () => void;
}

const initialState: Omit<SessionState, keyof Actions> = {
  recording: false,
  connected: false,
  interimToken: '',
  finalTokens: [],
  error: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,
  setRecording: (recording) => set({ recording }),
  setConnected: (connected) => set({ connected }),
  addToken: (token) =>
    set((s) => ({ finalTokens: [...s.finalTokens, token] })),
  reset: () => set(initialState),
}));
```

### Persisting Settings

Use `persist` middleware for `localStorage` integration (existing in `settings-store.ts`).

```typescript
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      sourceLang: 'en',
      targetLang: 'es',
      outputMode: 'text' as const,
      setApiKey: (key) => set({ apiKey: key }),
      // ...
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

### Avoiding Store Overhead

For component-local state (not shared), use `useState`.

```typescript
// ✓ Good: local state for settings panel visibility
const [isOpen, setIsOpen] = useState(false);

// ✗ Avoid: overkill for temporary UI state
const store = useUIStore();
store.setSettingsPanelOpen(true);
```

---

## Error Handling Patterns

### Try-Catch with User Feedback

All async operations should catch errors and dispatch to `SessionStore.error`.

```typescript
async function startRecording() {
  try {
    await audioCapture.start();
    await sonioxClient.connect();
    useSessionStore.setState({ connected: true, error: null });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    useSessionStore.setState({
      error: new Error(`Failed to start: ${errorMsg}`),
    });
  }
}
```

### User-Facing Errors

Keep error messages concise and actionable.

```typescript
// ✓ Good
'Microphone permission denied. Grant in Settings → Privacy.'

// ✗ Avoid
'PermissionDeniedError: NotAllowedError: Permission denied'
```

### Logging

Use `console.error()` for debugging; remove or set log level in production.

```typescript
console.error('[AudioCapture] Failed to initialize:', err);
```

---

## Tauri IPC Patterns

### Command Wrappers

Create TypeScript wrapper functions in `src/tauri/` for type safety.

```typescript
// tauri/transcript-fs.ts
import { invoke } from '@tauri-apps/api/core';

interface TranscriptMetadata {
  filename: string;
  size: number;
  created: string;
  modified: string;
}

export async function writeTranscript(
  filename: string,
  content: string
): Promise<void> {
  return await invoke('write_transcript', { filename, content });
}

export async function listTranscripts(): Promise<TranscriptMetadata[]> {
  return await invoke('list_transcripts');
}
```

### Error Handling

Always wrap Tauri commands with try-catch.

```typescript
async function saveTranscript(data: string) {
  try {
    await writeTranscript(`transcript-${Date.now()}.txt`, data);
    useSessionStore.setState({ error: null });
  } catch (err) {
    useSessionStore.setState({
      error: new Error(`Save failed: ${String(err)}`),
    });
  }
}
```

---

## Audio Processing Patterns

### AudioWorklet Setup

Initialize AudioWorklet with proper error handling and cleanup.

```typescript
async function initAudioWorklet() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    await context.audioWorklet.addModule('/pcm-worklet-processor.js');
    const worklet = new AudioWorkletNode(context, 'pcm-processor');
    // Configure ports, error handling
  } catch (err) {
    console.error('[AudioWorklet] Initialization failed:', err);
    throw err;
  }
}
```

### PCM Data Format

Always use signed 16-bit PCM at 16kHz for Soniox compatibility.

```typescript
// pcm-worklet-processor.ts
class PCMProcessor extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ) {
    const float32 = inputs[0][0];
    const int16 = new Int16Array(float32.length);

    // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.port.postMessage({ pcmChunk: int16 });
    return true;
  }
}
```

---

## TypeScript Best Practices

### Strict Mode

All TypeScript strict checks enabled in `tsconfig.json`.

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

### Avoid `any`

Use `unknown` or specific types instead.

```typescript
// ✓ Good
function parseResponse(data: unknown): TranscriptLine {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid response');
  }
  // Type guard and parse
}

// ✗ Avoid
function parseResponse(data: any): TranscriptLine {
  return data as TranscriptLine; // Unsafe!
}
```

### Type Narrowing

Use type guards and exhaustive checks.

```typescript
// ✓ Good
if (error instanceof Error) {
  console.error('Error message:', error.message);
} else {
  console.error('Unknown error:', error);
}

// Exhaustive check with discriminated union
type Event = { type: 'connect' } | { type: 'disconnect' };
function handle(event: Event) {
  switch (event.type) {
    case 'connect':
      // ...
      break;
    case 'disconnect':
      // ...
      break;
    // TS will error if case missing
  }
}
```

---

## Testing (Future)

### Unit Test Structure

When tests are added, follow this pattern:

```typescript
describe('RecordButton', () => {
  it('should call onPress when clicked', () => {
    const handlePress = jest.fn();
    render(<RecordButton label="Start" onPress={handlePress} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handlePress).toHaveBeenCalled();
  });
});
```

### Manual QA Checklist (Current)

Run before each release:

- [ ] Record and stop; transcript saved to disk
- [ ] Theme toggle persists across reload
- [ ] Language selection enforces mutual exclusion
- [ ] API key stored securely (check localStorage)
- [ ] TTS plays finalized lines (if enabled)
- [ ] Connection status badge updates correctly
- [ ] Error banner dismisses and reappears on new error
- [ ] No console errors in dev/prod modes
- [ ] Responsive on 320px (mobile) and 1920px (desktop) viewports
- [ ] Keyboard navigation works (Tab through controls)
- [ ] Screen reader announces button labels and status

---

## Rust Backend Standards

### Command Structure

All Tauri commands follow this pattern:

```rust
#[tauri::command]
pub fn write_transcript(
  filename: String,
  content: String,
) -> Result<(), String> {
  let path = expand_documents_path(&filename)?;
  std::fs::write(&path, &content)
    .map_err(|e| format!("Failed to write: {}", e))?;
  Ok(())
}
```

### Error Handling

Return `Result<T, String>` for Tauri commands; user sees error message.

```rust
// ✓ Good
let metadata = std::fs::metadata(&path)
  .map_err(|e| format!("Cannot read file: {}", e))?;

// ✗ Avoid
let metadata = std::fs::metadata(&path).unwrap(); // Panics!
```

### Path Handling

Always expand user paths safely; never trust user input.

```rust
fn expand_documents_path(filename: &str) -> Result<PathBuf, String> {
  let docs = dirs::document_dir()
    .ok_or_else(|| "Cannot find Documents directory".to_string())?;
  let app_dir = docs.join("TranslationAssistant");
  std::fs::create_dir_all(&app_dir)
    .map_err(|e| format!("Cannot create directory: {}", e))?;
  Ok(app_dir.join(filename))
}
```

---

## Styling with Tailwind CSS

### Class Organization

Order classes: layout → sizing → colors → spacing → effects → responsive.

```jsx
<div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 sm:flex-col">
  {/* ... */}
</div>
```

### Custom CSS Variables

Use Tailwind-extended CSS custom properties for theme tokens.

```css
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #0f172a;
  --accent: #3b82f6;
}

:root[data-theme="dark"] {
  --bg-primary: #0d0d14;
  --text-primary: #f1f5f9;
  --accent: #60a5fa;
}
```

Reference in components:

```jsx
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
  {/* ... */}
</div>
```

### Responsive Design

Mobile-first with Tailwind breakpoints.

```jsx
<div className="px-4 sm:px-6 md:px-8 max-w-[500px]">
  {/* 4px padding on mobile, 6px on sm+, 8px on md+ */}
</div>
```

---

## Code Review Checklist

Before pushing, ensure:

- [ ] No `console.log()` statements (except debugging)
- [ ] No `// TODO` comments left unresolved
- [ ] TypeScript strict mode passes (`npm run build`)
- [ ] No unused imports or variables
- [ ] Components are properly typed (no `React.FC` if not using children)
- [ ] Error messages are user-friendly
- [ ] State updates are immutable (no mutation)
- [ ] Accessibility: buttons labeled, colors accessible
- [ ] Tailwind classes are correct (no typos)
- [ ] Rust code compiles without warnings (`cargo check`)

---

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Updating Zustand state imperatively | Always use `set()` callback; never mutate |
| Missing error handling in async code | Wrap in try-catch; dispatch to error store |
| Creating new objects in render | Use `useMemo()` to prevent re-renders |
| Passing entire store as prop | Use selectors; pass only needed values |
| WebSocket not reconnecting | Implement exponential backoff (done in SonioxClient) |
| TTS blocking audio input | Use queue; emit non-blocking on finalize |
| Transcript not saved on stop | Always call `writeTranscript()` in stop handler |

---

## Performance Guidelines

### React Optimization

- Memoize expensive computations with `useMemo()`
- Use `useCallback()` for stable function refs in dependency arrays
- Avoid inline function definitions in props (use `useCallback()`)
- Lazy-load components if bundle size grows > 300KB gzipped

### Audio Processing

- AudioWorklet prevents main-thread blocking
- PCM chunks at 100ms intervals optimal for latency vs CPU
- Test memory usage while recording (target: < 200MB)

### State Updates

- Batch updates with Zustand when possible
- Avoid store subscriptions on every token (use callbacks instead)
- TTS queue limited to 3 utterances to prevent memory creep

---

## Documentation Standards

### Comments

Write comments for **why**, not **what**. Code should be self-documenting.

```typescript
// ✓ Good: explains intent
// Reconnect with exponential backoff to avoid overwhelming server
await reconnectWithBackoff();

// ✗ Avoid: restates code
// Increment i by 1
i++;
```

### JSDoc for Public APIs

Document functions exported from modules.

```typescript
/**
 * Writes transcript to disk and updates session store.
 * @param filename - Base filename (no path); saved to ~/Documents/TranslationAssistant/
 * @param content - Plain text transcript
 * @throws Error if write fails (permission denied, disk full, etc.)
 */
export async function saveTranscript(
  filename: string,
  content: string
): Promise<void> {
  // ...
}
```

---

## Security Best Practices

1. **API Keys**: Store in `settings-store` (localStorage) during MVP; migrate to Tauri keychain for v1.0
2. **Audio Data**: Never persist raw audio; save transcripts (text) only
3. **WebSocket**: Always use `wss://` (TLS); verify Soniox SSL cert
4. **Input Validation**: Validate filename and content in Rust command
5. **Dependencies**: Pin versions in `package.json` and `Cargo.toml`; audit regularly

---

## Version Control

### Commit Messages

Use conventional commits:

```
feat: add language picker component
fix: reconnect socket on temporary network loss
docs: update codebase summary
refactor: extract audio worklet initialization
test: add mock for Soniox client
chore: update dependencies
```

### Branch Naming

Use prefixes for clarity:

```
feature/language-picker
fix/audio-worklet-memory-leak
docs/update-readme
refactor/extract-soniox-types
```

---

## Continuous Improvement

- Monthly review of error logs to identify common failure patterns
- Quarterly audit of bundle size and performance metrics
- Feedback from beta users informs next phase standards
- Pre-release code reviews ensure compliance with all standards above

See [Codebase Summary](./codebase-summary.md) for current LOC metrics and [System Architecture](./system-architecture.md) for detailed design rationale.
