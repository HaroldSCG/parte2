const express = require('express');
const controller = require('../controllers/ventas.controller');

const router = express.Router();

/**
 * @route POST /api/ventas
 * @desc Registrar una nueva venta con sus detalles
 * @body { detalle: [{IdProducto, Cantidad, PrecioUnitario, Descuento}], observacion }
 * @access Private (requiere autenticación)
 */
router.post('/', controller.registrarVenta);

/**
 * @route GET /api/ventas
 * @desc Listar ventas con paginación y filtros
 * @query pagina - Number (default: 1)
 * @query tamanoPagina - Number (default: 20)
 * @query fechaInicio - Date (opcional) - Formato: YYYY-MM-DD
 * @query fechaFin - Date (opcional) - Formato: YYYY-MM-DD
 * @query usuario - String (opcional) - Filtrar por usuario
 * @access Private
 */
router.get('/', controller.listarVentas);

/**
 * @route GET /api/ventas/:id
 * @desc Obtener detalle completo de una venta específica
 * @access Private
 */
router.get('/:id', controller.obtenerDetalleVenta);

module.exports = router;
