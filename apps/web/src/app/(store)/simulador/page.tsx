import DesignSimulator from '@/components/store/DesignSimulator';

export const metadata = { title: 'Simulador de diseño — Relevé' };

export default function SimuladorPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold text-gray-900">Simulador de diseño</h1>
        <p className="text-gray-500 mt-1">Sube tu diseño y mira cómo quedaría. ✨</p>
      </div>
      <DesignSimulator />
    </div>
  );
}
