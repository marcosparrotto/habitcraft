import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { BlockColor, FrequencyType, Habit, HabitInput, WeekdayISO } from "../types";
import { ALL_WEEKDAYS, WEEKDAY_ABBR } from "../types";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelInput, PixelLabel, PixelSelect } from "../components/ui/PixelInput";
import { PixelIcon } from "../components/ui/PixelIcon";
import { BLOCK_COLOR_CLASSES, BLOCK_COLOR_OPTIONS } from "../theme/blockColors";
import { HABIT_ICONS } from "../theme/icons";
import { PIXEL_ICON_KEYS, PIXEL_ICON_LABELS } from "../theme/pixelIcons";

const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  daily: "Diário — 1x por dia",
  multiple_daily: "Várias vezes ao dia (com meta)",
  weekly_x: "X vezes por semana",
  one_time: "Pontual — tarefa avulsa",
};

const schema = z
  .object({
    name: z.string().min(1, "Dê um nome ao hábito"),
    icon: z.string().min(1),
    pixel_icon: z.string().nullable().optional(),
    color: z.string().min(1),
    frequency_type: z.enum(["daily", "one_time", "multiple_daily", "weekly_x"]),
    target_quantity: z.coerce.number().int().positive().nullable().optional(),
    target_unit: z.string().nullable().optional(),
    weekly_target_count: z.coerce.number().int().positive().nullable().optional(),
    scheduled_time: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    days_of_week: z.array(z.number().int().min(1).max(7)),
  })
  .refine(
    (v) => v.frequency_type !== "multiple_daily" || (v.target_quantity ?? 0) > 0,
    { message: "Defina a meta diária (ex: 8)", path: ["target_quantity"] },
  )
  .refine(
    (v) => v.frequency_type !== "weekly_x" || (v.weekly_target_count ?? 0) > 0,
    { message: "Defina quantas vezes por semana (ex: 3)", path: ["weekly_target_count"] },
  )
  .refine((v) => v.frequency_type === "one_time" || v.days_of_week.length > 0, {
    message: "Escolha pelo menos um dia da semana",
    path: ["days_of_week"],
  });

