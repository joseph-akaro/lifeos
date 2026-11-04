/** Boxicons glyph. `n` is the icon class, e.g. "bx-home" or "bxs-hot". */
export function Icon({ n, className = '' }: { n: string; className?: string }) {
  return <i className={`bx ${n} ${className}`} aria-hidden="true" />;
}
