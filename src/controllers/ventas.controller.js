const service = require('../services/ventas.service');

/**
 * Registrar una nueva venta
 * POST /api/ventas
 * Body: { detalle: [{IdProducto, Cantidad, PrecioUnitario, Descuento}], observacion, usuario }
 */
async function registrarVenta(req, res) {
  try {
    const { detalle, observacion, usuario: usuarioBody } = req.body;
    
    // Obtener usuario de la sesión o del body (para pruebas)
    const usuario = req.user?.usuario || usuarioBody || 'sistema';
    
    console.log('🛒 Solicitud de registro de venta:', { 
      usuario, 
      items: detalle?.length || 0,
      hasObservacion: !!observacion 
    });
    
    // Validaciones
    if (!Array.isArray(detalle) || detalle.length === 0) {
      console.log('❌ Error: Detalle vacío o inválido');
      return res.status(400).json({
        success: false,
        message: 'El detalle de la venta es requerido y debe contener al menos un item'
      });
    }
    
    // Validar cada item del detalle
    for (let i = 0; i < detalle.length; i++) {
      const item = detalle[i];
      
      if (!item.IdProducto || isNaN(parseInt(item.IdProducto))) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: debe tener un IdProducto válido`
        });
      }
      
      if (!item.Cantidad || isNaN(parseInt(item.Cantidad)) || parseInt(item.Cantidad) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: debe tener una Cantidad válida mayor a 0`
        });
      }
      
      if (item.PrecioUnitario === undefined || isNaN(parseFloat(item.PrecioUnitario)) || parseFloat(item.PrecioUnitario) < 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: debe tener un PrecioUnitario válido`
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
    
    // Registrar venta
    const result = await service.registrarVenta(usuario, detalleNormalizado, observacion || null);
    
    if (!result.success) {
      console.log('❌ Error en SP:', result.mensaje);
      return res.status(400).json({
        success: false,
        message: result.mensaje
      });
    }
    
    console.log('✅ Venta registrada exitosamente:', result.idVenta);
    
    return res.status(201).json({
      success: true,
      message: result.mensaje,
      idVenta: result.idVenta
    });
  } catch (error) {
    console.error('❌ Error en registrarVenta controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la venta: ' + (error.message || 'Error desconocido')
    });
  }
}

/**
 * Listar ventas con paginación
 * GET /api/ventas?page=1&limit=20&fechaDesde=2024-01-01&fechaHasta=2024-12-31&search=admin&montoMin=100&montoMax=5000
 */
async function listarVentas(req, res) {
  try {
    // Manejar parámetros de paginación (soportar ambos formatos)
    const pagina = req.query.page || req.query.pagina ? parseInt(req.query.page || req.query.pagina) : 1;
    const tamanoPagina = req.query.limit || req.query.tamanoPagina ? parseInt(req.query.limit || req.query.tamanoPagina) : 20;
    
    // Parsear fechas (soportar ambos formatos)
    let fechaInicio = null;
    let fechaFin = null;
    
    const fechaInicioParam = req.query.fechaDesde || req.query.fechaInicio;
    const fechaFinParam = req.query.fechaHasta || req.query.fechaFin;
    
    if (fechaInicioParam) {
      fechaInicio = new Date(fechaInicioParam);
      if (isNaN(fechaInicio.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inicio inválido. Use YYYY-MM-DD'
        });
      }
    }
    
    if (fechaFinParam) {
      fechaFin = new Date(fechaFinParam);
      if (isNaN(fechaFin.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha fin inválido. Use YYYY-MM-DD'
        });
      }
      // Ajustar a fin del día
      fechaFin.setHours(23, 59, 59, 999);
    }
    
    // Búsqueda por usuario o texto (soportar ambos formatos)
    const search = req.query.search || null;
    const usuario = req.query.usuario || null;
    
    // Para búsqueda, si viene 'search' lo tratamos como usuario/ID
    const usuarioFiltro = search || usuario;
    
    // Filtros por monto
    let montoMin = null;
    let montoMax = null;
    
    if (req.query.montoMin) {
      montoMin = parseFloat(req.query.montoMin);
      if (isNaN(montoMin)) montoMin = null;
    }
    
    if (req.query.montoMax) {
      montoMax = parseFloat(req.query.montoMax);
      if (isNaN(montoMax)) montoMax = null;
    }
    
    if (pagina < 1 || tamanoPagina < 1) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros de paginación deben ser mayores a 0'
      });
    }
    
    console.log('📊 Listando ventas:', { pagina, tamanoPagina, fechaInicio, fechaFin, usuario: usuarioFiltro, montoMin, montoMax });
    
    const ventas = await service.listarVentas(pagina, tamanoPagina, fechaInicio, fechaFin, usuarioFiltro, montoMin, montoMax);
    
    // Calcular información de paginación
    const totalRegistros = ventas.length > 0 ? ventas[0].TotalRegistros || ventas.length : 0;
    const totalPaginas = Math.ceil(totalRegistros / tamanoPagina);
    
    return res.json({
      success: true,
      data: {
        ventas: ventas,
        total: totalRegistros
      },
      pagination: {
        page: pagina,
        limit: tamanoPagina,
        total: totalRegistros,
        totalPages: totalPaginas,
        hasMore: pagina < totalPaginas
      }
    });
  } catch (error) {
    console.error('❌ Error en listarVentas controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar las ventas: ' + (error.message || 'Error desconocido')
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
    
    if (isNaN(idVenta) || idVenta <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de venta inválido'
      });
    }
    
    console.log('🔍 Obteniendo detalle de venta:', idVenta);
    
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
    console.error('❌ Error en obtenerDetalleVenta controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle de la venta: ' + (error.message || 'Error desconocido')
    });
  }
}

module.exports = {
  registrarVenta,
  listarVentas,
  obtenerDetalleVenta
};
