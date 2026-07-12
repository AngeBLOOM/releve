'use client';
import { useEffect, useState } from 'react';
import { Megaphone, Send, Trash2, Sparkles, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

type Platform = 'FACEBOOK' | 'INSTAGRAM';
interface AutopilotConfig {
  enabled: boolean;
  postsPerDay: number;
  postsPerHour: number;
  platforms: Platform[];
  hourStart: number;
  hourEnd: number;
  captionTemplates: string[];
}
interface StatusResp {
  config: AutopilotConfig;
  readiness: Record<Platform, boolean>;
  lastRun: string | null;
}
interface Post {
  id: string;
  platform: Platform;
  status: string;
  caption: string;
  imageUrl: string | null;
  linkUrl: string | null;
  origin: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  error: string | null;
  createdAt: string;
}
interface Product { id: string; name: string }

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  DRAFT: { label: 'Borrador', cls: 'bg-gray-100 text-gray-600', icon: Clock },
  SCHEDULED: { label: 'Programado', cls: 'bg-blue-50 text-blue-600', icon: Clock },
  PUBLISHING: { label: 'Publicando…', cls: 'bg-amber-50 text-amber-600', icon: Loader2 },
  PUBLISHED: { label: 'Publicado', cls: 'bg-green-50 text-green-600', icon: CheckCircle2 },
  FAILED: { label: 'Falló', cls: 'bg-red-50 text-red-600', icon: AlertTriangle },
};
const PLATFORM_LABEL: Record<Platform, string> = { FACEBOOK: '📘 Facebook', INSTAGRAM: '📸 Instagram' };

