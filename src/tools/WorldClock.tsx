import { useState, useEffect } from "react";

const CITIES = [
  { name: "New York", tz: "America/New_York" },
  { name: "London", tz: "Europe/London" },
  { name: "Paris", tz: "Europe/Paris" },
  { name: "Dubai", tz: "Asia/Dubai" },
  { name: "Tokyo", tz: "Asia/Tokyo" },
  { name: "Sydney", tz: "Australia/Sydney" },
  { name: "Los Angeles", tz: "America/Los_Angeles" },
  { name: "Singapore", tz: "Asia/Singapore" },
];

export default function WorldClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CITIES.map((c) => {
          const time = now.toLocaleTimeString("en-US", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
          const date = now.toLocaleDateString("en-US", { timeZone: c.tz, weekday: "short", month: "short", day: "numeric" });
          return (
            <div key={c.name} className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{c.name}</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">{time}</p>
              <p className="text-xs text-ink-400">{date}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
