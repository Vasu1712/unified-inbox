// app/dashboard/contacts/[id]/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import CollaborativeNotes from "@/components/contacts/CollaborativeNotes";
import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: contactData, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch contact");
      return res.json();
    },
  });

  const contact = contactData?.contact;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Contacts
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
            {contact?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact?.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              {contact?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <PhoneIcon className="w-4 h-4" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
              )}
              {contact?.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span className="text-sm">{contact.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            href={`/dashboard?contactId=${id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            Send Message
          </Link>
          <span className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">
            {contact?._count?.messages || 0} messages
          </span>
        </div>
      </div>

      {/* Notes Section */}
      <div className="flex-1 overflow-hidden">
        <CollaborativeNotes contactId={id} />
      </div>
    </div>
  );
}
