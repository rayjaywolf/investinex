import Link from "next/link";
import {
  Github,
  Twitter,
  Map,
  CheckCircle2,
  CalendarClock,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supercharge, coolvetica } from "@/app/fonts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="fixed top-0 w-full border-b border-white/10 bg-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20 z-50">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-all duration-200 hover:opacity-90 group"
            >
              <Avatar className="h-8 w-8 ring-2 ring-blue-500/20 bg-blue-500/10 transition-all duration-300 group-hover:ring-blue-500/40">
                <AvatarImage src="/avatar.png" alt="Investinex" />
                <AvatarFallback>IN</AvatarFallback>
              </Avatar>
              <span className={`text-xl tracking-wide ${coolvetica.className} bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 bg-[length:200%] animate-[gradient-move_3s_ease-in-out_infinite]`}>
                Investinex
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <Link 
                href="/chat"
                className="flex items-center gap-2 py-1.5 px-3 text-sm font-medium rounded-full transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Link>
              <Link 
                href="/trending"
                className="flex items-center gap-2 py-1.5 px-3 text-sm font-medium rounded-full transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </Link>
              <Link
                href="https://docs.investinex.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-1.5 px-3 text-sm font-medium rounded-full transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
              >
                <BookOpen className="h-4 w-4" />
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 py-1.5 px-3 text-sm font-medium rounded-full transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
                >
                  <Map className="h-4 w-4" />
                  Roadmap
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Development Roadmap</DialogTitle>
                </DialogHeader>
                <div className="pr-4 pt-6 pl-3 overflow-y-auto custom-scrollbar">
                  <div className="grid gap-8 pb-4">
                    <div className="relative pl-10 border-l-2 border-blue-500/20">
                      <div className="absolute -left-[13px] top-1">
                        <div className="rounded-full bg-background/80 backdrop-blur-sm p-0.5 border border-blue-500/20">
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 bg-clip-text text-transparent">
                          Q1 2025 - Launch
                        </h3>
                        <ul className="text-muted-foreground space-y-2">
                          <li className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                            AI-powered market analysis
                          </li>
                          <li className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                            Wallet tracker feature
                          </li>
                          <li className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                            Trending coins feature
                          </li>
                          <li className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                            $INTX token launch
                          </li>
                          <li className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                            Risk management features
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="relative pl-10 border-l-2 border-blue-500/20">
                      <div className="absolute -left-[13px] top-1">
                        <div className="rounded-full bg-background/80 backdrop-blur-sm p-0.5 border border-blue-500/20">
                          <div className="h-5 w-5 rounded-full border-2 border-blue-500/40" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-zinc-300/90 hover:text-blue-400 transition-colors">
                          Q2 2025 - Enhanced Analysis
                        </h3>
                        <ul className="text-muted-foreground space-y-2">
                          <li className="flex items-center gap-2 hover:text-blue-400/80 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
                            Advanced technical indicators
                          </li>
                          <li className="flex items-center gap-2 hover:text-blue-400/80 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
                            Portfolio tracking
                          </li>
                          <li className="flex items-center gap-2 hover:text-blue-400/80 transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
                            Performance analytics
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="relative pl-10 border-l-2 border-primary/20">
                      <div className="absolute -left-[13px] top-1">
                        <div className="rounded-full bg-background p-0.5">
                          <div className="h-5 w-5 rounded-full border-2 border-blue-500/40" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-zinc-300">
                          Q3 2025 - Social Features
                        </h3>
                        <ul className="text-muted-foreground space-y-2">
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/60" />
                            Community insights
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/60" />
                            Trading strategy sharing
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/60" />
                            Expert collaborations
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="relative pl-10 border-l-2 border-primary/20">
                      <div className="absolute -left-[13px] top-1">
                        <div className="rounded-full bg-background p-0.5">
                          <div className="h-5 w-5 rounded-full border-2 border-blue-500/40" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-zinc-300">
                          Q4 2025 - Advanced Tools
                        </h3>
                        <ul className="text-muted-foreground space-y-2">
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/60" />
                            Automated trading strategies
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/60" />
                            Custom indicator builder
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/60" />
                            Advanced risk modeling
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/rayjaywolf/investinex"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400 text-zinc-400 border border-transparent hover:border-blue-500/20"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/investinex"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400 text-zinc-400 border border-transparent hover:border-blue-500/20"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
