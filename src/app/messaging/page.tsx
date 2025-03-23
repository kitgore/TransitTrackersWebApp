'use client';
/*
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { Mail } from '@/components/mail';
import { accounts, mails } from '../data';
import React from 'react';
import { useCallback } from 'react';

export default function MailPage() {
  const [defaultLayout, setDefaultLayout] = useState<[number, number]>([60, 40]);

  useEffect(() => {
    const cookieName = 'react-resizable-panels:layout';
    const savedLayout = Cookies.get(cookieName);
    
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (Array.isArray(parsed) && parsed.length === 2 &&
            parsed.every(size => typeof size === 'number' && !isNaN(size))) {
          // Ensure minimum sizes are respected
          const validSizes = parsed.map(size => Math.max(30, size));
          const total = validSizes.reduce((sum, size) => sum + size, 0);
          setDefaultLayout([
            (validSizes[0] / total) * 100,
            (validSizes[1] / total) * 100
          ]);
        }
      } catch (e) {
        console.error('Failed to parse layout:', e);
        // Keep default layout
      }
    }
  }, []);

  const handleLayoutChange = useCallback((sizes: number[]) => {
    if (sizes.length !== 2 || sizes.some(size => isNaN(size))) {
      return;
    }
    
    // Ensure minimum sizes and normalization
    const validSizes = sizes.map(size => Math.max(30, size));
    const total = validSizes.reduce((sum, size) => sum + size, 0);
    const normalized = [
      (validSizes[0] / total) * 100,
      (validSizes[1] / total) * 100
    ];
    
    Cookies.set('react-resizable-panels:layout', JSON.stringify(normalized), {
      expires: 365,
      path: '/messaging',
      sameSite: 'strict'
    });
  }, []);

  if (!defaultLayout) return null;

  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/mail-dark.png"
          width={1280}
          height={727}
          alt="Mail"
          className="hidden dark:block"
        />
        <Image
          src="/examples/mail-light.png"
          width={1280}
          height={727}
          alt="Mail"
          className="block dark:hidden"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <Mail
          accounts={accounts}
          mails={mails}
          defaultLayout={defaultLayout}
          navCollapsedSize={4}
          onLayoutChange={handleLayoutChange}
        />
      </div>
    </>
  );
}
  */
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
  // Prepopulate with a couple of messages for demonstration
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

  // Handler for sending a new manager message
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

  return (
    <AppSidebar>
    <div className="flex h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        {/* Left side: brand / title */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">Employee Messenger</span>
          <span className="text-sm text-muted-foreground">Message your employees!</span>
        </div>
        {/* Right side: icons */}
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
            {/* Replace with real user icons or conversation list */}
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            {/* ... */}
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex flex-1 flex-col">
          {/* Chat header (for current conversation) */}
          <div className="flex items-center border-b p-4">
            <div className="mr-3 h-10 w-10 rounded-full bg-gray-200" />
            <div>
              <div className="font-medium">Jane Doe</div>
              <div className="text-sm text-muted-foreground">Active now</div>
            </div>
          </div>

          {/* Messages scroll area */}
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

          {/* Input area */}
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
