import { GoalsForm } from "@/components/settings/goals-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and daily nutritional goals.
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
    </div>
  );
}
