import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function NotEligiblePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-red-900/20">
            <ShieldX className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tighter text-white">
            Access Denied
          </h1>
          <p className="text-zinc-400">
            You need to hold the required token to access this feature. Please verify your eligibility before proceeding.
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <Link href="/" className="block">
            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Return Home & Check Eligibility
            </Button>
          </Link>

          <p className="text-sm text-zinc-500">
            If you believe this is an error, please ensure you&apos;re using the correct wallet address and try again.
          </p>
        </div>
      </div>
    </main>
  );
} 