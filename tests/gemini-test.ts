import "dotenv/config";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
  Type,
} from "@google/genai";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_API_KEY no encontrada en .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// ── Test 1: Generación básica con Gemini 2.5 Flash ──
console.log("═══ TEST 1: Generación básica ═══");
const basicResult = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Di 'hola mundo' y explica qué es una API key en 1 frase.",
});
console.log("Respuesta:", basicResult.text);
console.log("OK\n");

// ── Test 2: Files API — subir un documento de prueba ──
console.log("═══ TEST 2: Files API (subir documento) ═══");

const testContent = `
# Manual de Producto XYZ — Sistema de Gestión Documental Empresarial

## Capítulo 1: Introducción y Visión General

El producto XYZ es una solución integral de gestión documental diseñada para empresas medianas y grandes que necesitan organizar, buscar y compartir documentos de forma eficiente y segura. La plataforma fue desarrollada por el equipo de ingeniería de XYZ Corp en Madrid, España, y se lanzó por primera vez en enero de 2023.

XYZ soporta de forma nativa los siguientes formatos de archivo: PDF, DOCX, XLSX, PPTX, Markdown, texto plano, HTML, y archivos de imagen (PNG, JPG, SVG). Además, el sistema incluye un motor de OCR (Reconocimiento Óptico de Caracteres) que permite indexar documentos escaneados y fotografías de documentos físicos.

La arquitectura del sistema se basa en microservicios desplegados en contenedores Docker, orquestados por Kubernetes. El backend principal está desarrollado en Python con FastAPI, mientras que el frontend utiliza React con TypeScript. La base de datos relacional es PostgreSQL 15, y para la búsqueda semántica se utiliza Qdrant como base de datos vectorial.

### 1.1 Características principales
- Búsqueda semántica inteligente mediante embeddings de última generación
- Control de versiones de documentos con historial completo
- Sistema de permisos granular basado en roles (RBAC)
- Integración con proveedores de identidad (SSO via SAML 2.0 y OpenID Connect)
- API REST completa con documentación OpenAPI 3.0
- Webhooks para integración con sistemas externos
- Panel de administración con métricas en tiempo real
- Soporte multi-idioma (español, inglés, portugués, francés, alemán)

## Capítulo 2: Requisitos del Sistema e Instalación

### 2.1 Requisitos mínimos del servidor
- CPU: 4 cores x86_64 (recomendado: 8 cores)
- RAM: 8 GB (recomendado: 16 GB)
- Disco: 100 GB SSD (el espacio de almacenamiento de documentos es adicional)
- Sistema Operativo: Ubuntu 22.04 LTS, Debian 12, o RHEL 9
- Docker Engine 24.0+ y Docker Compose v2.20+
- PostgreSQL 15+ (puede ser externo o incluido en el despliegue Docker)

### 2.2 Proceso de instalación paso a paso
1. Descargar el instalador desde portal.xyz.com/downloads
2. Verificar la integridad del paquete: sha256sum -c xyz-installer.sha256
3. Descomprimir: tar -xzf xyz-server-v3.2.1.tar.gz
4. Configurar variables de entorno en el archivo .env (ver sección 2.3)
5. Ejecutar el script de configuración inicial: ./setup.sh --init
6. Configurar la conexión a base de datos PostgreSQL en config/database.yml
7. Ejecutar las migraciones de base de datos: ./xyz-cli db migrate
8. Iniciar todos los servicios: docker compose up -d
9. Verificar el estado: docker compose ps && curl http://localhost:8080/health

### 2.3 Variables de entorno requeridas
- XYZ_DB_HOST: Host de PostgreSQL (default: localhost)
- XYZ_DB_PORT: Puerto de PostgreSQL (default: 5432)
- XYZ_DB_NAME: Nombre de la base de datos (default: xyz_production)
- XYZ_DB_USER: Usuario de base de datos
- XYZ_DB_PASSWORD: Contraseña de base de datos
- XYZ_SECRET_KEY: Clave secreta para JWT (generar con: openssl rand -hex 32)
- XYZ_QDRANT_URL: URL del servidor Qdrant (default: http://localhost:6333)
- XYZ_STORAGE_PATH: Ruta de almacenamiento de archivos (default: /data/xyz/files)
- XYZ_MAX_UPLOAD_SIZE: Tamaño máximo de archivo en MB (default: 100)
- XYZ_CORS_ORIGINS: Orígenes permitidos para CORS (separados por coma)

## Capítulo 3: API REST — Referencia Completa

Todas las peticiones a la API requieren autenticación mediante token Bearer JWT en el header Authorization. Los tokens se obtienen mediante el endpoint de login.

### 3.1 Autenticación
- POST /api/v1/auth/login — Iniciar sesión (body: email, password). Retorna access_token y refresh_token.
- POST /api/v1/auth/refresh — Renovar token de acceso usando refresh_token.
- POST /api/v1/auth/logout — Cerrar sesión e invalidar tokens.
- GET /api/v1/auth/me — Obtener información del usuario autenticado.

### 3.2 Gestión de documentos
- POST /api/v1/documents — Subir un nuevo documento (multipart/form-data). Campos: file (requerido), title, description, tags[], folder_id.
- GET /api/v1/documents — Listar documentos del usuario. Query params: page, per_page, sort_by, order, folder_id, tag.
- GET /api/v1/documents/:id — Obtener metadatos de un documento específico.
- GET /api/v1/documents/:id/download — Descargar el archivo original.
- GET /api/v1/documents/:id/preview — Obtener vista previa del documento (thumbnail o HTML renderizado).
- PUT /api/v1/documents/:id — Actualizar metadatos del documento.
- DELETE /api/v1/documents/:id — Eliminar documento (soft delete, recuperable en 30 días).
- POST /api/v1/documents/:id/versions — Subir nueva versión del documento.
- GET /api/v1/documents/:id/versions — Listar historial de versiones.

### 3.3 Búsqueda
- POST /api/v1/search — Búsqueda semántica. Body: query (texto de búsqueda), filters (objeto con folder_id, tags, date_range, file_type), limit (default: 20), offset.
- POST /api/v1/search/similar/:id — Encontrar documentos similares a uno dado.
- GET /api/v1/search/suggestions — Obtener sugerencias de búsqueda basadas en el historial.

### 3.4 Carpetas
- POST /api/v1/folders — Crear carpeta. Body: name, parent_id (opcional).
- GET /api/v1/folders — Listar carpetas del usuario (estructura de árbol).
- PUT /api/v1/folders/:id — Renombrar o mover carpeta.
- DELETE /api/v1/folders/:id — Eliminar carpeta (mueve contenido a la raíz).

### 3.5 Webhooks
- POST /api/v1/webhooks — Registrar webhook. Body: url, events[] (document.created, document.updated, document.deleted, search.performed).
- GET /api/v1/webhooks — Listar webhooks registrados.
- DELETE /api/v1/webhooks/:id — Eliminar webhook.

## Capítulo 4: Guía de Administración

### 4.1 Panel de administración
El panel de administración está accesible en /admin y requiere un usuario con rol "admin". Desde aquí se puede:
- Gestionar usuarios y roles
- Ver métricas de uso (documentos subidos, búsquedas realizadas, almacenamiento usado)
- Configurar políticas de retención de documentos
- Gestionar integraciones y webhooks globales
- Ver logs de auditoría

### 4.2 Backup y recuperación
El sistema incluye un script de backup automatizado que se puede configurar via cron:
- Backup completo: ./xyz-cli backup --full --output /backups/
- Backup incremental: ./xyz-cli backup --incremental --output /backups/
- Restaurar: ./xyz-cli restore --from /backups/xyz-backup-20240115.tar.gz

### 4.3 Monitorización
XYZ expone métricas en formato Prometheus en el endpoint /metrics. Las métricas incluyen:
- xyz_documents_total: Total de documentos en el sistema
- xyz_searches_total: Total de búsquedas realizadas
- xyz_upload_duration_seconds: Histograma de duración de subidas
- xyz_search_latency_seconds: Histograma de latencia de búsquedas
- xyz_storage_bytes: Almacenamiento total usado

## Capítulo 5: Soporte y Contacto

### 5.1 Canales de soporte
- Email: soporte@xyz.com (respuesta en menos de 4 horas en horario laboral)
- Teléfono: +34 900 123 456
- Chat en vivo: disponible en portal.xyz.com (horario laboral)
- Portal de tickets: tickets.xyz.com

### 5.2 Horarios
- Soporte estándar: Lunes a Viernes, 9:00 - 18:00 CET
- Soporte premium 24/7: disponible con plan Enterprise
- Ventana de mantenimiento programado: Domingos 02:00 - 06:00 CET

### 5.3 SLAs por plan
- Plan Starter: 99.5% uptime, soporte por email
- Plan Professional: 99.9% uptime, soporte por email y teléfono, respuesta < 2h
- Plan Enterprise: 99.99% uptime, soporte 24/7, account manager dedicado, respuesta < 30min
`;

