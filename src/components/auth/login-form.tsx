
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, isFirebaseConfigured } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      console.log('🔐 LoginForm - Starting login process');
      const auth = getAuthInstance();
      console.log('✅ LoginForm - Got auth instance:', !!auth);
      
      const email = `${values.username.toLowerCase()}@macromate.com`;
      console.log('📧 LoginForm - Attempting login with email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, values.password);
      console.log('✅ LoginForm - Login successful for user:', userCredential.user.uid);
      console.log('👤 LoginForm - User details:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      });
      
      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 LoginForm - Redirecting to dashboard');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('❌ LoginForm - Login error:', error);
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid username or password.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase API key is not configured. Please check your .env.local file.'
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Authentication not configured. Please enable Email/Password and Google sign-in providers in the Firebase Console.';
      } else {
        errorMessage = `An error occurred during login: ${error.message}`;
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="your_username" {...field} />
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
          Login
        </Button>
      </form>
    </Form>
  );
}
