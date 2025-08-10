import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Zap className="h-6 w-6 text-primary" />
      <span className="text-xl font-bold tracking-tight">MacroMate</span>
    </Link>
  );
}
