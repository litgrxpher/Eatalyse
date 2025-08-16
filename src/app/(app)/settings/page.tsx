
'use client';

import { GoalsForm } from "@/components/settings/goals-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthInstance } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const auth = getAuthInstance();
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage your goals and account settings.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Daily Goals</CardTitle>
            <CardDescription>Set your targets for calories and macronutrients.</CardDescription>
        </CardHeader>
        <CardContent>
            <GoalsForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
