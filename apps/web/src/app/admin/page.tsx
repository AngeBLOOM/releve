import { redirect } from 'next/navigation';

// Entrada privada de la administradora. Va al panel; si no hay sesión, el
// layout del panel redirige a /login. Los clientes nunca llegan aquí: la
// tienda pública vive en /tienda y la raíz "/" también va a la tienda.
export default function AdminEntry() {
  redirect('/inbox');
}
