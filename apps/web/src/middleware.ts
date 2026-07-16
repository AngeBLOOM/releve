import { NextRequest, NextResponse } from 'next/server';

// El login guarda el token en una cookie httpOnly (auth_token), pero la API lee
// el token del encabezado Authorization. En producción (web en Vercel, API en
// Render) las peticiones del panel se hacen vía el proxy /api/* — este middleware
// toma la cookie y la pasa como "Authorization: Bearer <token>" para que la API
// autentique correctamente.
export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const headers = new Headers(req.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: '/api/:path*',
};
