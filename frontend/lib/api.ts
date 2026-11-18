export function getConfiguredApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

export function resolveApiBaseUrl(): string {
  const configured = getConfiguredApiBaseUrl();
  if (!configured || typeof window === "undefined") {
    return configured;
  }

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return configured;
  }

  try {
    const url = new URL(configured);
    url.hostname = hostname;
    return url.origin;
  } catch {
    return configured;
  }
}
