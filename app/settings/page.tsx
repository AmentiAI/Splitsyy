"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/hooks";
import { AddPaymentMethodModal } from "@/components/payment/AddPaymentMethodModal";
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
  AlertCircle,
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    bio: "",
  });

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

  const [preferences, setPreferences] = useState({
    language: "en",
    currency: "USD",
  });

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        // Load user profile
        const userResponse = await fetch("/api/auth/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const nameParts = (userData.user?.name || "").split(" ");
          setProfileData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: userData.user?.email || "",
            phone: "",
            address: "",
            dateOfBirth: "",
            bio: "",
          });
        }

        // Load settings
        const settingsResponse = await fetch("/api/settings");
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.settings) {
            const s = settingsData.settings;
            if (
              s.first_name ||
              s.last_name ||
              s.phone ||
              s.address ||
              s.date_of_birth ||
              s.bio
            ) {
              setProfileData({
                ...profileData,
                firstName: s.first_name || "",
                lastName: s.last_name || "",
                phone: s.phone || "",
                address: s.address || "",
                dateOfBirth: s.date_of_birth || "",
                bio: s.bio || "",
              });
            }
            if (s.notifications) {
              setNotifications(s.notifications);
            }
            if (s.security) {
              setSecurity(s.security);
            }
            if (s.preferences) {
              setPreferences(s.preferences);
            }
          }
        }

        // Load payment methods if on billing tab
        if (activeTab === "billing") {
          loadPaymentMethods();
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "billing") {
      loadPaymentMethods();
    }
  }, [activeTab]);

  const loadPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        setSuccess("Default payment method updated");
        loadPaymentMethods();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update default payment method"
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Payment method removed");
        loadPaymentMethods();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove payment method"
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone,
            address: profileData.address,
            dateOfBirth: profileData.dateOfBirth,
            bio: profileData.bio,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      setSuccess("Profile updated successfully");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload settings to reset form
    window.location.reload();
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save notifications");
      }

      setSuccess("Notification preferences updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save notifications"
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (updates?: Partial<SecuritySettings>) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const securityToSave = updates ? { ...security, ...updates } : security;
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ security: securityToSave }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save security settings");
      }

      setSecurity(securityToSave);
      setSuccess("Security settings updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save security settings"
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      setSuccess("Preferences updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save preferences"
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const currentPassword = prompt("Enter your current password:");
    if (!currentPassword) return;

    const newPassword = prompt("Enter your new password (min 8 characters):");
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    const confirmPassword = prompt("Confirm your new password:");
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess("Password changed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <span>{success}</span>
            <button
              onClick={() => setSuccess("")}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
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
                      className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        activeTab === tab.id
                          ? "border border-blue-200 bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
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
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Profile Information
                  </h2>
                  <div className="flex items-center space-x-3">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          loading={saving}
                          disabled={saving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                        <User className="h-12 w-12 text-white" />
                      </div>
                      {isEditing && (
                        <button className="absolute -bottom-2 -right-2 rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700">
                          <Camera className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {profileData.firstName} {profileData.lastName}
                      </h3>
                      <p className="text-gray-600">{profileData.email}</p>
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <Input
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <Input
                        value={profileData.lastName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        leftIcon={<Mail className="h-4 w-4" />}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        leftIcon={<Phone className="h-4 w-4" />}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <Input
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        leftIcon={<MapPin className="h-4 w-4" />}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            dateOfBirth: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        leftIcon={<Calendar className="h-4 w-4" />}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        rows={3}
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            bio: e.target.value,
                          })
                        }
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
                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                  Security Settings
                </h2>

                <div className="space-y-6">
                  {/* Password */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">Password</h3>
                        <p className="text-sm text-gray-500">
                          Last changed 3 months ago
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleChangePassword}
                      disabled={saving}
                    >
                      Change Password
                    </Button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={
                          security.twoFactor
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {security.twoFactor ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSaveSecurity({ twoFactor: !security.twoFactor })
                        }
                        disabled={saving}
                      >
                        {security.twoFactor ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  {/* Biometric Login */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <Key className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Biometric Login
                        </h3>
                        <p className="text-sm text-gray-500">
                          Use fingerprint or face recognition
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={
                          security.biometric
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {security.biometric ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSaveSecurity({ biometric: !security.biometric })
                        }
                        disabled={saving}
                      >
                        {security.biometric ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  {/* Session Timeout */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Session Timeout
                        </h3>
                        <p className="text-sm text-gray-500">
                          Automatically log out after inactivity
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        value={security.sessionTimeout}
                        onChange={(e) =>
                          handleSaveSecurity({
                            sessionTimeout: parseInt(e.target.value),
                          })
                        }
                        disabled={saving}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Login Notifications */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Login Notifications
                        </h3>
                        <p className="text-sm text-gray-500">
                          Get notified of new login attempts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={
                          security.loginNotifications
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {security.loginNotifications ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSaveSecurity({
                            loginNotifications: !security.loginNotifications,
                          })
                        }
                        disabled={saving}
                      >
                        {security.loginNotifications ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Notification Preferences
                  </h2>
                  <Button
                    onClick={handleSaveNotifications}
                    loading={saving}
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      key: "email",
                      label: "Email Notifications",
                      description: "Receive notifications via email",
                    },
                    {
                      key: "push",
                      label: "Push Notifications",
                      description: "Receive push notifications on your device",
                    },
                    {
                      key: "sms",
                      label: "SMS Notifications",
                      description: "Receive notifications via text message",
                    },
                    {
                      key: "marketing",
                      label: "Marketing Emails",
                      description: "Receive promotional content and updates",
                    },
                  ].map((notification) => (
                    <div
                      key={notification.key}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {notification.label}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {notification.description}
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={
                            notifications[
                              notification.key as keyof NotificationSettings
                            ]
                          }
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              [notification.key]: e.target.checked,
                            })
                          }
                          disabled={saving}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "billing" && (
              <Card className="p-6">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                  Billing & Subscription
                </h2>

                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Current Plan
                        </h3>
                        <p className="text-sm text-gray-500">
                          Free Plan - $0/month
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Payment Methods
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddPaymentMethod}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </div>

                    {loadingPaymentMethods ? (
                      <div className="py-8 text-center">
                        <p className="text-gray-600">
                          Loading payment methods...
                        </p>
                      </div>
                    ) : paymentMethods.length === 0 ? (
                      <div className="py-8 text-center">
                        <CreditCard className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="mb-4 text-gray-600">
                          No payment methods added
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleAddPaymentMethod}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Payment Method
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                          >
                            <div className="flex flex-1 items-center space-x-3">
                              <CreditCard className="h-5 w-5 text-gray-400" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900">
                                    {method.type === "card"
                                      ? `${method.card_brand ? method.card_brand.charAt(0).toUpperCase() + method.card_brand.slice(1) + " " : ""}**** ${method.last_four || "****"}`
                                      : "Bank Account"}
                                  </p>
                                  {method.is_default && (
                                    <Badge className="bg-yellow-100 text-xs text-yellow-800">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                {method.type === "card" &&
                                  method.expiry_month &&
                                  method.expiry_year && (
                                    <p className="text-sm text-gray-500">
                                      Expires{" "}
                                      {method.expiry_month
                                        .toString()
                                        .padStart(2, "0")}
                                      /{method.expiry_year}
                                    </p>
                                  )}
                                {method.billing_name && (
                                  <p className="text-sm text-gray-500">
                                    {method.billing_name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!method.is_default && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSetDefaultPaymentMethod(method.id)
                                  }
                                  disabled={saving}
                                >
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeletePaymentMethod(method.id)
                                }
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={handleAddPaymentMethod}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Payment Method
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card className="p-6">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                  Preferences
                </h2>

                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-3 font-medium text-gray-900">
                      Language & Region
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Language
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={preferences.language}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              language: e.target.value,
                            })
                          }
                          disabled={saving}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Currency
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={preferences.currency}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              currency: e.target.value,
                            })
                          }
                          disabled={saving}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={handleSavePreferences}
                        loading={saving}
                        disabled={saving}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-3 font-medium text-gray-900">
                      Data & Privacy
                    </h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={async () => {
                          try {
                            setSaving(true);
                            // Fetch all user data
                            const [userRes, settingsRes, paymentMethodsRes] =
                              await Promise.all([
                                fetch("/api/auth/user"),
                                fetch("/api/settings"),
                                fetch("/api/payment-methods"),
                              ]);

                            const userData = userRes.ok
                              ? await userRes.json()
                              : null;
                            const settingsData = settingsRes.ok
                              ? await settingsRes.json()
                              : null;
                            const paymentMethodsData = paymentMethodsRes.ok
                              ? await paymentMethodsRes.json()
                              : null;

                            const exportData = {
                              exported_at: new Date().toISOString(),
                              user: userData?.user || null,
                              settings: settingsData?.settings || null,
                              payment_methods:
                                paymentMethodsData?.paymentMethods || [],
                            };

                            const blob = new Blob(
                              [JSON.stringify(exportData, null, 2)],
                              { type: "application/json" }
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `splitsy-data-${new Date().toISOString().split("T")[0]}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            setSuccess("Data downloaded successfully");
                            setTimeout(() => setSuccess(""), 3000);
                          } catch (err) {
                            setError("Failed to download data");
                            setTimeout(() => setError(""), 5000);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                      >
                        Download My Data
                      </Button>
                      <Button
                        variant="outline"
                        fullWidth
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          const confirm1 = confirm(
                            "Are you sure you want to delete your account? This action cannot be undone."
                          );
                          if (!confirm1) return;

                          const confirm2 = prompt(
                            "This will permanently delete all your data. Type DELETE to confirm:"
                          );
                          if (confirm2 !== "DELETE") {
                            alert(
                              "Account deletion cancelled. You must type DELETE to confirm."
                            );
                            return;
                          }

                          try {
                            setSaving(true);
                            setError("");
                            const response = await fetch("/api/auth/user", {
                              method: "DELETE",
                            });

                            if (!response.ok) {
                              const data = await response.json();
                              throw new Error(
                                data.error || "Failed to delete account"
                              );
                            }

                            // Sign out and redirect
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/auth/login";
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Failed to delete account"
                            );
                            setTimeout(() => setError(""), 5000);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Add Payment Method Modal */}
        <AddPaymentMethodModal
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          onSuccess={() => {
            loadPaymentMethods();
            setSuccess("Payment method added successfully");
            setTimeout(() => setSuccess(""), 3000);
          }}
          existingPaymentMethodsCount={paymentMethods.length}
        />
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
