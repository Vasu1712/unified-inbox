// app/dashboard/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PencilSquareIcon, InboxIcon } from "@heroicons/react/24/outline";
import ConversationList from "@/components/inbox/ConversationList";
import MessageThread from "@/components/inbox/MessageThread";
import MessageComposer from "@/components/inbox/MessageComposer";
import NewMessageModal from "@/components/inbox/NewMessageModal";

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Get selected conversation or create temp one for new contact
  const selectedConversation = selectedConversationId
    ? conversations?.conversations?.find((c: any) => c.id === selectedConversationId)
    : selectedContactId
    ? { id: null, contact: { id: selectedContactId } }
    : null;

  function handleNewMessage() {
    setNewMessageModalOpen(true);
  }

  function handleSelectContact(contactId: string) {
    // Check if conversation already exists for this contact
    const existingConversation = conversations?.conversations?.find(
      (c: any) => c.contact.id === contactId
    );

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      setSelectedContactId(null);
    } else {
      // Start new conversation
      setSelectedContactId(contactId);
      setSelectedConversationId(null);
    }
  }

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <button
              onClick={handleNewMessage}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="New Message"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {conversations?.conversations?.length || 0} total
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : conversations?.conversations?.length === 0 ? (
            <div className="p-8 text-center">
              <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No conversations yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Start your first conversation
              </p>
              <button
                onClick={handleNewMessage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PencilSquareIcon className="w-5 h-5" />
                New Message
              </button>
            </div>
          ) : (
            <ConversationList
              conversations={conversations?.conversations || []}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
            />
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {selectedConversationId ? (
              <>
                <MessageThread conversationId={selectedConversationId} />
                <MessageComposer conversationId={selectedConversationId} />
              </>
            ) : (
              // New conversation view
              <NewConversationView contactId={selectedContactId!} />
            )}
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

// Component for new conversation (before first message is sent)
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
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {contact?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{contact?.name}</h3>
            <p className="text-sm text-gray-500">{contact?.phone}</p>
          </div>
        </div>
      </div>
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
      // Reload page to show new conversation
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
        <div className="flex-shrink-0 text-black">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
            className="px-3 py-2 text-black border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
