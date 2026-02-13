# Plan: Bot Verificador de Sitemap con Node.js

## Contexto

El usuario necesita un bot que automatice la verificación de URLs en un sitemap XML para detectar enlaces rotos (404s) y otros errores HTTP. Esto es crítico para mantener la salud SEO de un sitio web y detectar problemas antes de que afecten a usuarios o buscadores.

El proyecto está en un directorio vacío (`C:\Users\bpier\Documents\www\frontest`), por lo que creamos todo desde cero.

## Solución Propuesta: Bot Node.js con Arquitectura Modular

### Características Principales

1. **Requests Paralelos**: Verificar hasta 10 URLs simultáneamente (configurable) usando `p-limit` para control de concurrencia
2. **Retry Automático**: Reintentar hasta 3 veces con exponential backoff para errores temporales (500, 503, timeouts)
3. **Reportes Detallados**:
   - HTML interactivo con tablas sorteables, gráficas y estadísticas
   - JSON estructurado para integración con CI/CD
   - Resumen en consola con barra de progreso en tiempo real
4. **Logging Robusto**: Sistema winston con archivos rotatorios (all.log, error.log) + consola

### Stack Tecnológico

```json
{
  "dependencies": {
    "axios": "HTTP client con interceptors y retry",
    "xml2js": "Parser de sitemap XML",
    "p-limit": "Control de concurrencia",
    "winston": "Logger profesional",
    "winston-daily-rotate-file": "Rotación automática de logs",
    "chalk": "Colores en consola",
    "cli-progress": "Barra de progreso",
    "handlebars": "Templates para HTML",
    "dotenv": "Gestión de variables de entorno"
  }
}
```

### Arquitectura de Archivos

```
frontest/
├── package.json
├── .env.example
├── config/
│   └── default.js                    # Configuración centralizada
├── src/
│   ├── index.js                      # Punto de entrada - orquestación
│   ├── parser/
│   │   └── sitemap-parser.js         # Parse XML, soporte sitemap index
│   ├── crawler/
│   │   ├── http-checker.js           # HTTP requests + métricas
│   │   ├── retry-handler.js          # Lógica de retry con backoff
│   │   └── parallel-executor.js      # Control de concurrencia
│   ├── reporters/
│   │   ├── html-reporter.js          # Reporte HTML interactivo
│   │   ├── json-reporter.js          # Reporte JSON estructurado
│   │   └── console-reporter.js       # Progreso + resumen consola
│   ├── logger/
│   │   └── logger.js                 # Winston config (consola + archivos)
│   └── utils/
│       ├── error-classifier.js       # Clasificación de errores
│       └── stats-calculator.js       # Cálculo de estadísticas
├── tests/
│   ├── unit/                         # Tests unitarios (Jest)
│   ├── integration.test.js           # Tests de integración
│   └── fixtures/                     # Sitemaps de ejemplo
├── reports/                          # Output de reportes
└── logs/                            # Archivos de log
```

## Flujo de Ejecución

```
1. Parse Sitemap XML
   ├─ Detectar si es sitemap index (múltiples sitemaps)
   ├─ Recursivamente obtener todos los sitemaps hijos
   └─ Extraer todas las URLs (validar formato)

2. Setup Components
   ├─ HttpChecker: Configurar axios con timeout 30s
   ├─ RetryHandler: Max 3 retries, exponential backoff
   └─ ParallelExecutor: Concurrencia de 10 requests simultáneos

3. Execute Parallel Checks
   ├─ Cola de URLs procesada con p-limit
   ├─ Cada URL: HTTP request → medir tiempo → clasificar respuesta
   ├─ Si falla: retry automático según tipo de error
   └─ Progress bar en tiempo real

4. Collect Results
   ├─ Array de UrlResult objects
   ├─ Cada resultado: URL, status, tiempo, redirects, errores, intentos
   └─ Clasificar: success/client_error/server_error/network_error

5. Generate Reports
   ├─ Calcular estadísticas (success rate, avg time, percentiles)
   ├─ HTML: Tabla interactiva + gráficas + errores destacados
   ├─ JSON: Estructura completa para máquinas
   └─ Console: Resumen ejecutivo con tablas formateadas

6. Exit
   └─ Exit code 1 si hay errores, 0 si todo OK
```

## Manejo Inteligente de Errores

### Clasificación y Strategy

| Error | Retry? | Estrategia |
|-------|--------|-----------|
| **404 Not Found** | ❌ No | Reportar inmediatamente - URL inválida en sitemap |
| **500/502/503** | ✅ Sí | Retry 3x con backoff - error temporal del servidor |
| **Timeout** | ✅ Sí | Retry 3x - puede ser congestión temporal |
| **DNS Error** | ❌ No | Reportar - dominio inválido |
| **301 Redirect** | ❌ No | Seguir redirect, reportar para actualizar sitemap |
| **429 Rate Limit** | ✅ Sí | Retry 5x con backoff largo |

### Exponential Backoff
```
Intento 1 → Esperar 1s
Intento 2 → Esperar 2s
Intento 3 → Esperar 4s
(+ jitter aleatorio para evitar thundering herd)
```