type FormValues = z.input<typeof schema>;

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (input: HabitInput) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export function HabitForm({ habit, onSubmit, onCancel, submitting }: HabitFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: habit?.name ?? "",
      icon: habit?.icon ?? HABIT_ICONS[0],
      pixel_icon: habit?.pixel_icon ?? null,
      color: habit?.color ?? "grass",
      frequency_type: habit?.frequency_type ?? "daily",
      target_quantity: habit?.target_quantity ?? null,
      target_unit: habit?.target_unit ?? "",
      weekly_target_count: habit?.weekly_target_count ?? null,
      scheduled_time: habit?.scheduled_time?.slice(0, 5) ?? "",
      category: habit?.category ?? "",
      // sem days_of_week salvo, o hábito vale para todos os dias
      days_of_week: habit?.days_of_week ?? [...ALL_WEEKDAYS],
    },
  });

  const frequency = watch("frequency_type");
  const selectedIcon = watch("icon");
  const selectedPixelIcon = watch("pixel_icon");
  const selectedColor = watch("color") as BlockColor;
  const selectedDays = watch("days_of_week") ?? [];

  function toggleDay(day: WeekdayISO) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    setValue("days_of_week", next, { shouldValidate: true });
  }

  function submit(values: FormValues) {
    const parsed = schema.parse(values);
    const days = parsed.days_of_week as WeekdayISO[];

    onSubmit({
      name: parsed.name,
      icon: parsed.icon,
      pixel_icon: parsed.pixel_icon || null,
      color: parsed.color as BlockColor,
      frequency_type: parsed.frequency_type,
      target_quantity: parsed.frequency_type === "multiple_daily" ? parsed.target_quantity ?? null : null,
      target_unit:
        parsed.frequency_type === "multiple_daily" && parsed.target_unit ? parsed.target_unit : null,
      weekly_target_count:
        parsed.frequency_type === "weekly_x" ? parsed.weekly_target_count ?? null : null,
      scheduled_time: parsed.scheduled_time ? `${parsed.scheduled_time}:00` : null,
      category: parsed.category || null,
      // todos os dias marcados = null no banco (semântica de "todo dia")
      days_of_week:
        parsed.frequency_type === "one_time" || days.length === 7 ? null : days,
    });
  }

  return (
    <PixelPanel>
      <h2 className="font-pixel text-sm text-accent mb-5">
        {habit ? "Editar hábito" : "Novo hábito"}
      </h2>

      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div>
          <PixelLabel>Nome</PixelLabel>
          <PixelInput placeholder="Ex: Beber água" {...register("name")} />
          {errors.name && <p className="text-danger text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <PixelLabel>Ícone pixel-art</PixelLabel>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              title="Nenhum — usar emoji"
              onClick={() => setValue("pixel_icon", null)}
              className={`w-11 h-11 border-4 text-sm bg-panel-light ${
                !selectedPixelIcon ? "border-diamond" : "border-edge hover:border-stone"
              }`}
            >
              —
            </button>
            {PIXEL_ICON_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                title={PIXEL_ICON_LABELS[key] ?? key}
                onClick={() => setValue("pixel_icon", key)}
                className={`w-11 h-11 border-4 bg-panel-light flex items-center justify-center ${
                  selectedPixelIcon === key ? "border-diamond" : "border-edge hover:border-stone"
                }`}
              >
                <PixelIcon name={key} className="w-7 h-7" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <PixelLabel>Emoji (usado quando não há ícone pixel-art)</PixelLabel>
          <div className="flex flex-wrap gap-2">
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue("icon", icon)}
                className={`w-11 h-11 text-xl border-4 ${
                  selectedIcon === icon
                    ? "border-diamond bg-panel-light"
                    : "border-edge bg-panel-light hover:border-stone"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div>
          <PixelLabel>Bloco (cor)</PixelLabel>
          <div className="flex flex-wrap gap-2">
            {BLOCK_COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => setValue("color", color)}
                className={`w-11 h-11 border-4 ${BLOCK_COLOR_CLASSES[color].bg} ${
                  selectedColor === color ? "border-diamond" : "border-edge"
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <PixelLabel>Tipo de frequência</PixelLabel>
          <PixelSelect {...register("frequency_type")}>
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PixelSelect>
        </div>

        {frequency !== "one_time" && (
          <div>
            <PixelLabel>Dias da semana</PixelLabel>
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEKDAYS.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDay(day)}
                    className={`w-12 h-11 border-4 font-pixel text-[0.5rem] ${
                      active
                        ? "bg-grass-dark border-edge text-white"
                        : "bg-panel-light border-edge text-ink-dim"
                    }`}
                  >
                    {WEEKDAY_ABBR[day]}
                  </button>
                );
              })}
            </div>
            <p className="text-ink-dim text-sm mt-2">
              {selectedDays.length === 7
                ? "Todos os dias."
                : `Só ${selectedDays.map((d) => WEEKDAY_ABBR[d as WeekdayISO]).join(", ")} — nos outros dias o hábito não é cobrado nem quebra a sequência.`}
            </p>
            {errors.days_of_week && (
              <p className="text-danger text-sm mt-1">{errors.days_of_week.message}</p>
            )}
          </div>
        )}

        {frequency === "multiple_daily" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PixelLabel>Meta por dia</PixelLabel>
              <PixelInput type="number" min={1} placeholder="8" {...register("target_quantity")} />
              {errors.target_quantity && (
                <p className="text-danger text-sm mt-1">{errors.target_quantity.message}</p>
              )}
            </div>
            <div>
              <PixelLabel>Unidade</PixelLabel>
              <PixelInput placeholder="copos" {...register("target_unit")} />
            </div>
          </div>
        )}

        {frequency === "weekly_x" && (
          <div>
            <PixelLabel>Vezes por semana</PixelLabel>
            <PixelInput type="number" min={1} max={7} placeholder="3" {...register("weekly_target_count")} />
            {errors.weekly_target_count && (
              <p className="text-danger text-sm mt-1">{errors.weekly_target_count.message}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <PixelLabel>Horário fixo (opcional)</PixelLabel>
            <PixelInput type="time" {...register("scheduled_time")} />
          </div>
          <div>
            <PixelLabel>Categoria (opcional)</PixelLabel>
            <PixelInput placeholder="Saúde" {...register("category")} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <PixelButton type="submit" color="grass" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </PixelButton>
          <PixelButton type="button" color="stone" onClick={onCancel}>
            Cancelar
          </PixelButton>
        </div>
      </form>
    </PixelPanel>
  );
}
