
import type { Meal } from "@/types";
import { MealCard } from "./meal-card";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface MealListProps {
  meals: Meal[];
  isLoading: boolean;
  onMealDeleted: (mealId: string) => void;
  onMealEdit: (meal: Meal) => void;
}

export function MealList({ meals, isLoading, onMealDeleted, onMealEdit }: MealListProps) {
  if (isLoading) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-60" />
            <Skeleton className="h-60" />
            <Skeleton className="h-60" />
        </div>
    );
  }

  if (meals.length === 0) {
    return (
      <Card className="flex h-48 items-center justify-center border-dashed">
        <CardContent className="text-center text-muted-foreground p-6">
          <p>No meals logged for today.</p>
          <p>Click "Add Meal" to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => (
        <MealCard 
          key={meal.id} 
          meal={meal} 
          onMealDeleted={onMealDeleted}
          onMealEdit={onMealEdit}
        />
      ))}
    </div>
  );
}