## Configuración (config/default.js)

```javascript
{
  http: {
    timeout: 30000,              // 30 segundos
    followRedirects: true,
    maxRedirects: 5,
    userAgent: 'SitemapBot/1.0'
  },

  concurrency: {
    maxParallel: 10              // Requests simultáneos
  },

  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },

  reporting: {
    outputDirectory: './reports',
    formats: ['html', 'json', 'console']
  }
}
```

Override vía variables de entorno (`.env`):
```env
SITEMAP_URL=https://example.com/sitemap.xml
MAX_PARALLEL_REQUESTS=10
MAX_RETRIES=3
REQUEST_TIMEOUT=30000
LOG_LEVEL=info
RETRY_DELAY=1000
```

## Reportes Generados

### 1. Reporte HTML (`reports/sitemap-check-{timestamp}.html`)

**Características:**
- **Resumen ejecutivo**: Total URLs, exitosas, fallidas, tasa de éxito
- **Gráfica de status codes**: Visualización con distribución
- **Tabla interactiva**:
  - Sorteable por cualquier columna
  - Filtrable por status code o categoría
  - Búsqueda en tiempo real
  - Color-coded (verde 2xx, azul 3xx, amarillo 4xx, rojo 5xx)
- **Sección de errores**: Lista de URLs con error agrupadas por tipo
- **Estadísticas**: p50/p95/p99 de tiempos de respuesta
- **Diseño responsivo**: Funciona en desktop y mobile

### 2. Reporte JSON (`reports/sitemap-check-{timestamp}.json`)

Estructura para integración CI/CD:
```json
{
  "metadata": {
    "sitemapUrl": "...",
    "timestamp": "...",
    "duration": 45.2,
    "generatedAt": "..."
  },
  "summary": {
    "totalUrls": 1500,
    "successful": 1450,
    "failed": 50,
    "successRate": 96.67,
    "avgResponseTime": 234,
    "minResponseTime": 45,
    "maxResponseTime": 5000,
    "p50ResponseTime": 180,
    "p95ResponseTime": 850,
    "p99ResponseTime": 2400
  },
  "statusCodeDistribution": {
    "200": 1450,
    "404": 35,
    "500": 10,
    "503": 5
  },
  "results": [
    {
      "url": "...",
      "statusCode": 200,
      "responseTime": 145,
      "attempts": 1,
      "category": "success",
      "description": "Success",
      "error": null,
      "redirectUrl": null
    }
  ],
  "errors": {
    "404": [
      { "url": "...", "attempts": 1, "error": null }
    ]
  }
}
```

### 3. Reporte Console

```
╔══════════════════════════════════════════════════╗
║          SITEMAP CHECK REPORT                    ║
╚══════════════════════════════════════════════════╝

Sitemap: https://example.com/sitemap.xml
Duration: 5m 30s

┌────────────────────────────────────────────────┐
│ SUMMARY                                         │
├────────────────────────────────────────────────┤
│ Total URLs:          1500                       │
│ Successful:          1450 (96.67%)              │
│ Failed:              50 (3.33%)                 │
│ Avg Response Time:   234ms                      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ STATUS CODE DISTRIBUTION                        │
├────────────────────────────────────────────────┤
│ 200 OK       │ 1450 ████████████████  96.7%    │
│ 404 Not Fnd  │ 35   ██              2.3%       │
│ 500 Error    │ 10   ▌               0.7%       │
└────────────────────────────────────────────────┘

Reports saved to:
  • ./reports/sitemap-check-2026-02-12.html
  • ./reports/sitemap-check-2026-02-12.json
```

## Logging System

### Winston Config (3 transports):

1. **Console**: Nivel INFO, colorizado, tiempo real
2. **all.log**: Nivel DEBUG, JSON estructurado, rotación diaria
3. **error.log**: Solo ERRORES, JSON estructurado, rotación diaria

### Ejemplos de logs:

```javascript
// Consola (tiempo real)
[INFO] Starting sitemap check for https://example.com/sitemap.xml
[INFO] Found 1500 URLs to check
Progress: [=========>     ] 45% | 675/1500 | ETA: 2m 15s
[ERROR] URL https://example.com/missing returned 404
[INFO] Check completed in 5m 30s

// all.log (archivo JSON)
{"timestamp":"2026-02-12T10:30:00Z","level":"info","message":"Starting sitemap check"}
{"timestamp":"2026-02-12T10:30:05Z","level":"debug","message":"URL check completed","url":"...","statusCode":200}
{"timestamp":"2026-02-12T10:30:08Z","level":"error","message":"URL check failed","url":"...","statusCode":404}
```

## Archivos Críticos para Implementación

1. **`src/index.js`** - Orquestación del flujo principal (parse → check → report)
2. **`src/crawler/parallel-executor.js`** - Corazón del rendimiento (p-limit + cola)
3. **`src/crawler/http-checker.js`** - Requests HTTP + captura de métricas
4. **`src/crawler/retry-handler.js`** - Retry con exponential backoff
5. **`src/parser/sitemap-parser.js`** - Parse XML + soporte sitemap index
6. **`src/reporters/html-reporter.js`** - Generación de HTML interactivo
7. **`config/default.js`** - Configuración centralizada
8. **`src/logger/logger.js`** - Sistema de logging con Winston

