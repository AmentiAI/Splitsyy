"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  Search,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Verification {
  id: string;
  user_id: string;
  provider: string;
  provider_verification_id: string | null;
  provider_status: string;
  ssn_masked: string;
  ssn_full: string;
  date_of_birth: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  id_type: string | null;
  id_number_masked: string;
  id_number_full: string;
  id_issued_date: string | null;
  id_expiry_date: string | null;
  id_issuing_authority: string | null;
  verification_submitted_at: string | null;
  verification_completed_at: string | null;
  provider_response: any;
  provider_error: string | null;
  admin_notes: string | null;
  users: {
    id: string;
    email: string;
    name: string;
    kyc_status: string;
  } | null;
}

interface VerificationsData {
  verifications: Verification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function VerificationViewer() {
  const [data, setData] = useState<VerificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchVerifications();
  }, [filters, currentPage]);

  async function fetchVerifications() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      params.append("limit", pageSize.toString());
      params.append("offset", (currentPage * pageSize).toString());

      const response = await fetch(
        `/api/admin/verification?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch verifications");
      }

      const result = await response.json();

      // Apply client-side search
      let verifications = result.verifications;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        verifications = verifications.filter(
          (v: Verification) =>
            v.users?.email?.toLowerCase().includes(searchLower) ||
            v.users?.name?.toLowerCase().includes(searchLower) ||
            v.provider_verification_id?.toLowerCase().includes(searchLower)
        );
      }

      setData({
        ...result,
        verifications,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load verifications"
      );
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (verificationId: string, status: string) => {
    try {
      const response = await fetch("/api/admin/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          provider_status: status,
          verification_completed_at:
            status === "approved" || status === "rejected"
              ? new Date().toISOString()
              : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      fetchVerifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleSaveNotes = async (verificationId: string) => {
    try {
      const response = await fetch("/api/admin/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          admin_notes: editingNotes[verificationId],
        }),
      });

      if (!response.ok) throw new Error("Failed to save notes");

      setEditingNotes({ ...editingNotes, [verificationId]: "" });
      fetchVerifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading && !data) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="h-10 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search by email, name, or verification ID..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              leftIcon={<Search className="h-4 w-4" />}
              fullWidth
            />
          </div>
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: "", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "expired", label: "Expired" },
            ]}
          />
        </div>
        <div className="text-sm text-gray-600">
          Total: {data?.pagination.total || 0} verifications
        </div>
      </Card>

      {/* Verifications List */}
      <div className="space-y-4">
        {data?.verifications.map((verification) => (
          <Card key={verification.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {verification.users?.name || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {verification.users?.email}
                  </p>
                  <Badge
                    className={getStatusColor(
                      verification.users?.kyc_status || ""
                    )}
                  >
                    KYC: {verification.users?.kyc_status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={getStatusColor(verification.provider_status)}
                  >
                    {getStatusIcon(verification.provider_status)}
                    <span className="ml-1">{verification.provider_status}</span>
                  </Badge>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500">Date of Birth</label>
                  <p className="text-sm font-medium">
                    {verification.date_of_birth
                      ? new Date(
                          verification.date_of_birth
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Address</label>
                  <p className="text-sm font-medium">
                    {verification.address_line1 ? (
                      <>
                        {verification.address_line1}
                        {verification.city && `, ${verification.city}`}
                        {verification.state &&
                          `, ${verification.state} ${verification.zip_code || ""}`}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              </div>

              {/* Provider Information */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-500">Provider</label>
                    <p className="font-medium capitalize">
                      {verification.provider?.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Verification ID
                    </label>
                    <p className="font-mono text-xs">
                      {verification.provider_verification_id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Submitted</label>
                    <p className="text-sm">
                      {verification.verification_submitted_at
                        ? new Date(
                            verification.verification_submitted_at
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Completed</label>
                    <p className="text-sm">
                      {verification.verification_completed_at
                        ? new Date(
                            verification.verification_completed_at
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                {verification.provider_error && (
                  <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                    Error: {verification.provider_error}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="border-t border-gray-200 pt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Admin Notes
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  rows={2}
                  value={
                    editingNotes[verification.id] ??
                    verification.admin_notes ??
                    ""
                  }
                  onChange={(e) =>
                    setEditingNotes({
                      ...editingNotes,
                      [verification.id]: e.target.value,
                    })
                  }
                  placeholder="Add notes about this verification..."
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => handleSaveNotes(verification.id)}
                  disabled={
                    editingNotes[verification.id] === verification.admin_notes
                  }
                >
                  Save Notes
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-200 pt-4">
                {verification.provider_status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleUpdateStatus(verification.id, "approved")
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleUpdateStatus(verification.id, "rejected")
                      }
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {data && data.verifications.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Shield className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="text-gray-600">No verifications found</p>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {data && data.pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {currentPage * pageSize + 1} to{" "}
            {Math.min((currentPage + 1) * pageSize, data.pagination.total)} of{" "}
            {data.pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!data.pagination.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
