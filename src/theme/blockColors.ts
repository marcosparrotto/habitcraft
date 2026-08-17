import type { BlockColor } from "../types";

/**
 * Cada bloco vem com a cor de texto que passa em AA (>= 4.5:1) sobre ele —
 * medido, não chutado. Os blocos não mudam com o tema, então esse contraste
 * vale de dia e de noite.
 */
export const BLOCK_COLOR_CLASSES: Record<BlockColor, { bg: string; border: string; text: string }> = {
  grass: { bg: "bg-grass", border: "border-grass-dark", text: "text-obsidian" },
  dirt: { bg: "bg-dirt", border: "border-dirt-dark", text: "text-white" },
  stone: { bg: "bg-stone", border: "border-stone-dark", text: "text-obsidian" },
  wood: { bg: "bg-wood", border: "border-dirt-dark", text: "text-obsidian" },
  copper: { bg: "bg-copper", border: "border-dirt-dark", text: "text-obsidian" },
  silver: { bg: "bg-silver", border: "border-stone-dark", text: "text-obsidian" },
  gold: { bg: "bg-gold", border: "border-dirt-dark", text: "text-obsidian" },
  diamond: { bg: "bg-diamond", border: "border-stone-dark", text: "text-obsidian" },
  emerald: { bg: "bg-emerald", border: "border-grass-dark", text: "text-obsidian" },
  netherite: { bg: "bg-netherite", border: "border-obsidian", text: "text-white" },
  redstone: { bg: "bg-redstone", border: "border-dirt-dark", text: "text-white" },
};

export const BLOCK_COLOR_OPTIONS: BlockColor[] = [
  "grass",
  "dirt",
  "stone",
  "wood",
  "copper",
  "silver",
  "gold",
  "diamond",
  "emerald",
  "netherite",
  "redstone",
];
