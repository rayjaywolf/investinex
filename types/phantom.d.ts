interface Window {
  phantom?: {
    solana?: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: () => void) => void;
      isPhantom?: boolean;
      publicKey?: { toString: () => string };
    };
  };
} 