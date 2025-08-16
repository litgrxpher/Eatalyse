
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
import { addMeal, updateMeal } from '@/lib/firestore';
import type { FoodItem, LookupMacroInformationOutput, Meal } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, X, Plus, Calculator, Image as ImageIcon, Search } from 'lucide-react';

interface AddMealDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onMealSaved: () => void;
  date: string;
  initialMealData?: Meal | null;
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

export function AddMealDialog({ isOpen, setIsOpen, onMealSaved, date, initialMealData }: AddMealDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [identifiedFoods, setIdentifiedFoods] = useState<IdentifiedFood[]>([]);
  const [isIdentifying, setIsIdentifying] = useState(false);
  
  const [manualFoods, setManualFoods] = useState<ManualFoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState('');
  const [newServingSize, setNewServingSize] = useState('1 serving');
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  const [mealName, setMealName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMealData) {
      setIsEditMode(true);
      setMealName(initialMealData.name);
      setImagePreview(initialMealData.photoUrl || null);
      
      const foods = initialMealData.foodItems.map(item => ({
        ...item,
        id: item.id || Date.now().toString() + Math.random(),
      }));
      setManualFoods(foods);
      
      setActiveTab('manual'); // Default to manual tab for editing
    } else {
      setIsEditMode(false);
      resetState();
    }
  }, [initialMealData, isOpen]);


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
          const macros = await lookupMacroInformation({ foodItem: name, servingSize: '1 serving' });
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
    setImagePreview(null);
    setImageFile(null);
    setIdentifiedFoods([]);
    setManualFoods([]);
    setMealName('');
    setIsIdentifying(false);
    setIsSaving(false);
    setActiveTab('ai');
    setNewFoodName('');
    setNewServingSize('1 serving');
  };

  const handleClose = () => {
    resetState();
    setIsOpen(false);
  };

  const handleSaveMeal = async () => {
    if (!user) return;
    
    let foodItems: FoodItem[] = [];
    let currentTab = isEditMode ? 'manual' : activeTab;
    
    if (currentTab === 'ai') {
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
          name: mealName || (activeTab === 'ai' ? 'AI Meal' : 'Manual Meal'),
          category: 'Snacks' as const, // Default category
          foodItems,
          totals,
          photoUrl: imagePreview || undefined
        };
        await addMeal(mealData, imageFile || undefined);
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
    const currentTab = isEditMode ? 'manual' : activeTab;
    const items = currentTab === 'ai' 
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
  }, [identifiedFoods, manualFoods, activeTab, isEditMode]);

  const canSave = () => {
    if (isIdentifying || isLookingUp) return false;
    const currentTab = isEditMode ? 'manual' : activeTab;
    if (currentTab === 'ai') {
      return identifiedFoods.some(f => f.status === 'loaded' && f.macros);
    } else {
      return manualFoods.length > 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modify your meal details below.' : 'Use AI to analyze a photo or enter macros manually.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ai' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2" disabled={isEditMode}>
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
            
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Add Food Item</h4>
              <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Label htmlFor="foodName">Food Name</Label>
                    <Input
                      id="foodName"
                      value={newFoodName}
                      onChange={(e) => setNewFoodName(e.target.value)}
                      placeholder="e.g., Apple"
                      disabled={isLookingUp}
                    />
                  </div>
                  <div>
                    <Label htmlFor="servingSize">Serving Size</Label>
                    <Input
                      id="servingSize"
                      value={newServingSize}
                      onChange={(e) => setNewServingSize(e.target.value)}
                      placeholder="e.g., 1 medium"
                      disabled={isLookingUp}
                    />
                  </div>
                  <Button onClick={handleLookupFood} disabled={isLookingUp || !newFoodName}>
                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="hidden sm:inline ml-2">Find Food</span>
                  </Button>
                </div>
            </div>

            {manualFoods.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Added Food Items</h4>
                <div className='border rounded-lg'>
                {manualFoods.map((food, index) => (
                  <div key={food.id} className={`p-3 ${index < manualFoods.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{food.name}</p>
                            <p className="text-sm text-muted-foreground">{food.servingSize}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeManualFood(food.id)}
                            className="h-8 w-8"
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
          </TabsContent>
        </Tabs>

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
                <p className="font-medium">{Math.round(totalMacros.protein)}g</p>
              </div>
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
          <Button onClick={handleSaveMeal} disabled={isSaving || !canSave()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Save Meal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
