import { Notification, useNotificationStore } from "@/stores/notifications";
import { useEffect, useState } from "react";

const colors: Record<Notification["type"], string> = {
  info: "bg-blue-500",
  success: "bg-green-400",
  error: "bg-red-300",
  warning: "bg-yellow-500",
};

function NotificationElement({ notification }: { notification: Notification }) {
  const [startBarAnimation, setStartBarAnimation] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setStartBarAnimation(true);
    });
  }, []);

  return (
    <div
      className={`rounded-md pt-3 pb-5 px-4 text-gray-100 flex flex-col gap-0 overflow-hidden relative w-full ${
        colors[notification.type]
      }`}
    >
      <p className="text-lg font-bold">{notification.title}</p>
      <p className="text-sm">{notification.text}</p>

      <div
        className={`w-full h-1 bg-gray-100 absolute bottom-0 left-0 transition-transform origin-left ease-linear ${
          startBarAnimation ? "scale-x-0" : "scale-x-100"
        }`}
        style={{
          transitionDuration: `${notification.duration}ms`,
        }}
      ></div>
    </div>
  );
}

export interface NotificationsProps {}

export function Notifications() {
  const store = useNotificationStore();

  return (
    <div className="absolute bottom-0 right-0 flex flex-col p-4 gap-4 z-30 max-w-md w-full overflow-y-auto max-h-[95vh]">
      {store.notifications.map((notification) => (
        <NotificationElement key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
