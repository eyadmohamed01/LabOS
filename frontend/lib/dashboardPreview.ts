export type DashboardPreview = "populated" | "empty";

export function readDashboardPreview(
  search: string,
  development: boolean,
): DashboardPreview {
  return development && new URLSearchParams(search).get("dashboard") === "empty"
    ? "empty"
    : "populated";
}
