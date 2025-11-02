# 📊 ACTUALIZACIÓN POST-AUDITORÍA - BASE DE DATOS

**Fecha de análisis:** 2025-11-01  
**Archivo analizado:** `database/definitivo.sql` (2454 líneas)  
**Hallazgos:** Nuevas tablas del módulo comercial implementadas

---

## 🎯 RESUMEN EJECUTIVO

Después de revisar `definitivo.sql`, se ha encontrado que **YA EXISTE** la infraestructura completa del **módulo comercial** en la base de datos. Las tablas y procedimientos almacenados para Categorías, Productos, Inventario, Ventas y Reportes están completamente implementados.

### Estado de Implementación:
- ✅ **Base de Datos:** 100% implementada (esquema `com`)
- ❌ **Backend (server.js):** 0% implementado (sin endpoints)
- ❌ **Frontend (dashboard-app.js):** Mock data, sin integración

---

## 🗄️ NUEVAS TABLAS ENCONTRADAS (Esquema `com`)

### 1. **com.tbCategoria** - Categorías de Productos
```sql
IdCategoria   INT IDENTITY(1,1) PRIMARY KEY
Nombre        VARCHAR(100) NOT NULL UNIQUE
Descripcion   VARCHAR(200) NULL
Activo        BIT NOT NULL DEFAULT 1
FechaRegistro DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
```
**Estado:** ✅ Tabla completa con restricciones
**Relaciones:** N:N con `com.tbProducto` a través de `com.tbProductoCategoria`

---

### 2. **com.tbProducto** - Catálogo de Productos
```sql
IdProducto     INT IDENTITY(1,1) PRIMARY KEY
Codigo         VARCHAR(30) NOT NULL UNIQUE
Nombre         VARCHAR(120) NOT NULL
Descripcion    VARCHAR(400) NULL
PrecioCosto    DECIMAL(10,2) NOT NULL
PrecioVenta    DECIMAL(10,2) NOT NULL
Descuento      DECIMAL(6,2) NOT NULL DEFAULT 0
Estado         BIT NOT NULL DEFAULT 1
FechaRegistro  DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
```
**Estado:** ✅ Tabla completa con índices
**Índices:**
- `IX_tbProducto_Nombre` (búsquedas)
- `IX_tbProducto_Codigo` UNIQUE (validación)

---

### 3. **com.tbProductoCategoria** - Relación N:N Producto-Categoría
```sql
IdProducto   INT NOT NULL FK -> com.tbProducto
IdCategoria  INT NOT NULL FK -> com.tbCategoria
PRIMARY KEY (IdProducto, IdCategoria)
```
**Estado:** ✅ Tabla de relación con constraints
**Propósito:** Un producto puede tener múltiples categorías

---

### 4. **com.tbStock** - Existencias Actuales (Materializada)
```sql
IdProducto         INT PRIMARY KEY FK -> com.tbProducto
Existencia         INT NOT NULL DEFAULT 0
FechaActualizacion DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
```
**Estado:** ✅ Tabla con trigger automático
**Actualización:** Trigger `com.trg_ActualizarStock_Inventario` actualiza automáticamente

---

### 5. **com.tbInventario** - Movimientos de Inventario
```sql
IdMovimiento    BIGINT IDENTITY(1,1) PRIMARY KEY
IdProducto      INT NOT NULL FK -> com.tbProducto
Cantidad        INT NOT NULL
Tipo            VARCHAR(20) NOT NULL -- 'ENTRADA', 'SALIDA', 'VENTA', 'COMPRA', 'AJUSTE'
Usuario         VARCHAR(50) NOT NULL
FechaMovimiento DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
Observacion     VARCHAR(500) NULL
```
**Estado:** ✅ Tabla con índices de rendimiento
**Índice:** `IX_tbInventario_IdProducto_Fecha` (consultas rápidas de historial)

---

### 6. **com.tbVenta** - Registro de Ventas
```sql
IdVenta        BIGINT IDENTITY(1,1) PRIMARY KEY
Usuario        VARCHAR(50) NOT NULL
FechaVenta     DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
Subtotal       DECIMAL(12,2) NOT NULL
DescuentoTotal DECIMAL(12,2) NOT NULL DEFAULT 0
Total          DECIMAL(12,2) NOT NULL
Observacion    VARCHAR(500) NULL
```
**Estado:** ✅ Tabla con índices de fecha
**Índice:** `IX_tbVenta_FechaVenta` (reportes por periodo)

