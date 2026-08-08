import { useCallback, useEffect, useState } from "react";

const FAV_KEY = "zidrotool-favorites";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : read(),
  );

  useEffect(() => {
    const handler = () => setFavorites(read());
    window.addEventListener("zidrotool-favorites-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("zidrotool-favorites-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    setFavorites(next);
    window.dispatchEvent(new Event("zidrotool-favorites-changed"));
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      const next = favorites.includes(slug)
        ? favorites.filter((s) => s !== slug)
        : [...favorites, slug];
      persist(next);
    },
    [favorites, persist],
  );

  return { favorites, isFavorite, toggleFavorite };
}
