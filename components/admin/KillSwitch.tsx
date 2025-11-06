"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Power, PowerOff, AlertTriangle } from "lucide-react";

interface KillSwitchStatus {
  enabled: boolean;
  reason: string;
  disabled_at: string | null;
  updated_at: string;
}

export default function KillSwitch() {
  const [status, setStatus] = useState<KillSwitchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/kill-switch");
      if (!response.ok) throw new Error("Failed to fetch status");

      const data = await response.json();
      setStatus(data);
      setReason(data.reason || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load kill switch status");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!enabled && !reason.trim()) {
      setError("Please provide a reason for disabling the platform");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/admin/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, reason: reason.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update kill switch");
      }

      const data = await response.json();
      await fetchStatus();
      
      // Show success message
      if (data.success) {
        // Optionally show a toast notification here
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update kill switch");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-silver-200 rounded w-1/4"></div>
            <div className="h-10 bg-silver-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = status?.enabled ?? true;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? (
            <Power className="w-5 h-5 text-black" />
          ) : (
            <PowerOff className="w-5 h-5 text-silver-600" />
          )}
          Platform Kill Switch
        </CardTitle>
        <CardDescription>
          {isEnabled
            ? "Platform is currently operational. Use this to disable all non-admin operations."
            : "Platform is currently disabled. All non-admin operations are blocked."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="error">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </Alert>
        )}

        {!isEnabled && status?.reason && (
          <Alert variant="warning">
            <div>
              <strong>Disable Reason:</strong> {status.reason}
            </div>
            {status.disabled_at && (
              <div className="text-sm mt-1">
                Disabled at: {new Date(status.disabled_at).toLocaleString()}
              </div>
            )}
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Reason (required when disabling)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isEnabled ? "Enter reason for disabling..." : status?.reason || ""}
              className="w-full px-3 py-2 border border-silver-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="flex gap-3">
            {isEnabled ? (
              <Button
                variant="danger"
                onClick={() => handleToggle(false)}
                disabled={saving}
                loading={saving}
                fullWidth
              >
                <PowerOff className="w-4 h-4 mr-2" />
                Disable Platform
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => handleToggle(true)}
                disabled={saving}
                loading={saving}
                fullWidth
              >
                <Power className="w-4 h-4 mr-2" />
                Enable Platform
              </Button>
            )}
          </div>

          {status?.updated_at && (
            <p className="text-xs text-silver-600">
              Last updated: {new Date(status.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

