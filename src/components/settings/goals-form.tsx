"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { updateUserGoals } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";

const goalsSchema = z.object({
  calories: z.coerce.number().min(1, "Calories must be positive."),
  protein: z.coerce.number().min(1, "Protein must be positive."),
  carbs: z.coerce.number().min(1, "Carbs must be positive."),
  fat: z.coerce.number().min(1, "Fat must be positive."),
  fiber: z.coerce.number().min(1, "Fiber must be positive."),
});

export function GoalsForm() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof goalsSchema>>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 60,
      fiber: 30
    }
  });
  
  useEffect(() => {
    if (userProfile) {
        form.reset(userProfile.goals);
    }
  }, [userProfile, form]);

  async function onSubmit(values: z.infer<typeof goalsSchema>) {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserGoals(user.uid, values);
      toast({
        title: "Goals Updated",
        description: "Your daily goals have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save your goals. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!userProfile) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="calories"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Calories (kcal)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="2000" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="protein"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Protein (g)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="150" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="carbs"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Carbohydrates (g)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="200" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="fat"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fat (g)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="60" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="fiber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fiber (g)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
