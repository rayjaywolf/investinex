"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cookies } from 'next/headers';

export default function EligibilityCheck() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isEligible?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Check if already eligible
  useEffect(() => {
    const isEligible = localStorage.getItem("isEligible") === "true";
    if (isEligible) {
      setResult({
        isEligible: true,
        message: "You are eligible and can access the chat."
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/check-eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check eligibility");
      }

      // Store eligibility status if eligible
      if (data.isEligible) {
        // Store in localStorage
        localStorage.setItem("isEligible", "true");
        localStorage.setItem("walletAddress", walletAddress);

        // Set cookie through API call
        await fetch("/api/set-eligibility", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isEligible: true }),
        });

        // Redirect to chat after a short delay
        setTimeout(() => {
          router.push("/chat");
        }, 1500);
      }

      setResult(data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Failed to check eligibility",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Check Eligibility</h2>
        <p className="text-gray-400">Enter your Solana wallet address to check eligibility</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="wallet" className="sr-only">
            Wallet Address
          </label>
          <input
            id="wallet"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-700 bg-black/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Solana wallet address"
            required
            pattern="^[1-9A-HJ-NP-Za-km-z]{32,44}$"
            title="Please enter a valid Solana wallet address"
            aria-label="Solana wallet address input"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Checking...
            </>
          ) : (
            "Check Eligibility"
          )}
        </button>
      </form>

      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.error
              ? "bg-red-900/50 border border-red-700"
              : result.isEligible
              ? "bg-green-900/50 border border-green-700"
              : "bg-yellow-900/50 border border-yellow-700"
          }`}
        >
          <p className="text-sm text-center text-white">
            {result.error || result.message}
          </p>
        </div>
      )}
    </div>
  );
} 