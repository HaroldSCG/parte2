-- =============================================
-- Script para agregar esquema inv y vista v_productos
-- Base de datos: AcademicoDB
-- Fecha: 2 de Noviembre, 2025
-- =============================================

USE AcademicoDB;
GO

-- Crear esquema inv si no existe
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'inv')
BEGIN
    EXEC('CREATE SCHEMA inv');
    PRINT '✅ Esquema inv creado exitosamente';
END
ELSE
BEGIN
    PRINT '⚠️ Esquema inv ya existe';
END
GO

-- Eliminar vista si existe
IF OBJECT_ID('inv.v_productos', 'V') IS NOT NULL
BEGIN
    DROP VIEW inv.v_productos;
    PRINT '🗑️ Vista inv.v_productos anterior eliminada';
END
GO

-- Crear vista inv.v_productos
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

-- Verificar que la vista funciona correctamente
SELECT TOP 5 * FROM inv.v_productos ORDER BY IdProducto DESC;
GO

PRINT '✅ Script completado exitosamente';
