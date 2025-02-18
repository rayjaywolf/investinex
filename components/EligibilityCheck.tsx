"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EligibilityCheck() {
  const [status, setStatus] = useState<{
    isEligible: boolean;
    walletAddress: string | null;
  }>({
    isEligible: true,
    walletAddress: null,
  });

  useEffect(() => {
    // Add event listener for storage changes
    const handleStorageChange = () => {
      const walletAddress = localStorage.getItem("walletAddress");
      setStatus({ isEligible: true, walletAddress });
    };

    // Initial check
    handleStorageChange();

    // Listen for changes
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("walletStatusChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("walletStatusChange", handleStorageChange);
    };
  }, []);

  if (!status.walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
          <p className="text-gray-400">
            Connect your Solana wallet to access the platform
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Wallet Connected</h2>
        <div className="p-4 rounded-lg bg-green-900/50 border border-green-700">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm text-white">
              You are connected to the platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 