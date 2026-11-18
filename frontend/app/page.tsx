import { Dashboard } from "../components/dashboard/Dashboard";
import { readDashboardPreview } from "../lib/dashboardPreview";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ dashboard?: string | string[] }>;
}) {
  const development = process.env.NODE_ENV === "development";
  const params = development ? await searchParams : {};
  const query =
    typeof params.dashboard === "string"
      ? new URLSearchParams({ dashboard: params.dashboard }).toString()
      : "";
  return (
    <Dashboard initialPreview={readDashboardPreview(query, development)} />
  );
}
