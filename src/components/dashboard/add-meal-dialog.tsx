
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { lookupMacroInformation } from '@/ai/flows/lookup-macro-information';
import { addMeal, updateMeal } from '@/lib/firestore';
import type { FoodItem, LookupMacroInformationOutput, Meal } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Plus } from 'lucide-react';

interface AddMealDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onMealSaved: () => void;
  date: string;
  initialMealData?: Meal | null;
}

type ManualFoodItem = {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export function AddMealDialog({ isOpen, setIsOpen, onMealSaved, date, initialMealData }: AddMealDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [manualFoods, setManualFoods] = useState<ManualFoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState('');
  const [newServingSize, setNewServingSize] = useState('1 serving');
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  const [mealName, setMealName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialMealData) {
      setIsEditMode(true);
      setMealName(initialMealData.name);
      
      const foods = initialMealData.foodItems.map(item => ({
        ...item,
        id: item.id || Date.now().toString() + Math.random(),
      }));
      setManualFoods(foods);
      
    } else {
      setIsEditMode(false);
      resetState();
    }
  }, [initialMealData, isOpen]);

  const handleLookupFood = async () => {
    if (!newFoodName) {
      toast({ variant: 'destructive', title: 'Food Name Required', description: 'Please enter a food name to look up.' });
      return;
    }
    setIsLookingUp(true);
    try {
      const macros = await lookupMacroInformation({ foodItem: newFoodName, servingSize: newServingSize });
      const newFood: ManualFoodItem = {
        id: Date.now().toString(),
        name: newFoodName,
        servingSize: newServingSize,
        ...macros
      };
      setManualFoods(prev => [...prev, newFood]);
      setNewFoodName('');
      setNewServingSize('1 serving');

    } catch (error) {
       toast({ variant: 'destructive', title: 'Lookup Failed', description: `Could not find nutritional information for "${newFoodName}". Please try a different name or be more specific.` });
    } finally {
      setIsLookingUp(false);
    }
  };

  const removeManualFood = (id: string) => {
    setManualFoods(manualFoods.filter(food => food.id !== id));
  };

  const resetState = () => {
    setManualFoods([]);
    setMealName('');
    setIsSaving(false);
    setNewFoodName('');
    setNewServingSize('1 serving');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Delay resetting state to prevent jarring UI shift during close animation
    setTimeout(() => {
      resetState();
      setIsEditMode(false);
    }, 300);
  };

  const handleSaveMeal = async () => {
    if (!user) return;
    
    let foodItems: FoodItem[] = manualFoods.map(food => ({
      id: food.id,
      name: food.name,
      servingSize: food.servingSize,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
    }));

    if (foodItems.length === 0) {
      toast({ variant: 'destructive', title: 'No Food Items', description: 'Please add at least one food item before saving.' });
      return;
    }

    setIsSaving(true);
    try {
      const totals = foodItems.reduce((acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        acc.fiber += item.fiber;
        return acc;
      }, {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0});

      if (isEditMode && initialMealData) {
         const mealUpdateData = {
          name: mealName || 'Edited Meal',
          foodItems,
          totals,
        };
        await updateMeal(initialMealData.id, mealUpdateData);
        toast({ title: 'Meal updated!', description: 'Your meal has been successfully updated.' });
      } else {
        const mealData = {
          userId: user.uid,
          date,
          name: mealName || 'Manual Meal',
          category: 'Snacks' as const,
          foodItems,
          totals,
        };
        await addMeal(mealData);
        toast({ title: 'Meal saved!', description: 'Your meal has been added to your log.' });
      }
      
      onMealSaved();
      handleClose();
    } catch(error) {
      toast({ variant: 'destructive', title: 'Error saving meal', description: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`});
    } finally {
      setIsSaving(false);
    }
  };
  
  const totalMacros = useMemo(() => {
    return manualFoods.reduce((acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        acc.fiber += item.fiber;
        return acc;
      }, {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0});
  }, [manualFoods]);

  const canSave = () => {
    if (isLookingUp || isSaving) return false;
    return manualFoods.length > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modify your meal details below.' : 'Enter macros manually.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <Input 
              value={mealName} 
              onChange={(e) => setMealName(e.target.value)} 
              placeholder="Meal Name, e.g. Chicken Salad" 
            />
            
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Add Food Item</h4>
              <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Label htmlFor="foodName">Food Name</Label>
                    <Input
                      id="foodName"
                      value={newFoodName}
                      onChange={(e) => setNewFoodName(e.target.value)}
                      placeholder="e.g., Grilled Chicken Breast"
                      disabled={isLookingUp}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookupFood()}
                    />
                  </div>
                  <div className="w-40">
                    <Label htmlFor="servingSize">Serving Size</Label>
                    <Input
                      id="servingSize"
                      value={newServingSize}
                      onChange={(e) => setNewServingSize(e.target.value)}
                      placeholder="e.g., 100g"
                      disabled={isLookingUp}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookupFood()}
                    />
                  </div>
                  <Button onClick={handleLookupFood} disabled={isLookingUp || !newFoodName}>
                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="hidden sm:inline ml-2">Add</span>
                  </Button>
                </div>
            </div>

            {manualFoods.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Added Food Items</h4>
                <div className='border rounded-lg'>
                {manualFoods.map((food, index) => (
                  <div key={food.id} className={`p-3 ${index < manualFoods.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-medium">{food.name}</p>
                            <p className="text-sm text-muted-foreground">{food.servingSize}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeManualFood(food.id)}
                            className="h-8 w-8 shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-sm mt-2">
                      <div>
                        <p className="text-muted-foreground">Calories</p>
                        <p className="font-medium">{Math.round(food.calories)} kcal</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Protein</p>
                        <p className="font-medium">{Math.round(food.protein)}g</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Carbs</p>
                        <p className="font-medium">{Math.round(food.carbs)}g</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-muted-foreground">Fat</p>
                        <p className="font-medium">{Math.round(food.fat)}g</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-muted-foreground">Fiber</p>
                        <p className="font-medium">{Math.round(food.fiber)}g</p>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
        </div>

        {(totalMacros.calories > 0) && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Total Macros for this Meal</h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Calories</p>
                <p className="font-medium">{Math.round(totalMacros.calories)} kcal</p>
              </div>
              <div>
                <p className="text-muted-foreground">Protein</p>
                <p className="font-medium">{Math.round(totalMacros.protein)}g</p>              </div>
              <div>
                <p className="text-muted-foreground">Carbs</p>
                <p className="font-medium">{Math.round(totalMacros.carbs)}g</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-muted-foreground">Fat</p>
                <p className="font-medium">{Math.round(totalMacros.fat)}g</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-muted-foreground">Fiber</p>
                <p className="font-medium">{Math.round(totalMacros.fiber)}g</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveMeal} disabled={!canSave()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Save Meal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
