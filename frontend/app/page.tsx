import { HealthStatus } from "../components/HealthStatus";

export default function HomePage() {
  return (
    <main>
      <h1>LabOS</h1>
      <p>LabOS is running.</p>
      <HealthStatus />
    </main>
  );
}
