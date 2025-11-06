"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  Receipt,
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface Transaction {
  id: string;
  poolId: string | null;
  cardId: string | null;
  amount: number;
  currency: string;
  type: string;
  status: string;
  merchantName: string | null;
  merchantCategory: string | null;
  description: string | null;
  providerTransactionId: string | null;
  metadata: any;
  createdAt: string;
  pool: {
    id: string;
    targetAmount: number;
    group: {
      id: string;
      name: string;
      ownerId: string;
      currency: string;
      members: Array<{
        userId: string;
        role: string;
        userName: string | null;
        userEmail: string | null;
      }>;
    } | null;
  } | null;
  card: {
    id: string;
    lastFour: string;
    network: string;
    status: string;
  } | null;
}

interface TransactionsData {
  transactions: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalValue: number;
    statusCounts: {
      pending: number;
      approved: number;
      declined: number;
      reversed: number;
    };
    typeCounts: {
      purchase: number;
      refund: number;
      fee: number;
      adjustment: number;
    };
  };
}

export default function TransactionsViewer() {
  const [data, setData] = useState<TransactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchTransactions();
  }, [filters, currentPage]);

  async function fetchTransactions() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.type) params.append("type", filters.type);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", pageSize.toString());
      params.append("offset", (currentPage * pageSize).toString());

      const response = await fetch(`/api/admin/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const result = await response.json();

      // Apply client-side search if needed
      let transactions = result.transactions;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        transactions = transactions.filter(
          (t: Transaction) =>
            t.merchantName?.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower) ||
            t.providerTransactionId?.toLowerCase().includes(searchLower) ||
            t.pool?.group?.name?.toLowerCase().includes(searchLower) ||
            t.card?.lastFour?.includes(searchLower)
        );
      }

      setData({
        ...result,
        transactions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  const handleExport = () => {
    if (!data) return;

    const headers = [
      "Date",
      "ID",
      "Type",
      "Status",
      "Amount",
      "Currency",
      "Merchant",
      "Category",
      "Description",
      "Pool Group",
      "Card",
      "Provider Transaction ID",
    ];

    const rows = data.transactions.map((t) => [
      new Date(t.createdAt).toISOString(),
      t.id,
      t.type,
      t.status,
      (t.amount / 100).toFixed(2),
      t.currency,
      t.merchantName || "",
      t.merchantCategory || "",
      t.description || "",
      t.pool?.group?.name || "",
      t.card ? `${t.card.network.toUpperCase()} ****${t.card.lastFour}` : "",
      t.providerTransactionId || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "reversed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-blue-100 text-blue-800";
      case "refund":
        return "bg-green-100 text-green-800";
      case "fee":
        return "bg-red-100 text-red-800";
      case "adjustment":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">{error}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.summary.totalValue, "USD")}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.pagination.total}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.summary.statusCounts.approved}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Declined</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.summary.statusCounts.declined}
                </p>
              </div>
              <Badge className="bg-red-100 text-red-800">Failed</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search by merchant, description, ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              leftIcon={<Search className="w-4 h-4" />}
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
              { value: "approved", label: "Approved" },
              { value: "declined", label: "Declined" },
              { value: "reversed", label: "Reversed" },
            ]}
          />
          <Select
            label="Type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: "", label: "All Types" },
              { value: "purchase", label: "Purchase" },
              { value: "refund", label: "Refund" },
              { value: "fee", label: "Fee" },
              { value: "adjustment", label: "Adjustment" },
            ]}
          />
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ status: "", type: "", startDate: "", endDate: "", search: "" });
              setCurrentPage(0);
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Merchant</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Group</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Card</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {data?.transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.merchantName || "Unknown"}
                      </p>
                      {transaction.merchantCategory && (
                        <p className="text-xs text-gray-500">{transaction.merchantCategory}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p
                      className={`text-sm font-semibold ${
                        transaction.amount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {transaction.amount < 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={getTypeColor(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {transaction.pool?.group ? (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {transaction.pool.group.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {transaction.card ? (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {transaction.card.network.toUpperCase()} ****{transaction.card.lastFour}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs text-gray-600 font-mono">
                      {transaction.providerTransactionId || transaction.id.slice(0, 8)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.transactions.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions found</p>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {currentPage * pageSize + 1} to{" "}
              {Math.min((currentPage + 1) * pageSize, data.pagination.total)} of{" "}
              {data.pagination.total} transactions
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!data.pagination.hasMore}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}


