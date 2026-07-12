# Guía de despliegue de Relevé (gratis, 24/7)

Arquitectura:

- **GitHub** — código (repo privado `AngeBLOOM/releve`). ✅
- **Neon** — base de datos PostgreSQL. ✅ (proyecto `RELEVE`)
- **Render** — API + bot (NestJS) + Redis interno. Corre 24/7.
- **Vercel** — tienda web (Next.js).

> Las tablas y los productos se cargan **desde el servidor** (Render) al desplegar,
> no desde la PC local (evita cortes de internet y no expone contraseñas).

---

## Paso A — Render (servidor + Redis + base de datos)

1. Entra a https://render.com y regístrate/inicia sesión con **GitHub**.
2. **New → Blueprint** → conecta el repo `AngeBLOOM/releve`. Render leerá `render.yaml`
   y creará **releve-redis** (Redis) y **releve-api** (servidor).
3. Antes de crear, pega los **secretos** (campos que Render pide, marcados `sync: false`):
   - `DATABASE_URL` → la cadena **pooler** de Neon:
     `postgresql://neondb_owner:TU_PASSWORD@ep-orange-breeze-atbhanwd-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - `WHATSAPP_TOKEN` → token de WhatsApp (Meta).
   - `WHATSAPP_PHONE_NUMBER_ID` → `1112123201995571`
   - `META_APP_ID` → `2081665072698748`
   - `META_APP_SECRET` → el secreto de la app de Meta.
   - `WEB_URL` y `STORE_PUBLIC_URL` → se ponen **después** del Paso B (dominio de Vercel).
   - `OPENAI_API_KEY` → solo si se usa IA en el bot.
   - `REDIS_URL` y `JWT_SECRET` se configuran **solos**.
4. **Apply / Create**. Render instala, genera Prisma, aplica migraciones, **carga el catálogo**
   y arranca. La URL del servidor queda como `https://releve-api.onrender.com`.
5. Verifica: abre `https://releve-api.onrender.com/health` → debe decir `{"status":"ok"...}`.

## Paso B — Vercel (tienda web)

1. Entra a https://vercel.com y regístrate/inicia sesión con **GitHub**.
2. **Add New → Project** → importa `AngeBLOOM/releve`.
3. **Root Directory:** selecciona `apps/web`.
4. **Environment Variables:**
   - `API_URL` = `https://releve-api.onrender.com` (la URL del Paso A)
   - `NEXT_PUBLIC_WHATSAPP` = `584120846332`
5. **Deploy**. Queda como `https://releve.vercel.app` (o el dominio que asigne).

## Paso C — Enlazar los dos

1. En **Render** (releve-api → Environment) pon:
   - `WEB_URL` = `https://releve.vercel.app`
   - `STORE_PUBLIC_URL` = `https://releve.vercel.app`
   - Guarda (Render redepliega).
2. Abre `https://releve.vercel.app/tienda` → deben verse los productos con imágenes.

## Paso D — WhatsApp + Instagram/Facebook

1. **WhatsApp**: en Meta → WhatsApp → Configuration, pon el webhook:
   - Callback URL: `https://releve-api.onrender.com/webhooks/whatsapp`
   - Verify token: `sublicolor_webhook_2024`
2. **Instagram/Facebook** (publicaciones automáticas): requiere que la cuenta de
   Instagram `@releve01` sea **cuenta de empresa** vinculada a la página de Facebook
   de Relevé, y el token de página con permisos de publicación. (Se configura después
   de tener la web pública, porque Instagram lee las imágenes desde su URL pública.)

---

## Notas

- **Precios (REVISAR)** en el catálogo: combos, gorra, suéter y uniformes tienen precios
  estimados. Ajústalos en el panel de administración (`/admin`, login
  `admin@sublicolor.com` / `admin1234`).
- **Plan gratis de Render**: el servidor se "duerme" tras ~15 min sin uso; la primera
  visita después tarda ~1 min en despertar. Para publicaciones automáticas puntuales se
  puede usar un ping externo (p. ej. cron-job.org) a `/health` + un endpoint de disparo.
- **Diseños subidos por clientes**: se guardan en disco temporal de Render (se pierden al
  redeployar). Para producción conviene un almacenamiento externo más adelante.
