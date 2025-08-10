import type { Meal } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import Image from "next/image";

interface MealCardProps {
    meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
    return (
        <Card>
            <CardHeader>
                {meal.photoUrl && (
                     <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image src={meal.photoUrl} alt={meal.name} fill className="object-cover"/>
                     </div>
                )}
                <CardTitle className="mt-4">{meal.name}</CardTitle>
                <CardDescription>{meal.foodItems.map(item => item.name).join(', ')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                    <p><strong>Calories:</strong> {Math.round(meal.totals.calories)} kcal</p>
                    <p><strong>Protein:</strong> {Math.round(meal.totals.protein)} g</p>
                    <p><strong>Carbs:</strong> {Math.round(meal.totals.carbs)} g</p>
                    <p><strong>Fat:</strong> {Math.round(meal.totals.fat)} g</p>
                 </div>
            </CardContent>
        </Card>
    )
}
