import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Habit, HabitInput } from "../types";

export const habitsKey = ["habits"];

export function useHabits() {
  return useQuery({
    queryKey: habitsKey,
    queryFn: async (): Promise<Habit[]> => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Habit[];
    },
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HabitInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

      const { data, error } = await supabase
        .from("habits")
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKey }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: HabitInput }) => {
      const { data, error } = await supabase
        .from("habits")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKey }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: habitsKey });
      qc.invalidateQueries({ queryKey: ["check_ins"] });
      qc.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}
