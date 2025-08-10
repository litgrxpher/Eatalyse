'use client';
import { SignupForm } from '@/components/auth/signup-form';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import Link from 'next/link';
import { CardFooter } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <AuthFormWrapper
      title="Create an Account"
      description="Start your fitness journey with MacroMate today."
    >
      <SignupForm />
       <CardFooter className="flex justify-center text-sm mt-4">
        <p>Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link></p>
      </CardFooter>
    </AuthFormWrapper>
  );
}
