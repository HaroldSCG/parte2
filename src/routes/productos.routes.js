const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/productos.controller');

const router = express.Router();

// Rate limit solo para creación
const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// Validación básica
function validateCreate(req, res, next) {
  const { nombre, precioCosto, precioVenta, descuento, cantidad } = req.body || {};
  if (!nombre || precioCosto == null || precioVenta == null) {
    return res.status(400).json({ success: false, message: 'nombre, precioCosto y precioVenta son requeridos' });
  }
  const costo = Number(precioCosto), venta = Number(precioVenta);
  if (!Number.isFinite(costo) || costo <= 0) return res.status(400).json({ success: false, message: 'precioCosto debe ser mayor a 0' });
  if (!Number.isFinite(venta) || venta <= 0) return res.status(400).json({ success: false, message: 'precioVenta debe ser mayor a 0' });
  const desc = descuento == null ? 0 : Number(descuento);
  if (!Number.isFinite(desc) || desc < 0 || desc > 100) return res.status(400).json({ success: false, message: 'descuento debe estar entre 0 y 100' });
  const cant = cantidad == null ? 0 : Number(cantidad);
  if (!Number.isFinite(cant) || cant < 0) return res.status(400).json({ success: false, message: 'cantidad debe ser >= 0' });
  next();
}

router.post('/', createLimiter, validateCreate, controller.createProducto);
router.get('/', controller.listProductos);
router.get('/:codigo', controller.getProducto);
router.put('/:codigo', controller.updateProducto);
router.delete('/:codigo', controller.deleteProducto);

module.exports = router;
