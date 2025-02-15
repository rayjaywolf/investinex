"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function StartTradingButton() {
  return (
    <Link href="/chat">
      <Button 
        variant="gradientWhite" 
        size="lg" 
        className="rounded-full font-medium text-base tracking-wide bg-gradient-to-t from-zinc-100 to-white text-black/80"
      >
        Start Trading
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Link>
  );
}
