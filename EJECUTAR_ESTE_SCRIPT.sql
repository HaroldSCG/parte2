-- =============================================
-- ⚠️ IMPORTANTE: EJECUTAR ESTE SCRIPT EN SQL SERVER MANAGEMENT STUDIO
-- =============================================
-- Base de datos: AcademicoDB
-- Propósito: Crear esquema inv y vista v_productos para compatibilidad
-- =============================================

USE AcademicoDB;
GO

-- Paso 1: Crear esquema inv
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'inv')
BEGIN
    EXEC('CREATE SCHEMA inv');
    PRINT '✅ Esquema inv creado';
END
GO

-- Paso 2: Crear vista inv.v_productos
IF OBJECT_ID('inv.v_productos', 'V') IS NOT NULL
    DROP VIEW inv.v_productos;
GO

CREATE VIEW inv.v_productos AS
SELECT 
    p.IdProducto,
    p.Codigo,
    p.Nombre,
    p.Descripcion,
    p.PrecioCosto,
    p.PrecioVenta,
    p.Descuento,
    p.Estado,
    p.FechaRegistro,
    ISNULL(s.Existencia, 0) AS Cantidad,
    STUFF((
        SELECT '; ' + c.Nombre
        FROM com.tbProductoCategoria pc
        INNER JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
        WHERE pc.IdProducto = p.IdProducto AND c.Activo = 1
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS Categorias
FROM com.tbProducto p
LEFT JOIN com.tbStock s ON p.IdProducto = s.IdProducto;
GO

PRINT '✅ Vista inv.v_productos creada exitosamente';
GO

-- Verificación
SELECT TOP 5 * FROM inv.v_productos ORDER BY IdProducto DESC;
GO
