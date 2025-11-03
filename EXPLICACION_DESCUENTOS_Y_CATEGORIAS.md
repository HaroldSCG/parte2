# 📊 Explicación: Descuentos y Relación Producto-Categoría

## 🎯 Resumen Ejecutivo

El sistema maneja **dos tipos de descuentos** en diferentes niveles:
1. **Descuento a nivel de Producto** (`com.tbProducto.Descuento`) - Define el descuento base del producto
2. **Descuento a nivel de Detalle de Venta** (`com.tbDetalleVenta.Descuento`) - Aplica descuentos específicos por transacción

Además, la relación **Producto-Categoría** es **muchos a muchos** (N:N), permitiendo que un producto pertenezca a múltiples categorías.

---

## 📋 Estructura de Tablas

### 1️⃣ **com.tbProducto** - Tabla de Productos

```sql
CREATE TABLE com.tbProducto (
    IdProducto     INT IDENTITY(1,1) PRIMARY KEY,
    Codigo         VARCHAR(30) NOT NULL UNIQUE,
    Nombre         VARCHAR(120) NOT NULL,
    Descripcion    VARCHAR(400) NULL,
    PrecioCosto    DECIMAL(10,2) NOT NULL,
    PrecioVenta    DECIMAL(10,2) NOT NULL,
    Descuento      DECIMAL(6,2) NOT NULL DEFAULT 0,  -- ⭐ DESCUENTO BASE DEL PRODUCTO
    Estado         BIT NOT NULL DEFAULT 1,
    FechaRegistro  DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
```

**Campo `Descuento`:**
- **Propósito**: Define el porcentaje de descuento predeterminado del producto
- **Tipo**: `DECIMAL(6,2)` - Permite valores como `15.50` (15.50%)
- **Rango**: 0.00 a 100.00 (porcentaje)
- **Uso**: Cuando se agrega un producto al carrito, este descuento puede aplicarse automáticamente
- **Ejemplo**: Si un producto tiene `Descuento = 10.00`, significa 10% de descuento sobre el precio de venta

**Ejemplo de Producto:**
```sql
INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento)
VALUES ('LAP001', 'Laptop HP 15', 'Laptop HP core i5, 8GB RAM', 4500.00, 5500.00, 10.00);
-- Este producto tiene 10% de descuento base
-- Precio final sugerido: 5500 - (5500 * 0.10) = 4950.00
```

---

### 2️⃣ **com.tbCategoria** - Tabla de Categorías

```sql
CREATE TABLE com.tbCategoria (
    IdCategoria   INT IDENTITY(1,1) PRIMARY KEY,
    Nombre        VARCHAR(100) NOT NULL UNIQUE,
    Descripcion   VARCHAR(200) NULL,
    Activo        BIT NOT NULL DEFAULT 1,
    FechaRegistro DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
```

**Ejemplos:**
```sql
INSERT INTO com.tbCategoria (Nombre, Descripcion) VALUES
('Tecnología', 'Productos electrónicos y tecnológicos'),
('Papelería', 'Artículos de oficina y escritura'),
('Librería', 'Libros, revistas y material de lectura'),
('Computación', 'Hardware y accesorios de computadora');
```

---

### 3️⃣ **com.tbProductoCategoria** - Relación N:N

```sql
CREATE TABLE com.tbProductoCategoria (
    IdProducto   INT NOT NULL,
    IdCategoria  INT NOT NULL,
    PRIMARY KEY (IdProducto, IdCategoria),
    CONSTRAINT FK_ProductoCategoria_Producto FOREIGN KEY (IdProducto) REFERENCES com.tbProducto(IdProducto),
    CONSTRAINT FK_ProductoCategoria_Categoria FOREIGN KEY (IdCategoria) REFERENCES com.tbCategoria(IdCategoria)
);
```

**Propósito:**
- Permite que **un producto pertenezca a múltiples categorías**
- Permite que **una categoría contenga múltiples productos**

**Ejemplo Práctico:**
```sql
-- Producto: Laptop HP
-- Puede estar en múltiples categorías:
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES
(1, 1),  -- Tecnología
(1, 4);  -- Computación

-- Producto: Mouse Logitech
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES
(2, 1),  -- Tecnología
(2, 4);  -- Computación

-- Producto: Cuaderno Universitario
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES
(3, 2);  -- Solo Papelería
```

**Consulta para ver productos con sus categorías:**
```sql
SELECT 
    p.Codigo,
    p.Nombre,
    STRING_AGG(c.Nombre, ', ') AS Categorias
FROM com.tbProducto p
LEFT JOIN com.tbProductoCategoria pc ON p.IdProducto = pc.IdProducto
LEFT JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
GROUP BY p.IdProducto, p.Codigo, p.Nombre;
```