export default function SocialMarketing() {
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  // Composer
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['FACEBOOK', 'INSTAGRAM']);
  const [scheduledFor, setScheduledFor] = useState('');
  const [posting, setPosting] = useState(false);

  async function loadStatus() {
    const r = await fetch('/api/social/status');
    if (r.ok) setStatus(await r.json());
  }
  async function loadPosts() {
    const r = await fetch('/api/social/posts');
    if (r.ok) setPosts(await r.json());
  }
  useEffect(() => {
    loadStatus();
    loadPosts();
    fetch('/api/catalog/products').then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : []));
    const t = setInterval(loadPosts, 8000); // refresca estados
    return () => clearInterval(t);
  }, []);

  async function saveAutopilot(patch: Partial<AutopilotConfig>) {
    if (!status) return;
    setSaving(true);
    const next = { ...status.config, ...patch };
    const r = await fetch('/api/social/autopilot', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (r.ok) setStatus({ ...status, config: await r.json() });
    setSaving(false);
  }

  function togglePlatform(list: Platform[], p: Platform, set: (v: Platform[]) => void) {
    set(list.includes(p) ? list.filter((x) => x !== p) : [...list, p]);
  }

  async function generateFromProduct(productId: string) {
    if (!productId) return;
    const r = await fetch(`/api/social/generate/${productId}`, { method: 'POST' });
    if (r.ok) {
      const promo = await r.json();
      setCaption(promo.caption);
      setImageUrl(promo.imageUrl ?? '');
      setLinkUrl(promo.linkUrl ?? '');
    }
  }

  async function submitPost() {
    if (!caption.trim() || !platforms.length) return;
    setPosting(true);
    await fetch('/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, imageUrl, linkUrl, platforms, scheduledFor: scheduledFor || undefined }),
    });
    setCaption(''); setImageUrl(''); setLinkUrl(''); setScheduledFor('');
    setPosting(false);
    loadPosts();
  }

  async function publishNow(id: string) { await fetch(`/api/social/posts/${id}/publish`, { method: 'POST' }); loadPosts(); }
  async function removePost(id: string) { if (!confirm('¿Eliminar esta publicación?')) return; await fetch(`/api/social/posts/${id}`, { method: 'DELETE' }); loadPosts(); }

  if (!status) return <p className="text-gray-400 text-sm">Cargando…</p>;
  const c = status.config;
  const noTokens = !status.readiness.FACEBOOK && !status.readiness.INSTAGRAM;

  return (
    <div className="space-y-6">
      {noTokens && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Aún no hay tokens de Meta configurados.</p>
            <p>Puedes crear y programar publicaciones; se publicarán automáticamente en cuanto agregues los tokens de Página en <code>apps/api/.env</code> (Facebook e Instagram).</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Piloto automático */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-teal-600" />
            <h2 className="font-semibold text-gray-900">Piloto automático</h2>
          </div>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Publicar automáticamente</span>
            <button
              onClick={() => saveAutopilot({ enabled: !c.enabled })}
              disabled={saving}
              className={`relative w-11 h-6 rounded-full transition-colors ${c.enabled ? 'bg-teal-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${c.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </label>

          {/* Botón rápido: 3 publicaciones al día */}
          <button
            onClick={() => saveAutopilot({ postsPerDay: 3, enabled: true })}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold py-2 rounded-lg border border-teal-200 transition-colors"
          >
            <Megaphone size={15} /> Activar 3 publicaciones al día
          </button>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Publicaciones por día: <b>{c.postsPerDay ?? 3}</b></label>
            <input type="range" min={1} max={12} value={c.postsPerDay ?? 3} onChange={(e) => saveAutopilot({ postsPerDay: Number(e.target.value) })} className="w-full accent-teal-600" />
            <p className="text-xs text-gray-400">Se reparten dentro del horario activo (mínimo recomendado: 3).</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio</label>
              <input type="number" min={0} max={23} value={c.hourStart} onChange={(e) => saveAutopilot({ hourStart: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin</label>
              <input type="number" min={0} max={23} value={c.hourEnd} onChange={(e) => saveAutopilot({ hourEnd: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-gray-600 mb-1">Plataformas</span>
            <div className="flex gap-2">
              {(['FACEBOOK', 'INSTAGRAM'] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => saveAutopilot({ platforms: c.platforms.includes(p) ? c.platforms.filter((x) => x !== p) : [...c.platforms, p] })}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${c.platforms.includes(p) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  {PLATFORM_LABEL[p]} {status.readiness[p] ? '✅' : '⚠️'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">⚠️ = falta token; ✅ = lista para publicar.</p>
          </div>
        </div>

        {/* Composer */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Nueva publicación</h2>
            <select onChange={(e) => generateFromProduct(e.target.value)} defaultValue="" className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-teal-700">
              <option value="" disabled>✨ Generar desde producto…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <textarea rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Escribe el texto del anuncio… o genéralo desde un producto." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL de la imagen (requerida para Instagram)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Enlace (opcional, ej. a tu tienda)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <div className="flex flex-wrap items-center gap-2">
            {(['FACEBOOK', 'INSTAGRAM'] as Platform[]).map((p) => (
              <button key={p} onClick={() => togglePlatform(platforms, p, setPlatforms)} className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${platforms.includes(p) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <button onClick={submitPost} disabled={posting || !caption.trim() || !platforms.length} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {posting ? <Loader2 size={15} className="animate-spin" /> : scheduledFor ? <Clock size={15} /> : <Send size={15} />}
              {scheduledFor ? 'Programar' : 'Publicar'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Sin fecha = publica ahora. Con fecha = se programa.</p>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Sparkles size={16} className="text-teal-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Publicaciones</h2>
        </div>
        {posts.length === 0 ? (
          <p className="text-gray-400 text-sm p-5">Todavía no hay publicaciones.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => {
              const badge = STATUS_BADGE[post.status] ?? STATUS_BADGE.DRAFT;
              const Icon = badge.icon;
              return (
                <div key={post.id} className="flex items-start gap-3 p-4">
                  <div className="w-12 h-12 shrink-0 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center overflow-hidden">
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{post.platform === 'INSTAGRAM' ? '📸' : '📘'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-500">{PLATFORM_LABEL[post.platform]}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${badge.cls}`}>
                        <Icon size={11} className={post.status === 'PUBLISHING' ? 'animate-spin' : ''} /> {badge.label}
                      </span>
                      {post.origin === 'AUTOPILOT' && <span className="text-[11px] text-teal-500">🤖 Auto</span>}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2 whitespace-pre-wrap">{post.caption}</p>
                    {post.error && <p className="text-xs text-red-500 mt-1">{post.error}</p>}
                    {post.scheduledFor && post.status === 'SCHEDULED' && (
                      <p className="text-xs text-blue-500 mt-1">Programado: {new Date(post.scheduledFor).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING' && (
                      <button onClick={() => publishNow(post.id)} title="Publicar ahora" className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Send size={14} /></button>
                    )}
                    <button onClick={() => removePost(post.id)} title="Eliminar" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
