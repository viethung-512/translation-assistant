// Large circular record/stop/pause/resume button. Pulse animation via CSS module.
import { useTranslation } from 'react-i18next';
import type { RecordingStatus } from '@/hooks/use-translation-session';
import styles from "./record-button.module.css";

interface Props {
  recordingStatus: RecordingStatus;
  isDisabled: boolean;
  onClick: () => void;
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <rect x="5" y="3" width="4" height="18" rx="1" />
      <rect x="15" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function StopSquareIcon() {
  return (
    <span style={{ width: 22, height: 22, background: "#fff", borderRadius: 5, display: "block" }} />
  );
}

export function RecordButton({ recordingStatus, isDisabled, onClick }: Props) {
  const { t } = useTranslation();

  const stateClass = isDisabled
    ? styles.disabled
    : recordingStatus === 'recording'
      ? styles.recording
      : recordingStatus === 'paused'
        ? styles.paused
        : styles.idle;

  const shouldPulse = recordingStatus === 'recording' && !isDisabled;

  const ariaLabel =
    recordingStatus === 'recording' ? t('aria_pause')  :
    recordingStatus === 'paused'    ? t('aria_resume') :
    recordingStatus === 'stopping'  ? t('aria_stop')   :
                                      t('aria_start');  // idle

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      className={[styles.btn, stateClass, shouldPulse ? styles.pulse : ""].join(" ")}
    >
      {recordingStatus === 'recording' && <PauseIcon />}
      {recordingStatus === 'paused'    && <PlayIcon />}
      {recordingStatus === 'stopping'  && <StopSquareIcon />}
      {recordingStatus === 'idle'      && <MicIcon />}
    </button>
  );
}