**Resultado:**
```
Codigo  | Nombre             | Categorias
--------|--------------------|--------------------------
LAP001  | Laptop HP 15       | Tecnología, Computación
MOU001  | Mouse Logitech     | Tecnología, Computación
CUA001  | Cuaderno 100 hojas | Papelería
```

---

### 4️⃣ **com.tbVenta** - Tabla de Ventas (Cabecera)

```sql
CREATE TABLE com.tbVenta (
    IdVenta        BIGINT IDENTITY(1,1) PRIMARY KEY,
    Usuario        VARCHAR(50) NOT NULL,
    FechaVenta     DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    Subtotal       DECIMAL(12,2) NOT NULL,        -- Suma de subtotales sin descuento
    DescuentoTotal DECIMAL(12,2) NOT NULL DEFAULT 0, -- ⭐ DESCUENTO TOTAL DE LA VENTA
    Total          DECIMAL(12,2) NOT NULL,        -- Subtotal - DescuentoTotal
    Observacion    VARCHAR(500) NULL
);
```

**Campo `DescuentoTotal`:**
- **Propósito**: Suma total de todos los descuentos aplicados en la venta
- **Cálculo**: Se calcula automáticamente sumando los descuentos individuales de cada ítem
- **Fórmula**: `DescuentoTotal = SUM(DetalleVenta.Descuento * DetalleVenta.Cantidad)`

---

### 5️⃣ **com.tbDetalleVenta** - Detalle de Ventas

```sql
CREATE TABLE com.tbDetalleVenta (
    IdDetalle      BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdVenta        BIGINT NOT NULL,
    IdProducto     INT NOT NULL,
    Cantidad       INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Descuento      DECIMAL(10,2) NOT NULL DEFAULT 0,  -- ⭐ DESCUENTO POR ÍTEM
    CONSTRAINT FK_DetalleVenta_Venta FOREIGN KEY (IdVenta) REFERENCES com.tbVenta(IdVenta),
    CONSTRAINT FK_DetalleVenta_Producto FOREIGN KEY (IdProducto) REFERENCES com.tbProducto(IdProducto)
);
```

**Campo `Descuento`:**
- **Propósito**: Monto de descuento aplicado **por unidad** en esta transacción específica
- **Tipo**: `DECIMAL(10,2)` - Valor en dinero (no porcentaje)
- **Ejemplo**: Si `PrecioUnitario = 5500.00` y `Descuento = 550.00`, el precio efectivo es `4950.00`

---

## 💰 Flujo de Cálculo de Descuentos

### **Escenario 1: Sin Descuento**
```
Producto: Laptop HP
Precio Venta: $5500.00
Descuento Producto: 0%
Cantidad: 2

Detalle Venta:
  - PrecioUnitario: $5500.00
  - Descuento: $0.00
  - Subtotal por unidad: $5500.00
  - Subtotal total: $5500.00 × 2 = $11,000.00

Venta:
  - Subtotal: $11,000.00
  - DescuentoTotal: $0.00
  - Total: $11,000.00
```

### **Escenario 2: Con Descuento del Producto (10%)**
```
Producto: Laptop HP
Precio Venta: $5500.00
Descuento Producto: 10%
Cantidad: 2

Cálculo:
  - Descuento por unidad: $5500.00 × 0.10 = $550.00
  - Precio efectivo: $5500.00 - $550.00 = $4950.00

Detalle Venta:
  - PrecioUnitario: $5500.00
  - Descuento: $550.00
  - Subtotal por unidad: $4950.00
  - Subtotal total: $4950.00 × 2 = $9,900.00

Venta:
  - Subtotal: $11,000.00 (sin descuento)
  - DescuentoTotal: $1,100.00 ($550 × 2)
  - Total: $9,900.00
```

### **Escenario 3: Venta con Múltiples Productos**
```
Detalle 1:
  - Producto: Laptop HP
  - PrecioUnitario: $5500.00
  - Descuento: $550.00 (10%)
  - Cantidad: 1
  - Subtotal: $4950.00

Detalle 2:
  - Producto: Mouse Logitech
  - PrecioUnitario: $250.00
  - Descuento: $25.00 (10%)
  - Cantidad: 2
  - Subtotal: $450.00 ($225 × 2)

Venta:
  - Subtotal: $6000.00 ($5500 + $500)
  - DescuentoTotal: $600.00 ($550 + $50)
  - Total: $5400.00
```

---

## 🔧 Implementación en el Backend

### **Stored Procedure: com.sp_RegistrarVenta**

