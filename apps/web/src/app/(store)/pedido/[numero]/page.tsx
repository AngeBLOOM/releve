import OrderTracker from '@/components/store/OrderTracker';

export const metadata = { title: 'Sigue tu pedido — Relevé' };

/** Link directo: /pedido/ABC123 abre el seguimiento ya cargado. */
export default function SeguimientoDirectoPage({ params }: { params: { numero: string } }) {
  return <OrderTracker initialNumber={decodeURIComponent(params.numero)} />;
}
