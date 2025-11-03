# 🎨 Integración Frontend - Módulo de Ventas

## 📋 Resumen de Cambios

Se completó la integración del frontend del módulo de Ventas con el backend, eliminando completamente el uso de datos MOCK (DASHBOARD_DATA).

---

## 🔄 Modificaciones en `public/js/dashboard-app.js`

### 1️⃣ **Función `setupPOS()` - Carga de Productos**

**Antes (Mock Data):**
```javascript
function setupPOS() {
  const products = (DASHBOARD_DATA[role]?.productos?.list || DASHBOARD_DATA.admin?.productos?.list || [])
    .map(p => ({ code: p.code, name: p.name }));
  // ...
}
```

**Después (API Real):**
```javascript
async function setupPOS() {
  let products = [];
  try {
    const response = await apiRequest(API_ENDPOINTS.productos);
    if (response.success && Array.isArray(response.data)) {
      products = response.data.map(p => ({
        id: p.IdProducto,
        code: p.Codigo,
        name: p.Nombre,
        price: parseFloat(p.PrecioVenta || 0)
      }));
    }
  } catch (err) {
    console.error('Error cargando productos:', err);
    products = [];
  }
  // ... resto del código de autocomplete
}
```

**Cambios Clave:**
- ✅ Convertida a función `async`
- ✅ Llama a `GET /api/productos` para obtener productos reales
- ✅ Mapea campos de API: `IdProducto`, `Codigo`, `Nombre`, `PrecioVenta`
- ✅ Incluye `price` en el objeto de producto para cálculos del carrito
- ✅ Manejo de errores con fallback a array vacío

---

### 2️⃣ **Botón Checkout - Registro de Ventas**

**Antes (Mock):**
```javascript
document.getElementById('posCheckoutBtn')?.addEventListener('click', () => {
  if (!cart.length) return invSetMessage('salesPOSMessage', 'error', 'Agrega productos a la venta.');
  cart.splice(0, cart.length);
  renderCart();
  invSetMessage('salesPOSMessage', 'success', 'Venta realizada.');
});
```

**Después (API Real):**
```javascript
document.getElementById('posCheckoutBtn')?.addEventListener('click', async () => {
  if (!cart.length) return invSetMessage('salesPOSMessage', 'error', 'Agrega productos a la venta.');
  
  // Preparar detalle de venta
  const detalle = cart.map(item => ({
    IdProducto: item.id,
    Cantidad: item.qty,
    PrecioUnitario: item.price,
    Descuento: 0
  }));
  
  const observacion = document.getElementById('salesCustomer')?.value || 'Venta desde POS';
  const currentUser = profileState?.usuario || 'sistema';
  
  try {
    invSetMessage('salesPOSMessage', 'info', 'Procesando venta...');
    
    const response = await apiRequest(API_ENDPOINTS.ventas, {
      method: 'POST',
      body: {
        usuario: currentUser,
        detalle: detalle,
        observacion: observacion
      }
    });
    
    if (response.success) {
      cart.splice(0, cart.length);
      renderCart();
      invSetMessage('salesPOSMessage', 'success', response.message || 'Venta realizada exitosamente.');
      
      // Limpiar campos
      document.getElementById('salesCustomer').value = '';
      document.getElementById('salesDiscount').value = '0';
      
      try { showToast('Venta registrada con éxito', 'success'); } catch { }
      
      // Recargar bitácora si está visible
      const logContent = document.getElementById('salesLogContent');
      if (logContent && logContent.classList.contains('active')) {
        renderSalesLog();
      }
    } else {
      invSetMessage('salesPOSMessage', 'error', response.message || 'Error al procesar la venta');
    }
  } catch (error) {
    console.error('Error procesando venta:', error);
    invSetMessage('salesPOSMessage', 'error', 'Error de conexión al procesar la venta');
  }
});
```

**Cambios Clave:**
- ✅ Convertido a función `async`
- ✅ Extrae datos del carrito y los formatea para la API
- ✅ Llama a `POST /api/ventas` con estructura correcta
- ✅ Obtiene usuario actual de `profileState`
- ✅ Limpia campos después de venta exitosa
- ✅ Recarga automáticamente la bitácora si está visible
- ✅ Manejo completo de errores con mensajes al usuario

---

### 3️⃣ **Función `renderSalesLog()` - Listado de Ventas**

**Antes (Placeholder):**
```javascript
function renderSalesLog() {
  const tbody = document.querySelector('#salesTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6"><p class="empty-state">Conectado al backend próximamente.</p></td></tr>';
}
```

