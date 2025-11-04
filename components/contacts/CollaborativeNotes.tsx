/* eslint-disable @typescript-eslint/no-explicit-any */
// components/contacts/CollaborativeNotes.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  LockClosedIcon,
  GlobeAltIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import Mention from '@tiptap/extension-mention';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useSession } from "@/lib/auth-client";

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

const CURSOR_COLORS = [
  '#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8',
  '#94FADB', '#B9F18D',
];

export default function CollaborativeNotes({ contactId }: Props) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasContent, setHasContent] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(
      'wss://demos.yjs.dev',
      `unified-inbox-contact-${contactId}`,
      ydoc,
      { 
        connect: true,
        WebSocketPolyfill: WebSocket as any,
      }
    );

    wsProvider.awareness.on('change', () => {
      setOnlineUsers(wsProvider.awareness.getStates().size);
    });

    wsProvider.awareness.setLocalStateField('user', {
      name: session?.user?.name || 'Anonymous',
      color: CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)],
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.disconnect();
      wsProvider.destroy();
    };
  }, [contactId, session?.user?.name, ydoc]);

  // Initialize collaborative editor with conditional extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        
      }),
      Placeholder.configure({
        placeholder: isPrivate 
          ? 'Add a private note... (@mentions disabled for private notes)'
          : 'Add a collaborative note... (type @ to mention team members)',
      }),
      Collaboration.configure({
        document: ydoc,
        field: 'content',
      }),
      // Only add Mention extension for public notes
      ...(isPrivate ? [] : [
        Mention.configure({
          HTMLAttributes: {
            class: 'mention bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded font-medium',
          },
          suggestion: {
            items: ({ query }: { query: string }) => {
              const teamMembers = [
                { id: '1', label: 'Harry Potter', email: 'harry.p@hogwarts.edu' },
                { id: '2', label: 'Hermione Granger', email: 'hermione.g@hogwarts.edu' },
                { id: '3', label: 'Ron Weasley', email: 'ron.w@hogwarts.edu' },
                { id: '4', label: 'Albus Dumbledore', email: 'albus.d@hogwarts.edu' },
                { id: '5', label: 'Minerva McGonagall', email: 'minerva.m@hogwarts.edu' },
              ];
              
              return teamMembers
                .filter(item => 
                  item.label.toLowerCase().includes(query.toLowerCase()) ||
                  item.email.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 5);
            },
            render: () => {
              let component: any;
              let popup: any;

              return {
                onStart: (props: any) => {
                  component = document.createElement('div');
                  component.className = 'mention-list bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-h-60 overflow-auto z-50';
                  
                  const updateList = (items: any[]) => {
                    component.innerHTML = items
                      .map((item, index) => `
                        <button
                          class="mention-item w-full text-left px-3 py-2 rounded hover:bg-indigo-50 text-sm flex flex-col ${
                            index === props.selectedIndex ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                          }"
                          data-index="${index}"
                        >
                          <span class="font-medium">${item.label}</span>
                          <span class="text-xs text-gray-500">${item.email}</span>
                        </button>
                      `)
                      .join('');
                    
                    component.querySelectorAll('.mention-item').forEach((btn: any, idx: number) => {
                      btn.onclick = () => props.command({ id: props.items[idx].id, label: props.items[idx].label });
                    });
                  };

                  updateList(props.items);

                  popup = document.createElement('div');
                  popup.className = 'fixed z-50';
                  popup.appendChild(component);
                  document.body.appendChild(popup);

                  const updatePosition = () => {
                    const rect = props.clientRect?.();
                    if (rect) {
                      popup.style.left = `${rect.left}px`;
                      popup.style.top = `${rect.bottom + 10}px`;
                    }
                  };
                  updatePosition();

                  component.updateProps = (newProps: any) => {
                    updateList(newProps.items);
                    updatePosition();
                  };
                },
                onUpdate: (props: any) => {
                  component.updateProps(props);
                },
                onKeyDown: (props: any) => {
                  if (props.event.key === 'Escape') {
                    popup.remove();
                    return true;
                  }
                  return false;
                },
                onExit: () => {
                  popup?.remove();
                },
              };
            },
          },
        }),
      ]),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-4',
      },

      handleKeyDown: (view, event) => {
        if (isPrivate && event.key === '@') {
          event.preventDefault();
          return true;
        }
        return false;
      },

      handleTextInput: (view, from, to, text) => {
        if (isPrivate && text.includes('@')) {
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setHasContent(!editor.isEmpty);
    },
  }, [isPrivate]); 
  
  useEffect(() => {
    if (!editor) return;
    
    editor.extensionManager.extensions.forEach((ext) => {
      if (ext.name === 'placeholder') {
        ext.options.placeholder = isPrivate 
          ? 'Add a private note... (@mentions disabled for private notes)'
          : 'Add a collaborative note... (type @ to mention team members)';
      }
    });
    
    editor.view.dispatch(editor.state.tr);
  }, [isPrivate, editor]);

  const { data: notesData, isLoading } = useQuery({
    queryKey: ["notes", contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const notes: Note[] = notesData?.notes || [];

  const saveMutation = useMutation({
    mutationFn: async (data: { content: string; visibility: string }) => {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save note");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", contactId] });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      editor?.commands.clearContent();
      setHasContent(false);
    },
  });

  function handleSaveNote() {
    if (!editor || !hasContent) return;

    const content = editor.getHTML();
    const mentions = isPrivate ? [] : extractMentions(content);

    saveMutation.mutate({
      content,
      visibility: isPrivate ? "PRIVATE" : "PUBLIC",
    });
  }

  function extractMentions(html: string): string[] {
    const mentionRegex = /data-id="([^"]+)"/g;
    const matches = [...html.matchAll(mentionRegex)];
    return matches.map(m => m[1]);
  }

  if (!editor) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Collaborative Editor Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">Collaborative Notes</h3>
            {provider && provider.wsconnected && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-gray-500">
                  {onlineUsers} {onlineUsers === 1 ? 'user' : 'users'} online
                </span>
              </div>
            )}
          </div>
          
          {showSaved && (
            <span className="text-xs text-green-600 font-medium">✓ Saved</span>
          )}
        </div>

        {/* Active users */}
        {provider && onlineUsers > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {Array.from(provider.awareness.getStates().entries()).map(([clientId, state]: [any, any]) => {
              const user = state.user;
              if (!user) return null;
              
              return (
                <div
                  key={clientId}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: `${user.color}20` }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span style={{ color: user.color }}>
                    {user.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collaborative Editor */}
      <div className="flex-1 overflow-y-auto text-black/50 border-b border-gray-200">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Actions */}
      <div className="p-3 space-y-3 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Privacy Toggle Switch */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isPrivate ? 'bg-gray-400' : 'bg-indigo-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPrivate ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              {isPrivate ? (
                <>
                  <LockClosedIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-medium">Private</span>
                </>
              ) : (
                <>
                  <GlobeAltIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-indigo-700 font-medium">Public</span>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveNote}
            disabled={!hasContent || saveMutation.isPending}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saveMutation.isPending ? "Saving..." : "Save to History"}
          </button>
        </div>

        {/* Help Text */}
        <div className="flex items-center justify-between text-xs">
          <p className="text-gray-500">
            Changes sync in real-time.
            {!isPrivate && (
              <> Type <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">@</kbd> to mention team members</>
            )}
          </p>
          {isPrivate && (
            <p className="text-amber-600 flex items-center gap-1 font-medium">
              <LockClosedIcon className="w-3 h-3" />
              Mentions prohibited
            </p>
          )}
        </div>
      </div>

      {/* Saved Notes History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Notes History</h4>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No saved notes yet
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserCircleIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {note.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  note.visibility === "PRIVATE" 
                    ? "bg-gray-100 text-gray-700" 
                    : "bg-indigo-50 text-indigo-700"
                }`}>
                  {note.visibility === "PRIVATE" ? (
                    <>
                      <LockClosedIcon className="w-3 h-3" />
                      Private
                    </>
                  ) : (
                    <>
                      <GlobeAltIcon className="w-3 h-3" />
                      Public
                    </>
                  )}
                </div>
              </div>
              <div
                className="text-sm text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
