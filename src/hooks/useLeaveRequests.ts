// src/hooks/useLeaveRequests.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: 'vacation' | 'sick' | 'emergency' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  num_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_date?: string;
  rejection_reason?: string;
}

export interface LeaveBalance {
  vacation_balance: number;
  vacation_used: number;
  vacation_remaining: number;
  sick_balance: number;
  sick_used: number;
  sick_remaining: number;
  emergency_balance: number;
  emergency_used: number;
  emergency_remaining: number;
}

const token = localStorage.getItem('token');

export function useLeaveRequests(employeeId?: number) {
  const queryClient = useQueryClient();

  // Get pending leave requests (for managers)
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-leave-requests'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/leaves/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data || [];
    },
  });

  // Get employee leave balance
  const { data: leaveBalance = null } = useQuery({
    queryKey: ['leave-balance', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data } = await axios.get(`${API_URL}/leaves/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.balance;
    },
    enabled: !!employeeId,
  });

  // Get employee leave history
  const { data: leaveHistory = [] } = useQuery({
    queryKey: ['leave-history', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data } = await axios.get(`${API_URL}/leaves/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.requests || [];
    },
    enabled: !!employeeId,
  });

  // Submit leave request
  const submitMutation = useMutation({
    mutationFn: async (leaveData: Omit<LeaveRequest, 'id' | 'status'>) => {
      const { data } = await axios.post(`${API_URL}/leaves/request`, leaveData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balance', 'leave-history'] });
    },
  });

  // Approve leave request
  const approveMutation = useMutation({
    mutationFn: async (leaveRequestId: number) => {
      const { data } = await axios.post(
        `${API_URL}/leaves/${leaveRequestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-leave-requests'] });
    },
  });

  // Reject leave request
  const rejectMutation = useMutation({
    mutationFn: async ({ leaveRequestId, reason }: { leaveRequestId: number; reason: string }) => {
      const { data } = await axios.post(
        `${API_URL}/leaves/${leaveRequestId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-leave-requests'] });
    },
  });

  return {
    pendingRequests,
    leaveBalance,
    leaveHistory,
    submitLeave: submitMutation.mutate,
    approveLeave: approveMutation.mutate,
    rejectLeave: rejectMutation.mutate,
    isSubmitting: submitMutation.isPending,
    isApproving: approveMutation.isPending,
  };
}