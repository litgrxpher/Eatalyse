
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, isFirebaseConfigured } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
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
    try {
      const auth = getAuthInstance();
      const email = `${values.username.toLowerCase()}@macromate.com`;
      console.log('Creating user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
      console.log('User created, creating profile for:', userCredential.user.uid);
      await createUserProfile(userCredential.user.uid, {
        email: email,
        displayName: values.name,
        photoURL: null
      });
      console.log('Profile created, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This username is already taken. Please choose another one.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase API key is not configured. Please check your .env.local file.'
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Authentication not configured. Please enable Email/Password and Google sign-in providers in the Firebase Console.';
      }
      else {
        errorMessage = `An error occurred during sign up: ${error.message}`;
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
    </Form>
  );
}
