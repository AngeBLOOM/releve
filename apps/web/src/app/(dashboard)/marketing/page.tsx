import SocialMarketing from '@/components/marketing/SocialMarketing';
export const metadata = { title: 'Marketing — Relevé' };

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Marketing y publicaciones</h1>
        <p className="text-sm text-gray-500">Programa anuncios automáticos en Facebook e Instagram desde tu catálogo.</p>
      </div>
      <SocialMarketing />
    </div>
  );
}
