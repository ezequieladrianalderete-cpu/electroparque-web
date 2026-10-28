// Dirección pública de la tienda para armar los links que se le dan a Mercado Pago y GoCuotas.
// electroparque.com (sin www) solo redirige (308) a www.electroparque.com, y Mercado Pago / GoCuotas
// NO siguen redirecciones cuando avisan un pago: el aviso se perdía y el pedido nunca pasaba a la
// Lista de retiro ni descontaba stock hasta que alguien lo tocaba en el admin. Por eso se usa siempre www.
export function urlTienda() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app').trim().replace(/\/+$/, '');
  return base.replace(/^https?:\/\/electroparque\.com$/i, 'https://www.electroparque.com');
}
