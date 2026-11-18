"use client";

import { useEffect, useState } from "react";
import { parseTheme, themeStorageKey, type Theme } from "../../lib/theme";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";

export function ThemeToggle() {
  const { t } = useLocale();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let initial = parseTheme(document.documentElement.dataset.theme);
    try {
      initial = parseTheme(localStorage.getItem(themeStorageKey));
    } catch {
      /* Keep the rendered theme if browser storage is blocked. */
    }
    document.documentElement.dataset.theme = initial;
    setTheme(initial);
    const sync = (event: StorageEvent) => {
      if (event.key !== themeStorageKey && event.key !== null) return;
      const next = parseTheme(event.newValue);
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      /* The toggle also works when storage is unavailable. */
    }
  }

  const label = t(
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
  );
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === "dark"}
    >
      <span key={theme} className="theme-toggle-icon">
        <Icon name={theme === "dark" ? "moon" : "sun"} size={16} />
      </span>
      <span className="theme-toggle-label">
        {t(theme === "dark" ? "Dark" : "Light")}
      </span>
    </button>
  );
}
