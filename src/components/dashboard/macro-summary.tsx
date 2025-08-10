import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Goals } from '@/types';
import { Flame, Beef, Wheat, Droplets, Leaf } from 'lucide-react';

interface MacroSummaryProps {
  dailyTotals: Goals;
  goals: Goals;
}

const macroDetails = [
  { key: 'calories', label: 'Calories', icon: Flame, color: 'hsl(var(--destructive))' },
  { key: 'protein', label: 'Protein', icon: Beef, color: 'hsl(var(--protein))' },
  { key: 'carbs', label: 'Carbs', icon: Wheat, color: 'hsl(var(--carbs))' },
  { key: 'fat', label: 'Fat', icon: Droplets, color: 'hsl(var(--fat))' },
  { key: 'fiber', label: 'Fiber', icon: Leaf, color: 'hsl(var(--fiber))' },
] as const;


export function MacroSummary({ dailyTotals, goals }: MacroSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {macroDetails.map(({ key, label, icon: Icon, color }) => {
        const value = dailyTotals[key] || 0;
        const goal = goals[key] || 1;
        const progress = Math.min((value / goal) * 100, 100);
        const unit = key === 'calories' ? 'kcal' : 'g';

        return (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(value)}{unit}</div>
              <p className="text-xs text-muted-foreground">
                of {goal}{unit} goal
              </p>
              <Progress value={progress} className="mt-4 h-2" indicatorcolor={color} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Need to update Progress component to accept indicator color
// In src/components/ui/progress.tsx
// Add indicatorColor prop and apply it as inline style
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

const OriginalProgress = Progress;
const CustomProgress = ({ indicatorcolor, ...props }: React.ComponentProps<typeof Progress> & { indicatorcolor?: string }) => {
  return (
    <OriginalProgress
      {...props}
      style={{'--indicator-color': indicatorcolor} as React.CSSProperties}
      className="[&>div]:bg-[--indicator-color]"
    />
  );
};
export { CustomProgress as Progress };
