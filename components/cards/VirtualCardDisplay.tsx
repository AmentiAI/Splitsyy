"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatCardNumber, getStatusVariant } from "@/lib/utils/format";

interface VirtualCardDisplayProps {
  card: {
    id: string;
    last4?: string;
    network: string;
    status: string;
    balance?: number;
    currency?: string;
    groupName?: string;
  };
  onClick?: () => void;
}

export function VirtualCardDisplay({ card, onClick }: VirtualCardDisplayProps) {
  const networkLogos: Record<string, string> = {
    visa: "💳",
    mastercard: "💳",
  };

  const statusColors: Record<string, string> = {
    active: "text-green-600",
    suspended: "text-yellow-600",
    closed: "text-red-600",
  };

  return (
    <div
      onClick={onClick}
      className={`${onClick ? "cursor-pointer" : ""} group`}
    >
      <Card
        variant="elevated"
        padding="none"
        className="overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white hover:scale-[1.02] transition-transform"
      >
        <CardContent className="p-6">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wide mb-1">
                Virtual Card
              </p>
              <p className="text-sm font-medium">{card.groupName || "Splitsy Card"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={getStatusVariant(card.status)}
                size="sm"
                className="bg-white text-gray-900"
              >
                {card.status}
              </Badge>
            </div>
          </div>

          {/* Card Number */}
          <div className="mb-6">
            <p className="text-2xl font-mono tracking-wider">
              {card.last4 ? formatCardNumber(card.last4) : "•••• •••• •••• ••••"}
            </p>
          </div>

          {/* Card Footer */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wide mb-1">
                Balance
              </p>
              <p className="text-lg font-semibold">
                {card.balance !== undefined
                  ? formatCurrency(card.balance, card.currency || "USD")
                  : "---"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-100 uppercase tracking-wide mb-1">
                Network
              </p>
              <p className="text-sm font-medium capitalize flex items-center">
                {networkLogos[card.network.toLowerCase()] || "💳"}
                <span className="ml-1">{card.network}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


