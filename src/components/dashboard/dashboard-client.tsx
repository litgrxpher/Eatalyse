
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { getMealsForDay } from "@/lib/firestore";
import type { Meal, MealCategory } from "@/types";
import { MacroSummary } from "./macro-summary";
import { AddMealDialog } from "./add-meal-dialog";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";
import { MealList } from "./meal-list";

export function DashboardClient() {
  const { user, userProfile, loading } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchMeals = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const fetchedMeals = await getMealsForDay(user.uid, currentDate);
        setMeals(fetchedMeals);
      } catch (error) {
        console.error('Error fetching meals:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, currentDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleMealDeleted = (mealId: string) => {
    setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
  };

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

  if (loading || !user || !userProfile) {
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
      <div>
         <h2 className="text-2xl font-semibold tracking-tight">Daily Summary for {format(currentDate, "MMMM d, yyyy")}</h2>
      </div>

      <MacroSummary dailyTotals={dailyTotals} goals={userProfile.goals} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Today's Meals</h3>
           <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Meal
           </Button>
        </div>
        
        <MealList meals={meals} isLoading={isLoading} onMealDeleted={handleMealDeleted} />
      </div>
      
      <AddMealDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onMealAdded={() => {
          fetchMeals();
        }}
        date={format(currentDate, "yyyy-MM-dd")}
      />
    </div>
  );
}
