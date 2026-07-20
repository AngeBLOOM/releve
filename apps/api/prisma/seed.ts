import { PrismaClient, SublimationType, ProductCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Catálogo Relevé — reconstruido a partir de las imágenes del proyecto y los
// precios indicados por la dueña. Los precios marcados con (REVISAR) son
// estimados razonables; se pueden ajustar desde el panel de administración.
//
// Modelo de precio en la tienda:  precio = regla(unitPrice por sublimado/cantidad)
//                                          + recargo de la variante (priceModifier)
// Recargos de franela:  tallas hasta L = 0, XL = +1, XXL = +2
//                       colores claros = 0, colores oscuros/negro = +3
// ---------------------------------------------------------------------------

type VariantSeed = {
  sku: string;
  label: string;
  size?: string;
  color?: string;
  costPrice: number;
  priceModifier?: number;
};

const SIZES: Array<{ size: string; mod: number }> = [
  { size: 'S', mod: 0 },
  { size: 'M', mod: 0 },
  { size: 'L', mod: 0 },
  { size: 'XL', mod: 1 },
  { size: 'XXL', mod: 2 },
];

const LIGHT_COLORS = ['Blanco', 'Celeste', 'Rosado', 'Amarillo', 'Gris'];
const DARK_COLORS = ['Negro', 'Azul Oscuro', 'Rojo Vino'];

// Genera variantes de franela por talla y color (recargo talla + recargo color)
function shirtVariants(prefix: string, opts?: { colors?: boolean; costPrice?: number }): VariantSeed[] {
  const cost = opts?.costPrice ?? 4.5;
  const colors = opts?.colors
    ? [...LIGHT_COLORS.map((c) => ({ color: c, mod: 0 })), ...DARK_COLORS.map((c) => ({ color: c, mod: 4 }))]
    : [{ color: 'Blanco', mod: 0 }];
  const out: VariantSeed[] = [];
  for (const c of colors) {
    for (const s of SIZES) {
      out.push({
        sku: `${prefix}-${s.size}-${c.color.slice(0, 3).toUpperCase()}`,
        label: `Talla ${s.size} · ${c.color}`,
        size: s.size,
        color: c.color,
        costPrice: cost,
        priceModifier: s.mod + c.mod,
      });
    }
  }
  return out;
}

type ProductSeed = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  imageUrl: string;
  variants: VariantSeed[];
  pricing: Array<{ type: SublimationType; min: number; max: number | null; price: number }>;
};

// Franelas de diseño listo (frente y espalda tamaño carta) — $7 colores claros
const designShirts: ProductSeed[] = Array.from({ length: 13 }, (_, i) => {
  const n = i + 1;
  return {
    id: `prod-franela-dis-${n}`,
    name: `Franela Diseño ${n}`,
    category: 'SHIRT' as ProductCategory,
    description: 'Franela en microdurazno con diseño listo, sublimación frente y espalda tamaño carta.',
    imageUrl: `/products/franela-dis-${n}.png`,
    variants: shirtVariants(`FD${n}`, { colors: true }),
    pricing: [{ type: 'FULL_FRONT_BACK', min: 1, max: null, price: 7.0 }],
  };
});

const collections: ProductSeed[] = (
  [
    ['col-basica', 'Colección Básica', 'col-basica.png'],
    ['col-animales', 'Colección Animales', 'col-animales.png'],
    ['col-equipos', 'Colección Equipos', 'col-equipos.png'],
    ['col-sistema-solar', 'Colección Sistema Solar', 'col-sistema-solar.png'],
    ['col-sport', 'Colección Sport', 'col-sport.png'],
  ] as Array<[string, string, string]>
).map(([slug, name, img]) => ({
  id: `prod-${slug}`,
  name,
  category: 'SHIRT' as ProductCategory,
  description: 'Franela en microdurazno con diseño de colección, sublimación frente y espalda tamaño carta.',
  imageUrl: `/products/${img}`,
  variants: shirtVariants(slug.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6), { colors: true }),
  pricing: [{ type: 'FULL_FRONT_BACK' as SublimationType, min: 1, max: null, price: 7.0 }],
}));

