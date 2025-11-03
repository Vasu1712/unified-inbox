// components/inbox/MessageComposer.tsx
"use client";

import { useState, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaperAirplaneIcon, ClockIcon } from "@heroicons/react/24/solid";
import ScheduleMessageModal from "./ScheduleMessageModal";

interface Props {
  conversationId: string;
}

export default function MessageComposer({ conversationId }: Props) {
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<"SMS" | "WHATSAPP">("SMS");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get contact ID from conversations cache
  const conversations: any = queryClient.getQueryData(["conversations"]);
  const conversation = conversations?.conversations?.find(
    (c: any) => c.id === conversationId
  );
  const contactId = conversation?.contact?.id;

  const sendMutation = useMutation({
    mutationFn: async (data: { contactId: string; content: string; channel: string }) => {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }
      return res.json();
    },
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(["messages", conversationId]);

      // Optimistically update to the new value
      queryClient.setQueryData(["messages", conversationId], (old: any) => ({
        ...old,
        messages: [
          ...(old?.messages || []),
          {
            id: `temp-${Date.now()}`,
            content: newMessage.content,
            channel: newMessage.channel,
            direction: "OUTBOUND",
            status: "SENDING",
            createdAt: new Date().toISOString(),
            user: null,
          },
        ],
      }));

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previousMessages
        );
      }
      alert(`Error: ${err.message}`);
    },
    onSuccess: () => {
      // Refetch to get the real data
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setContent("");
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/scheduled-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to schedule message");
      }
      return res.json();
    },
    onSuccess: () => {
      alert("Message scheduled successfully!");
      setScheduleModalOpen(false);
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || !contactId) return;

    sendMutation.mutate({
      contactId,
      content: content.trim(),
      channel,
    });
  }

  if (!contactId) {
    return (
      <div className="border-t border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500 text-center">
          Unable to load conversation
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          {/* Channel selector */}
          <div className="flex-shrink-0">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="px-3 py-2 text-black/70 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>

          {/* Message input */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={2}
              className="w-full px-4 py-2 text-black/70 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {/* Schedule button */}
          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center gap-2"
            title="Schedule Message"
          >
            <ClockIcon className="w-5 h-5" />
            Schedule
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!content.trim() || sendMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            Send
          </button>
        </form>

        {sendMutation.isPending && (
          <p className="text-xs text-gray-500 mt-2">Sending message...</p>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <ScheduleMessageModal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSchedule={(data) => scheduleMutation.mutateAsync(data)}
          contactId={contactId}
        />
      )}
    </>
  );
}
