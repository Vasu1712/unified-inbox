// components/inbox/MessageComposer.tsx
"use client";

import { useState, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaperAirplaneIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import ScheduleMessageModal from "./ScheduleMessageModal";

interface Props {
  conversationId: string;
}

type ChannelType = "SMS" | "WHATSAPP" | "EMAIL" | "TWITTER";

export default function MessageComposer({ conversationId }: Props) {
  const [channel, setChannel] = useState<ChannelType>("SMS");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get contact ID from conversations cache
  const conversations: any = queryClient.getQueryData(["conversations"]);
  const conversation = conversations?.conversations?.find(
    (c: any) => c.id === conversationId
  );
  const contactId = conversation?.contact?.id;

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type your message...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 underline',
        },
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[60px] p-3',
      },
    },
  });

  // ... (keep all the mutation logic the same)

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
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previousMessages = queryClient.getQueryData(["messages", conversationId]);
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
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
      alert(`Error: ${err.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      editor?.commands.clearContent();
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editor || editor.isEmpty || !contactId) return;
    const content = editor.getText().trim();
    if (!content) return;
    sendMutation.mutate({ contactId, content, channel });
  }

  function handleScheduleMessage() {
    if (!editor || editor.isEmpty) return;
    setScheduleModalOpen(true);
  }

  // Formatting functions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!contactId) {
    return (
      <div className="border-t border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500 text-center">Unable to load conversation</p>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="border-t border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500 text-center">Loading editor...</p>
      </div>
    );
  }

  return (
    <>
      <div className="border-t border-gray-200 bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
          {/* Channel Icons */}
          <div className="flex items-center gap-1">
            {/* SMS Icon */}
            <button
              type="button"
              onClick={() => setChannel("SMS")}
              className={`p-2 rounded-lg transition-all ${
                channel === "SMS" ? "bg-blue-50" : "hover:bg-gray-100"
              }`}
              title="SMS"
            >
              <svg
                className="w-5 h-5"
                fill={channel === "SMS" ? "#3B82F6" : "#6B7280"}
                viewBox="0 0 24 24"
              >
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
              </svg>
            </button>

            {/* WhatsApp Icon */}
            <button
              type="button"
              onClick={() => setChannel("WHATSAPP")}
              className={`p-2 rounded-lg transition-all ${
                channel === "WHATSAPP" ? "bg-green-50" : "hover:bg-gray-100"
              }`}
              title="WhatsApp"
            >
              <svg
                className="w-5 h-5"
                fill={channel === "WHATSAPP" ? "#25D366" : "#6B7280"}
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </button>

            {/* Email Icon */}
            <button
              type="button"
              onClick={() => setChannel("EMAIL")}
              className={`p-2 rounded-lg transition-all ${
                channel === "EMAIL" ? "bg-red-50" : "hover:bg-gray-100"
              }`}
              title="Email"
            >
              <svg
                className="w-5 h-5"
                fill={channel === "EMAIL" ? "#EF4444" : "#6B7280"}
                viewBox="0 0 24 24"
              >
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </button>

            {/* Twitter/X Icon */}
            <button
              type="button"
              onClick={() => setChannel("TWITTER")}
              className={`p-2 rounded-lg transition-all ${
                channel === "TWITTER" ? "bg-gray-100" : "hover:bg-gray-100"
              }`}
              title="Twitter/X"
            >
              <svg
                className="w-5 h-5"
                fill={channel === "TWITTER" ? "#000000" : "#6B7280"}
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Formatting buttons */}
          <div className="flex items-center gap-1 text-gray-600">
            <button
              type="button"
              onClick={toggleBold}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200' : ''
              }`}
              title="Bold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggleItalic}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-200' : ''
              }`}
              title="Italic"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggleStrike}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('strike') ? 'bg-gray-200' : ''
              }`}
              title="Strikethrough"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 5l6 14M15 5L9 19" />
              </svg>
            </button>

            <button
              type="button"
              onClick={addLink}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('link') ? 'bg-gray-200' : ''
              }`}
              title="Add Link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </div>

          <div className="flex-1"></div>

          {/* Channel name display */}
          <span className="text-sm font-medium text-gray-600">
            {channel === "SMS" && "SMS"}
            {channel === "WHATSAPP" && "WhatsApp"}
            {channel === "EMAIL" && "Email"}
            {channel === "TWITTER" && "Twitter/X"}
          </span>
        </div>

        {/* Editor */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="border-b border-gray-200 text-black/80">
            <EditorContent 
              editor={editor} 
              className="min-h-[80px] max-h-[200px] overflow-y-auto"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to send
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleScheduleMessage}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center gap-2 text-sm"
              >
                <ClockIcon className="w-4 h-4" />
                Schedule
              </button>

              <button
                type="submit"
                disabled={editor.isEmpty || sendMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                {sendMutation.isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <ScheduleMessageModal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSchedule={(data) => {
            const content = editor.getText().trim();
            return scheduleMutation.mutateAsync({ ...data, content });
          }}
          contactId={contactId}
        />
      )}
    </>
  );
}
