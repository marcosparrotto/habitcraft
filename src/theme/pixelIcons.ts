/**
 * Ícones pixel-art 8x8. Cada padrão é uma matriz de 8 strings de 8 caracteres;
 * cada caractere é uma chave da paleta do ícone e "." é transparente.
 * Portado do painel rotina-semanal.html para virar componente de design system.
 */
export interface PixelIconDef {
  pattern: string[];
  palette: Record<string, string>;
}

const BOOK = [
  ".BBBBBB.",
  "BCCCCCCB",
  "BCPPPPCB",
  "BCPPPPCB",
  "BCPPPPCB",
  "BCPPPPCB",
  "BCCCCCCB",
  ".BBBBBB.",
];

const BONE = [
  ".OO..OO.",
  "OWWOOWWO",
  "OWWOOWWO",
  ".OWWWWO.",
  ".OWWWWO.",
  "OWWOOWWO",
  "OWWOOWWO",
  ".OO..OO.",
];

const NOTE = [
  "DDDDDDDD",
  "DWWWWWWD",
  "DWDDDDWD",
  "DWDNNDWD",
  "DWDNNDWD",
  "DWDDDDWD",
  "DWWWWWWD",
  "DDDDDDDD",
];

const BED = [
  "........",
  "RRRRRRRR",
  "RWWWWWWR",
  "RWWWWWWR",
  "RRRRRRRR",
  "....FFFF",
  "....FFFF",
  "........",
];

const DUMBBELL = [
  ".WW..WW.",
  "WWWwwWWW",
  "WWWwwWWW",
  "..Wwww..",
  "..Wwww..",
  "WWWwwWWW",
  "WWWwwWWW",
  ".WW..WW.",
];

const DIAMOND = [
  "...WW...",
  "..WDDW..",
  ".WDDDDW.",
  "WDDDDDDW",
  ".WDDDDW.",
  "..WDDW..",
  "...WW...",
  "........",
];

const CLOCK = [
  "..KKKK..",
  ".KFFFFK.",
  "KFFHFFFK",
  "KFFHFFFK",
  "KFFHHFFK",
  "KFFFFFFK",
  ".KFFFFK.",
  "..KKKK..",
];

export const PIXEL_ICONS: Record<string, PixelIconDef> = {
  book_gold: { pattern: BOOK, palette: { B: "#c9a227", C: "#ffffff", P: "#e8d9b5" } },
  book_purple: { pattern: BOOK, palette: { B: "#2b1b40", C: "#6a3fb5", P: "#b98cf0" } },
  book_red: { pattern: BOOK, palette: { B: "#5c1010", C: "#b23a3a", P: "#e8c9a0" } },
  bone: { pattern: BONE, palette: { O: "#a69b84", W: "#f2ebd9" } },
  note: { pattern: NOTE, palette: { D: "#5b3a1e", W: "#8a5a2e", N: "#1a1a1a" } },
  bed: { pattern: BED, palette: { R: "#c0392b", W: "#ffffff", F: "#6b4423" } },
  dumbbell: { pattern: DUMBBELL, palette: { W: "#b0b0b8", w: "#4a4a52" } },
  diamond: { pattern: DIAMOND, palette: { W: "#1a8f8f", D: "#55e6e6" } },
  clock: { pattern: CLOCK, palette: { K: "#4a4a52", F: "#e8e2cf", H: "#1a1a1a" } },
};

export const PIXEL_ICON_KEYS = Object.keys(PIXEL_ICONS);

export const PIXEL_ICON_LABELS: Record<string, string> = {
  book_gold: "Livro dourado",
  book_purple: "Livro roxo",
  book_red: "Livro vermelho",
  bone: "Osso",
  note: "Bloco de nota",
  bed: "Cama",
  dumbbell: "Halteres",
  diamond: "Diamante",
  clock: "Relógio",
};

export function isPixelIcon(key: string | null | undefined): key is string {
  return !!key && key in PIXEL_ICONS;
}
