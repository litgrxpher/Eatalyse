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

const mealCategories: MealCategory[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export function DashboardClient() {
  const { user, userProfile, loading } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Debug logging
  useEffect(() => {
    console.log('DashboardClient - Auth state:', { user, userProfile, loading });
  }, [user, userProfile, loading]);

  const fetchMeals = useCallback(async () => {
    if (user) {
      console.log('Fetching meals for user:', user.uid);
      setIsLoading(true);
      try {
        const fetchedMeals = await getMealsForDay(user.uid, currentDate);
        console.log('Fetched meals:', fetchedMeals);
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

  const handleAddMealClick = (category: MealCategory) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  // Show loading state while auth is loading
  if (loading) {
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

  // Show error state if no user
  if (!user) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive">Authentication Error</h2>
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // Show loading state if no user profile
  if (!userProfile) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading Profile...</h2>
          <p className="text-muted-foreground">Please wait while we load your profile.</p>
        </div>
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
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Add Your Meals</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking your nutrition by adding your first meal of the day.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mealCategories.map(category => (
            <div key={category} className="text-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => handleAddMealClick(category)}
              >
                <PlusCircle className="h-8 w-8"/>
                <span className="font-medium">{category}</span>
              </Button>
            </div>
          ))}
        </div>
        
        {meals.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Today's Meals</h3>
            <div className="space-y-3">
              {meals.map((meal) => (
                <div key={meal.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{meal.name}</h4>
                      <p className="text-sm text-muted-foreground">{meal.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{meal.totals.calories} kcal</p>
                      <p className="text-sm text-muted-foreground">
                        P: {meal.totals.protein}g | C: {meal.totals.carbs}g | F: {meal.totals.fat}g
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
