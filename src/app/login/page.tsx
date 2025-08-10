'use client';
import { LoginForm } from '@/components/auth/login-form';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import Link from 'next/link';
import { CardFooter } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <AuthFormWrapper
      title="Welcome Back"
      description="Sign in to continue your tracking."
    >
      <LoginForm />
      <CardFooter className="flex justify-center text-sm mt-4">
        <p>Don't have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></p>
      </CardFooter>
    </AuthFormWrapper>
  );
}
