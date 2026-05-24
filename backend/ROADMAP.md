# 🚀 Project Antigravity - System Architecture & Roadmap

## 1. Arquitectura del Proyecto

Para asegurar la **escalabilidad**, **mantenibilidad** y cumplir con el **Principio Open/Closed (OCP)** de SOLID, dividiremos la aplicación en distintas capas lógicas.

### Estructura de Directorios

```text
backend/
├── src/
│   ├── index.ts                 # Punto de entrada y orquestador API (Express o Fastify)
│   ├── config/                  # Configuraciones (Playwright, puertos, variables de entorno)
│   ├── interfaces/              # Interfaces y Tipos de TypeScript (IProduct, IScraper)
│   ├── controllers/             # Controladores de la pasarela API REST (SearchController)
│   ├── services/                # Lógica de orquestación y paralelización
│   ├── scrapers/                # Motores de extracción de datos
│   │   ├── base/                # ScraperBase (clase abstracta)
│   │   ├── implementations/     # Scrapers específicos (Mercadona, HiperDino, Carrefour, Lidl, Aldi)
│   │   └── strategies/          # Estrategias anti-bot, stealth y utilidades Playwright
│   ├── utils/                   # Helpers globales (PriceNormalizer, TextCleaner)
│   └── middlewares/             # Manejo de Errores, Logs y Validadores
├── package.json
└── tsconfig.json
```

### Principios Fundamentales
* **Abstracción OCP**: Todo supermercado tendrá su propia clase en `implementations/` que extenderá de `ScraperBase` e implementará una interfaz `IScraper`. Al añadir un nuevo supermercado, solo crearemos un nuevo archivo y lo añadiremos al inyector, sin alterar el código de los endpoints o el orquestador principal.
* **Inyección de Dependencias**: El controlador inyectará dinámicamente el array de scrapers al servicio buscador.

---

## 2. Fases de Implementación

### Fase 1: Core & Setup (Arquitectura Base)
- Inicializar proyecto: `Node.js`, `TypeScript`, y `Express` (o `Fastify` para mayor throughput con manejo del loop asíncrono).
- Integración de **Playwright**.
- Implementar **Browser Context Reuse**:
  - Lanzar **1 única instancia de Browser** al iniciar el backend y tenerla lista.
  - Al realizar un `GET /search`, el orquestador creará de forma aislada N contextos rápidos (`browser.newContext()`) y al finalizar, los destruirá, economizando RAM y CPU brutalmente frente a lanzar Browsers cada vez.
- Definir abstracciones: Interface `IProduct` unitaria (id, name, originalPrice, pricePerUnit, supermarket, image).

### Fase 2: Scrapers "Fáciles" (Bajo bloqueo)
- **HiperDino**: 
  - Extracción tradicional de DOM al ser HTML menos interactivo-SPA.
  - Mapeo de listados de productos, resolviendo la paginación base.
  - Implementación inicial de selectores XPath y CSS funcionales.

### Fase 3: Scrapers "Difíciles" (SPA, Protección Bot y Sesiones)
- **Mercadona** (SPA React/Next):
  - Reto: Exige proveer un Código Postal antes de buscar.
  - Estrategia: Automatizar inyección silenciosa del CP **35010** mediante escritura forzada en el LocalStorage y SessionStorage del `BrowserContext` de Playwright, refrescando la página, con el fin de ahorrarnos la apertura de los modales y esperar la hidratación.
- **Carrefour** (Protección Anti-bot Akamai/Datadome):
  - Estrategia: Implementar plugins como `puppeteer-extra-plugin-stealth` compatible con Playwright (`playwright-extra`). Configurar huellas indetectables (WebGL, WebRTC leaks, Canvas fingerprinting).
- **Lidl y Aldi**:
  - Reto: Ecosistema basado mayormente en catálogos semanales rotativos más que tienda online clásica en Canarias.
  - Estrategia: Scrapeo estructurado de secciones de promociones para emparejar keywords.

### Fase 4: API & Normalización de Datos
- **Agregador Paralelo (`Promise.allSettled`)**: Iniciar motores simultáneamente al invocar el endpoint `GET /search?q=leche`.
- **Capa Normalizadora (`PriceNormalizer`)**:
  - Calcular equivalente unificado: Siempre ofrecer formato de "Precio Base vs Precio por Kilo/Litro/Unidad" procesando las denominaciones dispares de cada supermercado.
  - Adaptabilidad y mapeo de textos confusos para separar **IGIC** de alusiones genéricas al IVA peninsular.

---

## 3. Estrategias Anti-Bloqueo y Rendimiento

1. **Eficiencia Extrema con `page.route()`**:
   Uso obsesivo del API Route de Playwright para interceptar y **BLOQUEAR** la descarga de assets innecesarios (Imágenes pesadas, fuentes WOFF, CSS que no sean críticos, trackers de analíticas como Google Tags/Hotjar). Buscamos tiempos de carga < 1 segundo para los HTML puros.
2. **Rotación de Identidades**:
   Capa de middlewares de Playwright para inyectar un **User-Agent** aleatorio contemporáneo (rotando entre Chrome/Windows, Safari/MacOS, o Mobile dependiendo del éxito) y headers limpios.
3. **Delays Aleatorios (Humanización)**:
   Inyección de tiempos de espera minúsculos aleatorizados (`Math.random()`) entre el tipeo de letras en barras de búsqueda, o un pequeño scroll/mousemove para las webs más agresivas como Carrefour, apaciguando motores de verificación.

---

## 4. Gestión de Errores y Resiliencia

- **Diseño Fail-Safe con Degradación Elegante**:
  La API **no debe devolver HTTP 500** si falla 1 supermercado. `Promise.allSettled` nos permite capturar el fallo particular de Carrefour por un Timeout y servir con éxito el JSON con los otros 4 supermercados, aportando advertencias en el cuerpo principal (`warnings: ["Carrefour scraper failed to resolve DOM format"]`).
- **Resiliencia de Selectores**:
  Jamás depender de las clases generadas automáticamente en frameworks (e.g., `class="jsx-18939"`). Usar anclas semánticas, etiquetas universales o atributos como `data-testid` y `aria-label`.
- **Patrón "Circuit Breaker"**:
  Si el Scraper de Mercadona produce error 5 veces seguidas de manera global (por ej. si cambiaron drásticamente su DOM y los selectores fallaron), se "abrirá el circuito" para parar de hacer peticiones a esa web, salvando recursos del servidor hasta que sea reparado.
