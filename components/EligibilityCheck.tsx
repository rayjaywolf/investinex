"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EligibilityCheck() {
  const [status, setStatus] = useState<{
    isEligible: boolean;
    walletAddress: string | null;
  }>({
    isEligible: false,
    walletAddress: null,
  });

  useEffect(() => {
    // Add event listener for storage changes
    const handleStorageChange = () => {
      const isEligible = localStorage.getItem("isEligible") === "true";
      const walletAddress = localStorage.getItem("walletAddress");
      setStatus({ isEligible, walletAddress });
    };

    // Initial check
    handleStorageChange();

    // Listen for changes
    window.addEventListener("storage", handleStorageChange);

    // Custom event for direct updates
    window.addEventListener("walletStatusChange", handleStorageChange);

    // Add this useEffect for route protection
    const validateAccess = () => {
      const isEligible = localStorage.getItem("isEligible") === "true";
      const currentPath = window.location.pathname;

      if (currentPath.startsWith("/chat") && !isEligible) {
        window.location.href = "/";
      }
    };

    // Initial check
    validateAccess();

    // Create enhanced handler
    const protectedRouteHandler = () => {
      validateAccess();
      const isEligible = localStorage.getItem("isEligible") === "true";
      const walletAddress = localStorage.getItem("walletAddress");
      setStatus({ isEligible, walletAddress });
    };

    window.addEventListener("storage", protectedRouteHandler);
    window.addEventListener("walletStatusChange", protectedRouteHandler);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("walletStatusChange", handleStorageChange);
      window.removeEventListener("storage", protectedRouteHandler);
      window.removeEventListener("walletStatusChange", protectedRouteHandler);
    };
  }, []);

  if (!status.walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Check Eligibility</h2>
          <p className="text-gray-400">
            Connect your Solana wallet to check eligibility
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Eligibility Status</h2>
        <div
          className={`p-4 rounded-lg ${status.isEligible
              ? "bg-green-900/50 border border-green-700"
              : "bg-red-900/50 border border-red-700"
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            {status.isEligible ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <p className="text-sm text-white">
              {status.isEligible
                ? "You are eligible to use the platform"
                : "You need to hold the required token to access this feature"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 