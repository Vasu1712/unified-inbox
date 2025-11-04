/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  PencilSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  InboxIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import ConversationList from "@/components/inbox/ConversationList";
import MessageThread from "@/components/inbox/MessageThread";
import MessageComposer from "@/components/inbox/MessageComposer";
import NewMessageModal from "@/components/inbox/NewMessageModal";
import CollaborativeNotes from "@/components/contacts/CollaborativeNotes";

type StatusFilter = "all" | "unread" | "read" | "archived" | "resolved";
type ChannelFilter = "all" | "SMS" | "WHATSAPP" | "EMAIL" | "TWITTER";

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Filter and search logic
  const filteredConversations = conversations?.conversations?.filter((conv: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      conv.contact?.name?.toLowerCase().includes(searchLower) ||
      conv.contact?.phone?.includes(searchQuery) ||
      conv.messages?.[0]?.content?.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && conv.status === "UNREAD") ||
      (statusFilter === "read" && conv.status === "READ") ||
      (statusFilter === "archived" && conv.status === "ARCHIVED") ||
      (statusFilter === "resolved" && conv.status === "RESOLVED");

    const lastMessageChannel = conv.messages?.[0]?.channel;
    const matchesChannel =
      channelFilter === "all" || lastMessageChannel === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  }) || [];

  const selectedConversation = selectedConversationId
    ? conversations?.conversations?.find((c: any) => c.id === selectedConversationId)
    : selectedContactId
    ? { id: null, contact: { id: selectedContactId } }
    : null;

  function handleNewMessage() {
    setNewMessageModalOpen(true);
  }

  function handleSelectContact(contactId: string) {
    const existingConversation = conversations?.conversations?.find(
      (c: any) => c.contact.id === contactId
    );

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      setSelectedContactId(null);
    } else {
      setSelectedContactId(contactId);
      setSelectedConversationId(null);
    }
  }

  const counts = {
    all: conversations?.conversations?.length || 0,
    unread: conversations?.conversations?.filter((c: any) => c.status === "UNREAD").length || 0,
    read: conversations?.conversations?.filter((c: any) => c.status === "READ").length || 0,
    archived: conversations?.conversations?.filter((c: any) => c.status === "ARCHIVED").length || 0,
    resolved: conversations?.conversations?.filter((c: any) => c.status === "RESOLVED").length || 0,
  };

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Filters"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleNewMessage}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                title="New Message"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All", count: counts.all },
                  { value: "unread", label: "Unread", count: counts.unread },
                  { value: "read", label: "Read", count: counts.read },
                  { value: "archived", label: "Archived", count: counts.archived },
                  { value: "resolved", label: "Resolved", count: counts.resolved },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value as StatusFilter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      statusFilter === status.value
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {status.label} {status.count > 0 && `(${status.count})`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Channel</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All", icon: "📬" },
                  { value: "SMS", label: "SMS", icon: "📱" },
                  { value: "WHATSAPP", label: "WhatsApp", icon: "💬" },
                  { value: "EMAIL", label: "Email", icon: "✉️" },
                  { value: "TWITTER", label: "Twitter", icon: "🐦" },
                ].map((channel) => (
                  <button
                    key={channel.value}
                    onClick={() => setChannelFilter(channel.value as ChannelFilter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                      channelFilter === channel.value
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span>{channel.icon}</span>
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>

            {(statusFilter !== "all" || channelFilter !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setChannelFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-600">
            {filteredConversations.length === conversations?.conversations?.length
              ? `${filteredConversations.length} conversations`
              : `${filteredConversations.length} of ${conversations?.conversations?.length || 0} conversations`}
          </p>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              {conversations?.conversations?.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-2">No conversations yet</p>
                  <button
                    onClick={handleNewMessage}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    New Message
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-2">No matches found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </>
              )}
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
            />
          )}
        </div>
      </div>

      {/* Message Thread & Notes */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Header with Notes Toggle */}
            <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {selectedConversation.contact?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation.contact?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.contact?.phone}
                  </p>
                </div>
              </div>
              
              {/* Notes Toggle Button */}
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showNotes
                    ? "text-indigo-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {showNotes ?
                  <>
                  <p>
                    <ChevronDoubleRightIcon className="w-5 h-5" />
                  </p>
                  </> :
                  <>
                  <DocumentTextIcon className="w-5 h-5" /> <p>Client Notes</p>
                  </>
                  }
              </button>
            </div>

            {/* Messages & Notes Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Message Thread */}
              <div className={`flex flex-col ${showNotes ? 'w-2/3' : 'w-full'} transition-all`}>
                {selectedConversationId ? (
                  <>
                    <MessageThread conversationId={selectedConversationId} />
                    <MessageComposer conversationId={selectedConversationId} />
                  </>
                ) : (
                  <NewConversationView contactId={selectedContactId!} />
                )}
              </div>
              
              {/* Notes Panel */}
              {showNotes && selectedConversation.contact?.id && (
                <div className="w-1/3 border-l border-gray-200 overflow-hidden">
                  <CollaborativeNotes contactId={selectedConversation.contact.id} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <InboxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Choose a conversation from the list or start a new one
              </p>
              <button
                onClick={handleNewMessage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PencilSquareIcon className="w-5 h-5" />
                New Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={newMessageModalOpen}
        onClose={() => setNewMessageModalOpen(false)}
        onSelectContact={handleSelectContact}
      />
    </div>
  );
}

// Component for new conversation
function NewConversationView({ contactId }: { contactId: string }) {
  const { data: contactData } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) throw new Error("Failed to fetch contact");
      return res.json();
    },
  });

  const contact = contactData?.contact;

  return (
    <>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No messages yet</p>
          <p className="text-sm text-gray-400">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
      <NewMessageComposer contactId={contactId} />
    </>
  );
}

// Separate composer for new conversations
function NewMessageComposer({ contactId }: { contactId: string }) {
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<"SMS" | "WHATSAPP">("SMS");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          content: content.trim(),
          channel,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }

      setContent("");
      window.location.reload();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-shrink-0">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