## Comandos de Uso

```bash
# Instalación
npm install

# Uso básico
npm start

# Con URL en línea de comandos
npm start https://example.com/sitemap.xml

# Con variables de entorno
SITEMAP_URL=https://example.com/sitemap.xml npm start

# Override de paralelismo
MAX_PARALLEL_REQUESTS=20 npm start https://example.com/sitemap.xml

# Override de timeout
REQUEST_TIMEOUT=60000 npm start https://example.com/sitemap.xml

# Modo verbose
LOG_LEVEL=debug npm start https://example.com/sitemap.xml

# Tests
npm test

# Tests con coverage
npm run test:coverage
```

## Verificación End-to-End

**Después de implementar, verificar:**

1. ✅ Crear sitemap de prueba con 20 URLs (10 OK, 5 404s, 5 500s)
2. ✅ Ejecutar bot: `npm start ./test-sitemap.xml`
3. ✅ Verificar progreso en consola con barra
4. ✅ Verificar que detecta correctamente 404s y 500s
5. ✅ Verificar retry automático en 500s (logs deben mostrar 3 intentos)
6. ✅ Verificar generación de reportes HTML y JSON en `./reports/`
7. ✅ Abrir HTML y verificar tabla interactiva + estadísticas
8. ✅ Verificar logs en `./logs/all.log` y `./logs/error.log`
9. ✅ Ejecutar tests: `npm test`
10. ✅ Test de volumen: Sitemap con 500 URLs debe completar en <5min

**Exit code verificación:**
```bash
npm start <url> && echo "No errors" || echo "Found errors"
# Exit code 1 si hay errores, 0 si todo OK
```

## Extensiones Futuras (Opcionales)

- **Alerting**: Notificaciones Slack/email cuando se detecten errores
- **CI/CD Integration**: GitHub Actions para checks automáticos
- **Historical Tracking**: Comparar resultados entre ejecuciones
- **Content Validation**: Verificar presencia de elementos específicos en páginas
- **Screenshot Capture**: Capturar pantalla de páginas con error
- **Database Storage**: Guardar resultados en base de datos
- **API REST**: Exponer resultados vía API
- **Scheduling**: Ejecuciones programadas automáticas
- **Multi-domain**: Verificar múltiples sitemaps en paralelo

## Consideraciones de Seguridad

- ✅ No se almacenan contraseñas o tokens en el código
- ✅ Variables sensibles se cargan desde `.env`
- ✅ `.env` está en `.gitignore`
- ✅ User-Agent identificable para respetar robots.txt
- ✅ Respeto a rate limits (configurable)
- ✅ Timeouts para evitar bloqueos indefinidos

## Rendimiento Esperado

- **100 URLs**: ~2-5 segundos
- **500 URLs**: ~10-15 segundos
- **1000 URLs**: ~30-60 segundos
- **Sitemap con 100k URLs**: ~10-30 minutos (dependiendo del servidor)

Factores que afectan:
- Velocidad de respuesta del servidor objetivo
- Latencia de red
- Configuración de concurrencia (MAX_PARALLEL_REQUESTS)
- Tiempo de timeout configurado

## Casos de Uso

1. **SEO Health Checks**: Verificación regular de integridad de sitemaps
2. **Pre-deployment Validation**: Verificar URLs antes de deploy
3. **Broken Link Detection**: Identificar enlaces rotos automáticamente
4. **CI/CD Pipeline**: Integración en pipeline de automatización
5. **Monitoring**: Monitoreo continuo de salud del sitio
6. **Disaster Recovery**: Verificar links después de migraciones
7. **Content Validation**: Asegurar que URLs actualizadas funcionan
8. **Load Testing**: Base para pruebas de carga (con modificaciones)

## Próximos Pasos Después de Implementación

1. Agregar autenticación (Basic Auth, OAuth) si es necesario
2. Implementar caché de resultados
3. Agregar notificaciones (Slack, email)
4. Crear dashboard web para visualizar histórico
5. Agregar soporte para múltiples sitemaps simultáneamente
6. Implementar validación de contenido (meta tags, H1, etc.)
7. Agregar detectores de redirect chains
8. Crear reportes de tendencias

## Tecnologías Utilizadas

- **Node.js**: Runtime JavaScript
- **Axios**: Cliente HTTP moderno
- **xml2js**: Parser XML robusto
- **p-limit**: Control de concurrencia
- **Winston**: Logger profesional
- **Handlebars**: Templating HTML
- **Chalk**: Colores en terminal
- **Jest**: Framework de testing
- **CLI Progress**: Barras de progreso

## Referencias y Estándares

- [Sitemap XML Protocol](https://www.sitemaps.org/)
- [HTTP Status Codes](https://httpwg.org/specs/rfc9110.html#status.codes)
- [Node.js Best Practices](https://nodejs.org/en/docs/)
- [ES2020 Async/Await](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/async_function)
