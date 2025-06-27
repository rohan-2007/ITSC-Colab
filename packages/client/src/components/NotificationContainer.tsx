import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { notify, setNotifyHandler } from './Notification';

interface Notification {
  id: number;
  duration: number;
  message: string;
}

const NotificationSystem: React.FC = () => {
  const [ notifications, setNotifications ] = useState<Notification[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
  // Set up notify handler
    setNotifyHandler((msg, duration = 4000) => {
      idRef.current += 1;
      const id = idRef.current;
      setNotifications((prev) => [ ...prev, { id, duration, message: msg }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    });

    // Handle queued notifications after reload
    const queued = sessionStorage.getItem(`__queued_notifications__`);
    if (queued) {
      try {
        const messages = JSON.parse(queued);
        if (Array.isArray(messages)) {
          messages.forEach((n: { duration: number, msg: string }) => {
            notify(n.msg, n.duration);
          });
        }
      } catch {
        notify(`Failed to parse queued notifications`);
      } finally {
        sessionStorage.removeItem(`__queued_notifications__`);
      }
    }
  }, []);

  return createPortal(
    <div style={styles.container}>
      <AnimatePresence>
        {notifications.map(({ id, duration, message }) =>
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={styles.toast}
          >
            <span style={styles.message}>{message}</span>
            <div
              style={{
                ...styles.progress,
                animationDuration: `${duration}ms`,
              }}
            />
            <button onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== id))} style={styles.close}>
              ✕
            </button>
          </motion.div>)}
      </AnimatePresence>
    </div>,
    document.body,
  );
};

export default NotificationSystem;

const styles: { [key: string]: React.CSSProperties } = {
  close: {
    background: `transparent`,
    border: `none`,
    color: `#888`,
    cursor: `pointer`,
    fontSize: `1.1rem`,
    position: `absolute`,
    right: `0.5rem`,
    top: `0.4rem`,
  },
  container: {
    display: `flex`,
    flexDirection: `column`,
    gap: `0.75rem`,
    position: `fixed`,
    right: `1rem`,
    top: `1rem`,
    zIndex: 9999,
  },
  message: {
    fontSize: `0.95rem`,
  },
  progress: {
    animationFillMode: `forwards`,
    animationName: `shrink`,
    animationTimingFunction: `linear`,
    background: `#d60000`,
    bottom: 0,
    height: `3px`,
    left: 0,
    position: `absolute`,
    width: `100%`,
  },
  toast: {
    background: `#fff`,
    borderLeft: `4px solid #d60000`,
    borderRadius: `12px`,
    boxShadow: `0 8px 20px rgba(0, 0, 0, 0.1)`,
    color: `#333`,
    fontFamily: `Segoe UI, sans-serif`,
    maxWidth: `350px`,
    minWidth: `250px`,
    padding: `1rem 1.25rem`,
    position: `relative`,
  },
};

// Keyframes (safe for runtime style injection)
const styleSheet = document.createElement(`style`);
styleSheet.innerText = `
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}`;
document.head.appendChild(styleSheet);
