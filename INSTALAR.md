# SubliColor — Guía de Instalación y Arranque

## Requisitos previos

### 1. Instalar Node.js 20 LTS
Descarga e instala desde: https://nodejs.org/en/download
- Marca la opción "Automatically install necessary tools"
- Versión recomendada: **Node.js 20 LTS**

### 2. Instalar pnpm (gestor de paquetes)
Abre PowerShell como administrador y ejecuta:
```powershell
npm install -g pnpm
```

### 3. Instalar Docker Desktop
Descarga desde: https://www.docker.com/products/docker-desktop
- Necesario para PostgreSQL y Redis
- Asegúrate de que Docker esté corriendo antes de continuar

---

## Arrancar el proyecto

Abre **PowerShell** en la carpeta del proyecto:
```
C:\Users\angel\AndroidStudioProjects\sublicolor
```

### Paso 1: Instalar dependencias
```powershell
pnpm install
```

### Paso 2: Levantar base de datos y Redis
```powershell
docker compose up -d postgres redis
```

Espera 5 segundos para que inicien.

### Paso 3: Crear tablas y datos iniciales
```powershell
cd apps/api
pnpm prisma migrate dev --name init
pnpm db:seed
cd ../..
```

### Paso 4: Iniciar la aplicación
```powershell
pnpm dev
```

---

## Acceder al panel

Una vez iniciado:
- **Panel Admin:** http://localhost:3000
- **API:**         http://localhost:3001
- **Usuario:**     admin@sublicolor.com
- **Contraseña:**  admin1234

---

## Conectar WhatsApp / Instagram / Facebook

### 1. Crear app en Meta for Developers
1. Ve a https://developers.facebook.com/
2. Crea una app de tipo **Business**
3. Agrega los productos: WhatsApp Business, Instagram, Messenger

### 2. Obtener tokens
- **WhatsApp:** Panel → WhatsApp → Configuración → Token de acceso temporal
- **Instagram:** Panel → Instagram → Generación de token
- **Messenger:** Panel → Messenger → Token de acceso de página

### 3. Actualizar el .env
Edita `apps/api/.env` con tus tokens reales:
```env
WHATSAPP_TOKEN=EAAtu_token_real
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
INSTAGRAM_ACCESS_TOKEN=EAAtu_token_real
MESSENGER_PAGE_ACCESS_TOKEN=EAAtu_token_real
META_APP_SECRET=tu_app_secret
```

### 4. Exponer el servidor con ngrok (desarrollo local)
```powershell
# Instalar ngrok
npm install -g ngrok

# Exponer el puerto 3001
ngrok http 3001
```

Copia la URL que ngrok te da (ej: https://abc123.ngrok.io) y:
1. Ve a **Meta for Developers → Webhooks**
2. URL de callback: `https://abc123.ngrok.io/webhook/whatsapp`
3. Token de verificación: `sublicolor_webhook_2024` (el del .env)
4. Suscribirse a: `messages`, `message_deliveries`, `message_reads`

### 5. Verificar la conexión
En el panel admin ve a **Integraciones** y haz clic en **Verificar conexión** para cada canal.

---

## OpenAI (IA del chatbot)
1. Ve a https://platform.openai.com/api-keys
2. Crea una API key
3. Agrégala al `.env`:
```env
OPENAI_API_KEY=sk-proj-tu_key_real
```

---

## Estructura de archivos creados
```
sublicolor/
├── apps/
│   ├── api/          ← Backend NestJS (puerto 3001)
│   └── web/          ← Panel Admin Next.js (puerto 3000)
├── docker-compose.yml
└── INSTALAR.md       ← Esta guía
```
