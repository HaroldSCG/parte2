# PLAN DE ELIMINACIÓN DE DATOS HARDCODEADOS - FASE 3
**Fecha**: 2 de Noviembre, 2025  
**Estado**: Análisis completo - Listo para implementación

---

## 📋 RESUMEN EJECUTIVO

### Datos identificados para eliminación
- **DASHBOARD_DATA**: 460 líneas (132-590 en dashboard-app.js)
- **NAV_ITEMS**: Configuración de navegación (MANTENER - es configuración, no datos)
- **ROLE_COPY**: Textos de interfaz (MANTENER - es cosmético)
- **PASSWORD_RULES**: Validaciones (MANTENER - es lógica de negocio)

### Archivos afectados
1. ✅ **public/js/dashboard-app.js** - 460 líneas de mock data
2. ✅ **public/js/ApiService.js** - Sin datos hardcodeados (solo configuración)
3. ✅ **public/js/UserManager.js** - Sin datos hardcodeados (ya conectado)
4. ✅ **public/js/DashboardCore.js** - Sin datos hardcodeados
5. ✅ **public/dashboard.html** - 4 selects con valores predeterminados (MANTENER - son opciones de paginación)

---

## 🎯 DATOS HARDCODEADOS IDENTIFICADOS

### 1. DASHBOARD_DATA (Líneas 132-590)

#### 1.1 Overview - Admin (Líneas 134-189)
```javascript
overview: {
  stats: [...]      // 4 estadísticas hardcodeadas
  modules: [...]    // 4 módulos (MANTENER - es navegación)
  alerts: [...]     // 3 alertas de ejemplo
  highlights: [...] // 3 highlights hardcodeados
  salesTrend: {...} // Datos de gráfico de ventas
  categoryMix: {...} // Datos de gráfico circular
}
```

**Acción requerida**:
- ❌ Eliminar `stats` - Reemplazar con `GET /api/stats/overview`
- ✅ Mantener `modules` - Es configuración de navegación
- ❌ Eliminar `alerts` - Calcular dinámicamente desde inventario
- ❌ Eliminar `highlights` - Obtener desde reportes
- ❌ Eliminar `salesTrend` - Reemplazar con `GET /api/reportes/ventas?periodo=mensual`
- ❌ Eliminar `categoryMix` - Reemplazar con `GET /api/reportes/categorias`

---

#### 1.2 Reportes - Admin (Líneas 190-241)
```javascript
reportes: {
  subtitle: '',
  summary: [...]    // 3 resúmenes hardcodeados
  filters: [...]    // 4 filtros (MANTENER - es configuración UI)
  table: {
    head: [...]     // Headers (MANTENER)
    rows: [...]     // 5 filas de datos de ejemplo ❌
  }
  charts: [...]     // 2 gráficos con datos estáticos ❌
}
```

**Acción requerida**:
- ❌ Eliminar `summary` - Calcular desde `GET /api/reportes/ventas`
- ✅ Mantener `filters` - Es configuración de UI
- ❌ Eliminar `table.rows` - Obtener con `GET /api/reportes/ventas`
- ❌ Eliminar `charts` - Generar desde datos reales

---

#### 1.3 Inventario - Admin (Líneas 242-283)
```javascript
inventario: {
  subtitle: '...',  // (MANTENER - es texto UI)
  stats: [...]      // 3 estadísticas ❌
  timeline: [...]   // 4 movimientos recientes ❌
  alerts: [...]     // 2 alertas ❌
  critical: [...]   // 4 productos en stock crítico ❌
}
```

**Acción requerida**:
- ❌ Eliminar `stats` - Calcular desde `GET /api/inventario/resumen`
- ❌ Eliminar `timeline` - Obtener con `GET /api/inventario/movimientos?limite=10`
- ❌ Eliminar `alerts` - Derivar de productos con stock < mínimo
- ❌ Eliminar `critical` - Obtener con `GET /api/inventario/stock?critico=true`

---