---

### 7. **com.tbDetalleVenta** - Ítems de Cada Venta
```sql
IdDetalle      BIGINT IDENTITY(1,1) PRIMARY KEY
IdVenta        BIGINT NOT NULL FK -> com.tbVenta
IdProducto     INT NOT NULL FK -> com.tbProducto
Cantidad       INT NOT NULL
PrecioUnitario DECIMAL(10,2) NOT NULL
Descuento      DECIMAL(10,2) NOT NULL DEFAULT 0
```
**Estado:** ✅ Tabla con trigger automático
**Trigger:** `com.trg_RegistrarVenta_DescontarStock` descuenta inventario automáticamente

---

## 🔧 TRIGGERS IMPLEMENTADOS

### 1. `com.trg_ActualizarStock_Inventario`
- **Dispara:** AFTER INSERT en `com.tbInventario`
- **Acción:** Actualiza `com.tbStock` automáticamente usando MERGE
- **Lógica:** Suma/resta cantidad según tipo de movimiento

### 2. `com.trg_RegistrarVenta_DescontarStock`
- **Dispara:** AFTER INSERT en `com.tbDetalleVenta`
- **Acción:** Crea movimiento tipo 'VENTA' en `com.tbInventario`
- **Efecto en cascada:** Dispara trigger anterior que actualiza `com.tbStock`

---

## 📊 PROCEDIMIENTOS ALMACENADOS COMERCIALES

### Sección 1: CRUD para Categorías (5 procedimientos) ✅ AGREGADOS

| Procedimiento | Descripción | Estado |
|---------------|-------------|--------|
| `com.sp_ListarCategorias` | Lista categorías (filtro activas/todas) | ✅ AGREGADO |
| `com.sp_ObtenerCategoria` | Obtiene una categoría por ID | ✅ AGREGADO |
| `com.sp_CrearCategoria` | Crea nueva categoría con bitácora | ✅ AGREGADO |
| `com.sp_ActualizarCategoria` | Actualiza categoría existente | ✅ AGREGADO |
| `com.sp_EliminarCategoria` | Elimina física/lógicamente una categoría | ✅ AGREGADO |

**Características**:
- Parámetro `@Usuario` para trazabilidad
- Validación de duplicados por nombre
- Registro en `seg.tbBitacoraTransacciones`
- Eliminación lógica (desactivar) o física
- Validación de productos asociados antes de eliminar

---

### Sección 2: CRUD para Productos (7 procedimientos) ✅ AGREGADOS

| Procedimiento | Descripción | Estado |
|---------------|-------------|--------|
| `com.sp_ListarProductos` | Lista con paginación, búsqueda y filtros | ✅ AGREGADO |
| `com.sp_ObtenerProducto` | Obtiene producto con categorías asociadas | ✅ AGREGADO |
| `com.sp_CrearProducto` | Crea producto e inicializa stock en 0 | ✅ AGREGADO |
| `com.sp_ActualizarProducto` | Actualiza datos del producto | ✅ AGREGADO |
| `com.sp_AsignarCategoriaProducto` | Asigna categoría a producto | ✅ AGREGADO |
| `com.sp_QuitarCategoriaProducto` | Quita categoría de producto | ✅ AGREGADO |
| `com.sp_EliminarProducto` | Elimina física/lógicamente un producto | ✅ AGREGADO |

**Características**:
- Paginación (`@Pagina`, `@TamanoPagina`)
- Búsqueda por código o nombre
- Filtro por categoría
- Validación precio costo vs precio venta
- Advertencia si precio venta < precio costo
- Inicialización automática en `com.tbStock`
- Gestión de relación N:M con categorías
- Protección contra eliminación con ventas

---

### Sección 3: Gestión de Inventario (2 procedimientos) ✅ AGREGADOS

