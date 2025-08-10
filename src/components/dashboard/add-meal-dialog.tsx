"use client";

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
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
import { useAuth } from '@/hooks/use-auth';
import { identifyFoodFromImage } from '@/ai/flows/identify-food-from-image';
import { lookupMacroInformation } from '@/ai/flows/lookup-macro-information';
import { addMeal } from '@/lib/firestore';
import type { FoodItem, LookupMacroInformationOutput } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, X, Plus } from 'lucide-react';

interface AddMealDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onMealAdded: () => void;
  date: string;
}

type IdentifiedFood = {
  name: string;
  macros?: LookupMacroInformationOutput;
  status: 'loading' | 'loaded' | 'error';
};

export function AddMealDialog({ isOpen, setIsOpen, onMealAdded, date }: AddMealDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [identifiedFoods, setIdentifiedFoods] = useState<IdentifiedFood[]>([]);
  const [mealName, setMealName] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        processImage(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (dataUri: string) => {
    setIsIdentifying(true);
    setIdentifiedFoods([]);
    try {
      const { foodItems } = await identifyFoodFromImage({ photoDataUri: dataUri });
      setMealName(foodItems.join(', '));
      const initialFoods = foodItems.map(name => ({ name, status: 'loading' } as IdentifiedFood));
      setIdentifiedFoods(initialFoods);

      const macroPromises = foodItems.map(async (name, index) => {
        try {
          const macros = await lookupMacroInformation({ foodItem: name });
          setIdentifiedFoods(prev => {
            const newFoods = [...prev];
            newFoods[index] = { ...newFoods[index], macros, status: 'loaded' };
            return newFoods;
          });
        } catch (error) {
           setIdentifiedFoods(prev => {
            const newFoods = [...prev];
            newFoods[index] = { ...newFoods[index], status: 'error' };
            return newFoods;
          });
        }
      });
      await Promise.all(macroPromises);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error identifying food', description: 'Could not identify food from the image. Please try again or enter manually.' });
    } finally {
      setIsIdentifying(false);
    }
  };

  const resetState = () => {
    setImagePreview(null);
    setImageFile(null);
    setIdentifiedFoods([]);
    setMealName('');
    setIsIdentifying(false);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetState();
    setIsOpen(false);
  };

  const handleSaveMeal = async () => {
    if (!user || identifiedFoods.length === 0) return;
    setIsSaving(true);
    try {
        const foodItems: FoodItem[] = identifiedFoods
            .filter(f => f.status === 'loaded' && f.macros)
            .map(f => ({
                id: f.name,
                name: f.name,
                servingSize: '1 serving',
                ...f.macros!
            }));

        const totals = foodItems.reduce((acc, item) => {
            acc.calories += item.calories;
            acc.protein += item.protein;
            acc.carbs += item.carbs;
            acc.fat += item.fat;
            acc.fiber += item.fiber;
            return acc;
        }, {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0});

        await addMeal({
            userId: user.uid,
            date,
            name: mealName || 'My Meal',
            foodItems,
            totals,
            photoUrl: imagePreview || ''
        }, imageFile || undefined);
        
        toast({ title: 'Meal saved!', description: 'Your meal has been added to your log.' });
        onMealAdded();
        handleClose();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error saving meal', description: 'Something went wrong.'});
    } finally {
        setIsSaving(false);
    }
  };
  
  const totalMacros = useMemo(() => {
    return identifiedFoods
      .filter(f => f.status === 'loaded' && f.macros)
      .reduce((acc, item) => {
        acc.calories += item.macros!.calories;
        acc.protein += item.macros!.protein;
        acc.carbs += item.macros!.carbs;
        acc.fat += item.macros!.fat;
        return acc;
      }, {calories: 0, protein: 0, carbs: 0, fat: 0})
  }, [identifiedFoods])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add a New Meal</DialogTitle>
          <DialogDescription>
            Upload a photo of your meal to have AI identify it, or add items manually.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!imagePreview ? (
            <div 
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">
                Click to upload a photo or drag and drop
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          ) : (
            <div className="relative">
              <Image src={imagePreview} alt="Meal preview" width={600} height={400} className="rounded-lg object-cover" />
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={resetState}>
                  <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isIdentifying && (
             <div className="flex items-center justify-center p-4">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Identifying food...</span>
             </div>
          )}

          {identifiedFoods.length > 0 && (
            <div className="space-y-4">
                <Input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Meal Name (e.g., Lunch)" />
                <div className="space-y-2">
                    {identifiedFoods.map((food, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <p className="font-medium">{food.name}</p>
                            {food.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {food.status === 'loaded' && food.macros && (
                                <p className="text-sm text-muted-foreground">{Math.round(food.macros.calories)} kcal</p>
                            )}
                            {food.status === 'error' && <p className="text-sm text-destructive">Error</p>}
                        </div>
                    ))}
                </div>
                 <div className="font-bold text-right">
                    Total: {Math.round(totalMacros.calories)} kcal
                 </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveMeal} disabled={isSaving || identifiedFoods.filter(f => f.status === 'loaded').length === 0}>
             {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Save Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
