"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { X, Plus, DollarSign, Users, MessageSquare } from "lucide-react";

interface SplitParticipant {
  id: string;
  name: string;
  phone: string;
  amount: number;
}

interface CreateSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSplit: (splitData: {
    description: string;
    totalAmount: number;
    participants: SplitParticipant[];
  }) => void;
}

export function CreateSplitModal({ isOpen, onClose, onCreateSplit }: CreateSplitModalProps) {
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [participants, setParticipants] = useState<SplitParticipant[]>([
    { id: "1", name: "", phone: "", amount: 0 }
  ]);

  const addParticipant = () => {
    if (participants.length < 8) {
      const newId = (participants.length + 1).toString();
      setParticipants([...participants, { id: newId, name: "", phone: "", amount: 0 }]);
    }
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const updateParticipant = (id: string, field: keyof SplitParticipant, value: string | number) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const calculateSplitAmount = () => {
    const amount = parseFloat(totalAmount) || 0;
    const splitAmount = amount / participants.length;
    setParticipants(participants.map(p => ({ ...p, amount: splitAmount })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    if (!description.trim() || !amount || amount <= 0) return;

    onCreateSplit({
      description: description.trim(),
      totalAmount: amount,
      participants: participants.filter(p => p.name.trim() && p.phone.trim())
    });

    // Reset form
    setDescription("");
    setTotalAmount("");
    setParticipants([{ id: "1", name: "", phone: "", amount: 0 }]);
    onClose();
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length > 0) {
      return `(${phoneNumber}`;
    }
    return phoneNumber;
  };

  const handlePhoneChange = (id: string, value: string) => {
    const formatted = formatPhoneNumber(value);
    updateParticipant(id, 'phone', formatted);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Split">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's this for?
          </label>
          <Input
            type="text"
            placeholder="e.g., Dinner at Mario's, Groceries, Concert tickets..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full"
          />
        </div>

        {/* Total Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Who's splitting? ({participants.length}/8)
            </label>
            {participants.length < 8 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParticipant}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Person
              </Button>
            )}
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {participants.map((participant, index) => (
              <Card key={participant.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Person {index + 1}
                  </span>
                  {participants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(participant.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={participant.name}
                      onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={participant.phone}
                      onChange={(e) => handlePhoneChange(participant.id, e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Amount to Pay</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={participant.amount || ""}
                      onChange={(e) => updateParticipant(participant.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {participants.length > 1 && (
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={calculateSplitAmount}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Split Evenly
              </Button>
            </div>
          )}
        </div>

        {/* Total Summary */}
        {totalAmount && (
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Total Amount:</span>
              <span className="text-lg font-bold text-gray-900">
                ${parseFloat(totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Split between {participants.length} people:</span>
              <span className="text-sm font-semibold text-gray-700">
                ${(parseFloat(totalAmount) / participants.length).toFixed(2)} each
              </span>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Send Payment Links
          </Button>
        </div>
      </form>
    </Modal>
  );
}





