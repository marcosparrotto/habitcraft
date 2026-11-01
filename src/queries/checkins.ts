import { useAuth } from "../lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { CheckIn } from "../types";
import { todayKey } from "../lib/dateUtils";

export const checkInsKey = ["check_ins"];

/** All check-ins — the personal-use data volume is small enough to compute stats client-side. */
export function useCheckIns() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [...checkInsKey, session?.user.id],
    enabled: !!session,
    queryFn: async ({ signal }): Promise<CheckIn[]> => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .abortSignal(signal)
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

export interface UndoVars extends Omit<CheckInVars, "quantity"> {
  /**
   * "day"  — apaga todos os check-ins do hábito naquela data. É o certo para
   *          hábito binário: desmarcar significa "não fiz hoje", e qualquer
   *          registro duplicado sairia junto em vez de continuar contando.
   * "last" — remove só a última unidade. Para hábito com meta diária
   *          (ex: 8 copos), onde desmarcar é decrementar.
   */
  scope?: "day" | "last";
}

/** Undo: desfaz o check-in do dia (default hoje). */
export function useUndoCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, date, scope = "day" }: UndoVars) => {
      const checkDate = date ?? todayKey();

      if (scope === "day") {
        const { error } = await supabase
          .from("check_ins")
          .delete()
          .eq("habit_id", habitId)
          .eq("check_date", checkDate);
        if (error) throw error;
        return;
      }

      const { data: latest, error: findError } = await supabase
        .from("check_ins")
        .select("id")
        .eq("habit_id", habitId)
        .eq("check_date", checkDate)
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
