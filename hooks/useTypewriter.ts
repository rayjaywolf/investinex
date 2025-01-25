"use client";

import { useState, useEffect } from "react";

export function useTypewriter(text: string, speed: number = 5) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) return;

    setIsTyping(true);
    setDisplayedText("");

    let index = 0;
    const charsPerTick = 2;
    
    const timer = setInterval(() => {
      if (index < text.length) {
        const nextChars = text.slice(index, index + charsPerTick);
        setDisplayedText((current) => current + nextChars);
        index += charsPerTick;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isTyping };
}
