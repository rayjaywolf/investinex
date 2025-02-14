"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StartTradingButton() {
  const router = useRouter();

  const handleClick = () => {
    const isEligible = localStorage.getItem("isEligible") === "true";
    router.push(isEligible ? "/chat" : "/not-eligible");
  };

  return (
    <Button
      size="lg"
      className="px-8 group font-bold text-md"
      onClick={handleClick}
    >
      Start Trading
      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Button>
  );
} 