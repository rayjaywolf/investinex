"use client";

import { Brain, DollarSign } from "lucide-react";

export default function EligibilityBadge() {
  return (
    <div className="flex justify-center hero-content">
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-500">
      <DollarSign className="w-3.5 h-3.5" />
      <span className="font-medium">INVESTINEX</span>
    </div>
  </div>
  );  
} 