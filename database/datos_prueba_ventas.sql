-- ============================================================================
-- SCRIPT DE DATOS DE PRUEBA - MÓDULO DE VENTAS
-- ============================================================================
-- Este script crea datos de prueba para poder probar el módulo de ventas
-- ============================================================================

USE AcademicoDB;
GO

PRINT '========================================';
PRINT 'GENERANDO DATOS DE PRUEBA PARA VENTAS';
PRINT '========================================';
PRINT '';

-- 1. CREAR CATEGORÍAS SI NO EXISTEN
PRINT '1. Creando categorías...';

IF NOT EXISTS (SELECT 1 FROM com.tbCategoria WHERE Nombre = 'Tecnología')
BEGIN
    INSERT INTO com.tbCategoria (Nombre, Descripcion, Activo)
    VALUES ('Tecnología', 'Productos tecnológicos y electrónicos', 1);
    PRINT '   ✓ Categoría Tecnología creada';
END
ELSE
    PRINT '   ℹ Categoría Tecnología ya existe';

IF NOT EXISTS (SELECT 1 FROM com.tbCategoria WHERE Nombre = 'Papelería')
BEGIN
    INSERT INTO com.tbCategoria (Nombre, Descripcion, Activo)
    VALUES ('Papelería', 'Artículos de oficina y papelería', 1);
    PRINT '   ✓ Categoría Papelería creada';
END
ELSE
    PRINT '   ℹ Categoría Papelería ya existe';

IF NOT EXISTS (SELECT 1 FROM com.tbCategoria WHERE Nombre = 'Librería')
BEGIN
    INSERT INTO com.tbCategoria (Nombre, Descripcion, Activo)
    VALUES ('Librería', 'Libros y material educativo', 1);
    PRINT '   ✓ Categoría Librería creada';
END
ELSE
    PRINT '   ℹ Categoría Librería ya existe';

PRINT '';

-- 2. CREAR PRODUCTOS SI NO EXISTEN
PRINT '2. Creando productos...';

-- Producto 1: Laptop
IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE Codigo = 'LAP001')
BEGIN
    INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento, Estado)
    VALUES ('LAP001', 'Laptop HP 15', 'Laptop HP 15 pulgadas, 8GB RAM, 256GB SSD', 3500.00, 4500.00, 0, 1);
    PRINT '   ✓ Producto Laptop HP 15 creado';
END
ELSE
    PRINT '   ℹ Producto LAP001 ya existe';

-- Producto 2: Mouse
IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE Codigo = 'MOU001')
BEGIN
    INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento, Estado)
    VALUES ('MOU001', 'Mouse Inalámbrico Logitech', 'Mouse inalámbrico con sensor óptico', 80.00, 120.00, 0, 1);
    PRINT '   ✓ Producto Mouse Inalámbrico creado';
END
ELSE
    PRINT '   ℹ Producto MOU001 ya existe';

-- Producto 3: Cuaderno
IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE Codigo = 'CUA001')
BEGIN
    INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento, Estado)
    VALUES ('CUA001', 'Cuaderno 100 hojas', 'Cuaderno espiral 100 hojas cuadriculadas', 8.00, 15.00, 0, 1);
    PRINT '   ✓ Producto Cuaderno creado';
END
ELSE
    PRINT '   ℹ Producto CUA001 ya existe';

-- Producto 4: Bolígrafos
IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE Codigo = 'BOL001')
BEGIN
    INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento, Estado)
    VALUES ('BOL001', 'Bolígrafo Azul (paquete 10)', 'Paquete de 10 bolígrafos azules', 12.00, 20.00, 0, 1);
    PRINT '   ✓ Producto Bolígrafos creado';
END
ELSE
    PRINT '   ℹ Producto BOL001 ya existe';

-- Producto 5: Libro
IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE Codigo = 'LIB001')
BEGIN
    INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento, Estado)
    VALUES ('LIB001', 'Cálculo I - Stewart', 'Libro de Cálculo I 8va edición', 150.00, 250.00, 0, 1);
    PRINT '   ✓ Producto Libro Cálculo creado';
END
ELSE
    PRINT '   ℹ Producto LIB001 ya existe';

PRINT '';

-- 3. ASOCIAR PRODUCTOS CON CATEGORÍAS
PRINT '3. Asociando productos con categorías...';

DECLARE @idTecnologia INT = (SELECT IdCategoria FROM com.tbCategoria WHERE Nombre = 'Tecnología');
DECLARE @idPapeleria INT = (SELECT IdCategoria FROM com.tbCategoria WHERE Nombre = 'Papelería');
DECLARE @idLibreria INT = (SELECT IdCategoria FROM com.tbCategoria WHERE Nombre = 'Librería');

-- Laptop -> Tecnología
DECLARE @idLaptop INT = (SELECT IdProducto FROM com.tbProducto WHERE Codigo = 'LAP001');
IF NOT EXISTS (SELECT 1 FROM com.tbProductoCategoria WHERE IdProducto = @idLaptop AND IdCategoria = @idTecnologia)
BEGIN
    INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES (@idLaptop, @idTecnologia);
    PRINT '   ✓ Laptop asociado a Tecnología';
END;

-- Mouse -> Tecnología
DECLARE @idMouse INT = (SELECT IdProducto FROM com.tbProducto WHERE Codigo = 'MOU001');
IF NOT EXISTS (SELECT 1 FROM com.tbProductoCategoria WHERE IdProducto = @idMouse AND IdCategoria = @idTecnologia)
BEGIN
    INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES (@idMouse, @idTecnologia);
    PRINT '   ✓ Mouse asociado a Tecnología';
