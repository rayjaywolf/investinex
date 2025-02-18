"use client";
import { Header } from "@/components/header";
import StartTradingButton from "@/components/StartTradingButton";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import {
  ArrowRight,
  Clock,
  LineChart,
  Shield,
  Activity,
  Brain,
  Coins,
  Zap,
  Github,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BlobGradient } from "@/components/ui/blob-gradient";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CircleBackground } from "@/components/ui/circle-background";
import { supercharge,coolvetica } from "@/app/fonts";
import EligibilityBadge from "@/components/EligibilityBadge";
import { Badge } from "@/components/ui/badge";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    // Hero section animation
    const heroContext = gsap.context(() => {
      gsap.from(".hero-content", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
      });
    }, heroRef);

    // Features section animation
    const featuresContext = gsap.context(() => {
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top center+=100",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });
    }, featuresRef);

    // Stats section animation
    const statsContext = gsap.context(() => {
      gsap.from(".stat-card", {
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top center+=100",
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
      });
    }, statsRef);

    return () => {
      heroContext.revert();
      featuresContext.revert();
      statsContext.revert();
    };
  }, []);

  return (
    <>
      <Header />
      <BlobGradient />
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ opacity: 0.1 }} />
      </div>
      <main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-background/80 via-background/70 to-background/60">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative w-full py-16 sm:py-24 md:py-32 lg:py-40 border-b border-white/10 overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-50" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <div className="relative">
              {/* Glowing orb */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-blue-500/30 blur-[120px]" />
            </div>
          </div>

          <div className="container px-4 sm:px-8 relative z-10">
            <div className="flex flex-col items-center space-y-6 sm:space-y-8 text-center">
              <div className="space-y-4 sm:space-y-6">
                <Badge 
                  variant="outline" 
                  className="mb-4 border-blue-500/20 bg-blue-500/10 text-blue-400 text-sm px-4 py-1.5 font-medium"
                >
                  <span className={`text-blue-300 font-bold`}>$INTX</span>&nbsp;&nbsp;RELEASE - XX.02.25
                </Badge>
                <h1 className="hero-content text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter">
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 bg-[length:200%] animate-[gradient-move_3s_ease-in-out_infinite] ${coolvetica.className} tracking-wide`}>
                    Investinex
                  </span>
                  <br />
                  <span className="text-white">
                    Trading Analysis
                  </span>
                </h1>
                <p className="hero-content mx-auto max-w-[700px] text-gray-400 text-base sm:text-lg md:text-xl px-4">
                  Make informed trading decisions with real-time market analysis
                  and precise recommendations powered by advanced AI.
                </p>
              </div>
              <div className="hero-content flex flex-col sm:flex-row gap-4 sm:space-x-4 w-full sm:w-auto px-4">
                <div className="w-full sm:w-auto">
                  <StartTradingButton />
                </div>
                <div className="w-full sm:w-auto">
                  <ConnectWalletButton />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          ref={featuresRef}
          className="w-full py-16 sm:py-20 px-4 sm:px-8 border-b border-white/10"
        >
          <div className="container px-4 sm:px-8">
            <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="feature-card flex flex-col items-center space-y-3 sm:space-y-4 text-center p-4">
                <div className="p-3 rounded-full bg-blue-600/10 border border-blue-600/20">
                  <LineChart className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold">Real-time Market Analysis</h3>
                <p className="text-gray-400">
                  Get timely insights on market trends and trading opportunities
                  as they emerge.
                </p>
              </div>
              <div className="feature-card flex flex-col items-center space-y-3 sm:space-y-4 text-center p-4">
                <div className="p-3 rounded-full bg-green-600/10 border border-green-600/20">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold">Risk Management</h3>
                <p className="text-gray-400">
                  Protect your investments with precise stop loss and take
                  profit recommendations.
                </p>
              </div>
              <div className="feature-card flex flex-col items-center space-y-3 sm:space-y-4 text-center p-4">
                <div className="p-3 rounded-full bg-purple-600/10 border border-purple-600/20">
                  <Clock className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold">Short-term Trading</h3>
                <p className="text-gray-400">
                  Optimized for trades spanning 20 minutes to 8 hours for
                  maximum efficiency.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="relative w-full py-16 sm:py-20 px-4 sm:px-8">
          {/* Decorative elements for stats section */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-50" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <div className="relative">
              {/* Glowing orb with purple/blue gradient */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[120px]"
                style={{
                  background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15), transparent)"
                }}
              />
            </div>
          </div>

          <div className="container px-4 sm:px-8 relative z-10">
            <div className="grid gap-8 lg:gap-10 lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                    Make Better Trading Decisions
                  </h2>
                  <p className="max-w-[600px] text-gray-400 text-base sm:text-lg md:text-xl">
                    Our AI analyzes market data, identifies patterns, and
                    provides actionable insights to help you trade with
                    confidence.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/chat" className="w-full sm:w-auto">
                    <Button 
                      variant="gradientWhite" 
                      size="lg" 
                      className="w-full sm:w-auto rounded-full font-medium text-base tracking-wide"
                    >
                      Try It Now
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <div className="stat-card rounded-lg border bg-card p-6 sm:p-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Activity className="w-8 h-8 text-blue-500" />
                      <h3 className="text-4xl font-bold">24/7</h3>
                    </div>
                    <p className="text-gray-400">Real-time market monitoring</p>
                  </div>
                </div>
                <div className="stat-card rounded-lg border bg-card p-6 sm:p-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Brain className="w-8 h-8 text-purple-500" />
                      <h3 className="text-4xl font-bold">AI</h3>
                    </div>
                    <p className="text-gray-400">Advanced analysis engine</p>
                  </div>
                </div>
                <div className="stat-card rounded-lg border bg-card p-6 sm:p-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <LineChart className="w-8 h-8 text-emerald-500" />
                      <h3 className="text-4xl font-bold">95%</h3>
                    </div>
                    <p className="text-gray-400">Prediction accuracy</p>
                  </div>
                </div>
                <div className="stat-card rounded-lg border bg-card p-6 sm:p-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Zap className="w-8 h-8 text-yellow-500" />
                      <h3 className="text-4xl font-bold">&lt;1s</h3>
                    </div>
                    <p className="text-gray-400">Response time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full py-6 border-t border-white/10">
        <div className="container px-8">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              <p>© 2025 Investinex. All rights reserved.</p>
              <p className="mt-2">For informational purposes only. This is not financial advice.</p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/rayjaywolf/investinex"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-primary transition-all duration-200"
              >
                Github
              </a>
              <a
                href="https://x.com/investinex"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-primary transition-all duration-200"
              >
                Twitter
              </a>
              <a
                href="/whitepaper.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-primary transition-all duration-200"
              >
                Whitepaper
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
