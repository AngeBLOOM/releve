'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelStatus { channel: string; connected: boolean; accountName?: string; phoneNumber?: string; webhookActive: boolean; lastMessageAt?: string; messageCount24h: number; }
const CFG: Record<string, { label: string; emoji: string; color: string; btnColor: string; docsUrl: string; gradient: string }> = {
  WHATSAPP:  { label: 'WhatsApp Business', emoji: '📱', color: 'border-green-200 bg-green-50',  btnColor: 'bg-green-600 hover:bg-green-700', docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api', gradient: 'from-green-400 to-green-600' },
  INSTAGRAM: { label: 'Instagram Direct',  emoji: '📸', color: 'border-pink-200 bg-pink-50',    btnColor: 'bg-pink-600 hover:bg-pink-700',   docsUrl: 'https://developers.facebook.com/docs/messenger-platform/instagram', gradient: 'from-cyan-400 to-pink-500' },
  MESSENGER: { label: 'Facebook Messenger',emoji: '💬', color: 'border-blue-200 bg-blue-50',    btnColor: 'bg-blue-600 hover:bg-blue-700',   docsUrl: 'https://developers.facebook.com/docs/messenger-platform', gradient: 'from-blue-400 to-blue-600' },
};

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<ChannelStatus[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadStatuses(); fetch('/api/integrations/bot-config').then(r => r.json()).then(setBotConfig).catch(() => {}); }, []);

  async function loadStatuses() { setLoading(true); try { const res = await fetch('/api/integrations/status'); setStatuses(await res.json()); } catch {} finally { setLoading(false); } }

  async function testConnection(channel: string) { setTesting(channel); await fetch(`/api/integrations/${channel.toLowerCase()}/test`, { method: 'POST' }).catch(() => {}); await loadStatuses(); setTesting(null); }

  async function toggleWebhook(channel: string, active: boolean) { await fetch(`/api/integrations/${channel.toLowerCase()}/webhook`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) }).catch(() => {}); loadStatuses(); }

  async function saveBotConfig() { await fetch('/api/integrations/bot-config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botConfig) }); setSaved(true); setTimeout(() => setSaved(false), 2000); }

  if (loading) return <p className="text-gray-400 text-sm">Verificando conexiones...</p>;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Cómo conectar cada canal</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
            <li>Ve a <strong>Meta for Developers</strong> y crea una app de tipo <em>Business</em>.</li>
            <li>Obtén los tokens de acceso para WhatsApp, Instagram y Messenger.</li>
            <li>Agrébalos en el archivo <code className="bg-blue-100 px-1 rounded">.env</code> de la API y reinicia.</li>
            <li>Haz clic en <strong>Verificar conexión</strong> para confirmar.</li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.keys(CFG).map(ch => {
          const cfg = CFG[ch];
          const status = statuses.find(s => s.channel === ch);
          return (
            <div key={ch} className={cn('rounded-xl border-2 p-5 space-y-4 transition-colors', status?.connected ? cfg.color : 'border-gray-200 bg-gray-50')}>
              <div className="flex items-start justify-between">
                <div><div className="text-2xl mb-1">{cfg.emoji}</div><h3 className="font-semibold text-gray-900 text-sm">{cfg.label}</h3></div>
                <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', status?.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                  {status?.connected ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {status?.connected ? 'Conectado' : 'Sin conectar'}
                </span>
              </div>
              {status?.connected && (
                <div className="space-y-1 text-xs text-gray-600">
                  {status.accountName && <p><span className="text-gray-400">Cuenta:</span> {status.accountName}</p>}
                  {status.phoneNumber && <p><span className="text-gray-400">Número:</span> {status.phoneNumber}</p>}
                  <p><span className="text-gray-400">Webhook:</span> <span className={status.webhookActive ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{status.webhookActive ? '● Activo' : '○ Inactivo'}</span></p>
                  <p className="text-gray-400">{status.messageCount24h} mensajes en 24h</p>
                </div>
              )}
              <div className="space-y-2">
                <button onClick={() => testConnection(ch)} disabled={testing === ch} className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50">
                  <RefreshCw size={13} className={testing === ch ? 'animate-spin' : ''} />{testing === ch ? 'Verificando...' : 'Verificar conexión'}
                </button>
                {status?.connected && (
                  <button onClick={() => toggleWebhook(ch, !status.webhookActive)} className={cn('w-full text-xs font-medium py-2 rounded-lg text-white transition-colors', status.webhookActive ? 'bg-gray-500 hover:bg-gray-600' : cfg.btnColor)}>
                    {status.webhookActive ? 'Pausar webhook' : 'Activar webhook'}
                  </button>
                )}
                <a href={cfg.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  <ExternalLink size={11} /> Ver documentación
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {botConfig && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Configuración del Bot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><p className="text-sm font-medium text-gray-800">Bot activo</p><p className="text-xs text-gray-500">Responde automáticamente</p></div>
              <button onClick={() => setBotConfig((c: any) => ({ ...c, botEnabled: !c.botEnabled }))} className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', botConfig.botEnabled ? 'bg-teal-600' : 'bg-gray-300')}>
                <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', botConfig.botEnabled ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><p className="text-sm font-medium text-gray-800">Transferencia automática</p><p className="text-xs text-gray-500">3 intentos fallidos → agente</p></div>
              <button onClick={() => setBotConfig((c: any) => ({ ...c, autoHumanTransfer: !c.autoHumanTransfer }))} className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', botConfig.autoHumanTransfer ? 'bg-teal-600' : 'bg-gray-300')}>
                <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', botConfig.autoHumanTransfer ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Horario de atención</label>
              <div className="flex items-center gap-2">
                <input type="time" value={botConfig.workHoursStart} onChange={e => setBotConfig((c: any) => ({ ...c, workHoursStart: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <span className="text-gray-400 text-sm">a</span>
                <input type="time" value={botConfig.workHoursEnd} onChange={e => setBotConfig((c: any) => ({ ...c, workHoursEnd: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Mensaje de bienvenida</label><textarea rows={2} value={botConfig.welcomeMessage} onChange={e => setBotConfig((c: any) => ({ ...c, welcomeMessage: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Mensaje fuera de horario</label><textarea rows={2} value={botConfig.offHoursMessage} onChange={e => setBotConfig((c: any) => ({ ...c, offHoursMessage: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" /></div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveBotConfig} className={cn('px-6 py-2 text-sm font-medium rounded-lg transition-all', saved ? 'bg-green-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white')}>{saved ? '✓ Guardado' : 'Guardar configuración'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
