import type { Meal } from "@/types";
import { MealCard } from "./meal-card";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface MealListProps {
  meals: Meal[];
  isLoading: boolean;
}

export function MealList({ meals, isLoading }: MealListProps) {
  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
        </div>
    );
  }

  if (meals.length === 0) {
    return (
      <Card className="flex h-48 items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <p>No meals logged for today.</p>
          <p>Click "Add Meal" to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}
    </div>
  );
}