| Procedimiento | Descripción | Estado |
|---------------|-------------|--------|
| `com.sp_RegistrarMovimientoInventario` | Registra entrada/salida/ajuste/compra | ✅ AGREGADO |
| `com.sp_ConsultarStock` | Consulta stock con nivel (CRITICO/BAJO/NORMAL) | ✅ AGREGADO |

**Características**:
- Tipos de movimiento: `ENTRADA`, `SALIDA`, `AJUSTE`, `COMPRA`
- Validación de stock para salidas
- Integración con trigger `trg_ActualizarStock_Inventario` (actualiza `tbStock`)
- Indicador de nivel de stock configurable
- Usuario y observación para trazabilidad

---

### Sección 4: Gestión de Ventas (3 procedimientos) ✅ AGREGADOS

| Procedimiento | Descripción | Estado |
|---------------|-------------|--------|
| `com.sp_RegistrarVenta` | Registra venta completa (cabecera + detalle JSON) | ✅ AGREGADO |
| `com.sp_ListarVentas` | Lista ventas con paginación y filtros de fecha | ✅ AGREGADO |
| `com.sp_ObtenerDetalleVenta` | Obtiene cabecera e items de una venta | ✅ AGREGADO |

**Características**:
- Recibe detalle en formato JSON con `OPENJSON`
- Validación de stock antes de registrar
- Cálculo automático de subtotales y total
- Transacción completa (rollback si falla)
- Integración con trigger `trg_RegistrarVenta_DescontarStock`
- Filtros por rango de fechas y usuario
- Paginación de resultados

---

### Sección 5: Procedimientos de Reportes (4 procedimientos) ✅ EXISTENTES

### 1. `com.sp_ReporteVentasPorFecha`
```sql
PARAMETERS:
  @FechaInicio   DATETIME2
  @FechaFin      DATETIME2
  @Usuario       VARCHAR(50) = NULL (opcional)
  @IdCategoria   INT = NULL (opcional)

RETURNS:
  IdVenta, FechaVenta, Usuario, Subtotal, DescuentoTotal, Total,
  IdProducto, CodigoProducto, NombreProducto, Cantidad, 
  PrecioUnitario, Descuento, Categorias (agregadas con STRING_AGG)
```
**Propósito:** Reporte de ventas filtrado por rango de fechas, usuario y categoría

---

### 2. `com.sp_ReporteInventarioActual`
```sql
PARAMETERS:
  @IdProducto  INT = NULL (opcional)
  @IdCategoria INT = NULL (opcional)
  @UltimosMov  INT = 50 (cantidad de movimientos recientes)

RETURNS:
  Result Set 1: Inventario actual (IdProducto, Codigo, Nombre, Existencia, PrecioCosto, PrecioVenta)
  Result Set 2: Últimos N movimientos de inventario
```
**Propósito:** Consulta de stock actual y historial reciente

---

### 3. `com.sp_ReporteProductosMasVendidos`
```sql
PARAMETERS:
  @TopN         INT = 10 (cantidad de productos a retornar)
  @FechaInicio  DATETIME2 = NULL (opcional)
  @FechaFin     DATETIME2 = NULL (opcional)

RETURNS:
  IdProducto, Codigo, Nombre, TotalVendido, TotalIngreso
```
**Propósito:** Top N productos más vendidos (con o sin rango de fechas)

---

### 4. `com.sp_ReporteIngresosTotales`
```sql
PARAMETERS:
  @Anio  INT (año a consultar)
  @Mes   INT = NULL (opcional, si NULL retorna por mes del año)

RETURNS:
  Si @Mes es NULL: Ingresos mensuales del año
  Si @Mes tiene valor: Ingresos diarios del mes
```
**Propósito:** Reportes de ingresos por periodo (anual/mensual)

---

## 🔐 PERMISOS Y ROLES CONFIGURADOS

