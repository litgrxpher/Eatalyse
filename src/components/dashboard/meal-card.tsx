"use client";

import type { Meal } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Image from "next/image";
import { Button } from "../ui/button";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { useState } from "react";
import { deleteMeal } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface MealCardProps {
  meal: Meal;
  onMealDeleted: (mealId: string) => void;
  onMealEdit: (meal: Meal) => void;
}

export function MealCard({ meal, onMealDeleted, onMealEdit }: MealCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Authorized",
        description: "You must be logged in to delete meals.",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMeal(meal.id, user.uid);

      toast({
        title: "Meal Deleted",
        description: `"${meal.name}" has been removed from your log.`,
      });

      onMealDeleted(meal.id);
    } catch (error: any) {
      console.error("Error deleting meal:", error);

      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error?.message ||
          "Could not delete the meal. Please try again later.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        {/* Meal image */}
        {meal.photoUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
            <Image
              src={meal.photoUrl}
              alt={meal.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Title + actions */}
        <div className="flex justify-between items-start mt-4">
          <div>
            <CardTitle>{meal.name}</CardTitle>
            <CardDescription>
              {meal.foodItems.map((item) => item.name).join(", ")}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            {/* Edit button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onMealEdit(meal)}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Delete button with confirmation dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete{" "}
                    <span className="font-semibold">"{meal.name}"</span> and
                    remove it from your meal log.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      {/* Nutritional info */}
      <CardContent>
        <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
          <p>
            <strong>Calories:</strong> {Math.round(meal.totals.calories)} kcal
          </p>
          <p>
            <strong>Protein:</strong> {Math.round(meal.totals.protein)} g
          </p>
          <p>
            <strong>Carbs:</strong> {Math.round(meal.totals.carbs)} g
          </p>
          <p>
            <strong>Fat:</strong> {Math.round(meal.totals.fat)} g
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
