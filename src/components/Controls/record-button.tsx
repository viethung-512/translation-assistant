// Large circular record/stop/pause/resume button. Pulse animation via CSS module.
import { IconMic, IconPause, IconPlay } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import type { RecordingStatus } from '@/hooks/use-translation-session';
import styles from "./record-button.module.css";

interface Props {
  recordingStatus: RecordingStatus;
  isDisabled: boolean;
  onClick: () => void;
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
      {recordingStatus === 'recording' && <IconPause />}
      {recordingStatus === 'paused'    && <IconPlay />}
      {recordingStatus === 'stopping'  && <StopSquareIcon />}
      {recordingStatus === 'idle'      && <IconMic />}
    </button>
  );
}