const uniforms: ProductSeed[] = (
  [
    ['uni-depor-1', 'Uniforme Deportivo Sublimado 1', 'uni-depor-1.png', 25],
    ['uni-depor-2', 'Uniforme Deportivo Sublimado 2', 'uni-depor-6.png', 25],
    ['uni-depor-3', 'Uniforme Deportivo Sublimado 3', 'uni-depor-7.png', 25],
    ['uni-baile-1', 'Uniforme de Baile 1', 'uni-baile-1.png', 25],
    ['uni-baile-2', 'Uniforme de Baile 2', 'uni-baile-2.png', 25],
    ['uni-baile-3', 'Uniforme de Baile 3', 'uni-baile-3.png', 25],
    ['uni-baile-4', 'Uniforme de Baile 4', 'uni-baile-4.png', 25],
  ] as Array<[string, string, string, number]>
).map(([slug, name, img, price]) => ({
  id: `prod-${slug}`,
  name,
  category: 'SPORTSWEAR' as ProductCategory,
  description: 'Uniforme con sublimación completa. Personalizable con nombres, números y colores.',
  imageUrl: `/products/${img}`,
  variants: SIZES.map((s) => ({
    sku: `${slug.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${s.size}`,
    label: `Talla ${s.size}`,
    size: s.size,
    color: 'Full color',
    costPrice: 12,
    priceModifier: s.mod,
  })),
  pricing: [{ type: 'FULL_FRONT_BACK' as SublimationType, min: 1, max: null, price }], // (REVISAR)
}));

// Tazas con diseño listo (agregadas 2026-07-17). Blancas $5, oscuras $8.
const designMugs: ProductSeed[] = (
  [
    ['taza-suena-sin-limites', 'Taza "Sueña sin límites"', 'taza-suena-sin-limites.png', 'dark'],
    ['taza-skater', 'Taza Niño Skater', 'taza-skater.png', 'dark'],
    ['taza-mejor-version', 'Taza "Tu mejor versión"', 'taza-mejor-version.png', 'dark'],
    ['taza-asi-soy', 'Taza "No es arrechera, así soy"', 'taza-asi-soy.png', 'white'],
    ['taza-palante-paalla', "Taza \"Pa'lante es pa'allá\"", 'taza-palante-paalla.png', 'white'],
    ['taza-dios-respalda', 'Taza "Dios me respalda"', 'taza-dios-respalda.png', 'white'],
    ['taza-mas-vale-palante', "Taza \"Más vale pa'lante\"", 'taza-mas-vale-palante.png', 'white'],
  ] as Array<[string, string, string, 'dark' | 'white']>
).map(([slug, name, img, kind]) => ({
  id: `prod-${slug}`,
  name,
  category: 'MUG' as ProductCategory,
  description:
    kind === 'dark'
      ? 'Taza cerámica oscura 11oz (sublimación mágica) de alta calidad. Diseño listo.'
      : 'Taza cerámica blanca 11oz apta para sublimación de alta calidad. Diseño listo.',
  imageUrl: `/products/${img}`,
  variants: [
    {
      sku: `${slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)}-11`,
      label: kind === 'dark' ? 'Taza 11oz Oscura' : 'Taza 11oz Blanca',
      size: '11oz',
      color: kind === 'dark' ? 'Oscura' : 'Blanco',
      costPrice: kind === 'dark' ? 3.5 : 2.5,
    },
  ],
  pricing: [{ type: 'A4' as SublimationType, min: 1, max: null, price: kind === 'dark' ? 8.0 : 5.0 }],
}));

