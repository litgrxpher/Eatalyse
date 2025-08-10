
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  if (!isFirebaseConfigured()) {
    return (
        <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
                Please add your Firebase credentials to the <code className="font-mono text-xs bg-muted p-1 rounded-sm">.env.local</code> file to enable authentication.
            </AlertDescription>
        </Alert>
    )
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth) return;
    try {
      // Firebase requires an email for authentication, so we create a "dummy" one.
      const email = `${values.username.toLowerCase()}@macromate.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
      
      // We need to update the user's profile to store the username, as Firebase Auth primarily uses email.
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: values.username });
      }

      // We still pass the generated email to our Firestore user profile.
      await createUserProfile(userCredential.user.uid, email, values.username);
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This username is already taken. Please choose another one.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase API key is not configured. Please check your .env.local file.'
      } else {
        errorMessage = 'An error occurred during sign up. Please try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // When signing in with Google, we use the provided display name and email.
      // We fall back to a generated username if the display name is not available.
      const displayName = result.user.displayName || `user_${result.user.uid.substring(0, 5)}`;
      await createUserProfile(result.user.uid, result.user.email, displayName);
      router.push('/dashboard');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="choose_a_username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
       <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
        {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-66.5 64.6C305.5 102.6 277.9 88 248 88c-86.5 0-155.7 70.2-155.7 156s69.2 156 155.7 156c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
        )}
        Google
      </Button>
    </Form>
  );
}
