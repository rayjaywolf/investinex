"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, TrendingUp } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";
import { coolvetica } from "@/app/fonts";
import { useSearchParams } from 'next/navigation';
import { prisma } from "@/lib/db";
import { getCoinGeckoData } from "@/lib/coins";

interface Message {
  role: "user" | "assistant";
  content: string;
  isComplete?: boolean;
  tradingData?: {
    cryptocurrency: string;
    currentPrice: string;
    leverage: string;
    stopLoss: string;
    takeProfit: string;
    duration: string;
    risk: string;
  };
}

interface CodeProps {
  inline?: boolean;
  children: React.ReactNode;
}

const parseTradingRecommendation = (content: string) => {
  try {
    // Look for common patterns in the trading recommendation
    const cryptoMatch = content.match(/(?:for|analyzing)\s+(\$?\w+|\w+\/\w+)/i);
    const priceMatch = content.match(
      /(?:price|currently trading at|at)\s*(?:is|:)?\s*([\d,.]+)/i
    );
    const leverageMatch = content.match(
      /(?:leverage|recommended leverage)\s*(?:of|:)?\s*([\dx]+)/i
    );
    const stopLossMatch = content.match(
      /(?:stop loss|stop-loss)\s*(?:at|:)?\s*([\d,.]+)/i
    );
    const takeProfitMatch = content.match(
      /(?:take profit|take-profit|target)\s*(?:at|:)?\s*([\d,.]+)/i
    );
    const durationMatch = content.match(
      /(?:duration|timeframe|time frame)\s*(?:of|:)?\s*([^.]+)/i
    );
    const riskMatch = content.match(
      /(?:risk|risk level)\s*(?:is|:)?\s*(low|medium|high)/i
    );

    if (cryptoMatch && priceMatch) {
      return {
        cryptocurrency: cryptoMatch[1].replace("$", "").toUpperCase(),
        currentPrice: `$${priceMatch[1]}`,
        leverage: leverageMatch ? leverageMatch[1] : "Not specified",
        stopLoss: stopLossMatch ? `$${stopLossMatch[1]}` : "Not specified",
        takeProfit: takeProfitMatch
          ? `$${takeProfitMatch[1]}`
          : "Not specified",
        duration: durationMatch ? durationMatch[1].trim() : "Not specified",
        risk: riskMatch
          ? riskMatch[1].charAt(0).toUpperCase() + riskMatch[1].slice(1)
          : "Medium",
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing trading recommendation:", error);
    return null;
  }
};

function QuickAccessCoins({ onSelect }: { onSelect: (coin: string) => void }) {
  const [coins, setCoins] = useState<Array<{ name: string; logo: string | null; symbol: string }>>([]);

  useEffect(() => {
    async function fetchTopCoins() {
      const response = await fetch('/api/trending?limit=5');
      const data = await response.json();
      setCoins(data.coins);
    }
    fetchTopCoins();
  }, []);

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {coins.map((coin) => (
        <button
          key={coin.name}
          onClick={() => onSelect(coin.name)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-200"
        >
          {coin.logo ? (
            <img src={coin.logo} alt={coin.name} className="w-5 h-5 rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-500/20" />
          )}
          <span className="text-sm font-medium text-blue-400">${coin.name}</span>
        </button>
      ))}
    </div>
  );
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const { displayedText, isTyping } = useTypewriter(
    lastMessage?.role === "assistant" && !lastMessage.isComplete
      ? lastMessage.content
      : "",
    5
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setInput(message);
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedText]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      isComplete: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create a context string from the last few messages
      const contextMessages = messages.slice(-3).map(msg => msg.content);
      const currentMessage = input;
      const messageWithContext = [...contextMessages, currentMessage].join('\n');

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((msg) => [msg.role, msg.content]),
            ["human", messageWithContext], // Send the context along with the current message
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      
      // Try to parse trading data from both the current message and previous context
      const tradingData = parseTradingRecommendation(messageWithContext + '\n' + data.content) || 
                         parseTradingRecommendation(data.content) ||
                         undefined;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        isComplete: false,
        tradingData,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, isComplete: true } : msg
          )
        );
      }, Math.ceil(data.content.length / 2) * 5 + 50);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCoinSelect = (coinName: string) => {
    setInput(`give me analysis on $${coinName}`);
  };

  return (
    <>
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-50" />
      </div>

      {/* Gradient Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] top-0">
          <div className="h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[128px]" />
        </div>
        <div className="absolute -right-[10%] top-[20%]">
          <div className="h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[128px]" />
        </div>
        <div className="absolute left-[20%] top-[40%]">
          <div className="h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[128px]" />
        </div>
      </div>

      {/* Radial Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[120px]"
              style={{
                background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15), transparent)"
              }}
            />
          </div>
        </div>
      </div>

      <Card
        className={cn(
          "flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-lg border border-white/10 bg-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20",
          isLoading && "animate-pulse"
        )}
      >
        <ScrollArea ref={scrollRef} className="flex-1 p-4 pt-6">
          <div className="space-y-4 px-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Avatar className="h-20 w-20 bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/20">
                    <AvatarImage src="/avatar.png" alt="Investinex" />
                    <AvatarFallback>IN</AvatarFallback>
                  </Avatar>
                  <div className="space-y-4">
                    <p className={`text-3xl ${coolvetica.className} text-white-500`}>
                      Welcome to Investinex
                    </p>
                    <p className="text-md text-gray-400 max-w-[600px]">
                      I can help you with short-term crypto trading recommendations. 
                      Prefix the coin name with a $ or enter a coingecko link to get accurate results.
                    </p>
                    <div className="pt-2">
                      <p className="text-sm opacity-80 font-bold text-primary mb-2 flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Trending Cryptocurrencies
                      </p>
                      <QuickAccessCoins onSelect={handleQuickCoinSelect} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-[80%] items-start gap-3",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <Avatar
                      className={cn(
                        "h-8 w-8",
                        message.role === "assistant"
                          ? "bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/20"
                          : "bg-purple-500/10 text-purple-500 ring-2 ring-purple-500/20"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <>
                          <AvatarImage src="/avatar.png" alt="Investinex" />
                          <AvatarFallback>IN</AvatarFallback>
                        </>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </Avatar>
                    <div
                      className={cn(
                        "flex flex-col space-y-2 rounded-lg border px-5 py-3",
                        message.role === "assistant"
                          ? "bg-blue-500/5 border-blue-500/10"
                          : "bg-purple-500/5 border-purple-500/10"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <>
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw, rehypeSanitize]}
                              components={{
                                p: ({
                                  children,
                                }: {
                                  children: React.ReactNode;
                                }) => (
                                  <p className="whitespace-pre-wrap mb-4 last:mb-0 text-base leading-relaxed">
                                    {children}
                                  </p>
                                ),
                                strong: ({
                                  children,
                                }: {
                                  children: React.ReactNode;
                                }) => (
                                  <strong className="font-semibold text-blue-400">
                                    {children}
                                  </strong>
                                ),
                                em: ({
                                  children,
                                }: {
                                  children: React.ReactNode;
                                }) => (
                                  <em className="text-purple-400 not-italic">
                                    {children}
                                  </em>
                                ),
                                pre: ({
                                  children,
                                }: {
                                  children: React.ReactNode;
                                }) => (
                                  <pre className="overflow-auto p-3 bg-background/50 rounded-md border border-cyan-500/20 mb-4 last:mb-0">
                                    {children}
                                  </pre>
                                ),
                                code: ({ inline, children }: CodeProps) => {
                                  if (inline) {
                                    return (
                                      <code className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-sm">
                                        {children}
                                      </code>
                                    );
                                  }
                                  return <code>{children}</code>;
                                },
                                ul: ({
                                  children,
                                }: {
                                  children: React.ReactNode;
                                }) => (
                                  <ul className="list-disc list-inside space-y-1 mb-4 last:mb-0">
                                    {children}
                                  </ul>
                                ),
                                li: ({
                                  children,
                                }: {
                                  children: React.ReactNode;
                                }) => (
                                  <li className="text-gray-300">{children}</li>
                                ),
                              }}
                            >
                              {message.isComplete ? message.content : displayedText}
                            </ReactMarkdown>
                          </div>
                          {!message.isComplete && (
                            <div className="mt-1 h-4 w-4">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            </div>
                          )}
                          {message.tradingData && message.isComplete && (
                            <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Cryptocurrency:</span>
                                  <span className="font-medium text-white">{message.tradingData.cryptocurrency}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Current Price:</span>
                                  <span className="font-medium text-white">{message.tradingData.currentPrice}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Leverage:</span>
                                  <span className="font-medium text-white">{message.tradingData.leverage}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Stop Loss:</span>
                                  <span className="font-medium text-red-400">{message.tradingData.stopLoss}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Take Profit Target:</span>
                                  <span className="font-medium text-green-400">{message.tradingData.takeProfit}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Duration:</span>
                                  <span className="font-medium text-white">{message.tradingData.duration}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Risk Level:</span>
                                  <span className={cn(
                                    "font-medium",
                                    message.tradingData.risk === "Low" && "text-green-400",
                                    message.tradingData.risk === "Medium" && "text-yellow-400",
                                    message.tradingData.risk === "High" && "text-red-400"
                                  )}>
                                    {message.tradingData.risk}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap text-base text-gray-200">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 bg-cyan-500/10 text-cyan-500 ring-2 ring-cyan-500/20">
                  <AvatarImage src="/avatar.png" alt="Samaritan" />
                  <AvatarFallback>NEX</AvatarFallback>
                </Avatar>
                <div className="flex max-w-[80%] items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                  <div className="flex space-x-2">
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-500/40"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-500/40"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-cyan-500/40"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-white/10 bg-background/30 backdrop-blur-xl p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about crypto trading..."
              disabled={isLoading}
              className="min-h-[2.5rem] max-h-[150px] resize-none rounded-lg bg-background/50 border-white/10 focus:border-blue-500/40 focus:ring-blue-500/20 px-3 py-2"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 shrink-0 bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </>
  );
}
