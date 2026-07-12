import ProductCustomizer from '@/components/store/ProductCustomizer';

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductCustomizer id={params.id} />;
}
