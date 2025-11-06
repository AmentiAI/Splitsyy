"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CreateSplitModal } from "@/components/splits/CreateSplitModal";
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
  X
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

// Mock data for development - will be replaced with API data
const mockSplits: Split[] = [];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <Clock className="w-4 h-4" />;
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "pending":
      return <AlertCircle className="w-4 h-4" />;
    case "cancelled":
      return <X className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

function SplitsPage() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load splits on component mount
  useEffect(() => {
    const fetchSplits = async () => {
      try {
        const response = await fetch('/api/splits');
        const data = await response.json();
        
        if (response.ok) {
          setSplits(data.splits || []);
        } else {
          console.error('Failed to fetch splits:', data.error);
        }
      } catch (error) {
        console.error('Error fetching splits:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSplits();
  }, []);

  // Calculate stats
  const totalTargetAmount = splits.reduce((sum, split) => sum + split.total_amount, 0);
  const totalPaidAmount = splits.reduce((sum, split) => {
    return sum + split.split_participants
      .filter(p => p.status === 'paid')
      .reduce((participantSum, p) => participantSum + p.amount, 0);
  }, 0);
  const activeSplitsCount = splits.filter(s => s.status === 'active').length;
  const completedSplitsCount = splits.filter(s => s.status === 'completed').length;
  const pendingSplitsCount = splits.filter(s => s.status === 'pending').length;

  // Filter splits by status
  const activeSplits = splits.filter(s => s.status === 'active');
  const completedSplits = splits.filter(s => s.status === 'completed');
  const pendingSplits = splits.filter(s => s.status === 'pending');

  // Helper function to calculate paid amount for a split
  const getPaidAmount = (split: Split) => {
    return split.split_participants
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  // Helper function to get participant count
  const getParticipantCount = (split: Split) => {
    return split.split_participants.length;
  };

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
      const response = await fetch('/api/splits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(splitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create split');
      }

      // Refresh splits list
      const refreshResponse = await fetch('/api/splits');
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setSplits(refreshData.splits || []);
      }
      
      setIsCreateModalOpen(false);
      
    } catch (error) {
      console.error('Error creating split:', error);
      // TODO: Show error message
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading splits...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Splits</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Manage shared expenses and group funding
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Split
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Splits</p>
                <p className="text-2xl font-bold text-green-600">{activeSplitsCount}</p>
              </div>
              <PiggyBank className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Target</p>
                <p className="text-2xl font-bold text-blue-600">${(totalTargetAmount / 100).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-purple-600">${(totalPaidAmount / 100).toFixed(2)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalTargetAmount > 0 ? Math.round((totalPaidAmount / totalTargetAmount) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Active Splits */}
        {activeSplits.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Splits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSplits.map((split) => (
                <Card key={split.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{split.description}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Created {new Date(split.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1">{split.status}</span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {getParticipantCount(split)} people
                        </Badge>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(getPaidAmount(split) / 100).toFixed(2)} / ${(split.total_amount / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${split.total_amount > 0 ? (getPaidAmount(split) / split.total_amount) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{getParticipantCount(split)} people</span>
                      </div>
                      <span className="text-gray-500">{new Date(split.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending Splits */}
        {pendingSplits.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Splits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingSplits.map((split) => (
                <Card key={split.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{split.description}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Created {new Date(split.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1">{split.status}</span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {getParticipantCount(split)} people
                        </Badge>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Target Amount</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${split.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{getParticipantCount(split)} people</span>
                      </div>
                      <span className="text-gray-500">{new Date(split.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
                        <Plus className="w-4 h-4 mr-2" />
                        Contribute
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Splits */}
        {completedSplits.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Splits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedSplits.map((split) => (
                <Card key={split.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{split.description}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Created {new Date(split.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1">{split.status}</span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {getParticipantCount(split)} people
                        </Badge>
                        {split.group_id && (
                          <Badge className="bg-green-100 text-green-800">
                            <Users className="w-3 h-3 mr-1" />
                            Group Created
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Final Amount</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(split.total_amount / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{getParticipantCount(split)} people</span>
                      </div>
                      <span className="text-gray-500">{new Date(split.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {split.group_id && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800 font-medium">Group Created!</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/groups/${split.group_id}`}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          View Group
                        </Button>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        All participants can now transact together
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Settings className="w-4 h-4 mr-2" />
                        History
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!initialLoading && splits.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <PiggyBank className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Splits Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first split to start sharing expenses with friends and family.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Split
              </Button>
            </div>
          </Card>
        )}

        {/* Create Split Modal */}
        <CreateSplitModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateSplit={handleCreateSplit}
        />
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


