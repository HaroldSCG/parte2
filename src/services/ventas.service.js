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
    // Validaciones de entrada
    if (!usuario || typeof usuario !== 'string') {
      throw new Error('Usuario es requerido y debe ser una cadena de texto');
    }
    
    if (!Array.isArray(detalle) || detalle.length === 0) {
      throw new Error('El detalle debe ser un array con al menos un producto');
    }
    
    // Validar cada item del detalle
    detalle.forEach((item, index) => {
      if (!item.IdProducto || typeof item.IdProducto !== 'number') {
        throw new Error(`Item ${index + 1}: IdProducto inválido`);
      }
      if (!item.Cantidad || item.Cantidad <= 0) {
        throw new Error(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      if (item.PrecioUnitario === undefined || item.PrecioUnitario < 0) {
        throw new Error(`Item ${index + 1}: PrecioUnitario inválido`);
      }
      if (item.Descuento === undefined) {
        item.Descuento = 0; // Asignar 0 si no viene
      }
      if (item.Descuento < 0) {
        throw new Error(`Item ${index + 1}: Descuento no puede ser negativo`);
      }
    });
    
    const p = await getPool();
    const request = p.request();
    
    // Convertir detalle a JSON
    const detalleJSON = JSON.stringify(detalle);
    
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('Observacion', sql.VarChar(500), observacion);
    request.input('Detalle', sql.NVarChar(sql.MAX), detalleJSON);
    request.output('Mensaje', sql.NVarChar(200));
    
    console.log('📝 Registrando venta:', { usuario, items: detalle.length, observacion: observacion || 'N/A' });
    
    const result = await request.execute('com.sp_RegistrarVenta');
    
    const success = result.returnValue > 0;
    const idVenta = result.returnValue;
    const mensaje = result.output.Mensaje;
    
    if (success) {
      console.log('✅ Venta registrada exitosamente:', { idVenta, mensaje });
    } else {
      console.log('❌ Error registrando venta:', mensaje);
    }
    
    return {
      success,
      idVenta: success ? idVenta : null,
      mensaje
    };
  } catch (error) {
    console.error('❌ Error en registrarVenta service:', error);
    throw error;
  }
}

/**
 * Listar ventas con paginación y filtros
 * @param {number} pagina - Número de página
 * @param {number} tamanoPagina - Tamaño de página
 * @param {Date} fechaInicio - Fecha inicial del filtro
 * @param {Date} fechaFin - Fecha final del filtro
 * @param {string} usuario - Usuario que realizó la venta (o búsqueda por ID/usuario)
 * @param {number} montoMin - Monto mínimo del total
 * @param {number} montoMax - Monto máximo del total
 * @returns {Array} Lista de ventas
 */
