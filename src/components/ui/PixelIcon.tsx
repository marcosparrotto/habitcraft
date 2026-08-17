import { PIXEL_ICONS, isPixelIcon } from "../../theme/pixelIcons";

interface PixelIconProps {
  /** Chave do ícone pixel-art. */
  name?: string | null;
  /** Emoji usado quando o hábito não tem ícone pixel-art definido. */
  fallback?: string;
  className?: string;
  title?: string;
}

/**
 * Renderiza um ícone 8x8 como SVG inline (1 rect por pixel aceso).
 * Sem ícone pixel-art definido, cai para o emoji do hábito — os dois sistemas
 * convivem porque hábitos criados na interface antes disso só têm emoji.
 */
export function PixelIcon({ name, fallback, className = "w-7 h-7", title }: PixelIconProps) {
  if (!isPixelIcon(name)) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center leading-none`}
        role="img"
        aria-label={title}
      >
        {fallback ?? "▪"}
      </span>
    );
  }

  const def = PIXEL_ICONS[name];
  const rects: React.ReactNode[] = [];

  def.pattern.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const fill = def.palette[row[x]];
      if (!fill) continue;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    }
  });

  return (
    <svg
      viewBox="0 0 8 8"
      className={`${className} block [image-rendering:pixelated] [shape-rendering:crispEdges]`}
      role="img"
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {rects}
    </svg>
  );
}
