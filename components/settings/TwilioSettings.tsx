// components/settings/TwilioSettings.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";

export default function TwilioSettings() {
  const [selectedNumber, setSelectedNumber] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["twilio-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/twilio");
      if (!res.ok) throw new Error("Failed to fetch Twilio settings");
      return res.json();
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: async (data: { phoneNumberSid: string; webhookUrl: string }) => {
      const res = await fetch("/api/settings/twilio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update webhook");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twilio-settings"] });
      alert("Webhook updated successfully!");
      setWebhookUrl("");
      setSelectedNumber("");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const recommendedWebhook = `${baseUrl}/api/webhooks/twilio`;

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Twilio Account
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Account SID</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-mono text-gray-900">
                {data?.account?.sid}
              </p>
              <button
                onClick={() => copyToClipboard(data?.account?.sid)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Account Status</p>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <p className="text-sm font-medium text-gray-900">
                {data?.account?.status}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Friendly Name</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {data?.account?.friendlyName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Account Type</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {data?.account?.type === "Trial" ? (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                  Trial Mode
                </span>
              ) : (
                data?.account?.type
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Phone Numbers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Phone Numbers
        </h3>

        {data?.phoneNumbers?.length === 0 ? (
          <div className="text-center py-8">
            <PhoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No phone numbers configured</p>
            <a
              href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Get a Twilio Number
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.phoneNumbers?.map((number: any) => (
              <div
                key={number.sid}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {number.phoneNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {number.friendlyName || "No friendly name"}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {number.capabilities.sms && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        SMS
                      </span>
                    )}
                    {number.capabilities.voice && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        Voice
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current SMS Webhook</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={number.smsUrl || "Not configured"}
                        readOnly
                        className="flex-1 px-3 py-1.5 text-sm border text-black/50 border-gray-300 rounded bg-gray-50"
                      />
                      {number.smsUrl && (
                        <button
                          onClick={() => copyToClipboard(number.smsUrl)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {number.smsUrl !== recommendedWebhook && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="flex gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">
                            Webhook not configured
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Update to: {recommendedWebhook}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedNumber(number.sid);
                              setWebhookUrl(recommendedWebhook);
                            }}
                            className="mt-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            Configure Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Webhook Form */}
      {selectedNumber && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Update Webhook URL
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-app.com/api/webhooks/twilio"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This URL will receive inbound SMS/MMS messages
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedNumber("");
                  setWebhookUrl("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateWebhookMutation.mutate({
                    phoneNumberSid: selectedNumber,
                    webhookUrl,
                  })
                }
                disabled={!webhookUrl || updateWebhookMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateWebhookMutation.isPending ? "Updating..." : "Update Webhook"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Ensure your application is publicly accessible (use ngrok for local development)</li>
          <li>Copy the recommended webhook URL: <code className="bg-blue-100 px-1 rounded">{recommendedWebhook}</code></li>
          <li>Configure it for your Twilio phone number above</li>
          <li>Send a test SMS to your Twilio number to verify the integration</li>
        </ol>
      </div>
    </div>
  );
}
