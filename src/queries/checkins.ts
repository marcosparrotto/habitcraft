import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { CheckIn } from "../types";
import { todayKey } from "../lib/dateUtils";

export const checkInsKey = ["check_ins"];

/** All check-ins — the personal-use data volume is small enough to compute stats client-side. */
export function useCheckIns() {
  return useQuery({
    queryKey: checkInsKey,
    queryFn: async (): Promise<CheckIn[]> => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .order("check_date", { ascending: true });
      if (error) throw error;
      return data as CheckIn[];
    },
  });
}

export interface CheckInVars {
  habitId: string;
  quantity?: number;
  /** "YYYY-MM-DD"; omitido = hoje. A aba "Semana" usa isso para editar dias passados. */
  date?: string;
}

export function useAddCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, quantity = 1, date }: CheckInVars) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

      const { data, error } = await supabase
        .from("check_ins")
        .insert({
          habit_id: habitId,
          user_id: userId,
          check_date: date ?? todayKey(),
          quantity,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CheckIn;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: checkInsKey }),
  });
}

/** Undo: removes the most recent check-in of the given day (default today). */
export function useUndoCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, date }: Omit<CheckInVars, "quantity">) => {
      const { data: latest, error: findError } = await supabase
        .from("check_ins")
        .select("id")
        .eq("habit_id", habitId)
        .eq("check_date", date ?? todayKey())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (findError) throw findError;
      if (!latest) return;

      const { error } = await supabase.from("check_ins").delete().eq("id", latest.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: checkInsKey }),
  });
}
