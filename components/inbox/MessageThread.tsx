// components/inbox/MessageThread.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  channel: string;
  direction: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
  } | null;
}

interface Props {
  conversationId: string;
}

export default function MessageThread({ conversationId }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const messages: Message[] = data?.messages || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message) => {
        const isOutbound = message.direction === "OUTBOUND";

        return (
          <div
            key={message.id}
            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-lg ${isOutbound ? "order-2" : "order-1"}`}>
              <div
                className={`px-4 py-2 rounded-2xl ${
                  isOutbound
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <div
                className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                  isOutbound ? "justify-end" : "justify-start"
                }`}
              >
                {message.user && (
                  <span>{message.user.name}</span>
                )}
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {isOutbound && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{message.status.toLowerCase()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