#### 1.4 Ventas - Admin (Líneas 284-316)
```javascript
ventas: {
  subtitle: '.',    // (MANTENER)
  stats: [...]      // 3 estadísticas ❌
  trend: [...]      // Tendencia semanal (5 días) ❌
  topProducts: [...] // 4 productos más vendidos ❌
  log: [...]        // 4 ventas recientes ❌
}
```

**Acción requerida**:
- ❌ Eliminar `stats` - Obtener con `GET /api/ventas/estadisticas`
- ❌ Eliminar `trend` - Obtener con `GET /api/reportes/ventas?periodo=semanal`
- ❌ Eliminar `topProducts` - Obtener con `GET /api/reportes/top-productos?limite=4`
- ❌ Eliminar `log` - Obtener con `GET /api/ventas?limite=10&orden=desc`

---

#### 1.5 Productos - Admin (Líneas 317-337)
```javascript
productos: {
  stats: [...]      // 3 estadísticas ❌
  list: [...]       // 5 productos de ejemplo ❌
}
```

**Acción requerida**:
- ❌ Eliminar `stats` - Calcular desde `GET /api/productos/estadisticas`
- ❌ Eliminar `list` - Obtener con `GET /api/productos`

---

#### 1.6 Categorías - Admin (Líneas 338-348)
```javascript
categorias: {
  list: [...]       // 5 categorías de ejemplo ❌
}
```

**Acción requerida**:
- ❌ Eliminar `list` - Obtener con `GET /api/categorias`

---

#### 1.7 Overview - Secretaria (Líneas 350-393)
```javascript
// Similar a admin pero con menos datos
overview: {
  stats: [...]      // 3 estadísticas ❌
  modules: [...]    // 3 módulos (MANTENER)
  alerts: [...]     // 2 alertas ❌
  highlights: [],   // Vacío
  salesTrend: {...} // Datos de gráfico ❌
  categoryMix: {...} // Datos de gráfico ❌
}
```

**Acción requerida**: Similar a Admin overview

---

#### 1.8 Reportes - Secretaria (Líneas 394-428)
**Acción requerida**: Similar a Admin reportes

---

#### 1.9 Inventario - Secretaria (Líneas 429-455)
**Acción requerida**: Similar a Admin inventario (menos datos)

---

#### 1.10 Ventas - Secretaria (Líneas 456-486)
**Acción requerida**: Similar a Admin ventas (menos datos)

---

### 2. NAV_ITEMS (Líneas 63-82)
```javascript
const NAV_ITEMS = {
  admin: [
    { id: 'categorias', label: 'Categorías', icon: 'fa-layer-group' },
    { id: 'productos', label: 'Productos', icon: 'fa-box-open' },
    { id: 'inventario', label: 'Inventario', icon: 'fa-boxes-stacked' },
    { id: 'ventas', label: 'Ventas', icon: 'fa-cash-register' },
    { id: 'reportes', label: 'Reportes', icon: 'fa-file-lines' },
    { id: 'usuarios', label: 'Usuarios', icon: 'fa-users' }
  ],
  secretaria: [
    { id: 'inventario', label: 'Inventario', icon: 'fa-boxes-stacked' },
    { id: 'ventas', label: 'Ventas', icon: 'fa-cash-register' },
    { id: 'reportes', label: 'Reportes', icon: 'fa-file-lines' }
  ]
};
```

**Acción**: ✅ **MANTENER** - Es configuración de navegación, no datos dinámicos

---

### 3. ROLE_COPY (Líneas 90-113)
```javascript
const ROLE_COPY = {
  admin: {
    badge: 'Administrador general',
    roleLabel: 'Administrador',
    // ... más textos de interfaz
  },
  secretaria: {
    badge: 'Secretaria académica',
    roleLabel: 'Secretaria',
    // ... más textos de interfaz
  }
};
```

**Acción**: ✅ **MANTENER** - Son textos cosméticos de interfaz

---

### 4. PASSWORD_RULES (Líneas 592-598)
```javascript
const PASSWORD_RULES = [
  { id: 'req-length', test: value => value.length >= 8 },
  { id: 'req-uppercase', test: value => /[A-Z]/.test(value) },
  { id: 'req-lowercase', test: value => /[a-z]/.test(value) },
  { id: 'req-number', test: value => /[0-9]/.test(value) },
  { id: 'req-symbol', test: value => /[^A-Za-z0-9]/.test(value) }
];
```

