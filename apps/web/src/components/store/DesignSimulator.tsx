'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Upload, RotateCcw } from 'lucide-react';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '';

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

export default function DesignSimulator() {
  const [garment, setGarment] = useState<Garment>('SHIRT');
  const [color, setColor] = useState('#ffffff');
  const [design, setDesign] = useState<string | null>(null);
  const [size, setSize] = useState(38); // % del área de estampado
  const [posX, setPosX] = useState(50); // %
  const [posY, setPosY] = useState(42); // %
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => setDesign(reader.result as string);
    reader.readAsDataURL(f);
  }

  function reset() { setSize(38); setPosX(50); setPosY(garment === 'SHIRT' ? 42 : 50); }

  // Área de estampado (en %) según prenda
  const printArea = garment === 'SHIRT'
    ? { left: 33, top: 30, width: 34, height: 42 }
    : { left: 30, top: 28, width: 40, height: 40 };

  const stroke = color === '#ffffff' ? '#d1d5db' : 'rgba(0,0,0,0.15)';

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Vista previa */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="relative w-full aspect-square select-none">
          <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
            {garment === 'SHIRT' ? (
              <path
                d="M105 28 L70 45 L36 80 L66 116 L92 100 L92 276 L208 276 L208 100 L234 116 L264 80 L230 45 L195 28 Q150 60 105 28 Z"
                fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round"
              />
            ) : (
              <g>
                <rect x="70" y="80" width="130" height="150" rx="16" fill={color} stroke={stroke} strokeWidth="2" />
                <path d="M200 110 q55 0 55 45 t-55 45" fill="none" stroke={stroke} strokeWidth="10" />
              </g>
            )}
          </svg>

          {/* Área de estampado + diseño */}
          <div
            className="absolute"
            style={{ left: `${printArea.left}%`, top: `${printArea.top}%`, width: `${printArea.width}%`, height: `${printArea.height}%`, overflow: 'hidden' }}
          >
            {design ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={design}
                alt="diseño"
                style={{ position: 'absolute', width: `${size}%`, left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)' }}
                className="pointer-events-none"
              />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-gray-300/70 rounded flex items-center justify-center">
                <span className="text-[10px] text-gray-400 text-center px-1">Tu diseño aquí</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="space-y-5">
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

        {/* Color */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Color del producto</label>
          <div className="flex flex-wrap gap-2">
            {GARMENT_COLORS.map((cl) => (
              <button key={cl.hex} onClick={() => setColor(cl.hex)} title={cl.name}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${color === cl.hex ? 'border-teal-600 scale-110' : 'border-gray-200'}`}
                style={{ backgroundColor: cl.hex }} />
            ))}
          </div>
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
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('¡Hola Relevé! 💜 Acabo de probar un diseño en el simulador y quiero pedirlo. Te envío mi diseño.')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Pedir este diseño por WhatsApp
            </a>
          )}
          <Link href="/tienda" className="text-center text-teal-600 text-sm font-medium hover:underline">Ver productos de la tienda →</Link>
        </div>
      </div>
    </div>
  );
}
