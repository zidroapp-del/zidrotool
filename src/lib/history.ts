import { useCallback, useEffect, useState } from "react";

const HIST_KEY = "zidrotool-history";
const MAX = 50;

export interface HistoryEntry {
  slug: string;
  name: string;
  ts: number;
}

function read(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    typeof window === "undefined" ? [] : read(),
  );

  useEffect(() => {
    const handler = () => setHistory(read());
    window.addEventListener("zidrotool-history-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("zidrotool-history-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const addHistory = useCallback((entry: HistoryEntry) => {
    const cur = read().filter((e) => e.slug !== entry.slug);
    const next = [entry, ...cur].slice(0, MAX);
    localStorage.setItem(HIST_KEY, JSON.stringify(next));
    setHistory(next);
    window.dispatchEvent(new Event("zidrotool-history-changed"));
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HIST_KEY);
    setHistory([]);
    window.dispatchEvent(new Event("zidrotool-history-changed"));
  }, []);

  return { history, addHistory, clearHistory };
}
