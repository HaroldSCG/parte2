# 🔧 Implementación Completa de Descuentos

## 📋 Resumen de Cambios

Se ha implementado el manejo completo de descuentos en el sistema, corrigiendo el problema donde los productos se guardaban siempre con descuento 0.

---

## ✅ Problema Resuelto

**Antes:**
- Productos se creaban siempre con `Descuento = 0` sin importar el valor ingresado en el formulario
- El frontend enviaba el descuento correctamente, pero el backend lo ignoraba
- El POS no mostraba ni aplicaba descuentos de productos

**Después:**
- ✅ Descuentos se guardan correctamente en `com.tbProducto.Descuento`
- ✅ POS carga y aplica descuentos automáticamente
- ✅ Carrito muestra precio original tachado y precio con descuento
- ✅ Ventas registran el monto de descuento por producto en `com.tbDetalleVenta.Descuento`

---

## 🔄 Archivos Modificados

### 1️⃣ **Backend - Service Layer**

**Archivo:** `src/services/productos.service.js`

#### **Función `createProducto` (Línea ~32)**

**Cambios:**
```javascript
// ANTES
async function createProducto({ codigo, nombre, categorias = null, precioCosto, precioVenta, cantidad = 0, usuarioEjecutor = 'sistema' }) {
  // ...
  req.input('Descuento', sql.Decimal(6, 2), 0);  // ❌ Siempre 0
```

```javascript
// DESPUÉS
async function createProducto({ codigo, nombre, descripcion, categorias = null, precioCosto, precioVenta, descuento = 0, cantidad = 0, usuarioEjecutor = 'sistema' }) {
  // Validar descuento
  const descuentoVal = Number(descuento) || 0;
  if (descuentoVal < 0 || descuentoVal > 100) {
    throw new Error('El descuento debe estar entre 0 y 100');
  }
  
  req.input('Descuento', sql.Decimal(6, 2), descuentoVal);  // ✅ Usa valor recibido
  req.input('Descripcion', sql.VarChar(400), descripcion || null);  // ✅ También se agregó descripción
```

#### **Función `updateProductoByCodigo` (Línea ~208)**

**Cambios:**
```javascript
// ANTES
async function updateProductoByCodigo({ codigo, nombre, precioCosto, precioVenta, cantidad, categorias }) {
  // ... No manejaba descuento ni descripción
```

```javascript
// DESPUÉS
async function updateProductoByCodigo({ codigo, nombre, descripcion, precioCosto, precioVenta, descuento, cantidad, categorias }) {
  // ...
  if (typeof descripcion === 'string') {
    setParts.push('Descripcion = @Descripcion');
    reqUpd.input('Descripcion', sql.VarChar(400), descripcion || null);
  }
  
  if (descuento != null) {
    const descuentoVal = Number(descuento);
    if (descuentoVal < 0 || descuentoVal > 100) {
      throw new Error('El descuento debe estar entre 0 y 100');
    }
    setParts.push('Descuento = @Descuento');
    reqUpd.input('Descuento', sql.Decimal(6, 2), descuentoVal);
  }
```

---

### 2️⃣ **Backend - Controller Layer**

**Archivo:** `src/controllers/productos.controller.js`

#### **Función `updateProducto`**

**Cambios:**
```javascript
// ANTES
const { nombre, precioCosto, precioVenta, cantidad, categorias } = req.body || {};

// DESPUÉS
const { nombre, descripcion, precioCosto, precioVenta, descuento, cantidad, categorias } = req.body || {};

// Validación de descuento
if (descuento != null) {
  const v = Number(descuento); 
  if (!Number.isFinite(v) || v < 0 || v > 100) {
    return res.status(400).json({ success:false, message:'descuento debe estar entre 0 y 100' });
  }
  updates.descuento = v;
}
```

---

### 3️⃣ **Frontend - POS Module**

**Archivo:** `public/js/dashboard-app.js`

#### **A. Función `setupPOS` - Cargar Descuentos (Línea ~2430)**

