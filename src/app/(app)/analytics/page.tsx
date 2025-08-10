import { TrendsChart } from "@/components/analytics/trends-chart";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Analytics</h1>
        <p className="text-muted-foreground">
          Visualize your progress and identify trends in your nutrition.
        </p>
      </div>
      <TrendsChart />
    </div>
  );
}
