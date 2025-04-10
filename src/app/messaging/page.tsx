"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatMessageList } from "@/src/components/ui/chat/chat-message-list";
import { ChatInput } from "@/src/components/ui/chat/chat-input";
import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "@/src/components/ui/chat/chat-bubble";
import { Button } from "@/src/components/ui/chat/button";
import { ScrollArea } from "@/src/components/ui/chat/scroll-area";
import { Menu, Search, Settings } from "lucide-react"; 
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Define a Message type
interface Message {
  id: number;
  text: string;
  sender: "manager" | "employee";
  timestamp: string;
  avatar?: string;
}

// Define a Conversation type that includes messages
interface Conversation {
  id: number;
  name: string;
  avatar: string;
  messages: Message[];
}

// This page displays a full-page chat layout with a resizable conversation sidebar.
export default function ChatPage() {
  const { user, loading: authLoading, role } = useAuth();
  const router = useRouter();

  // Sample conversation data.
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      name: "Drake Stanton",
      avatar: "/path/to/drake-avatar.png", // update with real asset path
      messages: [
        {
          id: 101,
          text: "Hey Drake, would you want to work this Friday at 4?",
          sender: "manager",
          timestamp: "10:40 AM",
          avatar: "/path/to/manager-avatar.png",
        },
        {
          id: 102,
          text: "Yeah totally!",
          sender: "employee",
          timestamp: "10:42 AM",
          avatar: "/path/to/drake-avatar.png",
        },
      ],
    },
    {
      id: 2,
      name: "Ben Griepp",
      avatar: "/path/to/ben-avatar.png", // update with real asset path
      messages: [
        {
          id: 201,
          text: "Hey Ben, could you cover Lauren's shift tomorrow?",
          sender: "manager",
          timestamp: "9:15 AM",
          avatar: "/path/to/manager-avatar.png",
        },
        {
          id: 202,
          text: "Yes, I will go ahead and pick it up right now!",
          sender: "employee",
          timestamp: "9:17 AM",
          avatar: "/path/to/ben-avatar.png",
        },
      ],
    },
    // Add additional conversations as needed.
  ]);

  // Hold the selected conversation's id.
  const [selectedConvoId, setSelectedConvoId] = useState<number>(conversations[0].id);
  
  // Local state for the message input.
  const [inputValue, setInputValue] = useState("");

  // Sidebar width state and ref for container.
  const [sidebarWidth, setSidebarWidth] = useState(250); // initial width in pixels
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Event Handlers for Resizing
  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    const newWidth = e.clientX - containerLeft;
    // Constrain the width between a minimum and maximum value.
    if (newWidth >= 150 && newWidth <= 500) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Derive the selected conversation.
  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConvoId
  );

  // Handler for sending a new message to the selected conversation.
  const handleSend = () => {
    if (!inputValue.trim() || !selectedConversation) return;

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

    // Update the message list for the selected conversation.
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === selectedConvoId
          ? { ...conv, messages: [...conv.messages, newMessage] }
          : conv
      )
    );

    setInputValue("");
  };

  // Authentication and role checks.
  if (authLoading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <div>You must be logged in to access this page.</div>;
  }
  if (role !== "admin") {
    return (
      <div className="text-center text-red-500 font-bold text-lg mt-10">
        Access Denied: You do not have admin privileges.
      </div>
    );
  }

  return (
    <AppSidebar>
      <div className="flex h-screen flex-col" ref={containerRef}>
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

        {/* Main content area with resizable sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation Sidebar */}
          <aside className="border-r overflow-y-auto" style={{ width: sidebarWidth }}>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Conversations</h2>
              <ul>
                {conversations.map((conv) => {
                  // Get the last message text if available.
                  const lastMessage =
                    conv.messages.length > 0
                      ? conv.messages[conv.messages.length - 1].text
                      : "No messages yet";
                  
                  return (
                    <li
                      key={conv.id}
                      onClick={() => setSelectedConvoId(conv.id)}
                      className={`flex flex-col p-2 rounded cursor-pointer hover:bg-gray-200 ${
                        conv.id === selectedConvoId ? "bg-gray-300" : ""
                      }`}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={conv.avatar} alt={conv.name} />
                          <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{conv.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate pl-13">
                        {lastMessage}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Draggable Divider */}
          <div
            className="w-1 cursor-col-resize bg-gray-300"
            onMouseDown={handleMouseDown}
          />

          {/* Chat Area */}
          <main className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center border-b p-4">
              <Avatar className="mr-3 h-10 w-10">
                <AvatarImage src={selectedConversation?.avatar} alt={selectedConversation?.name} />
                {selectedConversation && (
                  <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="font-medium">{selectedConversation?.name}</div>
                <div className="text-sm text-muted-foreground">Active now</div>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <ChatMessageList smooth className="h-full">
                {selectedConversation?.messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    variant={msg.sender === "manager" ? "sent" : "received"}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.avatar} alt={msg.sender === "manager" ? "Manager" : "Employee"} />
                      <AvatarFallback>{msg.sender === "manager" ? "M" : "E"}</AvatarFallback>
                    </Avatar>
                    <ChatBubbleMessage>{msg.text}</ChatBubbleMessage>
                    <ChatBubbleTimestamp timestamp={msg.timestamp} />
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </ScrollArea>

            {/* Message Input */}
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