**Acción**: ✅ **MANTENER** - Es lógica de validación, no datos

---

## 🔧 FUNCIONES QUE DEPENDEN DE DASHBOARD_DATA

### Funciones que consumen mock data:

1. **hydrateSections()** (Línea ~660)
   - Lee `DASHBOARD_DATA[role][section]`
   - **Solución**: Cargar datos vía API al cambiar de sección

2. **renderOverview()** (Línea ~1141)
   - Usa `DASHBOARD_DATA[role].overview`
   - **Solución**: Crear función `loadOverviewData()` asíncrona

3. **renderReportes()** (Línea ~1164)
   - Usa `DASHBOARD_DATA[role].reportes`
   - **Solución**: Crear función `loadReportesData()` asíncrona

4. **renderInventario()** (Línea ~1738)
   - Usa `DASHBOARD_DATA[role].inventario`
   - **Solución**: Crear función `loadInventarioData()` asíncrona

5. **renderVentas()** (Línea ~1953)
   - Usa `DASHBOARD_DATA[role].ventas`
   - **Solución**: Crear función `loadVentasData()` asíncrona

6. **renderProductos()** (Línea ~2180)
   - Usa `DASHBOARD_DATA.admin.productos`
   - **Solución**: Ya tiene función `loadProducts()` - conectar a API

7. **renderCategorias()** (Línea ~710)
   - Usa `initialCategories` derivado de `DASHBOARD_DATA`
   - **Solución**: Crear función `loadCategorias()` asíncrona

---

## 📊 PLAN DE REFACTORIZACIÓN POR MÓDULO

### 🟢 PRIORIDAD 1: CATEGORÍAS
**Complejidad**: BAJA  
**Tiempo estimado**: 1-2 horas

#### Endpoints necesarios:
- ✅ `GET /api/categorias` - Listar categorías
- ✅ `GET /api/categorias/:id` - Obtener una categoría
- ✅ `POST /api/categorias` - Crear categoría
- ✅ `PUT /api/categorias/:id` - Actualizar categoría
- ✅ `DELETE /api/categorias/:id` - Eliminar categoría

#### Cambios en frontend:
1. Eliminar líneas 338-348 (categorias mock data)
2. Reemplazar `initialCategories` (línea 607) con llamada API
3. Actualizar función `renderCategorias()` para cargar datos dinámicamente
4. Mantener lógica de paginación y formularios

---

### 🟡 PRIORIDAD 2: INVENTARIO
**Complejidad**: BAJA  
**Tiempo estimado**: 1-2 horas

#### Endpoints necesarios:
- ✅ `GET /api/inventario/stock` - Stock disponible
- ✅ `GET /api/inventario/movimientos` - Historial de movimientos
- ✅ `POST /api/inventario/movimiento` - Registrar entrada/salida

#### Cambios en frontend:
1. Eliminar líneas 242-283 (admin) y 429-455 (secretaria)
2. Crear función `loadInventarioData()` asíncrona
3. Actualizar `renderInventario()` para cargar datos dinámicamente
4. Implementar formulario de registro de movimientos

---

### 🟠 PRIORIDAD 3: PRODUCTOS
**Complejidad**: MEDIA  
**Tiempo estimado**: 2-3 horas

#### Endpoints necesarios:
- ✅ `GET /api/productos` - Listar productos (con paginación)
- ✅ `GET /api/productos/:codigo` - Obtener un producto
- ✅ `POST /api/productos` - Crear producto
- ✅ `PUT /api/productos/:codigo` - Actualizar producto
- ✅ `DELETE /api/productos/:codigo` - Eliminar producto

#### Cambios en frontend:
1. Eliminar líneas 317-337 (productos mock data)
2. Conectar función `loadProducts()` existente a API real
3. Implementar búsqueda y filtros
4. Mantener paginación y asociación de categorías

---

