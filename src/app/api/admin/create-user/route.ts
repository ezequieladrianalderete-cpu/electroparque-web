import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Antes cualquiera que encontrara esta URL podía crearse un usuario admin sin estar
  // logueado — ahora hace falta mandar la sesión de un admin ya existente.
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user: caller } } = await authClient.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { role: 'admin', must_change_password: true }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}