END;

-- Cuaderno -> Papelería
DECLARE @idCuaderno INT = (SELECT IdProducto FROM com.tbProducto WHERE Codigo = 'CUA001');
IF NOT EXISTS (SELECT 1 FROM com.tbProductoCategoria WHERE IdProducto = @idCuaderno AND IdCategoria = @idPapeleria)
BEGIN
    INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES (@idCuaderno, @idPapeleria);
    PRINT '   ✓ Cuaderno asociado a Papelería';
END;

-- Bolígrafos -> Papelería
DECLARE @idBoligrafo INT = (SELECT IdProducto FROM com.tbProducto WHERE Codigo = 'BOL001');
IF NOT EXISTS (SELECT 1 FROM com.tbProductoCategoria WHERE IdProducto = @idBoligrafo AND IdCategoria = @idPapeleria)
BEGIN
    INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES (@idBoligrafo, @idPapeleria);
    PRINT '   ✓ Bolígrafos asociado a Papelería';
END;

-- Libro -> Librería
DECLARE @idLibro INT = (SELECT IdProducto FROM com.tbProducto WHERE Codigo = 'LIB001');
IF NOT EXISTS (SELECT 1 FROM com.tbProductoCategoria WHERE IdProducto = @idLibro AND IdCategoria = @idLibreria)
BEGIN
    INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES (@idLibro, @idLibreria);
    PRINT '   ✓ Libro asociado a Librería';
END;

PRINT '';

-- 4. REGISTRAR INVENTARIO INICIAL (ENTRADAS)
PRINT '4. Registrando inventario inicial...';

-- Obtener usuario admin para los movimientos
DECLARE @usuarioAdmin VARCHAR(50);
SELECT TOP 1 @usuarioAdmin = Usuario FROM seg.tbUsuario WHERE Rol = 'admin' AND Estado = 1;

IF @usuarioAdmin IS NULL
BEGIN
    PRINT '   ✗ ERROR: No hay usuario admin activo para registrar movimientos';
END
ELSE
BEGIN
    -- Stock para Laptop (5 unidades)
    IF NOT EXISTS (SELECT 1 FROM com.tbInventario WHERE IdProducto = @idLaptop AND Tipo = 'ENTRADA' AND Cantidad = 5)
    BEGIN
        INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
        VALUES (@idLaptop, 5, 'ENTRADA', @usuarioAdmin, 'Inventario inicial - Laptops');
        PRINT '   ✓ Stock inicial Laptop: 5 unidades';
    END;

    -- Stock para Mouse (50 unidades)
    IF NOT EXISTS (SELECT 1 FROM com.tbInventario WHERE IdProducto = @idMouse AND Tipo = 'ENTRADA' AND Cantidad = 50)
    BEGIN
        INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
        VALUES (@idMouse, 50, 'ENTRADA', @usuarioAdmin, 'Inventario inicial - Mouse');
        PRINT '   ✓ Stock inicial Mouse: 50 unidades';
    END;

    -- Stock para Cuadernos (200 unidades)
    IF NOT EXISTS (SELECT 1 FROM com.tbInventario WHERE IdProducto = @idCuaderno AND Tipo = 'ENTRADA' AND Cantidad = 200)
    BEGIN
        INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
        VALUES (@idCuaderno, 200, 'ENTRADA', @usuarioAdmin, 'Inventario inicial - Cuadernos');
        PRINT '   ✓ Stock inicial Cuaderno: 200 unidades';
    END;

    -- Stock para Bolígrafos (100 paquetes)
    IF NOT EXISTS (SELECT 1 FROM com.tbInventario WHERE IdProducto = @idBoligrafo AND Tipo = 'ENTRADA' AND Cantidad = 100)
    BEGIN
        INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
        VALUES (@idBoligrafo, 100, 'ENTRADA', @usuarioAdmin, 'Inventario inicial - Bolígrafos');
        PRINT '   ✓ Stock inicial Bolígrafos: 100 paquetes';
    END;

    -- Stock para Libros (30 unidades)
    IF NOT EXISTS (SELECT 1 FROM com.tbInventario WHERE IdProducto = @idLibro AND Tipo = 'ENTRADA' AND Cantidad = 30)
    BEGIN
        INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
        VALUES (@idLibro, 30, 'ENTRADA', @usuarioAdmin, 'Inventario inicial - Libros');
        PRINT '   ✓ Stock inicial Libro: 30 unidades';
    END;
END;

PRINT '';

-- 5. VERIFICAR STOCK ACTUAL
PRINT '5. Verificando stock actual...';

SELECT 
    p.Codigo,
    p.Nombre,
    ISNULL(s.Existencia, 0) AS Stock,
    p.PrecioVenta
FROM com.tbProducto p
LEFT JOIN com.tbStock s ON p.IdProducto = s.IdProducto
WHERE p.Estado = 1
ORDER BY p.Nombre;

PRINT '';
PRINT '========================================';
PRINT 'DATOS DE PRUEBA CREADOS EXITOSAMENTE';
PRINT '========================================';
PRINT '';
PRINT 'RESUMEN:';
PRINT '- 3 categorías creadas';
PRINT '- 5 productos creados';
PRINT '- Productos asociados a categorías';
PRINT '- Stock inicial registrado';
PRINT '';
PRINT 'Ahora puedes probar el módulo de ventas con estos datos.';
PRINT '';
GO
