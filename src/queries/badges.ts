import { useAuth } from "../lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Badge, BadgeMetric, Milestone } from "../types";

export const badgesKey = ["badges"];

export function useBadges() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [...badgesKey, session?.user.id],
    enabled: !!session,
    queryFn: async ({ signal }): Promise<Badge[]> => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .abortSignal(signal)
        .order("achieved_at", { ascending: true });
      if (error) throw error;
      return data as Badge[];
    },
  });
}

export function useAwardBadges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      awards: { habitId: string; metric: BadgeMetric; milestone: Milestone }[],
    ): Promise<Badge[]> => {
      if (awards.length === 0) return [];

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

      const rows = awards.map((a) => ({
        habit_id: a.habitId,
        user_id: userId,
        metric_type: a.metric,
        milestone: a.milestone,
      }));

      // ignoreDuplicates keeps re-checks idempotent against the (habit, metric, milestone) unique index.
      const { data, error } = await supabase
        .from("badges")
        .upsert(rows, {
          onConflict: "habit_id,metric_type,milestone",
          ignoreDuplicates: true,
        })
        .select();
      if (error) throw error;
      return (data ?? []) as Badge[];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: badgesKey }),
  });
}
