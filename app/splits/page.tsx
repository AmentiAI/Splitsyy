"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CreateSplitModal } from "@/components/splits/CreateSplitModal";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import {
  PiggyBank,
  Plus,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Settings,
  MessageSquare,
  X,
  Info,
} from "lucide-react";

interface Split {
  id: string;
  description: string;
  total_amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  group_id: string | null;
  created_at: string;
  split_participants: Array<{
    id: string;
    name: string;
    phone: string;
    amount: number;
    status: string;
    payment_link: string;
  }>;
}

const mockSplits: Split[] = [
  {
    id: "mock-1",
    description: "Coastal Weekend Crew",
    total_amount: 420000,
    status: "active",
    group_id: null,
    created_at: new Date().toISOString(),
    split_participants: [
      {
        id: "mock-p1",
        name: "Jordan Blake",
        phone: "+15551234567",
        amount: 105000,
        status: "paid",
        payment_link: "#",
      },
      {
        id: "mock-p2",
        name: "Priya Desai",
        phone: "+15557654321",
        amount: 105000,
        status: "paid",
        payment_link: "#",
      },
      {
        id: "mock-p3",
        name: "Leo Martinez",
        phone: "+15559876543",
        amount: 105000,
        status: "pending",
        payment_link: "#",
      },
      {
        id: "mock-p4",
        name: "Maya Chen",
        phone: "+15558765432",
        amount: 105000,
        status: "pending",
        payment_link: "#",
      },
    ],
  },
];

const cloneSplit = (split: Split): Split => ({
  ...split,
  split_participants: split.split_participants.map((participant) => ({
    ...participant,
  })),
});

const prepareSplits = (splits: Split[] = []) => splits.map(cloneSplit);

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-brand-green-100 text-brand-green-700";
    case "completed":
      return "bg-brand-blue-100 text-brand-blue-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-brand-blue-50 text-brand-blue-700";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <Clock className="h-4 w-4" />;
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "pending":
      return <AlertCircle className="h-4 w-4" />;
    case "cancelled":
      return <X className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getParticipantStatusStyles = (status: string) => {
  switch (status) {
    case "paid":
      return {
        label: "Paid",
        className: "bg-brand-green-100 text-brand-green-700",
      };
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-700" };
    case "reminded":
      return {
        label: "Reminded",
        className: "bg-brand-blue-100 text-brand-blue-700",
      };
    default:
      return {
        label: status,
        className: "bg-brand-blue-50 text-brand-blue-700",
      };
  }
};

const getPaidAmount = (split: Split) =>
  split.split_participants
    .filter((participant) => participant.status === "paid")
    .reduce((sum, participant) => sum + participant.amount, 0);

const getParticipantCount = (split: Split) => split.split_participants.length;

