
"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { identifyFoodFromImage } from '@/ai/flows/identify-food-from-image';
import { lookupMacroInformation } from '@/ai/flows/lookup-macro-information';
import { addMeal } from '@/lib/firestore';
import type { FoodItem, LookupMacroInformationOutput } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, X, Plus, Calculator, Image as ImageIcon } from 'lucide-react';

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

export function AddMealDialog({ isOpen, setIsOpen, onMealAdded, date }: AddMealDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [identifiedFoods, setIdentifiedFoods] = useState<IdentifiedFood[]>([]);
  const [isIdentifying, setIsIdentifying] = useState(false);
  
  const [manualFoods, setManualFoods] = useState<ManualFoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState('');
  const [newServingSize, setNewServingSize] = useState('');
  const [newCalories, setNewCalories] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newFat, setNewFat] = useState('');
  const [newFiber, setNewFiber] = useState('');
  
  const [mealName, setMealName] = useState('');
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
      setMealName(foodItems.length > 0 ? foodItems.join(', ') : 'My Meal');
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

  const addManualFood = () => {
    if (!newFoodName || !newServingSize || !newCalories) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill in at least the food name, serving size, and calories.' });
      return;
    }

    const newFood: ManualFoodItem = {
      id: Date.now().toString(),
      name: newFoodName,
      servingSize: newServingSize,
      calories: parseFloat(newCalories) || 0,
      protein: parseFloat(newProtein) || 0,
      carbs: parseFloat(newCarbs) || 0,
      fat: parseFloat(newFat) || 0,
      fiber: parseFloat(newFiber) || 0,
    };

    setManualFoods([...manualFoods, newFood]);
    
    setNewFoodName('');
    setNewServingSize('');
    setNewCalories('');
    setNewProtein('');
    setNewCarbs('');
    setNewFat('');
    setNewFiber('');
  };

  const removeManualFood = (id: string) => {
    setManualFoods(manualFoods.filter(food => food.id !== id));
  };

  const resetState = () => {
    setImagePreview(null);
    setImageFile(null);
    setIdentifiedFoods([]);
    setManualFoods([]);
    setMealName('');
    setIsIdentifying(false);
    setIsSaving(false);
    setActiveTab('ai');
  };

  const handleClose = () => {
    resetState();
    setIsOpen(false);
    onMealAdded();
  };

  const handleSaveMeal = async () => {
    if (!user) return;
    
    let foodItems: FoodItem[] = [];
    
    if (activeTab === 'ai') {
      foodItems = identifiedFoods
        .filter(f => f.status === 'loaded' && f.macros)
        .map(f => ({
          id: f.name,
          name: f.name,
          servingSize: '1 serving',
          ...f.macros!
        }));
    } else {
      foodItems = manualFoods.map(food => ({
        id: food.id,
        name: food.name,
        servingSize: food.servingSize,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
      }));
    }

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

      const mealData = {
        userId: user.uid,
        date,
        name: mealName || 'My Meal',
        category: 'Snacks' as const, // Default category
        foodItems,
        totals,
        photoUrl: imagePreview || ''
      };

      await addMeal(mealData, imageFile || undefined);
      
      toast({ title: 'Meal saved!', description: 'Your meal has been added to your log.' });
      handleClose();
    } catch(error) {
      toast({ variant: 'destructive', title: 'Error saving meal', description: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`});
    } finally {
      setIsSaving(false);
    }
  };
  
  const totalMacros = useMemo(() => {
    const items = activeTab === 'ai' 
      ? identifiedFoods.filter(f => f.status === 'loaded' && f.macros).map(f => f.macros!)
      : manualFoods;
      
    return items.reduce((acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        acc.fiber += item.fiber;
        return acc;
      }, {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0});
  }, [identifiedFoods, manualFoods, activeTab]);

  const canSave = () => {
    if (activeTab === 'ai') {
      return identifiedFoods.filter(f => f.status === 'loaded').length > 0;
    } else {
      return manualFoods.length > 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Meal</DialogTitle>
          <DialogDescription>
            Use AI to analyze a photo or enter macros manually.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ai' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              AI Photo Analysis
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            {!imagePreview ? (
              <div 
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-center text-muted-foreground">
                  Click to upload a photo or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  AI will identify food items and estimate macros
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
                <span>Identifying food and calculating macros...</span>
              </div>
            )}

            {identifiedFoods.length > 0 && (
              <div className="space-y-4">
                <Input 
                  value={mealName} 
                  onChange={(e) => setMealName(e.target.value)} 
                  placeholder="Meal Name" 
                />
                <div className="space-y-2">
                  {identifiedFoods.map((food, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <p className="font-medium">{food.name}</p>
                      {food.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {food.status === 'loaded' && food.macros && (
                        <p className="text-sm text-muted-foreground">{Math.round(food.macros.calories)} kcal</p>
                      )}
                      {food.status === 'error' && <p className="text-sm text-destructive">Error</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Input 
              value={mealName} 
              onChange={(e) => setMealName(e.target.value)} 
              placeholder="Meal Name" 
            />
            
            <div className="space-y-4">
              <h4 className="font-medium">Add Food Items</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="foodName">Food Name</Label>
                  <Input
                    id="foodName"
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    placeholder="e.g., Chicken Breast"
                  />
                </div>
                <div>
                  <Label htmlFor="servingSize">Serving Size</Label>
                  <Input
                    id="servingSize"
                    value={newServingSize}
                    onChange={(e) => setNewServingSize(e.target.value)}
                    placeholder="e.g., 100g, 1 cup"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(e.target.value)}
                    placeholder="kcal"
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={newProtein}
                    onChange={(e) => setNewProtein(e.target.value)}
                    placeholder="g"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={newCarbs}
                    onChange={(e) => setNewCarbs(e.target.value)}
                    placeholder="g"
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={newFat}
                    onChange={(e) => setNewFat(e.target.value)}
                    placeholder="g"
                  />
                </div>
                <div>
                  <Label htmlFor="fiber">Fiber (g)</Label>
                  <Input
                    id="fiber"
                    type="number"
                    value={newFiber}
                    onChange={(e) => setNewFiber(e.target.value)}
                    placeholder="g"
                  />
                </div>
              </div>
              
              <Button onClick={addManualFood} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Food Item
              </Button>
            </div>

            {manualFoods.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Added Food Items</h4>
                {manualFoods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">{food.name}</p>
                      <p className="text-sm text-muted-foreground">{food.servingSize}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm">{Math.round(food.calories)} kcal</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeManualFood(food.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {(totalMacros.calories > 0) && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Total Macros</h4>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Calories</p>
                <p className="font-medium">{Math.round(totalMacros.calories)} kcal</p>
              </div>
              <div>
                <p className="text-muted-foreground">Protein</p>
                <p className="font-medium">{Math.round(totalMacros.protein)}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Carbs</p>
                <p className="font-medium">{Math.round(totalMacros.carbs)}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fat</p>
                <p className="font-medium">{Math.round(totalMacros.fat)}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fiber</p>
                <p className="font-medium">{Math.round(totalMacros.fiber)}g</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveMeal} disabled={isSaving || !canSave()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
