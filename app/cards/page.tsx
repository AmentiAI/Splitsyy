"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { 
  CreditCard,
  Plus,
  Eye,
  Settings,
  MoreHorizontal,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock
} from "lucide-react";

interface VirtualCard {
  id: string;
  name: string;
  cardNumber: string;
  expiryDate: string;
  balance: number;
  spendingLimit: number;
  status: "active" | "blocked" | "expired";
  type: "debit" | "credit";
  color: string;
  createdAt: string;
  lastUsed: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "blocked":
      return "bg-red-100 text-red-800";
    case "expired":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="w-4 h-4" />;
    case "blocked":
      return <AlertCircle className="w-4 h-4" />;
    case "expired":
      return <Clock className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

function CardsPage() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await fetch("/api/cards");
        if (response.ok) {
          const data = await response.json();
          setCards(data.cards || []);
        }
      } catch (error) {
        console.error("Failed to fetch cards:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, []);

  const activeCards = cards.filter(c => c.status === "active");
  const blockedCards = cards.filter(c => c.status === "blocked");
  const expiredCards = cards.filter(c => c.status === "expired");

  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const totalSpendingLimit = cards.reduce((sum, card) => sum + card.spendingLimit, 0);
  const activeCardsCount = activeCards.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading cards...</p>
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Virtual Cards</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Manage your virtual debit and credit cards
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create New Card
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cards</p>
                <p className="text-2xl font-bold text-green-600">{activeCardsCount}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-blue-600">${totalBalance.toLocaleString()}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Limit</p>
                <p className="text-2xl font-bold text-purple-600">${totalSpendingLimit.toLocaleString()}</p>
              </div>
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Credit</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${(totalSpendingLimit - totalBalance).toLocaleString()}
                </p>
              </div>
              <Unlock className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Active Cards */}
        {activeCards.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCards.map((card) => (
                <Card key={card.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className={`${card.color} rounded-lg p-4 mb-4 text-white relative overflow-hidden`}>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{card.name}</h3>
                        <Badge className={getStatusColor(card.status)}>
                          {getStatusIcon(card.status)}
                          <span className="ml-1">{card.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm opacity-90">Card Number</p>
                        <p className="text-lg font-mono">{card.cardNumber}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Expires</p>
                          <p className="font-semibold">{card.expiryDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90">Balance</p>
                          <p className="font-semibold">${card.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Design Elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full translate-y-8 -translate-x-8"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Spending Limit</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${card.spendingLimit.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Card Type</span>
                      <Badge className="bg-gray-100 text-gray-800 capitalize">
                        {card.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last used {card.lastUsed}</span>
                      <span className="text-gray-500">Created {card.createdAt}</span>
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

        {/* Blocked Cards */}
        {blockedCards.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Blocked Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blockedCards.map((card) => (
                <Card key={card.id} className="p-6 hover:shadow-lg transition-shadow opacity-75">
                  <div className={`${card.color} rounded-lg p-4 mb-4 text-white relative overflow-hidden`}>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{card.name}</h3>
                        <Badge className={getStatusColor(card.status)}>
                          {getStatusIcon(card.status)}
                          <span className="ml-1">{card.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm opacity-90">Card Number</p>
                        <p className="text-lg font-mono">{card.cardNumber}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Expires</p>
                          <p className="font-semibold">{card.expiryDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90">Balance</p>
                          <p className="font-semibold">${card.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Unlock className="w-4 h-4 mr-2" />
                        Unblock
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Expired Cards */}
        {expiredCards.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Expired Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiredCards.map((card) => (
                <Card key={card.id} className="p-6 hover:shadow-lg transition-shadow opacity-60">
                  <div className={`${card.color} rounded-lg p-4 mb-4 text-white relative overflow-hidden`}>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{card.name}</h3>
                        <Badge className={getStatusColor(card.status)}>
                          {getStatusIcon(card.status)}
                          <span className="ml-1">{card.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm opacity-90">Card Number</p>
                        <p className="text-lg font-mono">{card.cardNumber}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Expired</p>
                          <p className="font-semibold">{card.expiryDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90">Final Balance</p>
                          <p className="font-semibold">${card.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Eye className="w-4 h-4 mr-2" />
                        View History
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Plus className="w-4 h-4 mr-2" />
                        Renew
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {cards.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cards Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first virtual card to start making secure payments.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Card
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Cards() {
  return (
    <AuthGuard>
      <CardsPage />
    </AuthGuard>
  );
}


