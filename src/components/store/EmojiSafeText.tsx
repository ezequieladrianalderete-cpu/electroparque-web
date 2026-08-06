// Cuando un emoji queda DENTRO de un elemento con degradado (bg-clip-text + text-transparent),
// algunos navegadores lo pintan con el degradado en vez de sus colores propios y queda deforme.
// Tratar de "revertirle" el color desde adentro no es confiable en todos los navegadores —
// la única forma segura es que el emoji nunca sea descendiente de ese elemento. Por eso acá el
// degradado se aplica por partes de texto (cada una en su propio span), y el emoji queda afuera,
// sin degradado ninguno, con su color nativo intacto.
const EMOJI_RE = /\p{Extended_Pictographic}️?/gu;

export function EmojiSafeText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(new RegExp(`(${EMOJI_RE.source})`, 'gu')).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        new RegExp(`^${EMOJI_RE.source}$`, 'u').test(part)
          ? <span key={i}>{part}</span>
          : <span key={i} className={className}>{part}</span>
      )}
    </>
  );
}
