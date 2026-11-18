export type Theme = "light" | "dark";
export const themeStorageKey = "labos.theme";

export function parseTheme(value: unknown): Theme {
  return value === "dark" ? "dark" : "light";
}

// Runs before hydration so a saved dark preference never flashes a light page.
export const themeInitializationScript = `try{document.documentElement.dataset.theme=localStorage.getItem(${JSON.stringify(themeStorageKey)})==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}`;
