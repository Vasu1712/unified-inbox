// app/dashboard/settings/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import ProfileSettings from "@/components/settings/ProfileSettings";
import TwilioSettings from "@/components/settings/TwilioSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import {
  UserCircleIcon,
  PhoneIcon,
  BellIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type Tab = "profile" | "twilio" | "notifications" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { data: session } = useSession();

  const tabs = [
    { id: "profile", name: "Profile", icon: UserCircleIcon },
    { id: "twilio", name: "Twilio Integration", icon: PhoneIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
  ];

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeTab === "profile" && (
            <ProfileSettings user={session?.user} />
          )}
          {activeTab === "twilio" && <TwilioSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Security Settings
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
            <p className="text-sm text-gray-500">
              Add an extra layer of security to your account
            </p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            Enable
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">Change Password</p>
            <p className="text-sm text-gray-500">
              Update your password regularly for better security
            </p>
          </div>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
