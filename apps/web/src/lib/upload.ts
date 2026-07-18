// Sube el diseño del cliente a un lugar PERMANENTE (Cloudinary) para que le
// llegue al negocio y no se pierda. Si Cloudinary no está configurado, cae al
// endpoint del servidor (almacenamiento temporal de Render).
//
// Config (variables públicas, NO son secretas):
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  -> nombre de tu "cloud" en Cloudinary
//   NEXT_PUBLIC_CLOUDINARY_PRESET      -> un "upload preset" tipo Unsigned

export interface UploadedDesign {
  url: string;
  name: string;
  mime: string;
}

// Cuenta Cloudinary de Relevé (valores públicos, no secretos).
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'cfftkxvz';
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? 'releve_designs';

export function cloudinaryEnabled(): boolean {
  return !!CLOUD && !!PRESET;
}

export async function uploadDesignFile(file: File): Promise<UploadedDesign> {
  // 1) Cloudinary (permanente)
  if (CLOUD && PRESET) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`, {
      method: 'POST',
      body: fd,
    });
    if (res.ok) {
      const d = await res.json();
      return { url: d.secure_url as string, name: file.name, mime: file.type };
    }
    // si falla, seguimos al respaldo del servidor
  }

  // 2) Respaldo: endpoint del servidor (temporal)
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/shop/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message ?? 'No se pudo subir el archivo');
  }
  const d = await res.json();
  return { url: d.url as string, name: d.fileName as string, mime: d.mimeType as string };
}
