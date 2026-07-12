import CartCheckout from '@/components/store/CartCheckout';

export default function CarritoPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tu carrito</h1>
      <CartCheckout />
    </div>
  );
}
