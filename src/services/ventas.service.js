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
 * Registrar una nueva venta con sus detalles
 * @param {string} usuario - Usuario que ejecuta la operación
 * @param {Array} detalle - Array de items: [{IdProducto, Cantidad, PrecioUnitario, Descuento}]
 * @param {string} observacion - Observación opcional
 * @returns {Object} Resultado de la operación
 */
async function registrarVenta(usuario, detalle, observacion = null) {
  try {
    const p = await getPool();
    const request = p.request();
    
    // Convertir detalle a JSON
    const detalleJSON = JSON.stringify(detalle);
    
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('Observacion', sql.VarChar(500), observacion);
    request.input('Detalle', sql.NVarChar(sql.MAX), detalleJSON);
    request.output('Mensaje', sql.NVarChar(200));
    
    const result = await request.execute('com.sp_RegistrarVenta');
    
    return {
      success: result.returnValue >= 0,
      idVenta: result.returnValue,
      mensaje: result.output.Mensaje
    };
  } catch (error) {
    console.error('Error en registrarVenta:', error);
    throw error;
  }
}

/**
 * Listar ventas con paginación
 * @param {number} pagina - Número de página
 * @param {number} tamanoPagina - Tamaño de página
 * @param {Date} fechaInicio - Fecha inicial del filtro
 * @param {Date} fechaFin - Fecha final del filtro
 * @param {string} usuario - Usuario que realizó la venta
 * @returns {Array} Lista de ventas
 */
async function listarVentas(pagina = 1, tamanoPagina = 20, fechaInicio = null, fechaFin = null, usuario = null) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('Pagina', sql.Int, pagina);
    request.input('TamanoPagina', sql.Int, tamanoPagina);
    request.input('FechaInicio', sql.DateTime2, fechaInicio);
    request.input('FechaFin', sql.DateTime2, fechaFin);
    request.input('Usuario', sql.VarChar(50), usuario);
    
    const result = await request.execute('com.sp_ListarVentas');
    return result.recordset;
  } catch (error) {
    console.error('Error en listarVentas:', error);
    throw error;
  }
}

/**
 * Obtener detalle completo de una venta
 * @param {number} idVenta - ID de la venta
 * @returns {Object} Objeto con cabecera e items de la venta
 */
async function obtenerDetalleVenta(idVenta) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('IdVenta', sql.BigInt, idVenta);
    
    const result = await request.execute('com.sp_ObtenerDetalleVenta');
    
    // El SP retorna 2 result sets: cabecera e items
    return {
      cabecera: result.recordsets[0] && result.recordsets[0][0] ? result.recordsets[0][0] : null,
      items: result.recordsets[1] || []
    };
  } catch (error) {
    console.error('Error en obtenerDetalleVenta:', error);
    throw error;
  }
}

module.exports = {
  registrarVenta,
  listarVentas,
  obtenerDetalleVenta
};
