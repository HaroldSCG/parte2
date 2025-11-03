const express = require('express');
const controller = require('../controllers/inventario.controller');

const router = express.Router();

/**
 * @route POST /api/inventario/movimiento
 * @desc Registrar un movimiento de inventario (entrada, salida, ajuste, compra)
 * @body { idProducto, cantidad, tipo, observacion }
 * @access Private (requiere autenticación)
 */
router.post('/movimiento', controller.registrarMovimiento);

/**
 * @route GET /api/inventario/stock
 * @desc Consultar stock actual de productos
 * @query idProducto - Number (opcional) - Filtrar por producto específico
 * @query stockMinimo - Number (default: 10) - Nivel mínimo para alertas
 * @access Private
 */
router.get('/stock', controller.consultarStock);

/**
 * @route GET /api/inventario/movimientos
 * @desc Consultar movimientos de inventario (bitácora)
 * @query idProducto - Number (opcional) - Filtrar por producto
 * @query tipo - String (opcional) - Tipo: ENTRADA, SALIDA, AJUSTE, COMPRA
 * @query fechaDesde - Date (opcional) - Fecha inicial
 * @query fechaHasta - Date (opcional) - Fecha final
 * @query limite - Number (default: 100) - Límite de registros
 * @access Private
 */
router.get('/movimientos', controller.consultarMovimientos);

module.exports = router;