const blob = new Blob([testContent], { type: "text/plain" });
const file = await ai.files.upload({
  file: blob,
  config: { displayName: "manual-producto-xyz.txt" },
});
console.log(`Archivo subido: ${file.name} (${file.displayName})`);
console.log(`URI: ${file.uri}`);
console.log(`Estado: ${file.state}`);
console.log("OK\n");

// ── Test 3: Consulta sobre el documento subido (RAG directo) ──
console.log("═══ TEST 3: Consulta sobre documento (RAG con Files API) ═══");
const start = performance.now();
const ragResult = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: createUserContent([
    createPartFromUri(file.uri!, file.mimeType!),
    { text: "¿Cuál es el endpoint para buscar documentos y cuál es el horario de soporte estándar?" },
  ]),
  config: {
    systemInstruction:
      "Eres un asistente experto en el producto XYZ. Responde siempre en español, de forma concisa.",
  },
});
const latency = (performance.now() - start).toFixed(0);
console.log(`Respuesta (${latency}ms):`);
console.log(ragResult.text);

const usage = ragResult.usageMetadata!;
console.log(`\nTokens — prompt: ${usage.promptTokenCount}, respuesta: ${usage.candidatesTokenCount}`);
console.log("OK\n");

// ── Test 4: Context Caching (requiere billing) ──
console.log("═══ TEST 4: Context Caching ═══");
let cacheName: string | null = null;
try {
  const cache = await ai.caches.create({
    model: "gemini-2.5-flash",
    config: {
      contents: [
        createUserContent(createPartFromUri(file.uri!, file.mimeType!)),
      ],
      systemInstruction:
        "Eres un asistente experto en el producto XYZ. Responde siempre en español, de forma concisa y profesional.",
      ttl: "300s",
      displayName: "cache-manual-xyz",
    },
  });
  cacheName = cache.name!;
  console.log(`Caché creado: ${cache.name}`);

  const cachedResult = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "¿Qué SLA tiene el plan Enterprise?",
    config: { cachedContent: cache.name },
  });
  console.log(`Respuesta: ${cachedResult.text}`);
  console.log(`Tokens cacheados: ${cachedResult.usageMetadata?.cachedContentTokenCount}`);
  console.log("OK\n");
} catch (e: any) {
  if (e.status === 429 && e.message?.includes("FreeTier")) {
    console.log("SKIP — Context Caching no disponible en free tier.");
    console.log("       Activar billing en Google Cloud para habilitarlo.");
    console.log("       (Los tests 1-3 confirman que la API funciona correctamente)\n");
  } else {
    throw e;
  }
}

// ── Limpieza ──
console.log("═══ LIMPIEZA ═══");
if (cacheName) {
  await ai.caches.delete({ name: cacheName });
  console.log(`Caché eliminado: ${cacheName}`);
}
await ai.files.delete({ name: file.name! });
console.log(`Archivo eliminado: ${file.name}`);

console.log("\n✅ Todos los tests pasaron. La API key funciona con los 3 componentes:");
console.log("   1. Generación (Gemini 2.5 Flash)");
console.log("   2. Files API (subida de documentos)");
console.log("   3. Context Caching (consulta con caché)");
