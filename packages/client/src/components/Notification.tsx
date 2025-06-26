// NotificationEmitter.ts
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
