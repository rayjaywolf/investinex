"use client";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useState, useEffect } from "react";

type PhantomEvent = "connect" | "disconnect";

interface PhantomProvider {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, callback: () => void) => void;
  isPhantom?: boolean;
  publicKey?: { toString: () => string };
}

const getProvider = (): PhantomProvider | undefined => {
  if (typeof window !== "undefined") {
    const provider = window?.phantom?.solana;

    if (provider?.isPhantom) {
      return provider;
    }
  }
  return undefined;
};

export default function ConnectWalletButton() {
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  const checkEligibility = async (walletAddress: string) => {
    try {
      setIsChecking(true);
      const response = await fetch("/api/check-eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();
      localStorage.setItem("isEligible", String(data.isEligible));
      localStorage.setItem("walletAddress", walletAddress);
      localStorage.setItem("phantomConnected", "true");

      await fetch("/api/set-eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isEligible: data.isEligible }),
      });

      return data.isEligible;
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const provider = getProvider();
    setProvider(provider);

    const initializeWallet = async () => {
      if (provider && localStorage.getItem("phantomConnected") === "true") {
        try {
          // Try to reconnect if we were previously connected
          await provider.connect();
        } catch (error) {
          console.error("Error reconnecting to wallet:", error);
          localStorage.removeItem("phantomConnected");
        }
      }
    };

    if (provider) {
      // Set up event listeners
      provider.on("connect", async () => {
        setConnected(true);
        if (provider.publicKey) {
          const walletAddress = provider.publicKey.toString();
          setPublicKey(walletAddress);
          localStorage.setItem("phantomConnected", "true");
          await checkEligibility(walletAddress);
        }
      });

      provider.on("disconnect", () => {
        setConnected(false);
        setPublicKey("");
        localStorage.removeItem("isEligible");
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("phantomConnected");
      });

      // Initialize wallet connection
      initializeWallet();
    }

    // Cleanup function
    return () => {
      if (provider) {
        provider.on("disconnect", () => {});
        provider.on("connect", () => {});
      }
    };
  }, []);

  const handleConnectWallet = async () => {
    try {
      if (provider) {
        await provider.connect();
      } else {
        window.open("https://phantom.app/", "_blank");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      if (provider) {
        await provider.disconnect();
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  if (!provider) {
    return (
      <Button
        onClick={handleConnectWallet}
        variant="gradientRed"
        size="lg"
        className="w-full rounded-full font-medium text-base tracking-wide"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>
    );
  }

  if (connected) {
    return (
      <Button
        onClick={handleDisconnectWallet}
        variant="gradientPurple"
        size="lg"
        className="w-full rounded-full font-medium text-base tracking-wide"
        disabled={isChecking}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isChecking ? "Checking..." : "Connected"}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnectWallet}
      variant="gradientRed"
      size="lg"
      className="w-full rounded-full font-medium text-base tracking-wide"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
