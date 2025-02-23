import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TriangleAlert, ArrowRight } from "lucide-react";

export default function NotEligiblePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
            <TriangleAlert className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500">
              $INTX <span className="text-white">Token Required</span>
            </span>
          </h1>
          <p className="text-zinc-400 text-lg">
            You need $INTX token to use our chat and access advanced trading features.
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <a
            href="https://pumpfun.com/token/intx"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="gradientWhite"
              size="lg"
              className="w-full rounded-full font-medium text-base tracking-wide"
            >
              Buy on Pumpfun
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>

          <Link href="/" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium text-base tracking-wide"
            >
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
} 