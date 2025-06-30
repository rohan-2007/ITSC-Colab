type NotifyFunction = (msg: string, duration?: number) => void;

const notifyRef: { current: NotifyFunction | null } = {
  current: null,
};

export const setNotifyHandler = (fn: NotifyFunction) => {
  notifyRef.current = fn;
};

export const notify = (msg: string, duration?: number) => {
  if (notifyRef.current) {
    notifyRef.current(msg, duration);
  }
};

const QUEUE_KEY = `__queued_notifications__`;

export const notifyAfterReload = (msg: string, duration = 4000) => {
  const existing = JSON.parse(sessionStorage.getItem(QUEUE_KEY) ?? `[]`);
  const updated = [ ...existing, { duration, msg }];
  sessionStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
};