// Franela full sublimación manga corta (diseño listo, agregada 2026-07-17).
// Dama S-L $14, Dama XL $15, Caballero $16. Con 7+ franelas, $1 menos c/u.
const readyShirts: ProductSeed[] = [
  {
    id: 'prod-franela-palante',
    name: 'Franela "Pa\'lante" Full Sublimación',
    category: 'SHIRT',
    description:
      'Franela full sublimación manga corta 100% poliéster con diseño "¡Pa\'lante es pa\'allá!". Damas y caballeros. Con 6+ franelas, $1 menos cada una.',
    imageUrl: '/products/franela-palante.png',
    variants: [
      { sku: 'FPAL-D-S', label: 'Dama S', size: 'S', color: 'Dama', costPrice: 6 },
      { sku: 'FPAL-D-M', label: 'Dama M', size: 'M', color: 'Dama', costPrice: 6 },
      { sku: 'FPAL-D-L', label: 'Dama L', size: 'L', color: 'Dama', costPrice: 6 },
      { sku: 'FPAL-D-XL', label: 'Dama XL', size: 'XL', color: 'Dama', costPrice: 6, priceModifier: 1 },
      { sku: 'FPAL-C-S', label: 'Caballero S', size: 'S', color: 'Caballero', costPrice: 6, priceModifier: 2 },
      { sku: 'FPAL-C-M', label: 'Caballero M', size: 'M', color: 'Caballero', costPrice: 6, priceModifier: 2 },
      { sku: 'FPAL-C-L', label: 'Caballero L', size: 'L', color: 'Caballero', costPrice: 6, priceModifier: 2 },
      { sku: 'FPAL-C-XL', label: 'Caballero XL', size: 'XL', color: 'Caballero', costPrice: 6, priceModifier: 2 },
    ],
    pricing: [{ type: 'FULL_FRONT_BACK', min: 1, max: null, price: 15.0 }],
  },
  {
    id: 'prod-franela-manga-larga',
    name: 'Franela Manga Larga Full Sublimación',
    category: 'SHIRT',
    description:
      'Franela manga larga full sublimación 100% poliéster. Diseño de ejemplo, totalmente personalizable con tu diseño, colores y nombre. Hasta talla L $16.',
    imageUrl: '/products/franela-manga-larga.png',
    variants: SIZES.map((s) => ({
      sku: `FMLARGA-${s.size}`,
      label: `Talla ${s.size}`,
      size: s.size,
      color: 'Full color',
      costPrice: 8,
      priceModifier: s.mod,
    })),
    pricing: [{ type: 'FULL_FRONT_BACK', min: 1, max: null, price: 16.0 }],
  },
];

