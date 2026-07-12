import IntegrationsPage from '@/components/integrations/IntegrationsPage';
export const metadata = { title: 'Integraciones — Relevé' };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Integraciones</h1>
        <p className="text-sm text-gray-500 mt-1">Conecta tus cuentas de redes sociales para recibir mensajes en la bandeja unificada.</p>
      </div>
      <IntegrationsPage />
    </div>
  );
}
