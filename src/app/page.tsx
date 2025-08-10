import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Camera, Zap, BarChart } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Sign Up <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 font-headline">
            Stop Guessing. Start Tracking.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            MacroMate is the effortless way to track your meals. Just snap a photo, and our AI will handle the rest. Achieve your fitness goals faster.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-secondary rounded-full mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Snap & Track</h3>
              <p className="text-muted-foreground">
                Take a picture of your meal. Our AI identifies the food and logs the macros for you.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-secondary rounded-full mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Powered by AI</h3>
              <p className="text-muted-foreground">
                Leveraging generative AI to give you accurate nutritional information in seconds.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-secondary rounded-full mb-4">
                <BarChart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Visualize Progress</h3>
              <p className="text-muted-foreground">
                Track your trends with beautiful charts and stay motivated on your fitness journey.
              </p>
            </div>
          </div>
        </section>
        
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="relative aspect-video max-w-5xl mx-auto">
                <Image 
                    src="https://placehold.co/1200x675.png" 
                    alt="MacroMate Dashboard" 
                    fill
                    className="rounded-lg shadow-2xl object-cover"
                    data-ai-hint="app screenshot dashboard"
                />
            </div>
        </section>

      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MacroMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
