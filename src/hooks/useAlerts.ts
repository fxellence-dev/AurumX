/**
 * Alerts Hook
 * 
 * React Query hooks for managing gold rate alerts
 * 
 * Features:
 * - Fetch user's alerts
 * - Create new alerts
 * - Update existing alerts
 * - Delete alerts
 * - Toggle alert enabled state
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GoldRateAlert, CreateAlertPayload, UpdateAlertPayload } from '@/types/database';

/**
 * Fetch all alerts for the current user
 */
async function fetchAlerts(userId: string): Promise<GoldRateAlert[]> {
  const { data, error } = await supabase
    .from('gold_rate_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch alerts: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new alert
 */
async function createAlert(payload: CreateAlertPayload): Promise<GoldRateAlert> {
  const { data, error } = await supabase
    .from('gold_rate_alerts')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create alert: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing alert
 */
async function updateAlert(id: string, payload: UpdateAlertPayload): Promise<GoldRateAlert> {
  const { data, error } = await supabase
    .from('gold_rate_alerts')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update alert: ${error.message}`);
  }

  return data;
}

/**
 * Delete an alert
 */
async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('gold_rate_alerts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete alert: ${error.message}`);
  }
}

/**
 * Hook for fetching user's alerts
 * 
 * @example
 * const { data: alerts, isLoading } = useAlerts(userId);
 */
export function useAlerts(userId: string | undefined) {
  return useQuery({
    queryKey: ['alerts', userId],
    queryFn: () => fetchAlerts(userId!),
    enabled: !!userId,
    staleTime: 30_000, // Consider fresh for 30 seconds
  });
}

/**
 * Hook for creating a new alert
 * 
 * @example
 * const createMutation = useCreateAlert();
 * await createMutation.mutateAsync(payload);
 */
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      // Invalidate alerts query to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * Hook for updating an alert
 * 
 * @example
 * const updateMutation = useUpdateAlert();
 * await updateMutation.mutateAsync({ id: '...', payload: { enabled: false } });
 */
export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAlertPayload }) =>
      updateAlert(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * Hook for deleting an alert
 * 
 * @example
 * const deleteMutation = useDeleteAlert();
 * await deleteMutation.mutateAsync(alertId);
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * Hook for toggling alert enabled state
 * 
 * @example
 * const toggleMutation = useToggleAlert();
 * await toggleMutation.mutateAsync({ id: '...', enabled: false });
 */
export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateAlert(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
