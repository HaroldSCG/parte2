# ============================================================================
# PRUEBAS DEL MÓDULO DE VENTAS - API REST
# ============================================================================
# Instrucciones:
# 1. Asegúrate de que el servidor esté corriendo (npm start)
# 2. Ejecuta el script datos_prueba_ventas.sql para crear datos de prueba
# 3. Usa Postman, Thunder Client (VS Code), o curl para probar los endpoints
# ============================================================================

## BASE URL
http://localhost:3000

## NOTA IMPORTANTE
Para todas las peticiones que requieren autenticación, debes:
1. Primero hacer login en /api/login
2. Guardar el token/sesión recibido
3. Incluirlo en las peticiones siguientes

================================================================================
PRUEBA 1: REGISTRAR UNA VENTA
================================================================================

POST http://localhost:3000/api/ventas
Content-Type: application/json

{
  "usuario": "henryOo",
  "detalle": [
    {
      "IdProducto": 1,
      "Cantidad": 2,
      "PrecioUnitario": 4500.00,
      "Descuento": 0
    },
    {
      "IdProducto": 2,
      "Cantidad": 5,
      "PrecioUnitario": 120.00,
      "Descuento": 0
    }
  ],
  "observacion": "Venta de prueba - Primera venta del sistema"
}

RESPUESTA ESPERADA (201 Created):
{
  "success": true,
  "message": "Venta registrada exitosamente. ID: 1, Total: $9600.00",
  "idVenta": 1
}

VERIFICACIONES:
1. Verificar que la venta se registró en com.tbVenta
2. Verificar que los detalles se registraron en com.tbDetalleVenta
3. Verificar que el stock se descontó en com.tbStock (Laptop: 5→3, Mouse: 50→45)
4. Verificar que se crearon movimientos en com.tbInventario tipo 'VENTA'
5. Verificar que se registró en seg.tbBitacoraTransacciones

SQL DE VERIFICACIÓN:
-- Ver la venta registrada
SELECT * FROM com.tbVenta WHERE IdVenta = 1;

-- Ver los detalles
SELECT * FROM com.tbDetalleVenta WHERE IdVenta = 1;

-- Ver el stock actualizado
SELECT p.Nombre, s.Existencia 
FROM com.tbStock s
JOIN com.tbProducto p ON s.IdProducto = p.IdProducto;

-- Ver movimientos de inventario
SELECT TOP 5 * FROM com.tbInventario ORDER BY FechaMovimiento DESC;

================================================================================
PRUEBA 2: VENTA CON DESCUENTO
================================================================================

POST http://localhost:3000/api/ventas
Content-Type: application/json

{
  "usuario": "henryOo",
  "detalle": [
    {
      "IdProducto": 3,
      "Cantidad": 10,
      "PrecioUnitario": 15.00,
      "Descuento": 15.00
    },
    {
      "IdProducto": 4,
      "Cantidad": 5,
      "PrecioUnitario": 20.00,
      "Descuento": 10.00
    }
  ],
  "observacion": "Venta con descuento para estudiante"
}

RESPUESTA ESPERADA:
{
  "success": true,
  "message": "Venta registrada exitosamente. ID: 2, Total: $225.00",
  "idVenta": 2
}

CÁLCULO:
- Cuadernos: 10 x 15.00 = 150.00 - 15.00 descuento = 135.00
- Bolígrafos: 5 x 20.00 = 100.00 - 10.00 descuento = 90.00
- TOTAL: 225.00

================================================================================
PRUEBA 3: VENTA SIN STOCK (DEBE FALLAR)
================================================================================

POST http://localhost:3000/api/ventas
Content-Type: application/json

{
  "usuario": "henryOo",
  "detalle": [
    {
      "IdProducto": 1,
      "Cantidad": 10,
      "PrecioUnitario": 4500.00,
      "Descuento": 0
    }
  ],
  "observacion": "Intento de venta sin stock suficiente"
}

RESPUESTA ESPERADA (400 Bad Request):
{
  "success": false,
  "message": "Error: Stock insuficiente para Laptop HP 15. Disponible: 3, Requerido: 10"
}

VERIFICACIÓN:
- No se debe crear la venta
- No se debe descontar el stock
- No se deben crear movimientos de inventario

================================================================================
PRUEBA 4: LISTAR VENTAS (SIN FILTROS)
================================================================================

GET http://localhost:3000/api/ventas

RESPUESTA ESPERADA (200 OK):
{
  "success": true,
  "data": [
    {
      "IdVenta": 2,
      "Usuario": "henryOo",
      "FechaVenta": "2025-11-03T...",
      "Subtotal": 250.00,
      "DescuentoTotal": 25.00,
      "Total": 225.00,
      "Observacion": "Venta con descuento para estudiante",
      "CantidadItems": 2,
      "TotalUnidades": 15
    },
    {
      "IdVenta": 1,
      "Usuario": "henryOo",
      "FechaVenta": "2025-11-03T...",
      "Subtotal": 9600.00,
      "DescuentoTotal": 0.00,
      "Total": 9600.00,
      "Observacion": "Venta de prueba - Primera venta del sistema",
      "CantidadItems": 2,
      "TotalUnidades": 7
    }
  ],
  "pagination": {
    "pagina": 1,
    "tamanoPagina": 20,
    "totalRegistros": 2,
    "totalPaginas": 1,
    "hayMasPaginas": false
  }
}

