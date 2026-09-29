import { useEffect, useState } from "react";

function readOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/** Browser network status. Updates when the device goes offline or comes back. */
export function useOnlineStatus() {
  const [online, setOnline] = useState(readOnline);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
