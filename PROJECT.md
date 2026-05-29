# Asistente Documental Inteligente Multi-Tenant (Texto & Voz)

## Descripcion del Proyecto (MVP)

Plataforma SaaS donde cada usuario registrado tiene su propio espacio de almacenamiento privado (estilo "Vault" de Obsidian). El usuario puede subir su documentacion (PDFs, Imagenes, Markdown) y la plataforma genera un asistente inteligente personalizado con dos interfaces de acceso:

- **Chatbot de Texto:** Interfaz visual limpia donde el usuario chatea con sus documentos, pudiendo ver imagenes incrustadas, descargar archivos adjuntos compartidos por el bot y arrastrar nuevos archivos para su analisis.
- **Bot de Voz en Tiempo Real:** Boton WebRTC que permite al usuario iniciar una llamada de voz directa con el bot (a traves de ElevenLabs) para "hablar con sus documentos" con latencia cero y respuestas ultra-cortas y conversacionales.

## Pilares Tecnologicos

- **Seguridad:** Aislamiento absoluto de datos por usuario (user_id).
- **Velocidad:** Uso de base de datos vectorial nativa para garantizar rendimiento de voz.
- **Costos:** Uso de Prompt Caching y modelos economicos para el plan gratuito.

---

## Plan de Desarrollo (Fase a Fase)

### Fase 1: El Corazon del Sistema (Ingesta y Almacenamiento)

**Objetivo:** Lograr que subas un documento, se procese y se guarde de forma segura.

1. **Montar el Entorno Local:**
   - Instalar Docker. Levantar un contenedor de Qdrant en local.
   - Crear una base de datos relacional ligera (SQLite en local o Supabase) para gestionar cuentas de usuario de prueba.

2. **Script de Ingesta (ETL):**
   - Script en Python (FastAPI) o Node.js usando LlamaIndex.
   - Recibir un PDF/Markdown, extraer el texto, partirlo en chunks de 600 caracteres y generar embeddings (modelo local de HuggingFace o API de OpenAI).

3. **Indexacion con Seguridad Multi-Tenant:**
   - Al guardar fragmentos en Qdrant, insertar obligatoriamente en el Payload el ID del usuario (`user_id: "user_demo_1"`).
   - Probar con dos usuarios distintos y verificar busquedas filtradas sin mezcla de datos.

### Fase 2: El Cerebro del Chatbot (Modo Texto)

**Objetivo:** Crear el flujo RAG tradicional por chat escrito.

1. **Endpoint de Consulta:** Ruta `/api/chat`. Convierte la pregunta en vector, busca en Qdrant con filtro `user_id`, extrae los 3 fragmentos mas relevantes.
2. **Conexion con Claude:** Enviar fragmentos + pregunta a la API de Anthropic usando Claude 3.5 Haiku (o Sonnet para vision). System Prompt que no invente datos + Prompt Caching.
3. **Interfaz Grafica Basica:** Pantalla web (React, Vue o HTML/JS). Ventana de chat + boton para subir archivos. Backend devuelve URLs de archivos/imagenes via Function Calling.

### Fase 3: La Dimension de Voz (Integracion de ElevenLabs)

**Objetivo:** Convertir el conocimiento de Qdrant en una llamada de voz WebRTC fluida.

1. **Configurar ElevenLabs:** Crear un Conversational Agent en modo Custom LLM.
2. **Tunelizar el Servidor:** Ngrok para exponer el backend local a internet.
3. **Adaptar el Prompt para Voz:** Cuando la peticion venga de ElevenLabs, el prompt ordena a Claude: "Respuestas de maximo 2 frases, tono amigable, lenguaje directo para ser escuchado, no uses vinetas ni asteriscos".
4. **Boton WebRTC:** Integrar el SDK de frontend de ElevenLabs en la interfaz web. Boton de "Iniciar Llamada de Voz".

### Fase 4: Despliegue y Reglas de Produccion (SaaS)

**Objetivo:** Subir el proyecto a internet para los primeros usuarios reales.

1. **Infraestructura:** Backend en servicio economico (Render, Railway o VPS de $5) + Qdrant Self-Hosted en Docker para latencia cero.
2. **Control de Costos (Plan Gratuito):** Contador en base de datos (Redis o Postgres) que limite a usuarios gratuitos (ej. 10 mensajes de texto o 3 minutos de voz al dia).
3. **Modelo BYOK (Bring Your Own Key):** Pantalla de configuracion para que usuarios avanzados peguen su propia API Key de Anthropic y ElevenLabs, uso ilimitado sin costo de servidores.
