'use client';
import { useState } from 'react';

interface Props {
  /** tamaño en px del recuadro */
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Logo de Relevé. Carga /logo.png sobre un fondo turquesa
 * (para que un PNG transparente con el logo blanco se vea bien).
 * Si el archivo aún no existe, muestra la "R" como respaldo.
 */
export default function BrandLogo({ size = 36, className = '', rounded = 'rounded-xl' }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold ${rounded} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      <span>R</span>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="Relevé"
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
