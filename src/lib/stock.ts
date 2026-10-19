// Stock de la tienda: sale del producto vinculado en stock-app (columna products.stock_disponible,
// que la base mantiene al día sola). null = producto no vinculado → no se limita la cantidad.
export function stockDe(p: { stock_disponible?: number | null } | null | undefined) {
  const s = p?.stock_disponible;
  const limitado = typeof s === 'number';
  return {
    limitado,
    disponible: limitado ? Math.max(0, s as number) : Infinity,
    agotado: limitado && (s as number) <= 0,
    ultima: limitado && s === 1,
    pocas: limitado && (s as number) >= 2 && (s as number) <= 3,
  };
}

// Al cobrar: suma lo que el carrito pide de este producto (puede venir en varias líneas, por variante)
// y lo compara con el stock real. Devuelve el mensaje para el cliente, o null si alcanza.
export function faltaStock(product: any, items: any[], productId: string): string | null {
  const st = stockDe(product);
  if (!st.limitado) return null;
  const pedido = items.filter(i => (i.product_id || i.id) === productId)
    .reduce((t, i) => t + Math.max(1, Math.floor(Number(i.quantity)) || 1), 0);
  if (st.agotado) return `Nos quedamos sin stock de "${product.name}". Sacalo del carrito para seguir.`;
  if (pedido > st.disponible) return `De "${product.name}" nos queda${st.disponible === 1 ? ' 1 unidad' : 'n ' + st.disponible + ' unidades'}. Bajá la cantidad en el carrito para seguir.`;
  return null;
}
