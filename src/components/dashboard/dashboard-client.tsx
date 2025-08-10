"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { getMealsForDay } from "@/lib/firestore";
import type { Meal, MealCategory } from "@/types";
import { MacroSummary } from "./macro-summary";
import { MealList } from "./meal-list";
import { AddMealDialog } from "./add-meal-dialog";
import { Skeleton } from "../ui/skeleton";
import { Accordion } from "../ui/accordion";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";

const mealCategories: MealCategory[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export function DashboardClient() {
  const { user, userProfile } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | null>(null);
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

  const mealsByCategory = useMemo(() => {
    const grouped: { [key in MealCategory]?: Meal[] } = {};
    meals.forEach((meal) => {
      if (!grouped[meal.category]) {
        grouped[meal.category] = [];
      }
      grouped[meal.category]!.push(meal);
    });
    return grouped;
  }, [meals]);
  
  const handleAddMealClick = (category: MealCategory) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };


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
      <div>
         <h2 className="text-2xl font-semibold tracking-tight">Daily Summary for {format(currentDate, "MMMM d, yyyy")}</h2>
      </div>

      <MacroSummary dailyTotals={dailyTotals} goals={userProfile.goals} />
      
      <div className="space-y-4">
        {mealCategories.map(category => (
          <div key={category}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold tracking-tight">{category}</h3>
              <Button variant="ghost" size="sm" onClick={() => handleAddMealClick(category)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Meal
              </Button>
            </div>
            <MealList meals={mealsByCategory[category] || []} isLoading={isLoading} />
          </div>
        ))}
      </div>
      
      {selectedCategory && (
        <AddMealDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          onMealAdded={() => {
            fetchMeals();
            setSelectedCategory(null);
          }}
          date={format(currentDate, "yyyy-MM-dd")}
          category={selectedCategory}
        />
      )}
    </div>
  );
}
