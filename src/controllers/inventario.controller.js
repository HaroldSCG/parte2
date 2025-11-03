const service = require('../services/inventario.service');

/**
 * Registrar un movimiento de inventario
 * POST /api/inventario/movimiento
 * Body: { idProducto, cantidad, tipo, observacion }
 */
async function registrarMovimiento(req, res) {
  try {
    const { idProducto, cantidad, tipo, observacion } = req.body;
    const usuario = req.user?.usuario || 'sistema';
    
    // Validaciones
    if (!idProducto || isNaN(parseInt(idProducto))) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }
    
    if (!cantidad || isNaN(parseInt(cantidad))) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad inválida'
      });
    }
    
    const tiposValidos = ['ENTRADA', 'SALIDA', 'AJUSTE', 'COMPRA'];
    if (!tipo || !tiposValidos.includes(tipo.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
      });
    }
    
    const result = await service.registrarMovimiento(
      usuario,
      parseInt(idProducto),
      parseInt(cantidad),
      tipo.toUpperCase(),
      observacion || null
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.mensaje
      });
    }
    
    return res.status(201).json({
      success: true,
      message: result.mensaje,
      idMovimiento: result.idMovimiento
    });
  } catch (error) {
    console.error('Error en registrarMovimiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el movimiento'
    });
  }
}

/**
 * Consultar stock actual
 * GET /api/inventario/stock?idProducto=1&stockMinimo=10
 */
async function consultarStock(req, res) {
  try {
    const idProducto = req.query.idProducto ? parseInt(req.query.idProducto) : null;
    const stockMinimo = req.query.stockMinimo ? parseInt(req.query.stockMinimo) : 10;
    
    if (idProducto && isNaN(idProducto)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }
    
    const stock = await service.consultarStock(idProducto, stockMinimo);
    
    return res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Error en consultarStock:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el stock'
    });
  }
}

/**
 * Consultar movimientos de inventario (bitácora)
 * GET /api/inventario/movimientos?idProducto=1&tipo=ENTRADA&limite=50
 */
async function consultarMovimientos(req, res) {
  try {
    const filtros = {
      idProducto: req.query.idProducto ? parseInt(req.query.idProducto) : null,
      tipo: req.query.tipo || null,
      fechaDesde: req.query.fechaDesde ? new Date(req.query.fechaDesde) : null,
      fechaHasta: req.query.fechaHasta ? new Date(req.query.fechaHasta) : null,
      limite: req.query.limite ? parseInt(req.query.limite) : 100
    };
    
    const movimientos = await service.consultarMovimientos(filtros);
    
    return res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error en consultarMovimientos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar movimientos'
    });
  }
}

module.exports = {
  registrarMovimiento,
  consultarStock,
  consultarMovimientos
};
