"use client";

import { Chat } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ChatPage() {
  const [key, setKey] = useState(0);

  const handleClearChat = useCallback(() => {
    setKey(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto p-4 px-12 pt-20">
        <Chat key={key} />
      </div>
    </div>
  );
}
