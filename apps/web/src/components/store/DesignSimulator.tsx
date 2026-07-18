'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, RotateCcw } from 'lucide-react';
import { uploadDesignFile } from '@/lib/upload';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '584120846332';

type Garment = 'SHIRT' | 'MUG';

const GARMENT_COLORS = [
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Negro', hex: '#1f2937' },
  { name: 'Gris', hex: '#9ca3af' },
  { name: 'Celeste', hex: '#a5d8e6' },
  { name: 'Rosado', hex: '#f4b8c4' },
  { name: 'Amarillo', hex: '#f6e08b' },
  { name: 'Turquesa', hex: '#5ec5b6' },
];

// Aclara/oscurece un color hex un porcentaje (para sombras y luces 3D)
function shade(hex: string, percent: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function isLightHex(hex: string): boolean {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff) > 150;
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs font-medium text-gray-600">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {GARMENT_COLORS.map((cl) => (
          <button key={cl.hex} onClick={() => onChange(cl.hex)} title={cl.name}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${value === cl.hex ? 'border-teal-600 scale-110' : 'border-gray-200'}`}
            style={{ backgroundColor: cl.hex }} />
        ))}
      </div>
    </div>
  );
}

export default function DesignSimulator() {
  const [garment, setGarment] = useState<Garment>('SHIRT');
  const [color, setColor] = useState('#ffffff'); // cuerpo
  const [sleeveColor, setSleeveColor] = useState('#ffffff'); // mangas
  const [collarColor, setCollarColor] = useState('#ffffff'); // cuello
  const [cuffColor, setCuffColor] = useState('#ffffff'); // borde de manga
  const [design, setDesign] = useState<string | null>(null);
  const [designUrl, setDesignUrl] = useState<string | null>(null); // URL permanente para que le llegue al negocio
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [size, setSize] = useState(38); // % del área de estampado
  const [posX, setPosX] = useState(50); // %
  const [posY, setPosY] = useState(42); // %
  const fileRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: 'move' | 'resize'; sx: number; sy: number; px: number; py: number; ps: number } | null>(null);

  function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => setDesign(reader.result as string);
    reader.readAsDataURL(f);
    // Subir a un lugar permanente para poder enviárselo al negocio por WhatsApp
    setUploadingDesign(true);
    setDesignUrl(null);
    uploadDesignFile(f)
      .then((d) => setDesignUrl(d.url))
      .catch(() => {})
      .finally(() => setUploadingDesign(false));
  }

  // Avisar al panel de la administradora (aunque no completen el pedido en WhatsApp)
  const [sentToPanel, setSentToPanel] = useState(false);
  function sendToPanel() {
    if (!designUrl || sentToPanel) return;
    setSentToPanel(true);
    const label: Record<string, string> = { SHIRT: 'Franela', LONGSLEEVE: 'Franela manga larga', MUG: 'Taza' };
    fetch('/api/design-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'simulador',
        designUrl,
        garment: label[garment] ?? garment,
        colors: `Cuerpo ${color}, mangas ${sleeveColor}, cuello ${collarColor}`,
      }),
    }).catch(() => {});
  }

  // Arrastrar para mover / esquina para redimensionar
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = drag.current;
      const rect = printRef.current?.getBoundingClientRect();
      if (!d || !rect) return;
      const dx = ((e.clientX - d.sx) / rect.width) * 100;
      const dy = ((e.clientY - d.sy) / rect.height) * 100;
      if (d.mode === 'move') {
        setPosX(Math.max(0, Math.min(100, d.px + dx)));
        setPosY(Math.max(0, Math.min(100, d.py + dy)));
      } else {
        setSize(Math.max(8, Math.min(150, d.ps + dx * 1.8)));
      }
    }
    function onUp() { drag.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, []);

  function startMove(e: React.PointerEvent) { e.preventDefault(); drag.current = { mode: 'move', sx: e.clientX, sy: e.clientY, px: posX, py: posY, ps: size }; }
  function startResize(e: React.PointerEvent) { e.preventDefault(); e.stopPropagation(); drag.current = { mode: 'resize', sx: e.clientX, sy: e.clientY, px: posX, py: posY, ps: size }; }

  function reset() { setSize(38); setPosX(50); setPosY(garment === 'SHIRT' ? 42 : 50); }

  // Área de estampado (en %) según prenda
  const printArea = garment === 'SHIRT'
    ? { left: 37, top: 35, width: 26, height: 32 }
    : { left: 30, top: 28, width: 40, height: 40 };

  const isLight = isLightHex(color);
  // Silueta de franela limpia y simétrica (viewBox 300x300, eje x=150)
  const shirtOutline = 'M128 80 L100 84 L60 102 Q56 122 72 140 Q86 134 96 126 L92 240 Q150 250 208 240 L204 126 Q214 134 228 140 Q244 122 240 102 L200 84 L172 80 Q150 96 128 80 Z';
  const shirtBody = 'M128 80 L100 84 L96 126 L92 240 Q150 250 208 240 L204 126 L200 84 L172 80 Q150 96 128 80 Z';
  const lSleeve = 'M100 84 L60 102 Q56 122 72 140 Q86 134 96 126 Z';
  const rSleeve = 'M200 84 L240 102 Q244 122 228 140 Q214 134 204 126 Z';
  const lCuff = 'M60 102 Q56 122 72 140';
  const rCuff = 'M240 102 Q244 122 228 140';
  const collarPath = 'M128 82 Q150 98 172 82';

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Vista previa 3D */}
      <div className="rounded-2xl border border-gray-200 p-4 overflow-hidden"
        style={{ background: 'radial-gradient(circle at 50% 30%, #f8fafc 0%, #e5e7eb 55%, #cbd5e1 100%)' }}>
        <div className="relative w-full aspect-square select-none">
          <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
            <defs>
              <clipPath id="shirtClip"><path d={shirtBody} /></clipPath>
              <radialGradient id="bodyVol" cx="50%" cy="30%" r="72%">
                <stop offset="0%" stopColor={shade(color, isLight ? 6 : 24)} />
                <stop offset="58%" stopColor={color} />
                <stop offset="100%" stopColor={shade(color, -16)} />
              </radialGradient>
              <linearGradient id="sideL" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(0,0,0,0.16)" />
                <stop offset="30%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
              <linearGradient id="sideR" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(0,0,0,0.16)" />
                <stop offset="30%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
              <radialGradient id="chestHi" cx="50%" cy="40%" r="42%">
                <stop offset="0%" stopColor={`rgba(255,255,255,${isLight ? 0.4 : 0.16})`} />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
              <radialGradient id="sleeveVol" cx="45%" cy="30%" r="85%">
                <stop offset="0%" stopColor={shade(sleeveColor, isLightHex(sleeveColor) ? 6 : 22)} />
                <stop offset="60%" stopColor={sleeveColor} />
                <stop offset="100%" stopColor={shade(sleeveColor, -18)} />
              </radialGradient>
              <linearGradient id="mugVol" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={shade(color, -22)} />
                <stop offset="22%" stopColor={shade(color, isLight ? 6 : 22)} />
                <stop offset="55%" stopColor={color} />
                <stop offset="100%" stopColor={shade(color, -26)} />
              </linearGradient>
              <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
              <filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.20" />
              </filter>
              <clipPath id="lsClip"><path d={lSleeve} /></clipPath>
              <clipPath id="rsClip"><path d={rSleeve} /></clipPath>
            </defs>

            {garment === 'SHIRT' ? (
              <g>
                {/* base + sombra proyectada de toda la silueta */}
                <path d={shirtOutline} fill={color} filter="url(#drop)" />
                {/* MANGAS (color propio) con volumen */}
                <path d={lSleeve} fill="url(#sleeveVol)" />
                <path d={rSleeve} fill="url(#sleeveVol)" />
                {/* sombra del pliegue del hombro sobre la manga */}
                <g clipPath="url(#lsClip)"><path d="M96 122 Q80 128 66 140" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="6" filter="url(#soft)" /></g>
                <g clipPath="url(#rsClip)"><path d="M204 122 Q220 128 234 140" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="6" filter="url(#soft)" /></g>
                {/* CUERPO con volumen suave */}
                <path d={shirtBody} fill="url(#bodyVol)" />
                <g clipPath="url(#shirtClip)">
                  {/* redondez suave a los lados */}
                  <rect x="0" y="0" width="300" height="300" fill="url(#sideL)" />
                  <rect x="0" y="0" width="300" height="300" fill="url(#sideR)" />
                  {/* luz de pecho */}
                  <rect x="0" y="0" width="300" height="300" fill="url(#chestHi)" />
                  {/* pliegues suaves verticales */}
                  <path d="M104 90 Q100 130 100 240" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" filter="url(#soft)" />
                  <path d="M196 90 Q200 130 200 240" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" filter="url(#soft)" />
                  {/* sombra sutil del dobladillo */}
                  <path d="M96 234 Q150 244 204 234" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="7" filter="url(#soft)" />
                </g>
                {/* costura del hombro sutil */}
                <path d="M100 84 Q120 92 128 80" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                <path d="M200 84 Q180 92 172 80" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                {/* BORDE / PUÑO de manga (color propio) */}
                <path d={lCuff} fill="none" stroke={cuffColor} strokeWidth="4" strokeLinecap="round" />
                <path d={rCuff} fill="none" stroke={cuffColor} strokeWidth="4" strokeLinecap="round" />
                <path d={lCuff} fill="none" stroke={shade(cuffColor, -18)} strokeWidth="1" strokeLinecap="round" />
                <path d={rCuff} fill="none" stroke={shade(cuffColor, -18)} strokeWidth="1" strokeLinecap="round" />
                {/* CUELLO redondo tipo ribete (color propio) */}
                <path d={collarPath} fill="none" stroke={shade(collarColor, -18)} strokeWidth="7" strokeLinecap="round" opacity="0.5" transform="translate(0,1.6)" />
                <path d={collarPath} fill="none" stroke={collarColor} strokeWidth="6.5" strokeLinecap="round" />
                <path d={collarPath} fill="none" stroke={shade(collarColor, isLightHex(collarColor) ? 12 : 30)} strokeWidth="2" strokeLinecap="round" opacity="0.8" transform="translate(0,-1)" />
                {/* contorno limpio */}
                <path d={shirtOutline} fill="none" stroke={color === '#ffffff' ? '#c4cbd4' : 'rgba(0,0,0,0.16)'} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ) : (
              <g filter="url(#drop)">
                <ellipse cx="150" cy="82" rx="66" ry="14" fill={shade(color, -28)} />
                <path d="M84 82 L84 226 Q84 240 100 240 L200 240 Q216 240 216 226 L216 82 Z" fill="url(#mugVol)" />
                <ellipse cx="150" cy="82" rx="66" ry="13" fill={shade(color, 14)} />
                <ellipse cx="150" cy="82" rx="52" ry="9" fill={shade(color, -30)} opacity="0.6" />
                {/* asa */}
                <path d="M216 112 q46 6 46 46 t-46 44" fill="none" stroke={shade(color, -8)} strokeWidth="13" strokeLinecap="round" />
                {/* brillo */}
                <rect x="104" y="92" width="10" height="132" rx="5" fill="rgba(255,255,255,0.22)" filter="url(#soft)" />
              </g>
            )}
          </svg>

          {/* Área de estampado: arrastra para mover, esquina para agrandar */}
          <div
            ref={printRef}
            className="absolute"
            style={{ left: `${printArea.left}%`, top: `${printArea.top}%`, width: `${printArea.width}%`, height: `${printArea.height}%` }}
          >
            {design ? (
              <div
                style={{ position: 'absolute', width: `${size}%`, left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={design}
                  alt="diseño"
                  draggable={false}
                  onPointerDown={startMove}
                  style={{
                    width: '100%', display: 'block', cursor: 'move',
                    mixBlendMode: isLight ? 'multiply' : 'normal',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.22))',
                  }}
                />
                {/* borde de selección */}
                <div className="absolute inset-0 border border-dashed border-teal-500/80 pointer-events-none rounded-sm" />
                {/* esquina para redimensionar */}
                <div
                  onPointerDown={startResize}
                  title="Arrastra para agrandar/achicar"
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-teal-600 border-2 border-white rounded-full shadow cursor-nwse-resize"
                  style={{ touchAction: 'none' }}
                />
              </div>
            ) : (
              <div className="w-full h-full border-2 border-dashed border-gray-400/50 rounded flex items-center justify-center">
                <span className="text-[10px] text-gray-500 text-center px-1">Sube tu diseño 👇</span>
              </div>
            )}
          </div>
        </div>
        {design && (
          <p className="mt-2 text-center text-[11px] text-gray-500">✋ Arrastra el diseño para moverlo · tira de la esquina 🟢 para agrandarlo</p>
        )}
      </div>

      {/* Controles */}
      <div className="space-y-5 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm self-start">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Producto</label>
          <div className="flex gap-2">
            {([['SHIRT', '👕 Franela'], ['MUG', '☕ Taza']] as const).map(([g, label]) => (
              <button key={g} onClick={() => { setGarment(g); setPosY(g === 'SHIRT' ? 42 : 50); }}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${garment === g ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Colores por parte */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-gray-700">Colores</label>
          {garment === 'MUG' ? (
            <ColorRow label="Color de la taza" value={color} onChange={setColor} />
          ) : (
            <>
              <ColorRow label="Cuerpo" value={color} onChange={setColor} />
              <ColorRow label="Mangas" value={sleeveColor} onChange={setSleeveColor} />
              <ColorRow label="Cuello" value={collarColor} onChange={setCollarColor} />
              <ColorRow label="Borde de manga" value={cuffColor} onChange={setCuffColor} />
            </>
          )}
        </div>

        {/* Subir diseño */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tu diseño</label>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 cursor-pointer hover:border-teal-300 hover:text-teal-600 transition-colors">
            <Upload size={15} /> {design ? 'Cambiar diseño' : 'Subir imagen (PNG, JPG)'}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </label>
          <p className="text-xs text-gray-400 mt-1">Consejo: PNG con fondo transparente se ve mejor.</p>
        </div>

        {/* Ajustes (solo con diseño) */}
        {design && (
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño</label>
              <input type="range" min={10} max={100} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-teal-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Posición horizontal</label>
              <input type="range" min={0} max={100} value={posX} onChange={(e) => setPosX(Number(e.target.value))} className="w-full accent-teal-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Posición vertical</label>
              <input type="range" min={0} max={100} value={posY} onChange={(e) => setPosY(Number(e.target.value))} className="w-full accent-teal-600" />
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600">
              <RotateCcw size={13} /> Reiniciar posición
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400">
          * Esta es una vista aproximada para que te hagas una idea. El resultado final lo confirmamos contigo antes de producir. 💜
        </p>

        <div className="flex flex-col gap-2">
          {WHATSAPP && (
            <a
              onClick={sendToPanel}
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                '¡Hola Relevé! 💜 Acabo de probar un diseño en el simulador y quiero pedirlo.' +
                (designUrl ? `\n\n🎨 Mi diseño: ${designUrl}` : ' Te envío mi diseño.')
              )}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {uploadingDesign ? 'Preparando tu diseño…' : 'Pedir este diseño por WhatsApp'}
            </a>
          )}
          {design && !designUrl && !uploadingDesign && (
            <p className="text-[11px] text-amber-600 text-center">Si al pedir no se adjunta el diseño, envíanoslo tú en el chat 💜</p>
          )}
          <Link href="/tienda" className="text-center text-teal-600 text-sm font-medium hover:underline">Ver productos de la tienda →</Link>
        </div>
      </div>
    </div>
  );
}