### Rol: `admin` (completo)
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::com TO rol_admin_app;
GRANT EXECUTE ON SCHEMA::com TO rol_admin_app;
```
**Permisos:** Acceso total a todas las tablas y procedimientos

---

### Rol: `secretaria` (solo lectura y reportes)
```sql
GRANT SELECT ON com.tbVenta TO rol_secretaria_app;
GRANT SELECT ON com.tbDetalleVenta TO rol_secretaria_app;
GRANT SELECT ON com.tbProducto TO rol_secretaria_app;
GRANT SELECT ON com.tbCategoria TO rol_secretaria_app;
GRANT SELECT ON com.tbStock TO rol_secretaria_app;
GRANT SELECT ON com.tbInventario TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteVentasPorFecha TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteInventarioActual TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteProductosMasVendidos TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteIngresosTotales TO rol_secretaria_app;
```
**Permisos:** Solo lectura de tablas + ejecución de reportes

---

### Rol: `vendedor` (NUEVO - solo CRUD)
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbProducto TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbCategoria TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbInventario TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbVenta TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbDetalleVenta TO rol_vendedor_app;
GRANT SELECT ON com.tbStock TO rol_vendedor_app;
```
**Permisos:** CRUD completo en tablas comerciales, pero SIN acceso a reportes

---

## 📋 DATOS DE PRUEBA INCLUIDOS

El script incluye datos de prueba para validar la implementación:

### Categorías insertadas:
1. Papelería
2. Electrónica
3. Oficina

### Productos insertados:
1. **PEN-001:** Bolígrafo Azul ($1.00 costo, $2.00 venta)
2. **USB-001:** Memoria USB 16GB ($10.00 costo, $15.00 venta)
3. **NOTE-001:** Cuaderno Grande ($2.50 costo, $5.00 venta)

### Stock inicial:
- PEN-001: 100 unidades
- USB-001: 40 unidades
- NOTE-001: 60 unidades

### Movimientos de inventario:
- Entrada: 50 bolígrafos (reposición)
- Entrada: 20 memorias USB (stock inicial)

### Venta de prueba:
- 2 bolígrafos
- 1 memoria USB
- Total: $10.00

---

## ⚠️ INCONSISTENCIAS ENCONTRADAS

### 1. Tablas Duplicadas
El archivo `definitivo.sql` contiene **definiciones duplicadas** de las mismas tablas:
- Líneas 27-99: Primera definición de tablas `seg.*`
- Líneas 1479-1544: Segunda definición de tablas `seg.*` (duplicado)

**Recomendación:** Eliminar duplicados en limpieza futura del script.

---

### 2. Constraint CHECK Duplicado
```sql
-- Línea 2319: Intenta eliminar constraint genérico
ALTER TABLE seg.tbUsuario DROP CONSTRAINT [CK__tbUsuario__Rol__...];

-- Línea 2323: Crea nuevo constraint
ALTER TABLE seg.tbUsuario ADD CONSTRAINT CK_tbUsuario_Rol 
  CHECK (Rol IN ('admin','secretaria','vendedor'));

-- Línea 2381: Vuelve a eliminar
ALTER TABLE seg.tbUsuario DROP CONSTRAINT CK_tbUsuario_Rol;

-- Línea 2382: Vuelve a crear
ALTER TABLE seg.tbUsuario ADD CONSTRAINT CK_tbUsuario_Rol 
  CHECK (Rol IN ('admin','secretaria','vendedor'));
```

**Problema:** Lógica redundante  
**Impacto:** Ninguno (funciona correctamente, solo código duplicado)

---

## 🎯 CONCLUSIONES Y PRÓXIMOS PASOS

### ✅ Lo que YA está implementado (ACTUALIZADO):
1. **Esquema completo** del módulo comercial (`com`)
2. **7 tablas** con relaciones, índices y constraints
3. **2 triggers** para actualización automática de stock
4. **17 procedimientos CRUD** para categorías, productos, inventario y ventas ✅ AGREGADOS
5. **4 procedimientos** almacenados para reportes
6. **Permisos configurados** para 3 roles (admin, secretaria, vendedor)
7. **Datos de prueba** para validación

**TOTAL PROCEDIMIENTOS COMERCIALES: 21 procedimientos**

### ⏳ Lo que FALTA implementar:

