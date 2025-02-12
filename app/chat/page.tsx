"use client";

import { Chat } from "@/components/chat";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supercharge } from "@/app/fonts";

export default function ChatPage() {
  const [key, setKey] = useState(0);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearChat = useCallback(() => {
    setShowClearDialog(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    setKey((prev) => prev + 1);
    setShowClearDialog(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b">
        <div className="h-14 px-8 flex items-center justify-between">
          <Link href="/">
            <div className="space-y-1">
              <h2 className={`text-lg ${supercharge.className} text-white`}>
                Nexus
              </h2>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearChat}
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 container mx-auto p-4">
        <Chat key={key} />
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the chat history? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
