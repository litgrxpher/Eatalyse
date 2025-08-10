"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { getMealsForDay } from "@/lib/firestore";
import type { Meal } from "@/types";
import { MacroSummary } from "./macro-summary";
import { MealList } from "./meal-list";
import { Button } from "../ui/button";
import { AddMealDialog } from "./add-meal-dialog";
import { Skeleton } from "../ui/skeleton";
import { PlusCircle } from "lucide-react";

export function DashboardClient() {
  const { user, userProfile } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchMeals = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const fetchedMeals = await getMealsForDay(user.uid, currentDate);
      setMeals(fetchedMeals);
      setIsLoading(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const dailyTotals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => {
        acc.calories += meal.totals.calories;
        acc.protein += meal.totals.protein;
        acc.carbs += meal.totals.carbs;
        acc.fat += meal.totals.fat;
        acc.fiber += meal.totals.fiber;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [meals]);

  if (!userProfile) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-semibold tracking-tight">Daily Summary</h2>
         <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Add Meal
         </Button>
      </div>

      <MacroSummary dailyTotals={dailyTotals} goals={userProfile.goals} />

      <h3 className="text-2xl font-semibold tracking-tight">Today's Meals</h3>
      <MealList meals={meals} isLoading={isLoading} />
      
      <AddMealDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onMealAdded={fetchMeals}
        date={format(currentDate, "yyyy-MM-dd")}
      />
    </div>
  );
}
