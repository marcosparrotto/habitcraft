/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "../lib/supabaseClient";
import { toDateKey } from "../lib/dateUtils";
import type { Habit } from "../types";
import { subDays } from "date-fns";

/**
 * Só para o sandbox de UI (sandbox.html): troca o cliente Supabase por um banco
 * em memória com a rotina já semeada, pra dar pra testar spotlight, toast, tema
 * e edição retroativa sem precisar de login. Nada disso entra no bundle do app.
 */

const USER_ID = "dev-user";

interface Row {
  [key: string]: any;
}

const ROTINA: Omit<Habit, "id" | "user_id" | "created_at">[] = [
  { slug: "devocional", name: "Devocional (2-3 capítulos)", icon: "🙏", pixel_icon: "book_gold", color: "gold", frequency_type: "daily", scheduled_time: "06:35:00", days_of_week: [1, 2, 3, 4, 5, 6, 7], category: "Espiritual", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "passeio_manha", name: "Passeio manhã + podcast técnico", icon: "🐾", pixel_icon: "bone", color: "grass", frequency_type: "daily", scheduled_time: "06:50:00", days_of_week: [1, 2, 3, 4, 5, 6, 7], category: "Movimento", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "estudo_cert", name: "Estudo de certificação", icon: "📚", pixel_icon: "book_purple", color: "diamond", frequency_type: "daily", scheduled_time: "07:45:00", days_of_week: [1, 2, 3, 4, 5], category: "Carreira", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "ingles_revisao", name: "Revisão leve de inglês", icon: "✍️", pixel_icon: "note", color: "copper", frequency_type: "daily", scheduled_time: "08:10:00", days_of_week: [1, 3], category: "Idiomas", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "academia", name: "Academia (no almoço)", icon: "🏋️", pixel_icon: "dumbbell", color: "redstone", frequency_type: "daily", scheduled_time: "12:00:00", days_of_week: [1, 2, 3, 4, 5], category: "Movimento", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "ingles_aula", name: "Aula de inglês", icon: "🧠", pixel_icon: "note", color: "copper", frequency_type: "daily", scheduled_time: "18:15:00", days_of_week: [1, 3], category: "Idiomas", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "passeio_noite", name: "Passeio noturno", icon: "🐾", pixel_icon: "bone", color: "emerald", frequency_type: "daily", scheduled_time: "19:30:00", days_of_week: [1, 2, 3, 4, 5, 6, 7], category: "Movimento", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "leitura", name: "Leitura de ficção", icon: "📖", pixel_icon: "book_red", color: "wood", frequency_type: "daily", scheduled_time: "22:30:00", days_of_week: [1, 2, 3, 4, 5, 6, 7], category: "Lazer", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "dormir", name: "Dormir até 23h", icon: "😴", pixel_icon: "bed", color: "netherite", frequency_type: "daily", scheduled_time: "23:00:00", days_of_week: [1, 2, 3, 4, 5, 6, 7], category: "Sono", target_quantity: null, target_unit: null, weekly_target_count: null, archived: false },
  { slug: "agua", name: "Beber água", icon: "💧", pixel_icon: null, color: "diamond", frequency_type: "multiple_daily", scheduled_time: null, days_of_week: [1, 2, 3, 4, 5, 6, 7], category: "Saúde", target_quantity: 8, target_unit: "copos", weekly_target_count: null, archived: false },
];

const createdAt = subDays(new Date(), 40).toISOString();

const db: Record<string, Row[]> = {
  habits: ROTINA.map((h, i) => ({ ...h, id: `habit-${i}`, user_id: USER_ID, created_at: createdAt })),
  check_ins: [],
  badges: [],
};

/** Fecha os dois dias anteriores a ontem e deixa ontem pela metade,
 *  pro aviso de "retome hoje" e o streak terem o que mostrar. */
function seedHistory() {
  const today = new Date();
  let seq = 0;
  for (let back = 4; back >= 1; back--) {
    const date = subDays(today, back);
    const iso = toDateKey(date);
    const weekday = ((date.getDay() + 6) % 7) + 1;
    const due = db.habits.filter((h) => (h.days_of_week as number[]).includes(weekday));
    const rows = back === 1 ? due.slice(0, Math.max(1, due.length - 3)) : due;
    for (const h of rows) {
      db.check_ins.push({
        id: `ci-${seq++}`,
        habit_id: h.id,
        user_id: USER_ID,
        check_date: iso,
        quantity: 1,
        created_at: date.toISOString(),
      });
    }
  }
}
seedHistory();

function matches(row: Row, filters: [string, any][]): boolean {
  return filters.every(([col, val]) => row[col] === val);
}

function makeBuilder(table: string) {
  const filters: [string, any][] = [];
  let operation: "select" | "insert" | "delete" | "upsert" = "select";
  let payload: Row[] = [];
  let limit: number | null = null;
  let orderCol: string | null = null;

  function resolve(): { data: any; error: null } {
    const rows = db[table] ?? [];

    if (operation === "insert" || operation === "upsert") {
      const inserted = payload.map((p) => ({
        id: `${table}-${Math.random().toString(36).slice(2, 9)}`,
        created_at: new Date().toISOString(),
        achieved_at: new Date().toISOString(),
        ...p,
      }));
      db[table] = [...rows, ...inserted];
      return { data: inserted, error: null };
    }

    if (operation === "delete") {
      db[table] = rows.filter((r) => !matches(r, filters));
      return { data: null, error: null };
    }

    let result = rows.filter((r) => matches(r, filters));
    if (orderCol) {
      result = [...result].sort((a, b) => String(a[orderCol!]).localeCompare(String(b[orderCol!])));
    }
    if (limit !== null) result = result.slice(0, limit);
    return { data: result, error: null };
  }

  const api: any = {
    select: () => api,
    insert: (rows: Row | Row[]) => {
      operation = "insert";
      payload = Array.isArray(rows) ? rows : [rows];
      return api;
    },
    upsert: (rows: Row | Row[]) => {
      operation = "upsert";
      payload = Array.isArray(rows) ? rows : [rows];
      return api;
    },
    update: (values: Row) => {
      operation = "select";
      db[table] = (db[table] ?? []).map((r) => (matches(r, filters) ? { ...r, ...values } : r));
      return api;
    },
    delete: () => {
      operation = "delete";
      return api;
    },
    eq: (col: string, val: any) => {
      filters.push([col, val]);
      return api;
    },
    order: (col: string) => {
      orderCol = col;
      return api;
    },
    limit: (n: number) => {
      limit = n;
      return api;
    },
    single: async () => {
      const { data } = resolve();
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    },
    maybeSingle: async () => {
      const { data } = resolve();
      return { data: Array.isArray(data) ? (data[0] ?? null) : data, error: null };
    },
    then: (onFulfilled: any, onRejected: any) =>
      Promise.resolve(resolve()).then(onFulfilled, onRejected),
  };

  return api;
}

export function installFakeSupabase() {
  const client = supabase as any;
  client.from = (table: string) => makeBuilder(table);
  client.auth.getUser = async () => ({ data: { user: { id: USER_ID } }, error: null });
  client.auth.getSession = async () => ({
    data: { session: { user: { id: USER_ID } } },
    error: null,
  });
  client.auth.onAuthStateChange = () => ({
    data: { subscription: { unsubscribe() {} } },
  });
  client.auth.signOut = async () => ({ error: null });
}