================================================================================
PRUEBA 5: LISTAR VENTAS CON FILTROS
================================================================================

GET http://localhost:3000/api/ventas?pagina=1&tamanoPagina=10&usuario=henryOo&fechaInicio=2025-11-01&fechaFin=2025-11-30

RESPUESTA ESPERADA: Lista filtrada de ventas

================================================================================
PRUEBA 6: OBTENER DETALLE DE UNA VENTA
================================================================================

GET http://localhost:3000/api/ventas/1

RESPUESTA ESPERADA (200 OK):
{
  "success": true,
  "data": {
    "cabecera": {
      "IdVenta": 1,
      "Usuario": "henryOo",
      "FechaVenta": "2025-11-03T...",
      "Subtotal": 9600.00,
      "DescuentoTotal": 0.00,
      "Total": 9600.00,
      "Observacion": "Venta de prueba - Primera venta del sistema"
    },
    "items": [
      {
        "IdDetalle": 1,
        "IdProducto": 1,
        "Codigo": "LAP001",
        "Nombre": "Laptop HP 15",
        "Cantidad": 2,
        "PrecioUnitario": 4500.00,
        "Descuento": 0.00,
        "Subtotal": 9000.00
      },
      {
        "IdDetalle": 2,
        "IdProducto": 2,
        "Codigo": "MOU001",
        "Nombre": "Mouse Inalámbrico Logitech",
        "Cantidad": 5,
        "PrecioUnitario": 120.00,
        "Descuento": 0.00,
        "Subtotal": 600.00
      }
    ]
  }
}

================================================================================
PRUEBA 7: VENTA INVÁLIDA - SIN DETALLE
================================================================================

POST http://localhost:3000/api/ventas
Content-Type: application/json

{
  "usuario": "henryOo",
  "detalle": [],
  "observacion": "Venta sin productos"
}

RESPUESTA ESPERADA (400 Bad Request):
{
  "success": false,
  "message": "El detalle de la venta es requerido y debe contener al menos un item"
}

================================================================================
PRUEBA 8: VENTA INVÁLIDA - CANTIDAD NEGATIVA
================================================================================

POST http://localhost:3000/api/ventas
Content-Type: application/json

{
  "usuario": "henryOo",
  "detalle": [
    {
      "IdProducto": 1,
      "Cantidad": -5,
      "PrecioUnitario": 4500.00,
      "Descuento": 0
    }
  ]
}

RESPUESTA ESPERADA (400 Bad Request):
{
  "success": false,
  "message": "Item 1: debe tener una Cantidad válida mayor a 0"
}

================================================================================
COMANDOS CURL (ALTERNATIVA)
================================================================================

# Registrar venta
curl -X POST http://localhost:3000/api/ventas \
  -H "Content-Type: application/json" \
  -d '{"usuario":"henryOo","detalle":[{"IdProducto":1,"Cantidad":1,"PrecioUnitario":4500,"Descuento":0}],"observacion":"Venta desde curl"}'

# Listar ventas
curl http://localhost:3000/api/ventas

# Obtener detalle
curl http://localhost:3000/api/ventas/1

================================================================================
RESUMEN DE ENDPOINTS
================================================================================

POST   /api/ventas          - Registrar nueva venta
GET    /api/ventas          - Listar ventas (con paginación y filtros)
GET    /api/ventas/:id      - Obtener detalle de venta específica

PARÁMETROS QUERY PARA LISTAR:
- pagina: número de página (default: 1)
- tamanoPagina: registros por página (default: 20)
- fechaInicio: fecha inicial (formato: YYYY-MM-DD)
- fechaFin: fecha final (formato: YYYY-MM-DD)
- usuario: filtrar por usuario

================================================================================
FLUJO DE PRUEBA RECOMENDADO
================================================================================

1. ✅ Ejecutar validar_modulo_ventas.sql
2. ✅ Ejecutar datos_prueba_ventas.sql
3. ✅ Iniciar servidor (npm start)
4. ✅ Probar PRUEBA 1 (venta exitosa)
5. ✅ Verificar stock actualizado en BD
6. ✅ Probar PRUEBA 2 (venta con descuento)
7. ✅ Probar PRUEBA 3 (venta sin stock - debe fallar)
8. ✅ Probar PRUEBA 4 (listar ventas)
9. ✅ Probar PRUEBA 6 (detalle de venta)
10. ✅ Probar validaciones (PRUEBA 7 y 8)

================================================================================