El SP debe calcular automáticamente los descuentos:

```sql
CREATE PROCEDURE com.sp_RegistrarVenta
    @Usuario VARCHAR(50),
    @Detalle VARCHAR(MAX), -- JSON: [{"IdProducto":1,"Cantidad":2,"Descuento":0}]
    @Observacion VARCHAR(500) = NULL
AS
BEGIN
    -- Variables
    DECLARE @IdVenta BIGINT;
    DECLARE @Subtotal DECIMAL(12,2) = 0;
    DECLARE @DescuentoTotal DECIMAL(12,2) = 0;
    DECLARE @Total DECIMAL(12,2) = 0;
    
    -- Crear tabla temporal para el detalle
    DECLARE @DetalleTabla TABLE (
        IdProducto INT,
        Cantidad INT,
        PrecioUnitario DECIMAL(10,2),
        DescuentoPorcentaje DECIMAL(6,2),
        DescuentoMonto DECIMAL(10,2)
    );
    
    -- Parsear JSON y calcular descuentos
    INSERT INTO @DetalleTabla (IdProducto, Cantidad, PrecioUnitario, DescuentoPorcentaje, DescuentoMonto)
    SELECT 
        j.IdProducto,
        j.Cantidad,
        p.PrecioVenta,
        p.Descuento, -- Porcentaje del producto
        p.PrecioVenta * (p.Descuento / 100.0) -- Monto del descuento
    FROM OPENJSON(@Detalle) WITH (
        IdProducto INT,
        Cantidad INT
    ) j
    INNER JOIN com.tbProducto p ON j.IdProducto = p.IdProducto;
    
    -- Calcular totales
    SELECT 
        @Subtotal = SUM((PrecioUnitario - DescuentoMonto) * Cantidad),
        @DescuentoTotal = SUM(DescuentoMonto * Cantidad)
    FROM @DetalleTabla;
    
    SET @Total = @Subtotal;
    
    -- Insertar venta
    INSERT INTO com.tbVenta (Usuario, Subtotal, DescuentoTotal, Total, Observacion)
    VALUES (@Usuario, @Subtotal + @DescuentoTotal, @DescuentoTotal, @Total, @Observacion);
    
    SET @IdVenta = SCOPE_IDENTITY();
    
    -- Insertar detalle
    INSERT INTO com.tbDetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento)
    SELECT @IdVenta, IdProducto, Cantidad, PrecioUnitario, DescuentoMonto
    FROM @DetalleTabla;
    
    -- Retornar IdVenta
    SELECT @IdVenta AS IdVenta;
END;
```

---

## 🎨 Implementación en el Frontend

### **Modificaciones Necesarias:**

#### 1. **Cargar Descuento del Producto**
```javascript
async function setupPOS() {
  const response = await apiRequest(API_ENDPOINTS.productos);
  if (response.success && Array.isArray(response.data)) {
    products = response.data.map(p => ({
      id: p.IdProducto,
      code: p.Codigo,
      name: p.Nombre,
      price: parseFloat(p.PrecioVenta || 0),
      discount: parseFloat(p.Descuento || 0) // ⭐ AGREGAR DESCUENTO
    }));
  }
}
```

#### 2. **Calcular Precio con Descuento al Agregar**
```javascript
function addToCart() {
  const found = products.find(p => p.code === code);
  
  if (!found) return;
  
  // Calcular precio con descuento
  const discountAmount = found.price * (found.discount / 100);
  const effectivePrice = found.price - discountAmount;
  
  cart.push({ 
    id: found.id, 
    code: found.code, 
    name: found.name, 
    qty, 
    price: found.price,           // Precio original
    discount: found.discount,     // Porcentaje de descuento
    discountAmount: discountAmount, // Monto del descuento
    effectivePrice: effectivePrice  // Precio final
  });
}
```

#### 3. **Renderizar Carrito con Descuento**
```javascript
function renderCart() {
  tbody.innerHTML = cart.map((it, idx) => {
    const subtotal = it.effectivePrice * it.qty;
    const discountLine = it.discount > 0 
      ? `<small style="color:#10b981;">${it.discount}% desc.</small>` 
      : '';
    
    return `<tr>
      <td>${it.code}</td>
      <td>${it.name}</td>
      <td>${it.qty}</td>
      <td>$${it.price.toFixed(2)} ${discountLine}</td>
      <td>$${it.effectivePrice.toFixed(2)}</td>
      <td>$${subtotal.toFixed(2)}</td>
      <td><button data-remove="${idx}">🗑️</button></td>
    </tr>`;
  }).join('');
}
```