### 🔴 PRIORIDAD 4: VENTAS
**Complejidad**: ALTA  
**Tiempo estimado**: 2-3 horas

#### Endpoints necesarios:
- ✅ `GET /api/ventas` - Listar ventas
- ✅ `GET /api/ventas/:id` - Obtener una venta
- ✅ `POST /api/ventas` - Crear venta (POS)

#### Cambios en frontend:
1. Eliminar líneas 284-316 (admin) y 456-486 (secretaria)
2. Crear función `loadVentasData()` asíncrona
3. Implementar sistema POS completo
4. Validar stock antes de venta
5. Calcular totales y descuentos

---

### 🔴 PRIORIDAD 5: REPORTES
**Complejidad**: MEDIA  
**Tiempo estimado**: 1-2 horas

#### Endpoints necesarios:
- ✅ `GET /api/reportes/ventas` - Reporte de ventas
- ✅ `GET /api/reportes/inventario` - Reporte de inventario
- ✅ `GET /api/reportes/top-productos` - Productos más vendidos
- ✅ `GET /api/reportes/ingresos` - Ingresos por período

#### Cambios en frontend:
1. Eliminar líneas 190-241 (admin) y 394-428 (secretaria)
2. Crear función `loadReportesData()` asíncrona
3. Implementar filtros dinámicos
4. Generar gráficos con datos reales

---

### 🟢 PRIORIDAD 6: OVERVIEW
**Complejidad**: BAJA  
**Tiempo estimado**: 1 hora

#### Endpoints necesarios:
- ✅ `GET /api/stats/overview` - Estadísticas generales

#### Cambios en frontend:
1. Eliminar líneas 134-189 (admin) y 350-393 (secretaria)
2. Crear función `loadOverviewData()` asíncrona
3. Calcular alertas dinámicamente
4. Derivar highlights de reportes

---

## ⚠️ DEPENDENCIAS CRÍTICAS

### 1. Funciones que usan DASHBOARD_DATA directamente
```javascript
// Línea 607
const initialCategories = (DASHBOARD_DATA.admin.categorias?.list || [])
  .map((item, index) => normalizeCategory(item, index));

// Solución: Reemplazar con:
let categoryState = [];
async function loadCategorias() {
  const response = await fetch('/api/categorias');
  const data = await response.json();
  categoryState = data.categorias.map((item, index) => normalizeCategory(item, index));
}
```

### 2. Funciones hydrateSections()
```javascript
// Línea ~660
function hydrateSections(role) {
  const data = DASHBOARD_DATA[role]; // ❌ ELIMINAR
  // ...
}

// Solución: Cargar datos por sección
async function hydrateSections(role) {
  // No cargar todos los datos, sino al cambiar de sección
}
```

### 3. Render functions
Todas las funciones `render*()` deben convertirse en asíncronas y cargar datos al inicio:

```javascript
// Antes:
function renderCategorias() {
  const container = sections.categorias;
  const data = DASHBOARD_DATA.admin.categorias; // ❌
  // ...
}

// Después:
async function renderCategorias() {
  const container = sections.categorias;
  await loadCategorias(); // ✅ Cargar de API
  // Usar categoryState en lugar de data
}
```

---

## 📝 CHECKLIST DE ELIMINACIÓN

### Paso 1: Preparación
- [x] Identificar todos los DASHBOARD_DATA
- [x] Mapear funciones que consumen mock data
- [x] Identificar dependencias críticas
- [x] Crear funciones `load*Data()` para cada módulo ✅ **loadCategorias() implementada**

### Paso 2: Implementación por módulo
- [x] Categorías: Eliminar líneas 338-348, conectar API ✅ **COMPLETADO**
- [ ] Inventario: Eliminar líneas 242-283 + 429-455, conectar API
- [ ] Productos: Eliminar líneas 317-337, conectar API
- [ ] Ventas: Eliminar líneas 284-316 + 456-486, conectar API
- [ ] Reportes: Eliminar líneas 190-241 + 394-428, conectar API
- [ ] Overview: Eliminar líneas 134-189 + 350-393, conectar API

