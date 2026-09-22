// 對應 scripts/thumbs.mjs：/uploads/x.jpg → /_img/x-400.webp、/_img/x-800.webp
const WIDTHS = [400, 800] as const;

export function thumbs(src: string) {
  const m = src.match(/^\/uploads\/(.+)\.(jpe?g|png|webp)$/i);
  if (!m) return { src, srcset: undefined };
  const base = m[1];
  return {
    src: `/_img/${base}-800.webp`,
    srcset: WIDTHS.map((w) => `/_img/${base}-${w}.webp ${w}w`).join(', '),
  };
}

export function youtubeId(url: string | undefined) {
  if (!url) return undefined;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m?.[1];
}
