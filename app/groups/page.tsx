"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { 
  Users,
  Plus,
  DollarSign,
  Calendar,
  Settings,
  MoreHorizontal,
  Eye,
  UserPlus,
  TrendingUp
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  totalExpenses: number;
  createdAt: string;
  createdBy: string;
  status: "active" | "archived";
  category: string;
}

const mockGroups: Group[] = [
  {
    id: "1",
    name: "Roommates",
    description: "Shared expenses with my roommates",
    memberCount: 3,
    totalExpenses: 1250.50,
    createdAt: "2025-10-01",
    createdBy: "Aidan Wilson",
    status: "active",
    category: "Housing",
  },
  {
    id: "2",
    name: "Weekend Warriors",
    description: "Adventure and travel group",
    memberCount: 6,
    totalExpenses: 3200.75,
    createdAt: "2025-09-15",
    createdBy: "Sarah Johnson",
    status: "active",
    category: "Travel",
  },
  {
    id: "3",
    name: "Office Lunch Club",
    description: "Daily lunch expenses at work",
    memberCount: 8,
    totalExpenses: 890.25,
    createdAt: "2025-09-01",
    createdBy: "Mike Chen",
    status: "active",
    category: "Food",
  },
  {
    id: "4",
    name: "Gym Buddies",
    description: "Fitness and wellness expenses",
    memberCount: 4,
    totalExpenses: 450.00,
    createdAt: "2025-08-20",
    createdBy: "Lisa Rodriguez",
    status: "archived",
    category: "Health",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "archived":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function GroupsPage() {
  const [activeGroups, setActiveGroups] = useState(mockGroups.filter(g => g.status === "active"));
  const [archivedGroups, setArchivedGroups] = useState(mockGroups.filter(g => g.status === "archived"));

  const totalMembers = mockGroups.reduce((sum, group) => sum + group.memberCount, 0);
  const totalExpenses = mockGroups.reduce((sum, group) => sum + group.totalExpenses, 0);
  const activeGroupsCount = activeGroups.length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
            <p className="text-gray-600 mt-2">
              Manage your expense-sharing groups
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Groups</p>
                <p className="text-2xl font-bold text-green-600">{activeGroupsCount}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-blue-600">{totalMembers}</p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-purple-600">${totalExpenses.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg per Group</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${activeGroupsCount > 0 ? Math.round(totalExpenses / activeGroupsCount) : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Active Groups */}
        {activeGroups.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGroups.map((group) => (
                <Card key={group.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(group.status)}>
                          {group.status}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {group.category}
                        </Badge>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Members</span>
                      <span className="text-sm font-semibold text-gray-900">{group.memberCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Expenses</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${group.totalExpenses.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Created {group.createdAt}</span>
                      <span className="text-gray-500">by {group.createdBy}</span>
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

        {/* Archived Groups */}
        {archivedGroups.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Archived Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedGroups.map((group) => (
                <Card key={group.id} className="p-6 hover:shadow-lg transition-shadow opacity-75">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(group.status)}>
                          {group.status}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {group.category}
                        </Badge>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Members</span>
                      <span className="text-sm font-semibold text-gray-900">{group.memberCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Expenses</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${group.totalExpenses.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Created {group.createdAt}</span>
                      <span className="text-gray-500">by {group.createdBy}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View History
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {mockGroups.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first group to start sharing expenses with friends and family.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Groups() {
  return (
    <AuthGuard>
      <GroupsPage />
    </AuthGuard>
  );
}

