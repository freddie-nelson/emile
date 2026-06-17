import { create } from "zustand";

export interface Notification {
  id: number;
  title: string;
  text: string;
  type: "info" | "success" | "error" | "warning";
  duration: number;
}

export interface NotificationStore {
  notifications: Notification[];

  notify: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  notify: (notification: Notification) => {
    set((state) => {
      const notifications = [...state.notifications, notification];
      return { notifications };
    });

    setTimeout(() => {
      set((state) => {
        const notifications = state.notifications.filter((n) => n !== notification);
        return { notifications };
      });
    }, notification.duration);
  },
}));

export function notify(notification: Notification) {
  useNotificationStore.getState().notify(notification);
}

export function notifyError(title: string, text: string, duration = 3000) {
  notify({ id: Math.random(), title, text, type: "error", duration });
}

export function notifySuccess(title: string, text: string, duration = 3000) {
  notify({ id: Math.random(), title, text, type: "success", duration });
}

export function notifyInfo(title: string, text: string, duration = 3000) {
  notify({ id: Math.random(), title, text, type: "info", duration });
}

export function notifyWarning(title: string, text: string, duration = 3000) {
  notify({ id: Math.random(), title, text, type: "warning", duration });
}
