
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { getMealsForDay } from "@/lib/firestore";
import type { Meal } from "@/types";
import { MacroSummary } from "./macro-summary";
import { AddMealDialog } from "./add-meal-dialog";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { PlusCircle, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { MealList } from "./meal-list";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";

export function DashboardClient() {
  const { user, userProfile, loading } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
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

  const handleOpenAddDialog = () => {
    setEditingMeal(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (meal: Meal) => {
    setEditingMeal(meal);
    setIsDialogOpen(true);
  };

  const handleMealDeleted = (mealId: string) => {
    setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
  };
  
  const handleMealSaved = () => {
    fetchMeals();
  }

  const handlePreviousDay = () => {
    setCurrentDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
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
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-semibold tracking-tight">Daily Summary for {format(currentDate, "MMMM d, yyyy")}</h2>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Day</span>
           </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} size={"icon"}>
                  <CalendarIcon className="h-4 w-4" />
                  <span className="sr-only">Pick a date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    if (date) {
                      setCurrentDate(date)
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
           <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isToday(currentDate)}>
              <ChevronRight className="h-4 w-4" />
               <span className="sr-only">Next Day</span>
           </Button>
         </div>
      </div>

      <MacroSummary dailyTotals={dailyTotals} goals={userProfile.goals} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Meals for {format(currentDate, "MMMM d")}</h3>
           <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Meal
           </Button>
        </div>
        
        <MealList 
          meals={meals} 
          isLoading={isLoading} 
          onMealDeleted={handleMealDeleted} 
          onMealEdit={handleOpenEditDialog}
        />
      </div>
      
      <AddMealDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onMealSaved={handleMealSaved}
        date={format(currentDate, "yyyy-MM-dd")}
        initialMealData={editingMeal}
      />
    </div>
  );
}