#### Backend (server.js y src/):
- [ ] Crear `src/controllers/categorias.controller.js` - 5 endpoints (GET list/id, POST, PUT, DELETE)
- [ ] Crear `src/routes/categorias.routes.js` - Rutas para `/api/categorias`
- [ ] Crear `src/services/categorias.service.js` - Llamadas a los 5 SPs de categorías
- [ ] Completar `src/controllers/productos.controller.js` - 7 endpoints (CRUD + asignar/quitar categoría)
- [ ] Completar `src/routes/productos.routes.js` - Rutas para `/api/productos`
- [ ] Completar `src/services/productos.service.js` - Llamadas a los 7 SPs de productos
- [ ] Crear `src/controllers/inventario.controller.js` - 2 endpoints (registrar movimiento, consultar stock)
- [ ] Crear `src/routes/inventario.routes.js` - Rutas para `/api/inventario`
- [ ] Crear `src/services/inventario.service.js` - Llamadas a los 2 SPs de inventario
- [ ] Crear `src/controllers/ventas.controller.js` - 3 endpoints (registrar, listar, detalle)
- [ ] Crear `src/routes/ventas.routes.js` - Rutas para `/api/ventas`
- [ ] Crear `src/services/ventas.service.js` - Llamadas a los 3 SPs de ventas (con JSON parsing)
- [ ] Crear `src/controllers/reportes.controller.js` - 4 endpoints (ventas por fecha, inventario, top productos, ingresos)
- [ ] Crear `src/routes/reportes.routes.js` - Rutas para `/api/reportes`
- [ ] Middleware de validación de roles comerciales
- [ ] Registro en bitácora de transacciones comerciales

#### Frontend (dashboard-app.js):
- [ ] Reemplazar `DASHBOARD_DATA` mock (líneas 103-3184) con llamadas a API
- [ ] Módulo Categorías: Conectar formularios a `/api/categorias` (448 líneas)
- [ ] Módulo Productos: Conectar formularios a `/api/productos` (1189 líneas)
- [ ] Módulo Inventario: Conectar a `/api/inventario` (212 líneas)
- [ ] Módulo Ventas: Conectar sistema POS a `/api/ventas` (224 líneas)
- [ ] Módulo Reportes: Conectar a `/api/reportes` (571 líneas)

---

## 📝 ACTUALIZACIÓN DE COMENTARIOS CLEAR EN CÓDIGO

Basándome en estos hallazgos, actualizaré los comentarios CLEAR en el frontend para reflejar que:

1. ✅ Las tablas **SÍ EXISTEN** en la base de datos
2. ✅ Los procedimientos almacenados **ESTÁN LISTOS**
3. ❌ Lo que falta es **implementar los endpoints en server.js**
4. ❌ Y **conectar el frontend con esos endpoints**

---

## 📊 MATRIZ DE IMPLEMENTACIÓN ACTUALIZADA (POST-AGREGACIÓN DE SPs)

| Componente | Base de Datos | Backend | Frontend | Estado General |
|------------|---------------|---------|----------|----------------|
| **Usuarios** | ✅ 100% | ✅ 100% | ✅ 100% | **✅ COMPLETO** |
| **Bitácoras** | ✅ 100% | ✅ 100% | ⚠️ 70% | **⚠️ FUNCIONAL** |
| **Categorías** | ✅ 100% (5 SPs) | ⏳ 0% | ⏳ 0% (listo) | **⏳ BD LISTA** |
| **Productos** | ✅ 100% (7 SPs) | ⏳ 0% | ⏳ 0% (listo) | **⏳ BD LISTA** |
| **Inventario** | ✅ 100% (2 SPs) | ⏳ 0% | ⏳ 0% (listo) | **⏳ BD LISTA** |
| **Ventas** | ✅ 100% (3 SPs) | ⏳ 0% | ⏳ 0% (listo) | **⏳ BD LISTA** |
| **Reportes** | ✅ 100% (4 SPs) | ⏳ 0% | ⏳ 0% (listo) | **⏳ BD LISTA** |

**Leyenda**:
- ✅ Implementado y funcional
- ⏳ Pendiente de implementación (frontend tiene código listo con mock data)
- ⚠️ Funcional pero incompleto

---

## 🚀 PLAN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Backend - Controllers, Services y Routes (Prioridad ALTA) ⏳
**Objetivo**: Conectar los 21 procedimientos almacenados con endpoints REST

#### 1.1. Módulo Categorías
```
src/controllers/categorias.controller.js  → Crear 5 métodos (list, getById, create, update, delete)
src/services/categorias.service.js       → Llamar sp_ListarCategorias, sp_ObtenerCategoria, etc.
src/routes/categorias.routes.js          → GET /api/categorias, POST /api/categorias, etc.
```

