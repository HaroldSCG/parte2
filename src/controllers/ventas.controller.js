const service = require('../services/ventas.service');

/**
 * Registrar una nueva venta
 * POST /api/ventas
 * Body: { detalle: [{IdProducto, Cantidad, PrecioUnitario, Descuento}], observacion }
 */
async function registrarVenta(req, res) {
  try {
    const { detalle, observacion } = req.body;
    const usuario = req.user?.usuario || 'sistema';
    
    // Validaciones
    if (!Array.isArray(detalle) || detalle.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El detalle de la venta es requerido y debe contener al menos un item'
      });
    }
    
    // Validar cada item del detalle
    for (const item of detalle) {
      if (!item.IdProducto || isNaN(parseInt(item.IdProducto))) {
        return res.status(400).json({
          success: false,
          message: 'Cada item debe tener un IdProducto válido'
        });
      }
      
      if (!item.Cantidad || isNaN(parseInt(item.Cantidad)) || parseInt(item.Cantidad) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cada item debe tener una Cantidad válida mayor a 0'
        });
      }
      
      if (item.PrecioUnitario === undefined || isNaN(parseFloat(item.PrecioUnitario)) || parseFloat(item.PrecioUnitario) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cada item debe tener un PrecioUnitario válido'
        });
      }
    }
    
    // Normalizar detalle
    const detalleNormalizado = detalle.map(item => ({
      IdProducto: parseInt(item.IdProducto),
      Cantidad: parseInt(item.Cantidad),
      PrecioUnitario: parseFloat(item.PrecioUnitario),
      Descuento: item.Descuento ? parseFloat(item.Descuento) : 0
    }));
    
    const result = await service.registrarVenta(usuario, detalleNormalizado, observacion || null);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.mensaje
      });
    }
    
    return res.status(201).json({
      success: true,
      message: result.mensaje,
      idVenta: result.idVenta
    });
  } catch (error) {
    console.error('Error en registrarVenta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la venta'
    });
  }
}

/**
 * Listar ventas con paginación
 * GET /api/ventas?pagina=1&tamanoPagina=20&fechaInicio=2024-01-01&fechaFin=2024-12-31&usuario=admin
 */
async function listarVentas(req, res) {
  try {
    const pagina = req.query.pagina ? parseInt(req.query.pagina) : 1;
    const tamanoPagina = req.query.tamanoPagina ? parseInt(req.query.tamanoPagina) : 20;
    const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio) : null;
    const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin) : null;
    const usuario = req.query.usuario || null;
    
    if (pagina < 1 || tamanoPagina < 1) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros de paginación deben ser mayores a 0'
      });
    }
    
    const ventas = await service.listarVentas(pagina, tamanoPagina, fechaInicio, fechaFin, usuario);
    
    return res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error en listarVentas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar las ventas'
    });
  }
}

/**
 * Obtener detalle de una venta específica
 * GET /api/ventas/:id
 */
async function obtenerDetalleVenta(req, res) {
  try {
    const { id } = req.params;
    const idVenta = parseInt(id);
    
    if (isNaN(idVenta)) {
      return res.status(400).json({
        success: false,
        message: 'ID de venta inválido'
      });
    }
    
    const detalle = await service.obtenerDetalleVenta(idVenta);
    
    if (!detalle.cabecera) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: detalle
    });
  } catch (error) {
    console.error('Error en obtenerDetalleVenta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle de la venta'
    });
  }
}

module.exports = {
  registrarVenta,
  listarVentas,
  obtenerDetalleVenta
};