**Cambios:**
```javascript
// ANTES
products = response.data.map(p => ({
  id: p.IdProducto,
  code: p.Codigo,
  name: p.Nombre,
  price: parseFloat(p.PrecioVenta || 0)
}));

// DESPUÉS
products = response.data.map(p => ({
  id: p.IdProducto,
  code: p.Codigo,
  name: p.Nombre,
  price: parseFloat(p.PrecioVenta || 0),
  discount: parseFloat(p.Descuento || 0)  // ⭐ Carga descuento
}));
```

#### **B. Función `addToCart` - Calcular Precio con Descuento (Línea ~2570)**

**Cambios:**
```javascript
// ANTES
cart.push({ 
  id: found.id, 
  code: found.code, 
  name: found.name, 
  qty, 
  price: found.price 
});

// DESPUÉS
// Calcular descuento
const discountAmount = found.price * (found.discount / 100);
const effectivePrice = found.price - discountAmount;

cart.push({ 
  id: found.id, 
  code: found.code, 
  name: found.name, 
  qty, 
  price: found.price,              // Precio original
  discount: found.discount,         // Porcentaje de descuento
  discountAmount: discountAmount,   // Monto del descuento por unidad
  effectivePrice: effectivePrice    // Precio con descuento aplicado
});
```

#### **C. Función `renderCart` - Mostrar Descuentos (Línea ~2530)**

**Cambios:**
```javascript
// ANTES
const price = parseFloat(it.price || 0);
const subtotal = price * it.qty;
// ...
<td>$${price.toFixed(2)}</td>
<td>$${subtotal.toFixed(2)}</td>

// DESPUÉS
const price = parseFloat(it.price || 0);
const effectivePrice = parseFloat(it.effectivePrice || it.price || 0);
const subtotal = effectivePrice * it.qty;
const hasDiscount = it.discount > 0;

// Mostrar información de descuento si aplica
const priceDisplay = hasDiscount 
  ? `<div style="display:flex; flex-direction:column; align-items:flex-end;">
       <span style="text-decoration:line-through; color:#94a3b8; font-size:0.85em;">$${price.toFixed(2)}</span>
       <span style="color:#10b981; font-weight:600;">$${effectivePrice.toFixed(2)}</span>
       <small style="color:#10b981; font-size:0.75em;">${it.discount}% desc.</small>
     </div>`
  : `$${price.toFixed(2)}`;

// ...
<td>${priceDisplay}</td>
<td>$${subtotal.toFixed(2)}</td>
```

#### **D. Función `sumSubtotal` - Usar Precio Efectivo (Línea ~2617)**

**Cambios:**
```javascript
// ANTES
function sumSubtotal() { 
  return cart.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0); 
}

// DESPUÉS
function sumSubtotal() { 
  return cart.reduce((acc, it) => {
    const effectivePrice = parseFloat(it.effectivePrice || it.price || 0);
    return acc + (effectivePrice * it.qty);
  }, 0); 
}
```

#### **E. Checkout - Enviar Descuentos al Backend (Línea ~2665)**

**Cambios:**
```javascript
// ANTES
const detalle = cart.map(item => ({
  IdProducto: item.id,
  Cantidad: item.qty,
  PrecioUnitario: item.price,
  Descuento: 0  // ❌ Siempre 0
}));

// DESPUÉS
const detalle = cart.map(item => ({
  IdProducto: item.id,
  Cantidad: item.qty,
  PrecioUnitario: item.price || 0,                      // Precio original
  Descuento: parseFloat(item.discountAmount || 0)       // ⭐ Monto del descuento por unidad
}));
```

---

## 🎯 Flujo Completo de Descuentos

### **1. Crear Producto con Descuento**

```http
POST /api/productos
Content-Type: application/json

{
  "codigo": "LAP001",
  "nombre": "Laptop HP 15",
  "descripcion": "Laptop HP core i5, 8GB RAM",
  "precioCosto": 4500.00,
  "precioVenta": 5500.00,
  "descuento": 10.00  // ⭐ 10% de descuento
}
```

