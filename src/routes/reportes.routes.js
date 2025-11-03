const express = require('express');
const controller = require('../controllers/reportes.controller');

const router = express.Router();

/**
 * @route GET /api/reportes/ventas
 * @desc Reporte de ventas por rango de fechas
 * @query fechaInicio - Date (requerido) - Formato: YYYY-MM-DD
 * @query fechaFin - Date (requerido) - Formato: YYYY-MM-DD
 * @query usuario - String (opcional) - Filtrar por usuario
 * @query idCategoria - Number (opcional) - Filtrar por categoría
 * @access Private
 */
router.get('/ventas', controller.reporteVentasPorFecha);

/**
 * @route GET /api/reportes/inventario
 * @desc Reporte de inventario actual con movimientos recientes
 * @query idProducto - Number (opcional) - Filtrar por producto específico
 * @query idCategoria - Number (opcional) - Filtrar por categoría
 * @query ultimosMov - Number (default: 50) - Cantidad de movimientos recientes
 * @access Private
 */
router.get('/inventario', controller.reporteInventarioActual);

/**
 * @route GET /api/reportes/top-productos
 * @desc Reporte de productos más vendidos
 * @query topN - Number (default: 10) - Cantidad de productos a retornar (max: 100)
 * @query fechaInicio - Date (opcional) - Formato: YYYY-MM-DD
 * @query fechaFin - Date (opcional) - Formato: YYYY-MM-DD
 * @access Private
 */
router.get('/top-productos', controller.reporteProductosMasVendidos);

/**
 * @route GET /api/reportes/ingresos
 * @desc Reporte de ingresos totales por periodo
 * @query anio - Number (requerido) - Año a consultar
 * @query mes - Number (opcional) - Mes específico (1-12). Si se omite, retorna datos mensuales del año
 * @access Private
 */
router.get('/ingresos', controller.reporteIngresosTotales);

module.exports = router;