async function listarVentas(pagina = 1, tamanoPagina = 20, fechaInicio = null, fechaFin = null, usuario = null, montoMin = null, montoMax = null) {
  try {
    // Validaciones
    if (pagina < 1) pagina = 1;
    if (tamanoPagina < 1 || tamanoPagina > 100) tamanoPagina = 20;
    
    const p = await getPool();
    
    // Construir consulta SQL dinámicamente para incluir filtros de monto
    let query = `
      WITH VentasConItems AS (
        SELECT 
          v.IdVenta,
          v.Usuario,
          v.FechaVenta,
          v.Subtotal,
          v.DescuentoTotal,
          v.Total,
          v.Observacion,
          COUNT(dv.IdDetalle) AS CantidadItems,
          SUM(dv.Cantidad) AS TotalUnidades
        FROM com.tbVenta v
        LEFT JOIN com.tbDetalleVenta dv ON v.IdVenta = dv.IdVenta
        WHERE 1=1
    `;
    
    const params = [];
    
    // Filtro por fecha
    if (fechaInicio) {
      query += ` AND v.FechaVenta >= @fechaInicio`;
      params.push({ name: 'fechaInicio', type: sql.DateTime2, value: fechaInicio });
    }
    
    if (fechaFin) {
      query += ` AND v.FechaVenta <= @fechaFin`;
      params.push({ name: 'fechaFin', type: sql.DateTime2, value: fechaFin });
    }
    
    // Filtro por usuario (puede ser nombre exacto o buscar por ID)
    if (usuario) {
      query += ` AND (v.Usuario = @usuario OR CAST(v.IdVenta AS VARCHAR) LIKE '%' + @usuarioBusqueda + '%')`;
      params.push({ name: 'usuario', type: sql.VarChar(50), value: usuario });
      params.push({ name: 'usuarioBusqueda', type: sql.VarChar(50), value: usuario });
    }
    
    // Filtro por monto mínimo
    if (montoMin !== null && montoMin >= 0) {
      query += ` AND v.Total >= @montoMin`;
      params.push({ name: 'montoMin', type: sql.Decimal(12, 2), value: montoMin });
    }
    
    // Filtro por monto máximo
    if (montoMax !== null && montoMax >= 0) {
      query += ` AND v.Total <= @montoMax`;
      params.push({ name: 'montoMax', type: sql.Decimal(12, 2), value: montoMax });
    }
    
    query += `
        GROUP BY v.IdVenta, v.Usuario, v.FechaVenta, v.Subtotal, v.DescuentoTotal, v.Total, v.Observacion
      ),
      TotalCount AS (
        SELECT COUNT(*) as TotalRegistros FROM VentasConItems
      )
      SELECT 
        v.*,
        tc.TotalRegistros
      FROM VentasConItems v
      CROSS JOIN TotalCount tc
      ORDER BY v.FechaVenta DESC
      OFFSET @offset ROWS
      FETCH NEXT @tamanoPagina ROWS ONLY
    `;
    
    const request = p.request();
    
    // Agregar parámetros dinámicamente
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    // Parámetros de paginación
    const offset = (pagina - 1) * tamanoPagina;
    request.input('offset', sql.Int, offset);
    request.input('tamanoPagina', sql.Int, tamanoPagina);
    
    console.log('📋 Listando ventas:', { 
      pagina, 
      tamanoPagina, 
      fechaInicio: fechaInicio ? fechaInicio.toISOString() : 'N/A',
      fechaFin: fechaFin ? fechaFin.toISOString() : 'N/A',
      usuario: usuario || 'Todos',
      montoMin: montoMin !== null ? montoMin : 'N/A',
      montoMax: montoMax !== null ? montoMax : 'N/A'
    });
    
    const result = await request.query(query);
    
    console.log(`✅ Se encontraron ${result.recordset.length} ventas`);
    
    return result.recordset;
  } catch (error) {
    console.error('❌ Error en listarVentas service:', error);
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
    // Validación
    if (!idVenta || typeof idVenta !== 'number' || idVenta <= 0) {
      throw new Error('ID de venta inválido');
    }
    
    const p = await getPool();
    const request = p.request();
    request.input('IdVenta', sql.BigInt, idVenta);
    
    console.log('📄 Obteniendo detalle de venta:', idVenta);
    
    const result = await request.execute('com.sp_ObtenerDetalleVenta');
    
    // El SP retorna 2 result sets: cabecera e items
    const cabecera = result.recordsets[0] && result.recordsets[0][0] ? result.recordsets[0][0] : null;
    let items = result.recordsets[1] || [];
    
    // Asegurar que tenemos el nombre del producto
    items = items.map(item => ({
      ...item,
      NombreProducto: item.Nombre || item.NombreProducto || 'Producto sin nombre'
    }));
    
    if (cabecera) {
      console.log(`✅ Venta encontrada: ID ${idVenta}, Total: ${cabecera.Total}, Items: ${items.length}`);
    } else {
      console.log(`⚠️ Venta no encontrada: ID ${idVenta}`);
    }
    
    return {
      cabecera,
      items
    };
  } catch (error) {
    console.error('❌ Error en obtenerDetalleVenta service:', error);
    throw error;
  }
}

module.exports = {
  registrarVenta,
  listarVentas,
  obtenerDetalleVenta
};
