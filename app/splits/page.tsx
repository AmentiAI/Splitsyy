"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
  Settings
} from "lucide-react";

interface Split {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: "active" | "completed" | "pending";
  createdBy: string;
  createdAt: string;
  participants: number;
  category: string;
}

const mockSplits: Split[] = [
  {
    id: "1",
    name: "Weekend Trip to NYC",
    description: "Shared expenses for our NYC weekend getaway",
    targetAmount: 2000,
    currentAmount: 1500,
    status: "active",
    createdBy: "Aidan Wilson",
    createdAt: "2025-10-08",
    participants: 4,
    category: "Travel",
  },
  {
    id: "2",
    name: "Office Lunch Fund",
    description: "Monthly lunch budget for the team",
    targetAmount: 800,
    currentAmount: 800,
    status: "completed",
    createdBy: "Sarah Johnson",
    createdAt: "2025-10-01",
    participants: 8,
    category: "Food",
  },
  {
    id: "3",
    name: "Birthday Party",
    description: "Celebration for Mike's birthday",
    targetAmount: 500,
    currentAmount: 300,
    status: "active",
    createdBy: "Lisa Chen",
    createdAt: "2025-10-06",
    participants: 6,
    category: "Entertainment",
  },
  {
    id: "4",
    name: "Gym Membership",
    description: "Shared gym membership for the apartment",
    targetAmount: 120,
    currentAmount: 0,
    status: "pending",
    createdBy: "Tom Rodriguez",
    createdAt: "2025-10-09",
    participants: 3,
    category: "Health",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
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
    default:
      return <Clock className="w-4 h-4" />;
  }
};

function SplitsPage() {
  const [activeSplits, setActiveSplits] = useState(mockSplits.filter(s => s.status === "active"));
  const [completedSplits, setCompletedSplits] = useState(mockSplits.filter(s => s.status === "completed"));
  const [pendingSplits, setPendingSplits] = useState(mockSplits.filter(s => s.status === "pending"));

  const totalTargetAmount = mockSplits.reduce((sum, split) => sum + split.targetAmount, 0);
  const totalCurrentAmount = mockSplits.reduce((sum, split) => sum + split.currentAmount, 0);
  const activeSplitsCount = activeSplits.length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Splits</h1>
            <p className="text-gray-600 mt-2">
              Manage shared expenses and group funding
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Split
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-2xl font-bold text-blue-600">${totalTargetAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Raised</p>
                <p className="text-2xl font-bold text-purple-600">${totalCurrentAmount.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalTargetAmount > 0 ? Math.round((totalCurrentAmount / totalTargetAmount) * 100) : 0}%
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
                      <h3 className="font-semibold text-gray-900 mb-1">{split.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{split.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1">{split.status}</span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {split.category}
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
                        ${split.currentAmount.toLocaleString()} / ${split.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${(split.currentAmount / split.targetAmount) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{split.participants} members</span>
                      </div>
                      <span className="text-gray-500">{split.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
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
                      <h3 className="font-semibold text-gray-900 mb-1">{split.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{split.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1">{split.status}</span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {split.category}
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
                        <span className="text-gray-600">{split.participants} members</span>
                      </div>
                      <span className="text-gray-500">{split.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm">
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
                      <h3 className="font-semibold text-gray-900 mb-1">{split.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{split.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(split.status)}>
                          {getStatusIcon(split.status)}
                          <span className="ml-1">{split.status}</span>
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {split.category}
                        </Badge>
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
                        ${split.currentAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{split.participants} members</span>
                      </div>
                      <span className="text-gray-500">{split.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
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
        {mockSplits.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <PiggyBank className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Splits Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first split to start sharing expenses with friends and family.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Split
              </Button>
            </div>
          </Card>
        )}
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

