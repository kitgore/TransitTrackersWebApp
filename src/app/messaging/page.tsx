'use client';

import { useState } from 'react';
import { ChatBubbleExample } from '@/components/chat/chat-bubble-example';
import { ChatInputExample } from '@/components/chat/chat-input-example';
import { Avatar } from '@/components/chat/avatar';

export default function MessagingPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Jane Doe', text: 'How has your day been so far?', time: '10:06 AM' },
    { id: 2, sender: 'You', text: 'It has been good. I went for a run this morning and then had a nice breakfast. How about you?', time: '10:10 AM' }
  ]);

  const sendMessage = (messageText: string) => {
    setMessages([...messages, { id: messages.length + 1, sender: 'You', text: messageText, time: '8:08 PM' }]);
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-700 p-4">
        <h2 className="text-xl font-bold">Chats (4)</h2>
        <div className="mt-4">
          <Avatar name="Jane Doe" status="Typing..." />
          <Avatar name="John Doe" />
          <Avatar name="Elizabeth Smith" />
          <Avatar name="John Smith" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-3/4 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center">
          <Avatar name="Jane Doe" />
          <div className="ml-4">
            <h3 className="text-lg font-bold">Jane Doe</h3>
            <p className="text-sm text-gray-400">Active 2 mins ago</p>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg) => (
            <ChatBubbleExample key={msg.id} sender={msg.sender} text={msg.text} time={msg.time} />
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <ChatInputExample onSendMessage={sendMessage} />
        </div>
      </div>
    </div>
  );
}
