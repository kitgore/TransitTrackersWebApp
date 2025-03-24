"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Chat() {
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hello! How can I help?" }]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 overflow-auto border p-2 rounded">
          {messages.map((msg, index) => (
            <div key={index} className={msg.sender === "user" ? "text-right" : "text-left"}>
              <span className={msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"} 
                style={{ display: "inline-block", padding: "8px", borderRadius: "8px", marginBottom: "4px" }}>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
