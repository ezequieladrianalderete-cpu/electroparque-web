// Un ID por navegador/dispositivo, para poder contar "visitas" (sesiones únicas) sin
// necesitar cuentas de cliente — igual de simple que el carrito y los favoritos.
const KEY = 'ep-session-id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
