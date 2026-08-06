// Cuando un emoji queda dentro de un texto con degradado (bg-clip-text + text-transparent),
// el navegador lo pinta con el degradado en vez de sus colores propios y queda deforme.
// Esto separa los emojis y les devuelve su color nativo, sin tocar el degradado del resto del texto.
const EMOJI_RE = /\p{Extended_Pictographic}️?/gu;

export function EmojiSafeText({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${EMOJI_RE.source})`, 'gu')).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        new RegExp(`^${EMOJI_RE.source}$`, 'u').test(part)
          ? <span key={i} style={{ WebkitTextFillColor: 'initial', backgroundImage: 'none' }}>{part}</span>
          : part
      )}
    </>
  );
}