const coreProducts: ProductSeed[] = [
  {
    id: 'prod-franela-personalizada',
    name: 'Franela Personalizada',
    category: 'SHIRT',
    description:
      'Franela en microdurazno. Sube tu propio diseño (frente y espalda tamaño carta). Colores claros $7, oscuros $10.',
    imageUrl: '/products/franela.png',
    variants: shirtVariants('FPER', { colors: true }),
    pricing: [
      { type: 'FULL_FRONT', min: 1, max: null, price: 5.0 },
      { type: 'FULL_FRONT_BACK', min: 1, max: null, price: 7.0 },
    ],
  },
  {
    id: 'prod-combo-duo',
    name: 'Combo Dúo (Parejas)',
    category: 'SHIRT',
    description: 'Dos franelas a juego para parejas, sublimación frente y espalda tamaño carta. Claras $13 · Oscuras $18. ¡El más pedido! 💜',
    imageUrl: '/products/combo-duo.png',
    variants: [
      { sku: 'DUO-CLARA', label: 'Combo Dúo Claras (2 franelas)', size: 'Combo', color: 'Clara', costPrice: 7, priceModifier: 0 },
      { sku: 'DUO-OSCURA', label: 'Combo Dúo Oscuras (2 franelas)', size: 'Combo', color: 'Oscura', costPrice: 9, priceModifier: 5 },
    ],
    pricing: [{ type: 'FULL_FRONT_BACK', min: 1, max: null, price: 13.0 }], // clara $13, oscura $13+$5=$18
  },
  {
    id: 'prod-taza-11oz',
    name: 'Taza 11oz',
    category: 'MUG',
    description: 'Taza cerámica blanca 11oz apta para sublimación de alta calidad.',
    imageUrl: '/products/taza.png',
    variants: [{ sku: 'TZ-11-BLA', label: 'Taza 11oz Blanca', size: '11oz', color: 'Blanco', costPrice: 2.5 }],
    pricing: [
      { type: 'A4', min: 1, max: 11, price: 5.0 },
      { type: 'A4', min: 12, max: null, price: 4.5 },
    ],
  },
  {
    id: 'prod-gorra',
    name: 'Gorra Sublimada',
    category: 'CAP',
    description: 'Gorra con panel frontal sublimable. Ideal para logos y diseños.',
    imageUrl: '/products/gorra.png',
    variants: [{ sku: 'GO-STD', label: 'Gorra ajustable', size: 'Única', color: 'Blanco/Color', costPrice: 4 }],
    pricing: [{ type: 'LOGO_SMALL', min: 1, max: null, price: 11.0 }],
  },
  {
    id: 'prod-sueter',
    name: 'Suéter Sublimado',
    category: 'SWEATER',
    description: 'Suéter en microdurazno para sublimación. Abrigado y personalizable.',
    imageUrl: '/products/sueter.png',
    variants: shirtVariants('SUET'),
    pricing: [{ type: 'FULL_FRONT_BACK', min: 1, max: null, price: 15.0 }], // (REVISAR)
  },
  {
    id: 'prod-uniforme-full',
    name: 'Uniforme Full Sublimación',
    category: 'SPORTSWEAR',
    description: 'Kit de uniforme con sublimación total. Personalizable con nombres, números, escudo y colores.',
    imageUrl: '/products/uniforme.png',
    variants: SIZES.map((s) => ({
      sku: `UNIF-${s.size}`,
      label: `Talla ${s.size}`,
      size: s.size,
      color: 'Full color',
      costPrice: 14,
      priceModifier: s.mod,
    })),
    pricing: [{ type: 'FULL_FRONT_BACK', min: 1, max: null, price: 25.0 }], // Uniforme camiseta y short $25
  },
];

const ALL_PRODUCTS: ProductSeed[] = [...coreProducts, ...designShirts, ...collections, ...uniforms, ...designMugs, ...readyShirts];

async function main() {
  console.log('Ejecutando seed de Relevé...');

  const hash = await bcrypt.hash('admin1234', 10);
  await prisma.agent.upsert({
    where: { email: 'admin@sublicolor.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@sublicolor.com', password: hash, role: 'ADMIN' },
  });
  console.log('✅ Agente admin listo (admin@sublicolor.com / admin1234)');

  // IMPORTANTE: el seed corre en CADA despliegue (ver startCommand en render.yaml).
  // Por eso NO debe pisar lo que la dueña edite desde el panel de administración:
  //   - Los productos que ya existen no se tocan (update vacío).
  //   - Los precios sólo se crean si el producto todavía no tiene ninguno.
  // Así el panel es la fuente de verdad y los cambios manuales nunca se pierden.

  let nProd = 0;
  let nRule = 0;
  let nSkipped = 0;
  for (const p of ALL_PRODUCTS) {
    await prisma.baseProduct.upsert({
      where: { id: p.id },
      update: {}, // no sobrescribir: respeta nombre/descripción/imagen editados en el panel
      create: {
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl,
        variants: { create: p.variants.map((v) => ({ ...v, priceModifier: v.priceModifier ?? 0 })) },
      },
    });

    const yaTienePrecios = await prisma.pricingRule.count({ where: { baseProductId: p.id } });
    if (yaTienePrecios === 0) {
      for (const r of p.pricing) {
        await prisma.pricingRule.create({
          data: {
            baseProductId: p.id,
            sublimationType: r.type,
            minQuantity: r.min,
            maxQuantity: r.max,
            unitPrice: r.price,
          },
        });
        nRule++;
      }
    } else {
      nSkipped++;
    }
    nProd++;
  }

  console.log(`✅ ${nProd} productos revisados · ${nRule} reglas de precio creadas · ${nSkipped} con precios ya definidos (respetados)`);
  console.log('\n🎉 Seed de Relevé completado');
  console.log('   💡 Los precios se editan desde el panel (Catálogo). El seed ya no los pisa.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
