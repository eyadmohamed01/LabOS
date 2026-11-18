"use client";

import { useEffect, useState } from "react";

import { getConfiguredApiBaseUrl, resolveApiBaseUrl } from "../lib/api";

type Status = "checking" | "ok" | "unavailable";

export function HealthStatus() {
  const [apiBaseUrl, setApiBaseUrl] = useState(getConfiguredApiBaseUrl);
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const baseUrl = resolveApiBaseUrl();
    const controller = new AbortController();
    setApiBaseUrl(baseUrl);

    fetch(`${baseUrl}/api/health`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setStatus("unavailable");
          return;
        }
        const body: unknown = await response.json();
        if (
          typeof body === "object" &&
          body !== null &&
          "status" in body &&
          (body as { status?: unknown }).status === "ok"
        ) {
          setStatus("ok");
          return;
        }
        setStatus("unavailable");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  const healthUrl = `${apiBaseUrl}/api/health`;
  const docsUrl = `${apiBaseUrl}/docs`;
  const label =
    status === "checking" ? "Checking" : status === "ok" ? "Running" : "Unavailable";

  return (
    <section>
      <h2>Backend</h2>
      <p>
        Status: <strong>{label}</strong>
      </p>
      <p>
        <a href={healthUrl}>Health check</a>
      </p>
      <p>
        <a href={docsUrl}>API documentation</a>
      </p>
    </section>
  );
}
