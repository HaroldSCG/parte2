-- ============================================================================
-- SCRIPT DE VALIDACIÓN - MÓDULO DE VENTAS
-- ============================================================================
-- Ejecutar este script para verificar que toda la estructura necesaria existe
-- en la base de datos AcademicoDB antes de implementar el módulo de ventas
-- ============================================================================

USE AcademicoDB;
GO

PRINT '========================================';
PRINT 'VALIDACIÓN DEL MÓDULO DE VENTAS';
PRINT '========================================';
PRINT '';

-- 1. VALIDAR ESQUEMA COMERCIAL
PRINT '1. Validando esquema comercial...';
IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'com')
    PRINT '   ✓ Esquema "com" existe';
ELSE
    PRINT '   ✗ ERROR: Esquema "com" no existe';
PRINT '';

-- 2. VALIDAR TABLAS
PRINT '2. Validando tablas...';

-- Tabla tbVenta
IF OBJECT_ID('com.tbVenta', 'U') IS NOT NULL
BEGIN
    PRINT '   ✓ Tabla com.tbVenta existe';
    SELECT 
        '     - Columnas: ' + STRING_AGG(COLUMN_NAME, ', ')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'com' AND TABLE_NAME = 'tbVenta';
END
ELSE
    PRINT '   ✗ ERROR: Tabla com.tbVenta no existe';

-- Tabla tbDetalleVenta
IF OBJECT_ID('com.tbDetalleVenta', 'U') IS NOT NULL
BEGIN
    PRINT '   ✓ Tabla com.tbDetalleVenta existe';
    SELECT 
        '     - Columnas: ' + STRING_AGG(COLUMN_NAME, ', ')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'com' AND TABLE_NAME = 'tbDetalleVenta';
END
ELSE
    PRINT '   ✗ ERROR: Tabla com.tbDetalleVenta no existe';

-- Tabla tbProducto
IF OBJECT_ID('com.tbProducto', 'U') IS NOT NULL
    PRINT '   ✓ Tabla com.tbProducto existe';
ELSE
    PRINT '   ✗ ERROR: Tabla com.tbProducto no existe';

-- Tabla tbStock
IF OBJECT_ID('com.tbStock', 'U') IS NOT NULL
    PRINT '   ✓ Tabla com.tbStock existe';
ELSE
    PRINT '   ✗ ERROR: Tabla com.tbStock no existe';

-- Tabla tbInventario
IF OBJECT_ID('com.tbInventario', 'U') IS NOT NULL
    PRINT '   ✓ Tabla com.tbInventario existe';
ELSE
    PRINT '   ✗ ERROR: Tabla com.tbInventario no existe';

PRINT '';

-- 3. VALIDAR TRIGGERS
PRINT '3. Validando triggers...';

IF OBJECT_ID('com.trg_RegistrarVenta_DescontarStock', 'TR') IS NOT NULL
    PRINT '   ✓ Trigger com.trg_RegistrarVenta_DescontarStock existe';
ELSE
    PRINT '   ✗ ERROR: Trigger com.trg_RegistrarVenta_DescontarStock no existe';

IF OBJECT_ID('com.trg_ActualizarStock_Inventario', 'TR') IS NOT NULL
    PRINT '   ✓ Trigger com.trg_ActualizarStock_Inventario existe';
ELSE
    PRINT '   ✗ ERROR: Trigger com.trg_ActualizarStock_Inventario no existe';

PRINT '';

-- 4. VALIDAR STORED PROCEDURES
PRINT '4. Validando stored procedures...';

IF OBJECT_ID('com.sp_RegistrarVenta', 'P') IS NOT NULL
BEGIN
    PRINT '   ✓ SP com.sp_RegistrarVenta existe';
    -- Mostrar parámetros
    SELECT '     - Parámetros: ' + STRING_AGG(
        name + ' ' + TYPE_NAME(user_type_id) + 
        CASE WHEN is_output = 1 THEN ' OUTPUT' ELSE '' END, 
        ', '
    )
    FROM sys.parameters
    WHERE object_id = OBJECT_ID('com.sp_RegistrarVenta');
END
ELSE
    PRINT '   ✗ ERROR: SP com.sp_RegistrarVenta no existe';

