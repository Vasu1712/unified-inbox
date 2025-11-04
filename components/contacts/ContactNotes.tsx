// components/contacts/ContactNotes.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  LockClosedIcon,
  GlobeAltIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

interface Note {
  id: string;
  content: string;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
  mentions: string[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Props {
  contactId: string;
}

export default function ContactNotes({ contactId }: Props) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const queryClient = useQueryClient();

  const { data: notesData, isLoading } = useQuery({
    queryKey: ["notes", contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds for collaboration
  });

  const notes: Note[] = notesData?.notes || [];

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; visibility: string }) => {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create note");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", contactId] });
      setContent("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    // Extract mentions from content (e.g., @username)
    const mentions = content.match(/@\w+/g) || [];

    createMutation.mutate({
      content,
      visibility,
    });
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No notes yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Add your first note below
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {note.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {note.visibility === "PRIVATE" ? (
                    <>
                      <LockClosedIcon className="w-4 h-4" />
                      Private
                    </>
                  ) : (
                    <>
                      <GlobeAltIcon className="w-4 h-4" />
                      Public
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Note Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-4 space-y-3"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note... (use @username to mention)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />

        <div className="flex items-center justify-between">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="PUBLIC">Public Note</option>
            <option value="PRIVATE">Private Note</option>
          </select>

          <button
            type="submit"
            disabled={!content.trim() || createMutation.isPending}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding..." : "Add Note"}
          </button>
        </div>
      </form>
    </div>
  );
}