**Base de Datos:**
```sql
INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento)
VALUES ('LAP001', 'Laptop HP 15', 'Laptop HP core i5, 8GB RAM', 4500.00, 5500.00, 10.00);
```

### **2. Cargar en el POS**

```javascript
// GET /api/productos
products = [
  {
    id: 1,
    code: 'LAP001',
    name: 'Laptop HP 15',
    price: 5500.00,
    discount: 10.00  // ⭐ Descuento cargado
  }
]
```

### **3. Agregar al Carrito**

```javascript
// Usuario busca "LAP001" y agrega 2 unidades

// Cálculo automático:
discountAmount = 5500 × 0.10 = 550.00
effectivePrice = 5500 - 550 = 4950.00

// Item en carrito:
{
  id: 1,
  code: 'LAP001',
  name: 'Laptop HP 15',
  qty: 2,
  price: 5500.00,           // Precio original
  discount: 10.00,          // Porcentaje
  discountAmount: 550.00,   // Monto por unidad
  effectivePrice: 4950.00   // Precio final
}

// Subtotal mostrado: $4950 × 2 = $9,900.00
```

### **4. Visualización en el Carrito**

**Columna "Precio":**
```
~~$5500.00~~  ← Precio tachado
$4950.00      ← Precio con descuento (verde)
10% desc.     ← Etiqueta pequeña
```

### **5. Finalizar Venta**

```http
POST /api/ventas
Content-Type: application/json

{
  "usuario": "admin",
  "detalle": [
    {
      "IdProducto": 1,
      "Cantidad": 2,
      "PrecioUnitario": 5500.00,
      "Descuento": 550.00  // ⭐ Monto del descuento
    }
  ],
  "observacion": "Venta desde POS"
}
```

### **6. Registro en Base de Datos**

**tbVenta:**
```sql
INSERT INTO com.tbVenta (Usuario, Subtotal, DescuentoTotal, Total, Observacion)
VALUES ('admin', 11000.00, 1100.00, 9900.00, 'Venta desde POS');
-- Subtotal: $5500 × 2 = $11,000
-- DescuentoTotal: $550 × 2 = $1,100
-- Total: $11,000 - $1,100 = $9,900
```

**tbDetalleVenta:**
```sql
INSERT INTO com.tbDetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento)
VALUES (1, 1, 2, 5500.00, 550.00);
```

---

## 📊 Consultas SQL para Verificar

### **1. Ver Productos con Descuento**
```sql
SELECT 
    Codigo,
    Nombre,
    PrecioVenta,
    Descuento AS DescuentoPorcentaje,
    PrecioVenta * (Descuento / 100.0) AS DescuentoMonto,
    PrecioVenta - (PrecioVenta * (Descuento / 100.0)) AS PrecioConDescuento
FROM com.tbProducto
WHERE Descuento > 0
ORDER BY Descuento DESC;
```

### **2. Ver Ventas con Descuentos**
```sql
SELECT 
    v.IdVenta,
    v.Usuario,
    v.FechaVenta,
    v.Subtotal,
    v.DescuentoTotal,
    v.Total,
    v.DescuentoTotal / NULLIF(v.Subtotal, 0) * 100 AS PorcentajeDescuento
FROM com.tbVenta v
WHERE v.DescuentoTotal > 0
ORDER BY v.IdVenta DESC;
```

### **3. Ver Detalle de Venta con Descuentos**
```sql
SELECT 
    dv.IdVenta,
    p.Codigo,
    p.Nombre,
    dv.Cantidad,
    dv.PrecioUnitario,
    dv.Descuento AS DescuentoPorUnidad,
    (dv.PrecioUnitario - dv.Descuento) AS PrecioEfectivo,
    (dv.PrecioUnitario - dv.Descuento) * dv.Cantidad AS Subtotal,
    dv.Descuento * dv.Cantidad AS DescuentoTotal
FROM com.tbDetalleVenta dv
INNER JOIN com.tbProducto p ON dv.IdProducto = p.IdProducto
WHERE dv.IdVenta = 1
ORDER BY dv.IdDetalle;
```