IF OBJECT_ID('com.sp_ListarVentas', 'P') IS NOT NULL
BEGIN
    PRINT '   ✓ SP com.sp_ListarVentas existe';
    SELECT '     - Parámetros: ' + STRING_AGG(
        name + ' ' + TYPE_NAME(user_type_id), 
        ', '
    )
    FROM sys.parameters
    WHERE object_id = OBJECT_ID('com.sp_ListarVentas');
END
ELSE
    PRINT '   ✗ ERROR: SP com.sp_ListarVentas no existe';

IF OBJECT_ID('com.sp_ObtenerDetalleVenta', 'P') IS NOT NULL
BEGIN
    PRINT '   ✓ SP com.sp_ObtenerDetalleVenta existe';
    SELECT '     - Parámetros: ' + STRING_AGG(
        name + ' ' + TYPE_NAME(user_type_id), 
        ', '
    )
    FROM sys.parameters
    WHERE object_id = OBJECT_ID('com.sp_ObtenerDetalleVenta');
END
ELSE
    PRINT '   ✗ ERROR: SP com.sp_ObtenerDetalleVenta no existe';

PRINT '';

-- 5. VALIDAR ÍNDICES
PRINT '5. Validando índices...';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbVenta_FechaVenta' AND object_id = OBJECT_ID('com.tbVenta'))
    PRINT '   ✓ Índice IX_tbVenta_FechaVenta existe';
ELSE
    PRINT '   ✗ Advertencia: Índice IX_tbVenta_FechaVenta no existe';

PRINT '';

-- 6. VALIDAR DATOS DE PRUEBA
PRINT '6. Verificando datos existentes...';

DECLARE @countProductos INT, @countStock INT, @countVentas INT;

SELECT @countProductos = COUNT(*) FROM com.tbProducto WHERE Estado = 1;
SELECT @countStock = COUNT(*) FROM com.tbStock WHERE Existencia > 0;
SELECT @countVentas = COUNT(*) FROM com.tbVenta;

PRINT '   - Productos activos: ' + CAST(@countProductos AS VARCHAR);
PRINT '   - Productos con stock: ' + CAST(@countStock AS VARCHAR);
PRINT '   - Ventas registradas: ' + CAST(@countVentas AS VARCHAR);

IF @countProductos = 0
    PRINT '   ⚠ Advertencia: No hay productos activos para vender';

IF @countStock = 0
    PRINT '   ⚠ Advertencia: No hay productos con stock disponible';

PRINT '';

-- 7. VALIDAR USUARIOS CON PERMISOS
PRINT '7. Verificando usuarios...';

DECLARE @countUsuarios INT;
SELECT @countUsuarios = COUNT(*) FROM seg.tbUsuario WHERE Estado = 1;
PRINT '   - Usuarios activos: ' + CAST(@countUsuarios AS VARCHAR);

IF @countUsuarios = 0
    PRINT '   ✗ ERROR: No hay usuarios activos para registrar ventas';

PRINT '';

-- 8. PRUEBA RÁPIDA DE FUNCIONAMIENTO
PRINT '8. Ejecutando prueba de funcionamiento...';
PRINT '   (Esta prueba NO modifica datos)';

-- Simular cálculo de venta
IF EXISTS (SELECT 1 FROM com.tbProducto WHERE Estado = 1)
BEGIN
    DECLARE @testProduct INT;
    SELECT TOP 1 @testProduct = IdProducto FROM com.tbProducto WHERE Estado = 1;
    
    PRINT '   ✓ Producto de prueba encontrado (ID: ' + CAST(@testProduct AS VARCHAR) + ')';
    
    -- Verificar si tiene stock
    DECLARE @testStock INT = 0;
    SELECT @testStock = ISNULL(Existencia, 0) FROM com.tbStock WHERE IdProducto = @testProduct;
    
    IF @testStock > 0
        PRINT '   ✓ Producto tiene stock disponible: ' + CAST(@testStock AS VARCHAR) + ' unidades';
    ELSE
        PRINT '   ⚠ Advertencia: Producto de prueba sin stock';
END
ELSE
    PRINT '   ✗ No se puede ejecutar prueba: sin productos';

PRINT '';
PRINT '========================================';
PRINT 'VALIDACIÓN COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT 'Revisar los resultados arriba.';
PRINT 'Si hay errores (✗), ejecutar el script definitivo.sql completo.';
GO
