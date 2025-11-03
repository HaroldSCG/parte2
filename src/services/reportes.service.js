require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

// Construir cadena de conexión desde env
const dbServer = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const dbName = process.env.DB_DATABASE || 'AcademicoDB';
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const odbcDriver = process.env.ODBC_DRIVER || 'ODBC Driver 18 for SQL Server';
const encrypt = process.env.DB_ENCRYPT || 'no';
const trustCert = process.env.DB_TRUST_CERT || 'yes';
const useTrusted = !dbUser || !dbPass;
const connectionString = `Driver={${odbcDriver}};Server=${dbServer};Database=${dbName};` +
  (useTrusted ? 'Trusted_Connection=Yes;' : `Trusted_Connection=No;Uid=${dbUser};Pwd=${dbPass};`) +
  `Encrypt=${encrypt};TrustServerCertificate=${trustCert};`;

let pool;
async function getPool() {
  if (!pool) {
    pool = await sql.connect({ connectionString });
  }
  return pool;
}

/**
 * Reporte de ventas por rango de fechas
 * @param {Date} fechaInicio - Fecha inicial
 * @param {Date} fechaFin - Fecha final
 * @param {string} usuario - Usuario específico (opcional)
 * @param {number} idCategoria - ID de categoría para filtrar (opcional)
 * @returns {Array} Lista de ventas con detalle
 */
async function reporteVentasPorFecha(fechaInicio, fechaFin, usuario = null, idCategoria = null) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('FechaInicio', sql.DateTime2, fechaInicio);
    request.input('FechaFin', sql.DateTime2, fechaFin);
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('IdCategoria', sql.Int, idCategoria);
    
    const result = await request.execute('com.sp_ReporteVentasPorFecha');
    return result.recordset;
  } catch (error) {
    console.error('Error en reporteVentasPorFecha:', error);
    throw error;
  }
}

/**
 * Reporte de inventario actual
 * @param {number} idProducto - ID de producto específico (opcional)
 * @param {number} idCategoria - ID de categoría para filtrar (opcional)
 * @param {number} ultimosMov - Cantidad de movimientos recientes a incluir
 * @returns {Object} Objeto con inventario actual y movimientos recientes
 */
async function reporteInventarioActual(idProducto = null, idCategoria = null, ultimosMov = 50) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('IdProducto', sql.Int, idProducto);
    request.input('IdCategoria', sql.Int, idCategoria);
    request.input('UltimosMov', sql.Int, ultimosMov);
    
    const result = await request.execute('com.sp_ReporteInventarioActual');
    
    // El SP retorna 2 result sets: inventario actual y movimientos recientes
    return {
      inventario: result.recordsets[0] || [],
      movimientos: result.recordsets[1] || []
    };
  } catch (error) {
    console.error('Error en reporteInventarioActual:', error);
    throw error;
  }
}

/**
 * Reporte de productos más vendidos
 * @param {number} topN - Cantidad de productos a retornar
 * @param {Date} fechaInicio - Fecha inicial del periodo (opcional)
 * @param {Date} fechaFin - Fecha final del periodo (opcional)
 * @returns {Array} Lista de productos más vendidos
 */
async function reporteProductosMasVendidos(topN = 10, fechaInicio = null, fechaFin = null) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('TopN', sql.Int, topN);
    request.input('FechaInicio', sql.DateTime2, fechaInicio);
    request.input('FechaFin', sql.DateTime2, fechaFin);
    
    const result = await request.execute('com.sp_ReporteProductosMasVendidos');
    return result.recordset;
  } catch (error) {
    console.error('Error en reporteProductosMasVendidos:', error);
    throw error;
  }
}

/**
 * Reporte de ingresos totales
 * @param {number} anio - Año a consultar
 * @param {number} mes - Mes específico (opcional, null para reporte anual)
 * @returns {Array} Lista de ingresos por periodo
 */
async function reporteIngresosTotales(anio, mes = null) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('Anio', sql.Int, anio);
    request.input('Mes', sql.Int, mes);
    
    const result = await request.execute('com.sp_ReporteIngresosTotales');
    return result.recordset;
  } catch (error) {
    console.error('Error en reporteIngresosTotales:', error);
    throw error;
  }
}

module.exports = {
  reporteVentasPorFecha,
  reporteInventarioActual,
  reporteProductosMasVendidos,
  reporteIngresosTotales
};
