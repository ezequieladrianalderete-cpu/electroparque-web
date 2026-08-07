'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/lib/utils';
import { DateRangePicker, defaultRange, type DateRange } from '@/components/admin/DateRangePicker';

// Solo estos estados representan plata que efectivamente entró (no pedidos abandonados/cancelados).
const REVENUE_STATUSES = ['paid', 'preparing', 'dispatched', 'in_transit', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', preparing: 'Preparando', dispatched: 'Despachado',
  in_transit: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};
const BRAND_BLUE = '#1c2f6b';
const GRID_COLOR = '#e5e7eb';
const AXIS_COLOR = '#9ca3af';

function dayKey(d: string | Date) { return new Date(d).toISOString().slice(0, 10); }
function pct(part: number, whole: number) { return whole > 0 ? (part / whole) * 100 : 0; }
function distinctSessions(events: any[], type: string) { return new Set(events.filter(e => e.event_type === type).map(e => e.session_id)).size; }

function StatTile({ label, value, deltaPct }: { label: string; value: string; deltaPct?: number | null }) {
  const hasDelta = deltaPct !== null && deltaPct !== undefined && isFinite(deltaPct);
  const up = (deltaPct || 0) >= 0;
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
      {hasDelta && (
        <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${up ? 'text-green-600' : 'text-ep-red'}`}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {up ? '+' : ''}{deltaPct!.toFixed(0)}% vs. período anterior
        </p>
      )}
    </div>
  );
}

function RatioTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-extrabold text-ep-navy mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, height = 'h-64', children }: { title: string; height?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="font-bold text-sm text-gray-700 mb-4">{title}</h2>
      <div className={height}>{children}</div>
    </div>
  );
}

export default function EstadisticasPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [range, setRange] = useState<DateRange>(defaultRange());
  const [orders, setOrders] = useState<any[]>([]);
  const [prevOrders, setPrevOrders] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [prevEvents, setPrevEvents] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, range]);

  const load = async () => {
    setLoaded(false);
    const spanMs = range.to.getTime() - range.from.getTime();
    const prevFrom = new Date(range.from.getTime() - spanMs);
    const prevTo = new Date(range.from.getTime());

    const [{ data: ordersData }, { data: prevOrdersData }, { data: eventsData }, { data: prevEventsData }] = await Promise.all([
      supabase.from('orders').select('id,order_number,status,total,items,created_at').gte('created_at', range.from.toISOString()).lte('created_at', range.to.toISOString()),
      supabase.from('orders').select('id,status,total,items,created_at').gte('created_at', prevFrom.toISOString()).lte('created_at', prevTo.toISOString()),
      supabase.from('analytics_events').select('event_type,session_id,category_id,product_id,created_at').gte('created_at', range.from.toISOString()).lte('created_at', range.to.toISOString()),
      supabase.from('analytics_events').select('event_type,session_id').gte('created_at', prevFrom.toISOString()).lte('created_at', prevTo.toISOString()),
    ]);
    setOrders(ordersData || []); setPrevOrders(prevOrdersData || []);
    setEvents(eventsData || []); setPrevEvents(prevEventsData || []);
    setLoaded(true);
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  const revenueOf = (list: any[]) => list.filter(o => REVENUE_STATUSES.includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
  const payingOf = (list: any[]) => list.filter(o => REVENUE_STATUSES.includes(o.status));

  const revenue = revenueOf(orders);
  const revenuePrev = revenueOf(prevOrders);
  const revenueDelta = revenuePrev > 0 ? ((revenue - revenuePrev) / revenuePrev) * 100 : null;

  const paidOrders = payingOf(orders);
  const paidOrdersPrev = payingOf(prevOrders);
  const salesDelta = paidOrdersPrev.length > 0 ? ((paidOrders.length - paidOrdersPrev.length) / paidOrdersPrev.length) * 100 : null;

  const avgOrder = paidOrders.length > 0 ? revenue / paidOrders.length : 0;
  const avgOrderPrev = paidOrdersPrev.length > 0 ? revenuePrev / paidOrdersPrev.length : 0;
  const avgOrderDelta = avgOrderPrev > 0 ? ((avgOrder - avgOrderPrev) / avgOrderPrev) * 100 : null;

  const visits = distinctSessions(events, 'page_view');
  const visitsPrev = distinctSessions(prevEvents, 'page_view');
  const visitsDelta = visitsPrev > 0 ? ((visits - visitsPrev) / visitsPrev) * 100 : null;

  const categoryViews = distinctSessions(events, 'view_category');
  const productViews = distinctSessions(events, 'view_product');
  const cartsCreated = distinctSessions(events, 'add_to_cart');
  const checkoutsStarted = distinctSessions(events, 'begin_checkout');
  const ordersCreatedCount = orders.length;

  const visitorFunnel = [
    { etapa: 'Visitas', valor: visits },
    { etapa: 'Vista de categoría', valor: categoryViews },
    { etapa: 'Vista de producto', valor: productViews },
    { etapa: 'Carritos creados', valor: cartsCreated },
  ];
  const checkoutFunnel = [
    { etapa: 'Checkout iniciado', valor: checkoutsStarted },
    { etapa: 'Pedidos creados', valor: ordersCreatedCount },
    { etapa: 'Pedidos pagos', valor: paidOrders.length },
  ];

  // Serie diaria de facturación dentro del rango elegido (incluye días en $0 para que no salte).
  const days = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000));
  const dailyMap: Record<string, number> = {};
  for (let i = days; i >= 0; i--) dailyMap[dayKey(new Date(range.to.getTime() - i * 86400000))] = 0;
  payingOf(orders).forEach(o => { const key = dayKey(o.created_at); if (key in dailyMap) dailyMap[key] += Number(o.total); });
  const dailySeries = Object.entries(dailyMap).map(([date, rev]) => ({ date: new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), revenue: rev }));

  const statusCounts = Object.keys(STATUS_LABELS).map(status => ({ status: STATUS_LABELS[status], cantidad: orders.filter(o => o.status === status).length })).filter(s => s.cantidad > 0);

  const productRevenue: Record<string, { name: string; revenue: number }> = {};
  payingOf(orders).forEach(o => (o.items || []).forEach((item: any) => {
    const key = item.product_id || item.name;
    if (!productRevenue[key]) productRevenue[key] = { name: item.name, revenue: 0 };
    productRevenue[key].revenue += Number(item.subtotal) || 0;
  }));
  const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
    .map(p => ({ name: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name, facturacion: p.revenue }));

  const tooltipMoney = { formatter: (v: any) => formatPrice(Number(v)), contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' } };
  const tooltipCount = (name: string) => ({ formatter: (v: any) => [v, name], contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' } });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3 flex-wrap">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1"><h1 className="font-bold text-lg">Estadísticas</h1><p className="text-xs text-gray-500">Comparado contra el período anterior de igual duración</p></div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label="Visitas" value={String(visits)} deltaPct={visitsDelta} />
          <StatTile label="Ventas" value={String(paidOrders.length)} deltaPct={salesDelta} />
          <StatTile label="Facturación" value={formatPrice(revenue)} deltaPct={revenueDelta} />
          <StatTile label="Ticket promedio" value={formatPrice(avgOrder)} deltaPct={avgOrderDelta} />
        </div>

        <ChartCard title="Facturación por día">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} interval={Math.max(0, Math.floor(days / 8))} />
              <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} width={70} tickFormatter={v => formatPrice(v)} />
              <Tooltip {...tooltipMoney} />
              <Area type="monotone" dataKey="revenue" name="Facturación" stroke={BRAND_BLUE} strokeWidth={2} fill={BRAND_BLUE} fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RatioTile label="Visitas a ventas" value={`${pct(paidOrders.length, visits).toFixed(2)}%`} />
          <RatioTile label="Visitas a carritos" value={`${pct(cartsCreated, visits).toFixed(2)}%`} />
          <RatioTile label="Checkouts iniciados a ventas" value={`${pct(paidOrders.length, checkoutsStarted).toFixed(2)}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Comportamiento de los visitantes">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorFunnel} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="0" horizontal={false} stroke={GRID_COLOR} />
                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="etapa" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltipCount('Sesiones')} />
                <Bar dataKey="valor" name="Sesiones" fill={BRAND_BLUE} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Comportamiento en el checkout">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={checkoutFunnel} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="0" horizontal={false} stroke={GRID_COLOR} />
                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="etapa" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltipCount('Cantidad')} />
                <Bar dataKey="valor" name="Cantidad" fill={BRAND_BLUE} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Pedidos por estado (en el período)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="0" horizontal={false} stroke={GRID_COLOR} />
                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...tooltipCount('Pedidos')} />
                <Bar dataKey="cantidad" name="Pedidos" fill={BRAND_BLUE} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top productos por facturación">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Sin ventas pagadas en este período</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="0" horizontal={false} stroke={GRID_COLOR} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => formatPrice(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip {...tooltipMoney} />
                  <Bar dataKey="facturacion" name="Facturación" fill={BRAND_BLUE} radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
