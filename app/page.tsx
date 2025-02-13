import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  LineChart,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-24 bg-gradient-to-b from-background via-background/95 to-background/90">
        <div className="px-4 md:px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl blur-3xl" />
          <div className="relative flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-secondary">
                Investinex
              </h1>
              <p className="mx-auto max-w-[700px] text-zinc-500 md:text-xl dark:text-zinc-400">
                Your specialized cryptocurrency investment advisor powered by
                advanced AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] w-full">
              <div className="flex flex-col items-center p-6 bg-card rounded-xl border shadow-sm">
                <LineChart className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Smart Analysis</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Real-time market analysis and trading opportunities
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-xl border shadow-sm">
                <Shield className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Risk Management</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Precise stop loss and take profit recommendations
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-xl border shadow-sm">
                <Clock className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Short-term Focus</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Optimized for 20-minute to 8-hour trading windows
                </p>
              </div>
            </div>

            <div className="space-x-4">
              <Link href="/chat">
                <Button size="lg" className="px-8 group font-bold text-md">
                  Start Trading
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
