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

function generateCode(nombre) {
  const base = (nombre || 'PRD').toString().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 8) || 'PRD';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`;
}

async function createProducto({ codigo, nombre, categorias = null, precioCosto, precioVenta, cantidad = 0, usuarioEjecutor = 'sistema' }) {
  const finalCode = (codigo && typeof codigo === 'string' && codigo.trim()) ? codigo.trim() : generateCode(nombre);
  const p = await getPool();

  // Verificar si el código ya existe en com.tbProducto
  const exists = await p.request().input('Codigo', sql.VarChar(30), finalCode)
    .query('SELECT 1 FROM com.tbProducto WHERE Codigo = @Codigo');
  if (exists.recordset.length > 0) {
    const e = new Error('Código ya existe');
    e.code = 'PRODUCT_CODE_EXISTS';
    throw e;
  }

  // Insertar en com.tbProducto (sin columna Categorias ni Cantidad)
  const req = p.request();
  req.input('Nombre', sql.VarChar(120), nombre);
  req.input('Codigo', sql.VarChar(30), finalCode);
  req.input('Descripcion', sql.VarChar(400), null); // Opcional
  req.input('PrecioCosto', sql.Decimal(10, 2), Number(precioCosto));
  req.input('PrecioVenta', sql.Decimal(10, 2), Number(precioVenta));
  req.input('Descuento', sql.Decimal(6, 2), 0);
  
  const insertResult = await req.query(`
    INSERT INTO com.tbProducto (Nombre, Codigo, Descripcion, PrecioCosto, PrecioVenta, Descuento)
    VALUES (@Nombre, @Codigo, @Descripcion, @PrecioCosto, @PrecioVenta, @Descuento);
    SELECT SCOPE_IDENTITY() AS IdProducto;
  `);
  
  const idProducto = insertResult.recordset[0].IdProducto;

  // Inicializar stock en com.tbStock
  const cantidadInicial = Number(cantidad || 0);
  await p.request()
    .input('IdProducto', sql.Int, idProducto)
    .input('Existencia', sql.Int, cantidadInicial)
    .query('INSERT INTO com.tbStock (IdProducto, Existencia) VALUES (@IdProducto, @Existencia)');

  // Asociar categorías si vienen
  if (Array.isArray(categorias) && categorias.length > 0) {
    for (const idCat of categorias) {
      const catId = parseInt(idCat);
      if (!isNaN(catId)) {
        await p.request()
          .input('IdProducto', sql.Int, idProducto)
          .input('IdCategoria', sql.Int, catId)
          .query('INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES (@IdProducto, @IdCategoria)');
      }
    }
  }

  // Obtener el producto creado desde la vista
  const row = (await p.request().input('Codigo', sql.VarChar(30), finalCode).query(`
    SELECT TOP 1 IdProducto, Nombre, Codigo, Categorias, PrecioCosto, PrecioVenta, Cantidad, Estado
    FROM inv.v_productos WHERE Codigo = @Codigo
  `)).recordset[0];

  // Bitácora (opcional)
  try {
    await p.request()
      .input('Usuario', sql.VarChar(50), usuarioEjecutor || 'sistema')
      .input('IdUsuario', sql.Int, -1)
      .input('Operacion', sql.VarChar(40), 'INSERT')
      .input('Entidad', sql.VarChar(40), 'com.tbProducto')
      .input('ClaveEntidad', sql.VarChar(100), String(row.IdProducto))
      .input('Detalle', sql.NVarChar(4000), `Alta de producto ${row.Codigo} - ${row.Nombre}`)
      .query(`INSERT INTO seg.tbBitacoraTransacciones(Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
              VALUES (@Usuario, @IdUsuario, @Operacion, @Entidad, @ClaveEntidad, @Detalle)`);
  } catch (_) {}

  return {
    id: row.IdProducto,
    codigo: row.Codigo,
    nombre: row.Nombre,
    categorias: row.Categorias,
    precioCosto: Number(row.PrecioCosto),
    precioVenta: Number(row.PrecioVenta),
    cantidad: Number(row.Cantidad),
    estado: row.Estado
  };
}

async function listProductos({ page = 1, limit = 10, search = '', estado = '' }) {
  const p = await getPool();
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let where = 'WHERE 1=1';
  const params = [];
  if (search && String(search).trim()) {
    where += ' AND (Nombre LIKE @s OR Codigo LIKE @s)';
    params.push({ name: 's', type: sql.VarChar(160), value: `%${String(search).trim()}%` });
  }
  if (estado && String(estado).trim()) {
    const estadoBit = String(estado).trim() === '1' || String(estado).trim().toLowerCase() === 'true' ? 1 : 0;
    where += ' AND Estado = @e';
    params.push({ name: 'e', type: sql.Bit, value: estadoBit });
  }

  const view = 'inv.v_productos';
  // Count desde la vista (incluye columnas agregadas como Categorias)
  const countReq = p.request();
  params.forEach(pr => countReq.input(pr.name, pr.type, pr.value));
  const total = (await countReq.query(`SELECT COUNT(*) total FROM ${view} ${where}`)).recordset[0].total;

  // Page
  const dataReq = p.request();
  params.forEach(pr => dataReq.input(pr.name, pr.type, pr.value));
  dataReq.input('offset', sql.Int, offset);
  dataReq.input('limit', sql.Int, limitNum);
  const rows = (await dataReq.query(`
    SELECT IdProducto, Nombre, Codigo, Categorias, PrecioCosto, PrecioVenta, Cantidad, Estado
    FROM ${view}
    ${where}
    ORDER BY CASE WHEN (Categorias IS NULL OR LTRIM(RTRIM(Categorias)) = '') THEN 1 ELSE 0 END,
             IdProducto DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `)).recordset;

  return {
    data: rows,
    pagination: {
      currentPage: pageNum,
      itemsPerPage: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: pageNum * limitNum < total,
      hasPrevPage: pageNum > 1
    }
  };
}

async function getProductoByCodigo(codigo) {
  const p = await getPool();
  const view = 'inv.v_productos';
  const r = await p.request()
    .input('Codigo', sql.VarChar(50), String(codigo || '').trim())
    .query(`SELECT TOP 1 IdProducto, Codigo, Nombre, Categorias, PrecioCosto, PrecioVenta, Cantidad, Estado
            FROM ${view} WHERE Codigo = @Codigo`);
  if (r.recordset.length === 0) return null;
  const row = r.recordset[0];
  // Normalizar categorías a array
  const cats = (row.Categorias && typeof row.Categorias === 'string')
    ? row.Categorias.split(/[;|,]/).map(s => s.trim()).filter(Boolean)
    : [];
  return {
    id: row.IdProducto,
    codigo: row.Codigo,
    nombre: row.Nombre,
    categorias: cats,
    precioCosto: Number(row.PrecioCosto),
    precioVenta: Number(row.PrecioVenta),
    cantidad: Number(row.Cantidad),
    estado: row.Estado
  };
}

async function updateProductoByCodigo({ codigo, nombre, precioCosto, precioVenta, cantidad, categorias }) {
  const p = await getPool();
  const code = String(codigo || '').trim();
  
  // Obtener IdProducto desde com.tbProducto
  const prod = await p.request().input('Codigo', sql.VarChar(30), code)
    .query('SELECT TOP 1 IdProducto FROM com.tbProducto WHERE Codigo = @Codigo');
  if (prod.recordset.length === 0) {
    const e = new Error('Producto no encontrado'); e.code = 'NOT_FOUND'; throw e;
  }
  const idProd = prod.recordset[0].IdProducto;

  // Actualizar campos básicos en com.tbProducto
  const setParts = [];
  const reqUpd = p.request();
  reqUpd.input('IdProducto', sql.Int, idProd);
  
  if (typeof nombre === 'string') { 
    setParts.push('Nombre = @Nombre'); 
    reqUpd.input('Nombre', sql.VarChar(120), nombre); 
  }
  if (precioCosto != null) { 
    setParts.push('PrecioCosto = @PrecioCosto'); 
    reqUpd.input('PrecioCosto', sql.Decimal(10, 2), Number(precioCosto)); 
  }
  if (precioVenta != null) { 
    setParts.push('PrecioVenta = @PrecioVenta'); 
    reqUpd.input('PrecioVenta', sql.Decimal(10, 2), Number(precioVenta)); 
  }

  if (setParts.length) {
    await reqUpd.query(`UPDATE com.tbProducto SET ${setParts.join(', ')} WHERE IdProducto = @IdProducto`);
  }

  // Actualizar cantidad en com.tbStock si viene
  if (cantidad != null) {
    const cantidadNum = Number(cantidad);
    // Verificar si existe el registro en stock
    const stockExists = await p.request()
      .input('IdProducto', sql.Int, idProd)
      .query('SELECT 1 FROM com.tbStock WHERE IdProducto = @IdProducto');
    
    if (stockExists.recordset.length > 0) {
      // Actualizar existente
      await p.request()
        .input('IdProducto', sql.Int, idProd)
        .input('Existencia', sql.Int, cantidadNum)
        .query('UPDATE com.tbStock SET Existencia = @Existencia, FechaActualizacion = SYSDATETIME() WHERE IdProducto = @IdProducto');
    } else {
      // Insertar nuevo registro de stock
      await p.request()
        .input('IdProducto', sql.Int, idProd)
        .input('Existencia', sql.Int, cantidadNum)
        .query('INSERT INTO com.tbStock (IdProducto, Existencia) VALUES (@IdProducto, @Existencia)');
    }
  }

  // Sincronizar categorías (relación N:M en com.tbProductoCategoria)
  if (Array.isArray(categorias)) {
    // Obtener categorías actuales
    const currentRows = (await p.request().input('IdProducto', sql.Int, idProd)
      .query('SELECT IdCategoria FROM com.tbProductoCategoria WHERE IdProducto = @IdProducto')).recordset;
    const currentIds = new Set(currentRows.map(r => r.IdCategoria));

    // Categorías deseadas (convertir a IDs)
    const desiredIds = new Set();
    for (const catId of categorias) {
      const id = parseInt(catId);
      if (!isNaN(id)) {
        desiredIds.add(id);
      }
    }

    // Insertar nuevas asociaciones
    for (const idCat of desiredIds) {
      if (!currentIds.has(idCat)) {
        await p.request()
          .input('IdProducto', sql.Int, idProd)
          .input('IdCategoria', sql.Int, idCat)
          .query('INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria) VALUES (@IdProducto, @IdCategoria)');
      }
    }

    // Eliminar asociaciones que ya no están
    for (const idCat of currentIds) {
      if (!desiredIds.has(idCat)) {
        await p.request()
          .input('IdProducto', sql.Int, idProd)
          .input('IdCategoria', sql.Int, idCat)
          .query('DELETE FROM com.tbProductoCategoria WHERE IdProducto = @IdProducto AND IdCategoria = @IdCategoria');
      }
    }
  }

  // Devolver el producto actualizado desde la vista
  const updated = await getProductoByCodigo(code);
  return updated;
}

async function deleteProductoByCodigo({ codigo, eliminacionFisica = false, usuarioEjecutor = 'sistema' }) {
  const p = await getPool();
  const code = String(codigo || '').trim();
  
  // Obtener IdProducto desde com.tbProducto
  const prod = await p.request().input('Codigo', sql.VarChar(30), code)
    .query('SELECT TOP 1 IdProducto FROM com.tbProducto WHERE Codigo = @Codigo');
  if (prod.recordset.length === 0) {
    const e = new Error('Producto no encontrado'); e.code = 'NOT_FOUND'; throw e;
  }
  const idProd = prod.recordset[0].IdProducto;

  // Ejecutar stored procedure
  const request = p.request();
  request.input('Usuario', sql.VarChar(50), usuarioEjecutor);
  request.input('IdProducto', sql.Int, idProd);
  request.input('EliminacionFisica', sql.Bit, eliminacionFisica ? 1 : 0);
  request.output('Mensaje', sql.NVarChar(200));
  
  const result = await request.execute('com.sp_EliminarProducto');
  
  return {
    success: result.returnValue >= 0,
    mensaje: result.output.Mensaje,
    eliminacionFisica
  };
}

module.exports = { createProducto, listProductos, getProductoByCodigo, updateProductoByCodigo, deleteProductoByCodigo };