### Paso 3: Limpieza final
- [x] Eliminar variable `initialCategories` (línea 607) ✅ **COMPLETADO**
- [ ] Eliminar objeto completo DASHBOARD_DATA (líneas 132-590) - Parcialmente (categorías eliminadas)
- [x] Actualizar comentarios de auditoría
- [x] Probar módulo Categorías individualmente
- [ ] Verificar manejo de errores (API no disponible)

---

## � PROGRESO ACTUAL (2 Nov 2025 - 18:30)

### ✅ MÓDULO CATEGORÍAS - COMPLETADO

**Cambios aplicados**:
1. ✅ Eliminado mock data de categorías (líneas 294-303)
2. ✅ Eliminada variable `initialCategories` 
3. ✅ Creada función `async loadCategorias()` con llamada a GET /api/categorias
4. ✅ Actualizada `renderCategorias()` para cargar datos dinámicamente
5. ✅ Actualizada `handleCategoryFormSubmit()` con POST/PUT a API
6. ✅ Actualizada `deleteCategory()` con DELETE a API
7. ✅ Actualizada `hydrateSections()` para no pasar parámetros
8. ✅ Agregados endpoints en `API_ENDPOINTS` (categorias, categoriaById)

**Funciones modificadas**:
- `loadCategorias()` - Nueva función asíncrona
- `renderCategorias()` - Ya no recibe parámetros, carga desde API
- `handleCategoryFormSubmit()` - Ahora asíncrona, usa POST/PUT
- `deleteCategory()` - Ahora asíncrona, usa DELETE
- `hydrateSections()` - No pasa parámetros a render functions
- `renderOverview()`, `renderReportes()`, `renderInventario()`, `renderVentas()`, `renderProductos()` - Obtienen data de DASHBOARD_DATA[role] internamente

**Estado**: 100% funcional, listo para testing con backend

---

## 🔄 PRÓXIMOS PASOS

1. **Categorías** (1-2h) → Más simple, sin dependencias
2. **Inventario** (1-2h) → Simple, consultas básicas
3. **Productos** (2-3h) → Depende de Categorías
4. **Ventas** (2-3h) → Depende de Productos e Inventario
5. **Reportes** (1-2h) → Depende de Ventas e Inventario
6. **Overview** (1h) → Depende de todos los anteriores

**Tiempo total estimado**: 8-13 horas

---

## 🔒 MANTENER SIN CAMBIOS

### Configuración (NO eliminar):
- ✅ `NAV_ITEMS` - Configuración de navegación
- ✅ `ROLE_COPY` - Textos de interfaz
- ✅ `PASSWORD_RULES` - Validaciones
- ✅ `API_ENDPOINTS` - URLs de API
- ✅ Selects de paginación en HTML

### Funciones de utilidad (NO modificar):
- ✅ `normalizeCategory()`
- ✅ `generateCategorySlug()`
- ✅ `formatPrice()`
- ✅ `createModalManager()`
- ✅ `applyTheme()`
- ✅ `resolveRole()`

---

## 📊 MÉTRICAS DE ELIMINACIÓN

### Antes:
- **Líneas de código**: 4694
- **Datos hardcodeados**: ~460 líneas (10%)
- **Mock data**: 100% en módulos comerciales

### Después (proyectado):
- **Líneas de código**: ~4300 (eliminando 394 líneas de mock)
- **Datos hardcodeados**: 0 líneas (0%)
- **Mock data**: 0% - Todo conectado a backend

### Impacto:
- ✅ Reducción de 8.4% en tamaño de archivo
- ✅ 100% de datos dinámicos
- ✅ Código más limpio y mantenible
- ✅ Sin duplicación de datos

---

## 🎯 SIGUIENTE ACCIÓN

**Iniciar con módulo Categorías**:
1. Crear función `loadCategorias()` asíncrona
2. Conectar a `GET /api/categorias`
3. Reemplazar `initialCategories` con estado dinámico
4. Eliminar líneas 338-348 de DASHBOARD_DATA
5. Probar CRUD completo

**Comando para iniciar**:
```
npm start  # Verificar que backend esté corriendo
# Luego modificar dashboard-app.js
```