### **4. Actualizar Descuento de un Producto**
```sql
UPDATE com.tbProducto
SET Descuento = 15.00  -- 15% de descuento
WHERE Codigo = 'LAP001';
```

---

## 🧪 Pruebas Recomendadas

### **Test 1: Crear Producto con Descuento**
1. Abrir modal "Nuevo Producto"
2. Ingresar:
   - Nombre: "Mouse Gamer"
   - Precio Costo: $200.00
   - Precio Venta: $350.00
   - Descuento: 20%
3. Guardar
4. Verificar en BD: `SELECT * FROM com.tbProducto WHERE Codigo LIKE '%MOUSE%'`
5. **Esperado:** `Descuento = 20.00`

### **Test 2: POS con Descuento**
1. Ir al módulo "Ventas"
2. Buscar producto con descuento
3. Agregar 2 unidades al carrito
4. **Verificar visualización:**
   - Precio original tachado
   - Precio con descuento en verde
   - Etiqueta "X% desc."
5. **Verificar cálculo:**
   - Subtotal = (precio - descuento) × cantidad

### **Test 3: Venta con Descuento**
1. Agregar productos al carrito
2. Finalizar venta
3. Verificar en BD:
```sql
SELECT v.*, dv.* 
FROM com.tbVenta v
INNER JOIN com.tbDetalleVenta dv ON v.IdVenta = dv.IdVenta
ORDER BY v.IdVenta DESC;
```
4. **Esperado:**
   - `tbVenta.DescuentoTotal > 0`
   - `tbDetalleVenta.Descuento > 0`

### **Test 4: Validación de Descuento**
1. Intentar crear producto con descuento = 150%
2. **Esperado:** Error "El descuento debe estar entre 0 y 100"
3. Intentar con descuento = -10%
4. **Esperado:** Error "El descuento debe estar entre 0 y 100"

---

## 📋 Relación Producto-Categoría (N:N)

La tabla `com.tbProductoCategoria` permite asociaciones múltiples:

```sql
-- Un producto puede tener múltiples categorías
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES
(1, 1),  -- Laptop → Tecnología
(1, 4);  -- Laptop → Computación

-- Una categoría puede tener múltiples productos
SELECT p.Nombre
FROM com.tbProducto p
INNER JOIN com.tbProductoCategoria pc ON p.IdProducto = pc.IdProducto
WHERE pc.IdCategoria = 1;  -- Todos los productos de "Tecnología"
```

**Consulta para ver productos con sus categorías:**
```sql
SELECT 
    p.Codigo,
    p.Nombre,
    p.Descuento,
    STRING_AGG(c.Nombre, ', ') WITHIN GROUP (ORDER BY c.Nombre) AS Categorias
FROM com.tbProducto p
LEFT JOIN com.tbProductoCategoria pc ON p.IdProducto = pc.IdProducto
LEFT JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
GROUP BY p.IdProducto, p.Codigo, p.Nombre, p.Descuento;
```

---

## ✅ Checklist de Implementación

### Backend:
- [x] Modificar `createProducto` para recibir y guardar descuento
- [x] Agregar validación de descuento (0-100)
- [x] Modificar `updateProductoByCodigo` para actualizar descuento
- [x] Actualizar controller para aceptar descuento en PUT

### Frontend:
- [x] Cargar descuento en `setupPOS()`
- [x] Calcular precio efectivo en `addToCart()`
- [x] Mostrar descuento visualmente en `renderCart()`
- [x] Actualizar `sumSubtotal()` para usar precio efectivo
- [x] Enviar descuento correcto en checkout

### Validación:
- [x] Campo descuento existe en el modal de productos
- [x] Validación frontend: 0-100
- [x] Validación backend: 0-100
- [x] Vista del carrito muestra descuentos correctamente

---

**Fecha:** 3 de noviembre de 2025  
**Estado:** ✅ Implementación completa - Lista para pruebas
