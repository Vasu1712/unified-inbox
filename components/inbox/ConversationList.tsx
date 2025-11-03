// components/inbox/ConversationList.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

interface Conversation {
  id: string;
  status: string;
  lastMessageAt: string;
  contact: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  messages: Array<{
    id: string;
    content: string;
    channel: string;
    direction: string;
    createdAt: string;
  }>;
  _count: {
    messages: number;
  };
}

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const lastMessage = conversation.messages[0];
        const isSelected = conversation.id === selectedId;
        const isUnread = conversation.status === "UNREAD";

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
              isSelected ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {conversation.contact.name?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`text-sm font-semibold truncate ${
                      isUnread ? "text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {conversation.contact.name || "Unknown"}
                  </h3>
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>

                {/* Last message preview */}
                {lastMessage && (
                  <p
                    className={`text-sm truncate mb-2 ${
                      isUnread ? "font-medium text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {lastMessage.direction === "OUTBOUND" ? "You: " : ""}
                    {lastMessage.content}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-2">
                  {lastMessage && (
                    <ChannelBadge channel={lastMessage.channel} />
                  )}
                  {isUnread && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                      New
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {conversation._count.messages} messages
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const config = {
    SMS: { icon: PhoneIcon, color: "bg-blue-100 text-blue-700" },
    WHATSAPP: { icon: ChatBubbleLeftRightIcon, color: "bg-green-100 text-green-700" },
    EMAIL: { icon: EnvelopeIcon, color: "bg-purple-100 text-purple-700" },
  };

  const { icon: Icon, color } = config[channel as keyof typeof config] || config.SMS;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${color}`}>
      <Icon className="w-3 h-3" />
      {channel}
    </span>
  );
}
