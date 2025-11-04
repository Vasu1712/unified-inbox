// components/settings/NotificationSettings.tsx
"use client";

import { useState } from "react";

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [newMessages, setNewMessages] = useState(true);
  const [scheduledMessages, setScheduledMessages] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Notification Preferences
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage how you receive notifications
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Notification Channels */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Notification Channels</h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive notifications via SMS
                </p>
              </div>
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Event Types */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Notify me about</h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">New Messages</p>
                <p className="text-sm text-gray-500">
                  When you receive a new message from a contact
                </p>
              </div>
              <input
                type="checkbox"
                checked={newMessages}
                onChange={(e) => setNewMessages(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Scheduled Messages</p>
                <p className="text-sm text-gray-500">
                  When a scheduled message is sent or fails
                </p>
              </div>
              <input
                type="checkbox"
                checked={scheduledMessages}
                onChange={(e) => setScheduledMessages(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-200">
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
