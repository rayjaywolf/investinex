"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  isComplete?: boolean;
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((msg) => [msg.role, msg.content]),
            ["human", input],
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        isComplete: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setTimeout(
        () => {
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 ? { ...msg, isComplete: true } : msg
            )
          );
        },
        Math.ceil(data.content.length / 2) * 5 + 50
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-lg bg-background/80 backdrop-blur-xl border-[#00ffff33] shadow-[0_0_15px_rgba(0,255,255,0.1)]",
        isLoading && "animate-gradient-rotate"
      )}
    >
      <ScrollArea ref={scrollRef} className="flex-1 p-4 pt-6">
        <div className="space-y-4 px-4">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar className="h-12 w-12 bg-cyan-500/10 text-cyan-500 ring-2 ring-cyan-500/20 animate-glow">
                  <AvatarImage src="/avatar.png" alt="Samaritan" />
                  <AvatarFallback>SAM</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-cyan-500">
                    Welcome to Samaritan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    I can help you with short-term crypto trading
                    recommendations. What would you like to know?
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "mb-4 p-4",
                  message.role === "assistant" &&
                    !message.isComplete &&
                    "loading"
                )}
              >
                <div
                  className={cn(
                    "flex items-start gap-3 transition-all",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar
                    className={cn(
                      "h-8 w-8 transition-all ring-2",
                      message.role === "assistant"
                        ? "bg-cyan-500/10 text-cyan-500 ring-cyan-500/20"
                        : "bg-violet-500/10 text-violet-500 ring-violet-500/20"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <AvatarImage src="/avatar.png" alt="Samaritan" />
                    ) : (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      "group relative max-w-[80%] rounded-lg px-3 py-2 transition-all",
                      message.role === "user"
                        ? "bg-violet-500/10 text-foreground border border-violet-500/20"
                        : "bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:whitespace-pre-wrap [&>p]:mb-4 [&>p:last-child]:mb-0">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, rehypeSanitize]}
                          components={{
                            p: ({ children }) => (
                              <p className="whitespace-pre-wrap mb-4 last:mb-0">
                                {children}
                              </p>
                            ),
                            pre: ({ children }) => (
                              <pre className="overflow-auto p-2 bg-background/50 rounded-md border border-cyan-500/20 mb-4 last:mb-0">
                                {children}
                              </pre>
                            ),
                            code: ({ inline, children }) =>
                              inline ? (
                                <code className="bg-background/50 px-1 py-0.5 rounded-md border border-cyan-500/20">
                                  {children}
                                </code>
                              ) : (
                                <code>{children}</code>
                              ),
                          }}
                        >
                          {message.isComplete ? message.content : displayedText}
                        </ReactMarkdown>
                        {!message.isComplete && (
                          <div className="mt-1 h-4 w-4">
                            <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">
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
                <AvatarFallback>SAM</AvatarFallback>
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
      <div className="border-t border-cyan-500/20 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            placeholder="Ask all things crypto..."
            disabled={isLoading}
            className="min-h-[2.5rem] max-h-[150px] resize-none rounded-md bg-background/50 border-cyan-500/20 focus:border-cyan-500/40 focus:ring-cyan-500/20 px-3 py-2 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 shrink-0 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/20 hover:text-cyan-400"
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
  );
}