function SplitsPage() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "info" | "error" | "success";
    message: string;
  } | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "manage">("view");

  useEffect(() => {
    const fetchSplits = async () => {
      try {
        const response = await fetch("/api/splits", { credentials: "include" });
        const data = await response.json();

        if (response.ok) {
          setSplits(prepareSplits(data.splits || []));
          setBanner(null);
        } else {
          console.error("Failed to fetch splits:", data.error, data.details);
          const errorMsg = data.details
            ? `${data.error}: ${data.details}`
            : data.error ||
              "We couldn't load your splits. Showing a demo split for now.";
          setBanner(
            response.status === 401
              ? {
                  type: "info",
                  message:
                    "Your session has expired. Showing demo data—please sign in again to load your real splits.",
                }
              : { type: "error", message: errorMsg }
          );
          setSplits(prepareSplits(mockSplits));
        }
      } catch (error) {
        console.error("Error fetching splits:", error);
        setBanner({
          type: "error",
          message:
            "We couldn’t reach the splits service. Showing a demo split while you retry.",
        });
        setSplits(prepareSplits(mockSplits));
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSplits();
  }, []);

  const totalTargetAmount = splits.reduce(
    (sum, split) => sum + split.total_amount,
    0
  );
  const totalPaidAmount = splits.reduce(
    (sum, split) => sum + getPaidAmount(split),
    0
  );
  const activeSplitsCount = splits.filter(
    (split) => split.status === "active"
  ).length;
  const completedSplits = splits.filter(
    (split) => split.status === "completed"
  );
  const activeSplits = splits.filter((split) => split.status === "active");
  const pendingSplits = splits.filter((split) => split.status === "pending");

  const handleCreateSplit = async (splitData: {
    description: string;
    totalAmount: number;
    participants: Array<{
      id: string;
      name: string;
      phone: string;
      amount: number;
    }>;
  }) => {
    setLoading(true);
    try {
      const response = await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(splitData),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create split");
      }

      const refreshResponse = await fetch("/api/splits", {
        credentials: "include",
      });
      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok) {
        setSplits(prepareSplits(refreshData.splits || []));
        setBanner({
          type: "success",
          message:
            "Split created successfully. You're viewing the latest data.",
        });
      } else {
        setBanner(
          refreshResponse.status === 401
            ? {
                type: "info",
                message:
                  "Split created, but your session expired before refresh. Please sign in again.",
              }
            : {
                type: "error",
                message:
                  refreshData.error ||
                  "Split created, but we couldn’t refresh the list.",
              }
        );
      }

      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating split:", error);
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the split.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openSplitModal = (split: Split, mode: "view" | "manage") => {
    setSelectedSplit(cloneSplit(split));
    setModalMode(mode);
  };

  const closeSplitModal = () => {
    setSelectedSplit(null);
    setModalMode("view");
  };

  const handleSendReminder = (split: Split) => {
    setBanner({
      type: "info",
      message: `Reminder queued for participants in "${split.description}". (Demo action)`,
    });
  };

  const handleMarkCompleted = (split: Split) => {
    setSplits((previous) =>
      previous.map((item) =>
        item.id === split.id ? { ...item, status: "completed" } : item
      )
    );
    setSelectedSplit((previous) =>
      previous && previous.id === split.id
        ? { ...previous, status: "completed" }
        : previous
    );
    setBanner({
      type: "success",
      message: `"${split.description}" marked as completed in this session.`,
    });
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-brand-blue-600">Loading splits...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const bannerStyles = {
    info: {
      title: "Heads up",
      bg: "bg-brand-blue-50",
      border: "border-brand-blue-200",
      text: "text-brand-blue-600",
      icon: "text-brand-blue-500",
      Icon: Info,
    },
    error: {
      title: "Something went wrong",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      icon: "text-red-500",
      Icon: AlertCircle,
    },
    success: {
      title: "Success",
      bg: "bg-brand-green-50",
      border: "border-brand-green-200",
      text: "text-brand-green-700",
      icon: "text-brand-green-500",
      Icon: CheckCircle,
    },
  };

  const currentBannerStyle = banner ? bannerStyles[banner.type] : null;
  const BannerIcon = currentBannerStyle?.Icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-midnight sm:text-3xl lg:text-4xl">
              Splits
            </h1>
            <p className="mt-2 text-sm text-brand-blue-600 sm:text-base">
              Manage shared expenses and group funding
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Split
          </Button>
        </div>

        {banner && currentBannerStyle && BannerIcon && (
          <Card
            className={`border p-4 ${currentBannerStyle.bg} ${currentBannerStyle.border}`}
          >
            <div className="flex items-start gap-3">
              <BannerIcon
                className={`h-5 w-5 ${currentBannerStyle.icon} mt-0.5`}
              />
              <div>
                <p
                  className={`text-sm font-semibold ${currentBannerStyle.text}`}
                >
                  {currentBannerStyle.title}
                </p>
                <p className={`mt-1 text-sm ${currentBannerStyle.text}`}>
                  {banner.message}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-blue-600">
                  Active Splits
                </p>
                <p className="text-2xl font-bold text-brand-green-600">
                  {activeSplitsCount}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-brand-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-blue-600">
                  Total Target
                </p>
                <p className="text-2xl font-bold text-brand-blue-600">
                  {formatCurrency(totalTargetAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-brand-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-blue-600">
                  Amount Paid
                </p>
                <p className="text-2xl font-bold text-brand-green-600">
                  {formatCurrency(totalPaidAmount)}
                </p>
              </div>
              <Users className="h-8 w-8 text-brand-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-blue-600">
                  Progress
                </p>
                <p className="text-2xl font-bold text-brand-blue-600">
                  {totalTargetAmount > 0
                    ? Math.round((totalPaidAmount / totalTargetAmount) * 100)
                    : 0}
                  %
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-brand-blue-500" />
            </div>
          </Card>
        </div>

        {activeSplits.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-brand-midnight">
              Active Splits
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeSplits.map((split) => (
                <Card
                  key={split.id}
                  className="p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-brand-midnight">
                        {split.description}
                      </h3>
                      <p className="mb-2 text-sm text-brand-blue-600">
                        Created {formatDateTime(split.created_at)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1 capitalize">
                            {split.status}
                          </span>
                        </Badge>
                        <Badge className="bg-brand-blue-50 text-brand-blue-700">
                          {getParticipantCount(split)} people
                        </Badge>
                      </div>
                    </div>
                    <button className="rounded p-1 hover:bg-brand-blue-50">
                      <MoreHorizontal className="h-4 w-4 text-brand-blue-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand-blue-600">
                        Progress
                      </span>
                      <span className="text-sm font-semibold text-brand-midnight">
                        {formatCurrency(getPaidAmount(split))} /{" "}
                        {formatCurrency(split.total_amount)}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-brand-blue-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                        style={{
                          width: `${
                            split.total_amount > 0
                              ? (getPaidAmount(split) / split.total_amount) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-brand-blue-600">
                        <Users className="h-4 w-4 text-brand-blue-400" />
                        <span>{getParticipantCount(split)} people</span>
                      </div>
                      <span className="text-brand-blue-400">
                        {new Date(split.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-brand-blue-100 pt-4">
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => openSplitModal(split, "view")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => openSplitModal(split, "manage")}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pendingSplits.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-brand-midnight">
              Pending Splits
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingSplits.map((split) => (
                <Card
                  key={split.id}
                  className="p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-brand-midnight">
                        {split.description}
                      </h3>
                      <p className="mb-2 text-sm text-brand-blue-600">
                        Created {formatDateTime(split.created_at)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1 capitalize">
                            {split.status}
                          </span>
                        </Badge>
                        <Badge className="bg-brand-blue-50 text-brand-blue-700">
                          {getParticipantCount(split)} people
                        </Badge>
                      </div>
                    </div>
                    <button className="rounded p-1 hover:bg-brand-blue-50">
                      <MoreHorizontal className="h-4 w-4 text-brand-blue-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand-blue-600">
                        Target Amount
                      </span>
                      <span className="text-sm font-semibold text-brand-midnight">
                        {formatCurrency(split.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-brand-blue-600">
                        <Users className="h-4 w-4 text-brand-blue-400" />
                        <span>{getParticipantCount(split)} people</span>
                      </div>
                      <span className="text-brand-blue-400">
                        {new Date(split.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-brand-blue-100 pt-4">
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => openSplitModal(split, "view")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => openSplitModal(split, "manage")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Contribute
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {completedSplits.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-brand-midnight">
              Completed Splits
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedSplits.map((split) => (
                <Card
                  key={split.id}
                  className="p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-brand-midnight">
                        {split.description}
                      </h3>
                      <p className="mb-2 text-sm text-brand-blue-600">
                        Created {formatDateTime(split.created_at)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1 capitalize">
                            {split.status}
                          </span>
                        </Badge>
                        <Badge className="bg-brand-blue-50 text-brand-blue-700">
                          {getParticipantCount(split)} people
                        </Badge>
                        {split.group_id && (
                          <Badge className="bg-brand-green-100 text-brand-green-700">
                            <Users className="mr-1 h-3 w-3 text-brand-green-600" />
                            Group Created
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button className="rounded p-1 hover:bg-brand-blue-50">
                      <MoreHorizontal className="h-4 w-4 text-brand-blue-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand-blue-600">
                        Final Amount
                      </span>
                      <span className="text-sm font-semibold text-brand-midnight">
                        {formatCurrency(split.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-brand-blue-600">
                        <Users className="h-4 w-4 text-brand-blue-400" />
                        <span>{getParticipantCount(split)} people</span>
                      </div>
                      <span className="text-brand-blue-400">
                        {new Date(split.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {split.group_id && (
                    <div className="mt-4 rounded-lg border border-brand-green-200 bg-brand-green-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-brand-green-600" />
                          <span className="text-sm font-medium text-brand-green-700">
                            Group Created!
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            (window.location.href = `/groups/${split.group_id}`)
                          }
                          className="border-brand-green-300 text-brand-green-700 hover:bg-brand-green-100"
                        >
                          View Group
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-brand-green-600">
                        All participants can now transact together
                      </p>
                    </div>
                  )}

                  <div className="mt-4 border-t border-brand-blue-100 pt-4">
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => openSplitModal(split, "view")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => openSplitModal(split, "manage")}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        History
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!initialLoading && splits.length === 0 && (
          <Card className="border border-brand-blue-100 p-12">
            <div className="text-center">
              <PiggyBank className="mx-auto mb-4 h-16 w-16 text-brand-blue-300" />
              <h3 className="mb-2 text-lg font-semibold text-brand-midnight">
                No Splits Yet
              </h3>
              <p className="mb-6 text-brand-blue-600">
                Create your first split to start sharing expenses with friends
                and family.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Split
              </Button>
            </div>
          </Card>
        )}

        <CreateSplitModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateSplit={handleCreateSplit}
        />

        <Modal
          isOpen={!!selectedSplit}
          onClose={closeSplitModal}
          title={modalMode === "view" ? "Split Details" : "Manage Split"}
          description={selectedSplit?.description}
          size="lg"
        >
          {selectedSplit && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(selectedSplit.status)}>
                    {getStatusIcon(selectedSplit.status)}
                    <span className="ml-1 capitalize">
                      {selectedSplit.status}
                    </span>
                  </Badge>
                  <Badge className="bg-brand-blue-50 text-brand-blue-700">
                    <Users className="mr-1 h-3 w-3" />
                    {selectedSplit.split_participants.length} people
                  </Badge>
                </div>
                <p className="text-sm text-brand-blue-500">
                  Created {formatDateTime(selectedSplit.created_at)}
                </p>
                <p className="text-sm font-semibold text-brand-midnight">
                  Target: {formatCurrency(selectedSplit.total_amount)}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-brand-midnight">
                  Participants
                </h4>
                <div className="space-y-2">
                  {selectedSplit.split_participants.map((participant) => {
                    const statusStyles = getParticipantStatusStyles(
                      participant.status
                    );
                    return (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between rounded-lg border border-brand-blue-100 bg-brand-blue-50/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-brand-midnight">
                            {participant.name}
                          </p>
                          <p className="text-xs text-brand-blue-500">
                            {participant.phone}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-sm font-semibold text-brand-blue-600">
                            {formatCurrency(participant.amount)}
                          </p>
                          <Badge className={statusStyles.className}>
                            {statusStyles.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {modalMode === "manage" ? (
                <div className="space-y-4">
                  <p className="text-sm text-brand-blue-600">
                    Use these quick actions to manage participant progress.
                    Actions update the dashboard locally.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleSendReminder(selectedSplit)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Reminders
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleMarkCompleted(selectedSplit)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                  </div>
                  <p className="text-xs text-brand-blue-400">
                    Full workflow automation is on the roadmap; these controls
                    update the current view for demos.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-brand-blue-100 p-3">
                      <p className="text-xs uppercase tracking-wide text-brand-blue-400">
                        Paid so far
                      </p>
                      <p className="mt-1 text-lg font-semibold text-brand-midnight">
                        {formatCurrency(getPaidAmount(selectedSplit))}
                      </p>
                    </div>
                    <div className="rounded-lg border border-brand-blue-100 p-3">
                      <p className="text-xs uppercase tracking-wide text-brand-blue-400">
                        Remaining
                      </p>
                      <p className="mt-1 text-lg font-semibold text-brand-midnight">
                        {formatCurrency(
                          selectedSplit.total_amount -
                            getPaidAmount(selectedSplit)
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-brand-blue-400">
                    View mode highlights the current state of the split. Open
                    “Manage” to trigger reminders or close the split.
                  </p>
                </div>
              )}

              <ModalFooter className="justify-between">
                <Button variant="ghost" onClick={closeSplitModal}>
                  Close
                </Button>
                <div className="flex gap-2">
                  {modalMode === "view" && (
                    <Button
                      variant="secondary"
                      onClick={() => setModalMode("manage")}
                    >
                      Manage Split
                    </Button>
                  )}
                  {modalMode === "manage" && (
                    <Button
                      variant="outline"
                      onClick={() => setModalMode("view")}
                    >
                      View Summary
                    </Button>
                  )}
                </div>
              </ModalFooter>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default function Splits() {
  return (
    <AuthGuard>
      <SplitsPage />
    </AuthGuard>
  );
}
