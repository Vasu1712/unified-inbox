/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/contacts/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import ContactModal from "@/components/contacts/ContactModal";
import { formatDistanceToNow } from "date-fns";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";


interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  _count: {
    messages: number;
  };
  conversations: Array<{
    lastMessageAt: string | null;
  }>;
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const contacts: Contact[] = contactsData?.contacts || [];
  const router = useRouter();


  // Filter contacts based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (contact: any) => {
      const url = contact.id
        ? `/api/contacts/${contact.id}`
        : "/api/contacts";
      const method = contact.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save contact");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setModalOpen(false);
      setSelectedContact(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  function handleAddContact() {
    setSelectedContact(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function handleEditContact(contact: Contact) {
    setSelectedContact(contact);
    setModalMode("edit");
    setModalOpen(true);
  }

  function handleDeleteContact(id: string) {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your customer contacts
            </p>
          </div>
          <button
            onClick={handleAddContact}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-5 h-5" />
            Add Contact
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border text-black/50 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No contacts found" : "No contacts yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Get started by adding your first contact"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddContact}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="w-5 h-5" />
                Add Your First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {contact.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        {contact.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {contact.email ? (
                          <>
                            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                            {contact.email}
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                        {contact._count.messages}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.conversations[0]?.lastMessageAt
                        ? formatDistanceToNow(
                            new Date(contact.conversations[0].lastMessageAt),
                            { addSuffix: true }
                          )
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-900 mr-2"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        title="View Notes"
                        >
                        <DocumentTextIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                            window.location.href = `/dashboard?contactId=${contact.id}`;
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Send Message"
                        >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ContactModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedContact(null);
        }}
        onSave={(contact) => saveMutation.mutateAsync(contact)}
        contact={selectedContact}
        mode={modalMode}
      />
    </div>
  );
}