#### 4. **Enviar al Backend**
```javascript
// El backend calculará automáticamente los descuentos
const detalle = cart.map(item => ({
  IdProducto: item.id,
  Cantidad: item.qty
  // No enviar descuento, el SP lo calculará desde tbProducto
}));
```

---

## 📝 Ejemplo Completo de Flujo

### **1. Crear Productos con Descuentos**
```sql
-- Productos con descuentos
INSERT INTO com.tbProducto (Codigo, Nombre, PrecioCosto, PrecioVenta, Descuento) VALUES
('LAP001', 'Laptop HP', 4500.00, 5500.00, 10.00),  -- 10% descuento
('MOU001', 'Mouse Logitech', 200.00, 250.00, 0.00),  -- Sin descuento
('TEC001', 'Teclado Mecánico', 600.00, 850.00, 15.00); -- 15% descuento

-- Categorías
INSERT INTO com.tbCategoria (Nombre, Descripcion) VALUES
('Tecnología', 'Productos tecnológicos'),
('Computación', 'Hardware de computadora');

-- Asociaciones
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES
(1, 1), (1, 2),  -- Laptop: Tecnología + Computación
(2, 1), (2, 2),  -- Mouse: Tecnología + Computación
(3, 1), (3, 2);  -- Teclado: Tecnología + Computación
```

### **2. Consultar Productos con Descuento**
```sql
SELECT 
    p.Codigo,
    p.Nombre,
    p.PrecioVenta,
    p.Descuento AS DescuentoPorcentaje,
    p.PrecioVenta * (p.Descuento / 100.0) AS DescuentoMonto,
    p.PrecioVenta - (p.PrecioVenta * (p.Descuento / 100.0)) AS PrecioConDescuento,
    STRING_AGG(c.Nombre, ', ') AS Categorias
FROM com.tbProducto p
LEFT JOIN com.tbProductoCategoria pc ON p.IdProducto = pc.IdProducto
LEFT JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
GROUP BY p.IdProducto, p.Codigo, p.Nombre, p.PrecioVenta, p.Descuento;
```

**Resultado:**
```
Codigo | Nombre             | PrecioVenta | Descuento% | DescuentoMonto | PrecioConDesc | Categorias
-------|--------------------|--------------|-----------| --------------|---------------|---------------------------
LAP001 | Laptop HP          | 5500.00     | 10.00     | 550.00        | 4950.00       | Tecnología, Computación
MOU001 | Mouse Logitech     | 250.00      | 0.00      | 0.00          | 250.00        | Tecnología, Computación
TEC001 | Teclado Mecánico   | 850.00      | 15.00     | 127.50        | 722.50        | Tecnología, Computación
```

### **3. Ver Ventas con Descuentos**
```sql
SELECT 
    v.IdVenta,
    v.Usuario,
    v.FechaVenta,
    v.Subtotal,
    v.DescuentoTotal,
    v.Total,
    v.Observacion
FROM com.tbVenta v
ORDER BY v.IdVenta DESC;
```

### **4. Ver Detalle de Venta**
```sql
SELECT 
    dv.IdVenta,
    p.Codigo,
    p.Nombre,
    dv.Cantidad,
    dv.PrecioUnitario,
    dv.Descuento AS DescuentoPorUnidad,
    (dv.PrecioUnitario - dv.Descuento) AS PrecioEfectivo,
    (dv.PrecioUnitario - dv.Descuento) * dv.Cantidad AS Subtotal
FROM com.tbDetalleVenta dv
INNER JOIN com.tbProducto p ON dv.IdProducto = p.IdProducto
WHERE dv.IdVenta = 1;
```

---

## ✅ Checklist de Implementación

### Backend:
- [ ] Modificar `src/services/productos.service.js` para incluir campo `Descuento` al crear/editar
- [ ] Validar que `Descuento` esté entre 0 y 100
- [ ] Actualizar `sp_RegistrarVenta` para calcular descuentos automáticamente
- [ ] Asegurar que `sp_ListarProductos` retorne el campo `Descuento`

### Frontend:
- [ ] Agregar campo "Descuento (%)" en el modal de crear/editar producto
- [ ] Cargar `discount` en `setupPOS()` al obtener productos
- [ ] Calcular precio efectivo al agregar al carrito
- [ ] Mostrar descuento en la tabla del carrito
- [ ] Actualizar totales considerando descuentos

### Base de Datos:
- [ ] Verificar que productos tienen valores válidos en `Descuento` (0-100)
- [ ] Verificar relaciones en `tbProductoCategoria`
- [ ] Probar consultas de productos con categorías

---

**Fecha:** 3 de noviembre de 2025  
**Estado:** 📖 Documento de referencia completo
