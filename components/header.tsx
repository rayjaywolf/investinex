import Link from "next/link";
import {
  Github,
  Twitter,
  Map,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supercharge } from "@/app/fonts";

export function Header() {
  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className={`text-lg ${supercharge.className} text-white`}>
            Nexus
          </span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Map className="h-4 w-4" />
                Roadmap
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <CalendarClock className="h-6 w-6 text-primary" />
                  Product Roadmap
                </DialogTitle>
              </DialogHeader>
              <div className="pr-4">
                <div className="grid gap-8">
                  <div className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[11px] top-1">
                      <div className="rounded-full bg-background p-0.5">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Q1 2025 - Launch
                      </h3>
                      <ul className="text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          AI-powered market analysis
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          Basic trading recommendations
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          Risk management features
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[11px] top-1">
                      <div className="rounded-full bg-background p-0.5">
                        <div className="h-5 w-5 rounded-full border-2 border-primary/40" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        Q2 2025 - Enhanced Analysis
                      </h3>
                      <ul className="text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Advanced technical indicators
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Portfolio tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Performance analytics
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[11px] top-1">
                      <div className="rounded-full bg-background p-0.5">
                        <div className="h-5 w-5 rounded-full border-2 border-primary/40" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        Q3 2025 - Social Features
                      </h3>
                      <ul className="text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Community insights
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Trading strategy sharing
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Expert collaborations
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="relative pl-8 border-l-2 border-primary/20">
                    <div className="absolute -left-[11px] top-1">
                      <div className="rounded-full bg-background p-0.5">
                        <div className="h-5 w-5 rounded-full border-2 border-primary/40" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        Q4 2025 - Advanced Tools
                      </h3>
                      <ul className="text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Automated trading strategies
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Custom indicator builder
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Advanced risk modeling
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <a
            href="https://github.com/rayjaywolf/samaritan"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://x.com/SamaritanAI_SOL"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            <Twitter className="h-5 w-5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
