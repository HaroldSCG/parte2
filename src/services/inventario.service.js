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
 * Registrar un movimiento de inventario
 * @param {string} usuario - Usuario que ejecuta la operación
 * @param {number} idProducto - ID del producto
 * @param {number} cantidad - Cantidad del movimiento (positivo para entradas, negativo para salidas)
 * @param {string} tipo - Tipo de movimiento: ENTRADA, SALIDA, AJUSTE, COMPRA
 * @param {string} observacion - Observación opcional
 * @returns {Object} Resultado de la operación
 */
async function registrarMovimiento(usuario, idProducto, cantidad, tipo, observacion = null) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('IdProducto', sql.Int, idProducto);
    request.input('Cantidad', sql.Int, cantidad);
    request.input('Tipo', sql.VarChar(20), tipo);
    request.input('Observacion', sql.VarChar(500), observacion);
    request.output('Mensaje', sql.NVarChar(200));
    
    const result = await request.execute('com.sp_RegistrarMovimientoInventario');
    
    return {
      success: result.returnValue >= 0,
      idMovimiento: result.returnValue,
      mensaje: result.output.Mensaje
    };
  } catch (error) {
    console.error('Error en registrarMovimiento:', error);
    throw error;
  }
}

/**
 * Consultar stock actual de productos
 * @param {number} idProducto - ID del producto (null para todos)
 * @param {number} stockMinimo - Nivel mínimo de stock para alertas
 * @returns {Array} Lista de productos con su stock
 */
async function consultarStock(idProducto = null, stockMinimo = 10) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('IdProducto', sql.Int, idProducto);
    request.input('StockMinimo', sql.Int, stockMinimo);
    
    const result = await request.execute('com.sp_ConsultarStock');
    return result.recordset;
  } catch (error) {
    console.error('Error en consultarStock:', error);
    throw error;
  }
}

module.exports = {
  registrarMovimiento,
  consultarStock
};
