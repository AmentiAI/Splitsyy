"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/hooks";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  CreditCard,
  Key,
  Trash2,
  Edit,
  Save,
  X,
  Camera,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Plus,
  AlertCircle
} from "lucide-react";

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
}

interface SecuritySettings {
  twoFactor: boolean;
  biometric: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
}

function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    bio: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/user");
        if (response.ok) {
          const data = await response.json();
          const nameParts = (data.user?.name || "").split(" ");
          setProfileData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: data.user?.email || "",
            phone: "",
            address: "",
            dateOfBirth: "",
            bio: "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }
    loadProfile();
  }, []);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactor: false,
    biometric: true,
    sessionTimeout: 30,
    loginNotifications: true,
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to your backend
    console.log("Saving profile data:", profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <div className="flex items-center space-x-3">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                      {isEditing && (
                        <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors">
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {profileData.firstName} {profileData.lastName}
                      </h3>
                      <p className="text-gray-600">{profileData.email}</p>
                      <Badge className="bg-green-100 text-green-800 mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <Input
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <Input
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        disabled={!isEditing}
                        icon={<Mail className="w-4 h-4" />}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing}
                        icon={<Phone className="w-4 h-4" />}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <Input
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        disabled={!isEditing}
                        icon={<MapPin className="w-4 h-4" />}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                        disabled={!isEditing}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        rows={3}
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "security" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  {/* Password */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">Password</h3>
                        <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                      </div>
                    </div>
                    <Button variant="outline">
                      Change Password
                    </Button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={security.twoFactor ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {security.twoFactor ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {security.twoFactor ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  {/* Biometric Login */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Key className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">Biometric Login</h3>
                        <p className="text-sm text-gray-500">Use fingerprint or face recognition</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={security.biometric ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {security.biometric ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {security.biometric ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  {/* Session Timeout */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">Session Timeout</h3>
                        <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select 
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={security.sessionTimeout}
                        onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Login Notifications */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">Login Notifications</h3>
                        <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={security.loginNotifications ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {security.loginNotifications ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {security.loginNotifications ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  {[
                    { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
                    { key: "push", label: "Push Notifications", description: "Receive push notifications on your device" },
                    { key: "sms", label: "SMS Notifications", description: "Receive notifications via text message" },
                    { key: "marketing", label: "Marketing Emails", description: "Receive promotional content and updates" },
                  ].map((notification) => (
                    <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{notification.label}</h3>
                        <p className="text-sm text-gray-500">{notification.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications[notification.key as keyof NotificationSettings]}
                          onChange={(e) => setNotifications({
                            ...notifications,
                            [notification.key]: e.target.checked
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "billing" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing & Subscription</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Current Plan</h3>
                        <p className="text-sm text-gray-500">Free Plan - $0/month</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Payment Methods</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">**** **** **** 1234</p>
                            <p className="text-sm text-gray-500">Expires 12/25</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
                      <Button variant="outline" fullWidth>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferences</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Language & Region</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Data & Privacy</h3>
                    <div className="space-y-3">
                      <Button variant="outline" fullWidth>
                        Download My Data
                      </Button>
                      <Button variant="outline" fullWidth className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function Settings() {
  return (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  );
}


