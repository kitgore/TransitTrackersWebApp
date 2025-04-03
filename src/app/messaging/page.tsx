'use client';

import React, { useState } from "react";
import {
  ChatMessageList,
} from "@/src/components/ui/chat/chat-message-list";
import { ChatInput } from "@/src/components/ui/chat/chat-input";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage, ChatBubbleTimestamp } from "@/src/components/ui/chat/chat-bubble";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Search, Settings } from "lucide-react"; 
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Example message type
interface Message {
  id: number;
  text: string;
  sender: "manager" | "employee";
  timestamp: string;
  avatar?: string;
}

// This page displays a full-page chat layout
export default function ChatPage() {
  const { user, loading: authLoading, role } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "How was your day down there so far?",
      sender: "manager",
      timestamp: "10:40 AM",
      avatar: "/path/to/manager-avatar.png",
    },
    {
      id: 2,
      text: "It’s been good! I went for a run this morning and then had time to read the new guidelines.",
      sender: "employee",
      timestamp: "10:42 AM",
      avatar: "/path/to/employee-avatar.png",
    },
  ]);

  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "manager",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: "/path/to/manager-avatar.png",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
  };

  // Redirect non-admin users
  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>You must be logged in to access this page.</div>;
  }

  if (role !== "admin") {
    return <div className="text-center text-red-500 font-bold text-lg mt-10">Access Denied: You do not have admin privileges.</div>;
  }

  return (
    <AppSidebar>
      <div className="flex h-screen flex-col">
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">Employee Messenger</span>
            <span className="text-sm text-muted-foreground">
              Message your employees!
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="p-2 hover:text-foreground">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 hover:text-foreground">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <aside className="hidden w-20 flex-col border-r px-2 py-4 md:flex">
            <div className="mb-4 text-sm font-semibold text-muted-foreground">
              Chats
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="h-10 w-10 rounded-full bg-gray-200" />
            </div>
          </aside>

          {/* Chat area */}
          <main className="flex flex-1 flex-col">
            <div className="flex items-center border-b p-4">
              <div className="mr-3 h-10 w-10 rounded-full bg-gray-200" />
              <div>
                <div className="font-medium">Jane Doe</div>
                <div className="text-sm text-muted-foreground">Active now</div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <ChatMessageList smooth className="h-full">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    variant={msg.sender === "manager" ? "sent" : "received"}
                  >
                    <ChatBubbleAvatar
                      src={msg.avatar}
                      fallback={msg.sender === "manager" ? "M" : "E"}
                    />
                    <ChatBubbleMessage>{msg.text}</ChatBubbleMessage>
                    <ChatBubbleTimestamp timestamp={msg.timestamp} />
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <ChatInput
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button onClick={handleSend}>Send</Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AppSidebar>
  );
}
