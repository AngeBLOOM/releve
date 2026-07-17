import { redirect } from 'next/navigation';

export default function Home() {
  // El dominio público es la TIENDA. El panel admin vive en /login e /inbox.
  redirect('/tienda');
}
