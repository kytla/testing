import { useCallback, useEffect, useState } from "react";
import { useConfessions } from "../contexts/ConfessionContext";

export function useConfessionDeck(keyboardEnabled: boolean) {
  const { feed, currentId, setCurrentId } = useConfessions();
  const [direction, setDirection] = useState(0);

  const total = feed.length;
  const found = feed.findIndex((p) => p.id === currentId);
  const index = found === -1 ? 0 : found;

  const paginate = useCallback(
    (dir: number) => {
      if (total === 0) return;
      setDirection(dir);
      setCurrentId(feed[(index + dir + total) % total].id);
    },
    [feed, index, total, setCurrentId],
  );

  const next = useCallback(() => paginate(1), [paginate]);
  const prev = useCallback(() => paginate(-1), [paginate]);

  useEffect(() => {
    // Keyboard shortcuts are browser-only. React Native runtimes may expose
    // `window` without implementing addEventListener.
    if (
      !keyboardEnabled ||
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function"
    ) {
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      if (
        typeof window !== "undefined" &&
        typeof window.removeEventListener === "function"
      ) {
        window.removeEventListener("keydown", onKey);
      }
    };
  }, [keyboardEnabled, next, prev]);

  return { current: feed[index], index, total, direction, next, prev };
}