**Después (API Real):**
```javascript
async function renderSalesLog() {
  const tbody = document.querySelector('#salesTable tbody');
  if (!tbody) return;
  
  try {
    tbody.innerHTML = '<tr><td colspan="6"><p class="empty-state">Cargando ventas...</p></td></tr>';
    
    const response = await apiRequest(API_ENDPOINTS.ventas + '?page=1&limit=20');
    
    if (!response.success || !response.data || !Array.isArray(response.data.ventas)) {
      tbody.innerHTML = '<tr><td colspan="6"><p class="empty-state">No se pudieron cargar las ventas.</p></td></tr>';
      return;
    }
    
    const ventas = response.data.ventas;
    
    if (ventas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><p class="empty-state">No hay ventas registradas.</p></td></tr>';
      return;
    }
    
    tbody.innerHTML = ventas.map(venta => `
      <tr data-venta-id="${venta.IdVenta}" style="cursor: pointer;">
        <td>${venta.IdVenta}</td>
        <td>${new Date(venta.FechaVenta).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
        <td>${venta.Usuario || 'N/A'}</td>
        <td>${venta.CantidadItems || 0}</td>
        <td>$${parseFloat(venta.Total || 0).toFixed(2)}</td>
        <td><span class="badge badge-success">Completada</span></td>
      </tr>
    `).join('');
    
    // Agregar evento click para ver detalle
    tbody.querySelectorAll('tr[data-venta-id]').forEach(row => {
      row.addEventListener('click', async () => {
        const idVenta = row.getAttribute('data-venta-id');
        await showSaleDetail(idVenta);
      });
    });
    
  } catch (error) {
    console.error('Error cargando ventas:', error);
    tbody.innerHTML = '<tr><td colspan="6"><p class="empty-state">Error al cargar ventas.</p></td></tr>';
  }
}
```

**Cambios Clave:**
- ✅ Convertida a función `async`
- ✅ Llama a `GET /api/ventas?page=1&limit=20`
- ✅ Renderiza tabla con datos reales: ID, Fecha, Usuario, Items, Total
- ✅ Formato de fecha mexicano con hora
- ✅ Agrega evento click a cada fila para ver detalle
- ✅ Manejo de estados: cargando, vacío, error

---

### 4️⃣ **Nueva Función `showSaleDetail()` - Detalle de Venta**

```javascript
async function showSaleDetail(idVenta) {
  try {
    const response = await apiRequest(`${API_ENDPOINTS.ventas}/${idVenta}`);
    
    if (!response.success || !response.data) {
      try { showToast('No se pudo cargar el detalle de la venta', 'error'); } catch { }
      return;
    }
    
    const { cabecera, items } = response.data;
    
    const itemsHtml = items.map(item => `
      <tr>
        <td>${item.Codigo || 'N/A'}</td>
        <td>${item.NombreProducto || 'N/A'}</td>
        <td>${item.Cantidad}</td>
        <td>$${parseFloat(item.PrecioUnitario || 0).toFixed(2)}</td>
        <td>$${parseFloat(item.Subtotal || 0).toFixed(2)}</td>
      </tr>
    `).join('');
    
    const content = `
      <div class="sale-detail-content" style="padding: 20px;">
        <h4 style="margin-bottom: 15px;">Venta #${cabecera.IdVenta}</h4>
        <div style="margin-bottom: 20px;">
          <p><strong>Fecha:</strong> ${new Date(cabecera.FechaVenta).toLocaleString('es-MX')}</p>
          <p><strong>Usuario:</strong> ${cabecera.Usuario || 'N/A'}</p>
          <p><strong>Observación:</strong> ${cabecera.Observacion || 'N/A'}</p>
        </div>
        
        <h5 style="margin-bottom: 10px;">Detalle de productos:</h5>
        <table class="table table-bordered" style="margin-bottom: 20px;">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; font-size: 1.2em; font-weight: bold;">
          <p>Total: $${parseFloat(cabecera.Total || 0).toFixed(2)}</p>
        </div>
      </div>
    `;
    
    modalManager.showModal({
      title: 'Detalle de Venta',
      content: content,
      actions: [
        {
          label: 'Cerrar',
          className: 'btn-secondary',
          action: () => modalManager.closeModal()
        }
      ]
    });
    
  } catch (error) {
    console.error('Error obteniendo detalle de venta:', error);
    try { showToast('Error al cargar el detalle de la venta', 'error'); } catch { }
  }
}
```

**Funcionalidad:**
- ✅ Llama a `GET /api/ventas/:id`
- ✅ Muestra modal con información de cabecera
- ✅ Tabla detallada de productos vendidos
- ✅ Cálculo de subtotales y total
- ✅ Manejo de errores

---

## 🔗 Flujo de Datos Completo

### **1. Carga Inicial del Módulo**
```
Usuario hace clic en "Ventas" 
  → renderVentas() se ejecuta
  → setupSalesTabs() configura pestañas
  → setupPOS() se ejecuta (async)
  → GET /api/productos
  → Productos se cargan en autocomplete
```

### **2. Agregar Producto al Carrito**
```
Usuario busca producto en input
  → Autocomplete filtra productos
  → Usuario selecciona producto
  → Producto se agrega al array cart[]
  → renderCart() actualiza vista
```

### **3. Finalizar Venta**
```
Usuario hace clic en "Finalizar Venta"
  → Validación: ¿cart.length > 0?
  → Formatear datos: detalle[], usuario, observacion
  → POST /api/ventas
  → Backend ejecuta sp_RegistrarVenta
  → Trigger descuenta stock automáticamente
  → Respuesta exitosa → limpiar carrito y campos
  → Si bitácora está visible → recargar con renderSalesLog()
```

### **4. Ver Bitácora de Ventas**
```
Usuario hace clic en tab "Bitácora"
  → activate('log') + renderSalesLog()
  → GET /api/ventas?page=1&limit=20
  → Renderizar tabla con ventas
  → Cada fila es clickeable
```

### **5. Ver Detalle de Venta**
```
Usuario hace clic en una fila
  → showSaleDetail(idVenta)
  → GET /api/ventas/:id
  → Backend ejecuta sp_ObtenerDetalleVenta
  → Muestra modal con cabecera + items
```

---

## ✅ Estado de Integración

| Funcionalidad | Estado | Endpoint |
|---------------|--------|----------|
| Cargar productos para POS | ✅ Completo | `GET /api/productos` |
| Registrar venta | ✅ Completo | `POST /api/ventas` |
| Listar ventas | ✅ Completo | `GET /api/ventas` |
| Ver detalle de venta | ✅ Completo | `GET /api/ventas/:id` |
| Descuento automático de stock | ✅ Completo | Trigger DB |
| Actualización de vista tbStock | ✅ Completo | Trigger DB |

---

## 🧪 Pruebas Pendientes

1. **Probar en navegador:**
   - Abrir `http://localhost:3000/dashboard.html`
   - Iniciar sesión
   - Ir a módulo "Ventas"
   - Buscar producto en POS
   - Agregar al carrito
   - Finalizar venta
   - Ver bitácora actualizada
   - Hacer clic en una venta para ver detalle

2. **Validar en base de datos:**
   ```sql
   -- Ver última venta registrada
   SELECT TOP 1 * FROM com.tbVenta ORDER BY IdVenta DESC;
   
   -- Ver detalle de venta
   SELECT * FROM com.tbDetalleVenta WHERE IdVenta = (SELECT TOP 1 IdVenta FROM com.tbVenta ORDER BY IdVenta DESC);
   
   -- Verificar stock descontado
   SELECT * FROM com.tbStock WHERE IdProducto IN (SELECT IdProducto FROM com.tbDetalleVenta WHERE IdVenta = ...);
   ```

---

## 📝 Notas Importantes

- **Dependencia de `/api/productos`**: El POS requiere que el endpoint de productos esté funcionando. Si no existe, `setupPOS()` fallará silenciosamente y el autocomplete estará vacío.

- **profileState.usuario**: El sistema obtiene el usuario actual de `profileState?.usuario`. Asegúrate de que este estado se inicialice correctamente en `UserManager.js` después del login.

- **Descuentos**: Actualmente, el descuento por item se envía como `0`. Para implementar descuentos, se debe modificar el carrito para incluir un campo de descuento por producto.

- **Paginación**: La bitácora carga las primeras 20 ventas (`?page=1&limit=20`). Para implementar paginación completa, se debe agregar controles de navegación.

---

## 🎯 Siguiente Fase

**Fase 7: Pruebas End-to-End**
- Probar flujo completo en navegador
- Validar mensajes de error
- Verificar stock en base de datos
- Confirmar que los triggers funcionan correctamente
- Documentar cualquier bug encontrado

---

**Fecha:** 2 de noviembre de 2025  
**Estado:** ✅ Frontend integrado con backend - Listo para pruebas
