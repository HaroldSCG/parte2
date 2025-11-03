const service = require('../services/reportes.service');

/**
 * Reporte de ventas por fecha
 * GET /api/reportes/ventas?fechaInicio=2024-01-01&fechaFin=2024-12-31&usuario=admin&idCategoria=1
 */
async function reporteVentasPorFecha(req, res) {
  try {
    const { fechaInicio, fechaFin, usuario, idCategoria } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas de inicio y fin son requeridas'
      });
    }
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido'
      });
    }
    
    const idCat = idCategoria ? parseInt(idCategoria) : null;
    
    const reporte = await service.reporteVentasPorFecha(
      inicio,
      fin,
      usuario || null,
      idCat
    );
    
    return res.json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error('Error en reporteVentasPorFecha:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de ventas'
    });
  }
}

/**
 * Reporte de inventario actual
 * GET /api/reportes/inventario?idProducto=1&idCategoria=1&ultimosMov=50
 */
async function reporteInventarioActual(req, res) {
  try {
    const idProducto = req.query.idProducto ? parseInt(req.query.idProducto) : null;
    const idCategoria = req.query.idCategoria ? parseInt(req.query.idCategoria) : null;
    const ultimosMov = req.query.ultimosMov ? parseInt(req.query.ultimosMov) : 50;
    
    const reporte = await service.reporteInventarioActual(idProducto, idCategoria, ultimosMov);
    
    return res.json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error('Error en reporteInventarioActual:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de inventario'
    });
  }
}

/**
 * Reporte de productos más vendidos
 * GET /api/reportes/top-productos?topN=10&fechaInicio=2024-01-01&fechaFin=2024-12-31
 */
async function reporteProductosMasVendidos(req, res) {
  try {
    const topN = req.query.topN ? parseInt(req.query.topN) : 10;
    const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio) : null;
    const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin) : null;
    
    if (topN < 1 || topN > 100) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro topN debe estar entre 1 y 100'
      });
    }
    
    const reporte = await service.reporteProductosMasVendidos(topN, fechaInicio, fechaFin);
    
    return res.json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error('Error en reporteProductosMasVendidos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de productos más vendidos'
    });
  }
}

/**
 * Reporte de ingresos totales
 * GET /api/reportes/ingresos?anio=2024&mes=12
 */
async function reporteIngresosTotales(req, res) {
  try {
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear();
    const mes = req.query.mes ? parseInt(req.query.mes) : null;
    
    if (anio < 2000 || anio > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Año inválido'
      });
    }
    
    if (mes && (mes < 1 || mes > 12)) {
      return res.status(400).json({
        success: false,
        message: 'Mes inválido. Debe estar entre 1 y 12'
      });
    }
    
    const reporte = await service.reporteIngresosTotales(anio, mes);
    
    return res.json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error('Error en reporteIngresosTotales:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de ingresos'
    });
  }
}

module.exports = {
  reporteVentasPorFecha,
  reporteInventarioActual,
  reporteProductosMasVendidos,
  reporteIngresosTotales
};