#### 1.2. Módulo Productos  
```
src/controllers/productos.controller.js  → Completar con 7 métodos (list, getById, create, update, delete, assignCategory, removeCategory)
src/services/productos.service.js        → Llamar sp_ListarProductos, sp_CrearProducto, sp_AsignarCategoriaProducto, etc.
src/routes/productos.routes.js           → Completar rutas existentes
```

#### 1.3. Módulo Inventario
```
src/controllers/inventario.controller.js → Crear 2 métodos (registerMovement, consultStock)
src/services/inventario.service.js       → Llamar sp_RegistrarMovimientoInventario, sp_ConsultarStock
src/routes/inventario.routes.js          → POST /api/inventario/movimiento, GET /api/inventario/stock
```

#### 1.4. Módulo Ventas
```
src/controllers/ventas.controller.js     → Crear 3 métodos (register, list, getDetail)
src/services/ventas.service.js           → Llamar sp_RegistrarVenta (JSON parsing), sp_ListarVentas, sp_ObtenerDetalleVenta
src/routes/ventas.routes.js              → POST /api/ventas, GET /api/ventas, GET /api/ventas/:id
```

#### 1.5. Módulo Reportes
```
src/controllers/reportes.controller.js   → Crear 4 métodos (salesByDate, currentInventory, topProducts, totalRevenue)
src/services/reportes.service.js         → Llamar sp_ReporteVentasPorFecha, etc.
src/routes/reportes.routes.js            → GET /api/reportes/ventas, /inventario, /top-productos, /ingresos
```

#### 1.6. Integración en server.js
```javascript
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);
```

**Validación**: Probar con Postman/Thunder Client antes de conectar frontend

---

### Fase 2: Frontend - Conexión con API Real (Prioridad MEDIA) ⏳
**Objetivo**: Reemplazar mock data con llamadas a endpoints implementados

#### 2.1. Refactorizar módulos en dashboard-app.js
```javascript
// Líneas 687-1134: Categorías → Cambiar DASHBOARD_DATA.categorias por fetch('/api/categorias')
// Líneas 1135-2323: Productos → Cambiar DASHBOARD_DATA.productos por fetch('/api/productos')
// Líneas 1902-2113: Inventario → Usar fetch('/api/inventario/movimiento') y '/stock'
// Líneas 2114-2337: Ventas → Usar fetch('/api/ventas') con JSON body
// Líneas 1310-1880: Reportes → Usar fetch('/api/reportes/*') con parámetros
```

#### 2.2. Actualizar ApiService.js
```javascript
// Agregar métodos específicos:
getCategorias(), createCategoria(data), updateCategoria(id, data), deleteCategoria(id)
getProductos(params), createProducto(data), assignCategory(productId, categoryId)
registerInventoryMovement(data), getStock(productId)
registerSale(data), getSales(params), getSaleDetail(id)
getReports(type, params)
```

#### 2.3. Eliminar mock data
```javascript
// Eliminar líneas 103-3184 de DASHBOARD_DATA en dashboard-app.js
```

**Validación**: Probar flujo completo en navegador

---

### Fase 3: Pruebas Integradas (Prioridad ALTA) ⏳
1. ✅ Crear categoría "Tecnología" → Verificar en base de datos
2. ✅ Crear producto "Laptop HP" → Asignar a "Tecnología" → Verificar stock inicial en 0
3. ✅ Registrar entrada inventario +10 unidades → Validar trigger actualiza tbStock
4. ✅ Registrar venta de 2 laptops → Validar trigger descuenta stock a 8
5. ✅ Generar reporte ventas por fecha → Validar datos coinciden
6. ✅ Validar permisos: admin (full), secretaria (solo read+reports), vendedor (CRUD sin reports)

---

**Fecha de actualización:** 2025-01-[FECHA_ACTUAL]  
**Estado actual:** ✅ BASE DE DATOS COMPLETA (21 SPs CRUD + 4 Reportes)  
**Próxima acción:** Implementar Fase 1 (Backend Controllers/Services/Routes)
