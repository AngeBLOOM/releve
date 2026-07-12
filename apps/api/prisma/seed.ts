import { PrismaClient, SublimationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Ejecutando seed...');

  const hash = await bcrypt.hash('admin1234', 10);
  await prisma.agent.upsert({
    where: { email: 'admin@sublicolor.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@sublicolor.com',
      password: hash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Agente admin creado');

  const franelaCotton = await prisma.baseProduct.upsert({
    where: { id: 'prod-franela-cotton' },
    update: {},
    create: {
      id: 'prod-franela-cotton',
      name: 'Franela Algodón',
      category: 'SHIRT',
      description: '100% algodón peinado, sublimación directa. Colores claros recomendados.',
      variants: {
        create: [
          { sku: 'FC-S-BLA', label: 'Talla S - Blanca', size: 'S', color: 'Blanco', costPrice: 4.5 },
          { sku: 'FC-M-BLA', label: 'Talla M - Blanca', size: 'M', color: 'Blanco', costPrice: 4.5 },
          { sku: 'FC-L-BLA', label: 'Talla L - Blanca', size: 'L', color: 'Blanco', costPrice: 5.0 },
          { sku: 'FC-XL-BLA', label: 'Talla XL - Blanca', size: 'XL', color: 'Blanco', costPrice: 5.5 },
        ],
      },
    },
  });

  const franelaPoly = await prisma.baseProduct.upsert({
    where: { id: 'prod-franela-poly' },
    update: {},
    create: {
      id: 'prod-franela-poly',
      name: 'Franela Poliéster',
      category: 'SHIRT',
      description: 'Poliéster 100%, colores vivos y durabilidad superior en sublimación.',
      variants: {
        create: [
          { sku: 'FP-S-BLA', label: 'Talla S - Blanca', size: 'S', color: 'Blanco', costPrice: 5.0 },
          { sku: 'FP-M-BLA', label: 'Talla M - Blanca', size: 'M', color: 'Blanco', costPrice: 5.0 },
          { sku: 'FP-L-BLA', label: 'Talla L - Blanca', size: 'L', color: 'Blanco', costPrice: 5.5 },
          { sku: 'FP-XL-BLA', label: 'Talla XL - Blanca', size: 'XL', color: 'Blanco', costPrice: 6.0 },
        ],
      },
    },
  });

  const tazaCeramica = await prisma.baseProduct.upsert({
    where: { id: 'prod-taza-ceramica' },
    update: {},
    create: {
      id: 'prod-taza-ceramica',
      name: 'Taza Cerámica 11oz',
      category: 'MUG',
      description: 'Taza blanca 11oz apta para sublimación de alta calidad.',
      variants: {
        create: [
          { sku: 'TC-11-BLA', label: 'Taza 11oz Blanca', size: '11oz', color: 'Blanco', costPrice: 2.5 },
        ],
      },
    },
  });

  const tazaMagica = await prisma.baseProduct.upsert({
    where: { id: 'prod-taza-magica' },
    update: {},
    create: {
      id: 'prod-taza-magica',
      name: 'Taza Mágica 11oz',
      category: 'MUG',
      description: 'Cambia de color al contacto con bebidas calientes. Efecto sorpresa.',
      variants: {
        create: [
          { sku: 'TM-11-NEG', label: 'Taza Mágica 11oz Negra', size: '11oz', color: 'Negro', costPrice: 4.0 },
        ],
      },
    },
  });
  console.log('✅ Productos creados');

  const pricingData: Array<{
    baseProductId: string;
    sublimationType: SublimationType;
    minQuantity: number;
    maxQuantity: number | null;
    unitPrice: number;
  }> = [
    { baseProductId: franelaCotton.id, sublimationType: 'LOGO_SMALL',      minQuantity: 1,  maxQuantity: 9,   unitPrice: 8.00 },
    { baseProductId: franelaCotton.id, sublimationType: 'LOGO_SMALL',      minQuantity: 10, maxQuantity: null, unitPrice: 7.00 },
    { baseProductId: franelaCotton.id, sublimationType: 'FULL_FRONT',      minQuantity: 1,  maxQuantity: 9,   unitPrice: 12.00 },
    { baseProductId: franelaCotton.id, sublimationType: 'FULL_FRONT',      minQuantity: 10, maxQuantity: null, unitPrice: 10.00 },
    { baseProductId: franelaCotton.id, sublimationType: 'FULL_FRONT_BACK', minQuantity: 1,  maxQuantity: 9,   unitPrice: 18.00 },
    { baseProductId: franelaCotton.id, sublimationType: 'FULL_FRONT_BACK', minQuantity: 10, maxQuantity: null, unitPrice: 15.00 },
    { baseProductId: franelaPoly.id,   sublimationType: 'FULL_FRONT',      minQuantity: 1,  maxQuantity: 9,   unitPrice: 14.00 },
    { baseProductId: franelaPoly.id,   sublimationType: 'FULL_FRONT',      minQuantity: 10, maxQuantity: null, unitPrice: 12.00 },
    { baseProductId: franelaPoly.id,   sublimationType: 'FULL_FRONT_BACK', minQuantity: 1,  maxQuantity: 9,   unitPrice: 20.00 },
    { baseProductId: franelaPoly.id,   sublimationType: 'FULL_FRONT_BACK', minQuantity: 10, maxQuantity: null, unitPrice: 17.00 },
    { baseProductId: tazaCeramica.id,  sublimationType: 'A4',              minQuantity: 1,  maxQuantity: 5,   unitPrice: 7.00 },
    { baseProductId: tazaCeramica.id,  sublimationType: 'A4',              minQuantity: 6,  maxQuantity: null, unitPrice: 6.00 },
    { baseProductId: tazaMagica.id,    sublimationType: 'A4',              minQuantity: 1,  maxQuantity: 5,   unitPrice: 10.00 },
    { baseProductId: tazaMagica.id,    sublimationType: 'A4',              minQuantity: 6,  maxQuantity: null, unitPrice: 9.00 },
  ];

  for (const rule of pricingData) {
    await prisma.pricingRule.create({ data: rule });
  }
  console.log('✅ Reglas de precios creadas');

  console.log('\n🎉 Seed completado exitosamente');
  console.log('   Login: admin@sublicolor.com / admin1234');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
