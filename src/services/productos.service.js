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

  const exists = await p.request().input('Codigo', sql.VarChar(50), finalCode)
    .query('SELECT 1 FROM inv.productos WHERE Codigo = @Codigo');
  if (exists.recordset.length > 0) {
    const e = new Error('Código ya existe');
    e.code = 'PRODUCT_CODE_EXISTS';
    throw e;
  }

  const req = p.request();
  req.input('Nombre', sql.VarChar(150), nombre);
  req.input('Codigo', sql.VarChar(50), finalCode);
  const cats = Array.isArray(categorias) ? categorias.join(';') : (categorias || null);
  req.input('Categorias', sql.NVarChar(200), cats);
  req.input('PrecioCosto', sql.Decimal(18, 2), Number(precioCosto));
  req.input('PrecioVenta', sql.Decimal(18, 2), Number(precioVenta));
  req.input('Cantidad', sql.Int, Number(cantidad || 0));
  await req.query(`
    INSERT INTO inv.productos (Nombre, Codigo, Categorias, PrecioCosto, PrecioVenta, Cantidad)
    VALUES (@Nombre, @Codigo, @Categorias, @PrecioCosto, @PrecioVenta, @Cantidad)
  `);

  const row = (await p.request().input('Codigo', sql.VarChar(50), finalCode).query(`
    SELECT TOP 1 IdProducto, Nombre, Codigo, Categorias, PrecioCosto, PrecioVenta, Cantidad, Estado
    FROM inv.productos WHERE Codigo = @Codigo
  `)).recordset[0];

  // Bitácora (opcional)
  try {
    await p.request()
      .input('Usuario', sql.VarChar(50), usuarioEjecutor || 'sistema')
      .input('IdUsuario', sql.Int, -1)
      .input('Operacion', sql.VarChar(40), 'INSERT')
      .input('Entidad', sql.VarChar(40), 'inv.productos')
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
    where += ' AND Estado = @e';
    params.push({ name: 'e', type: sql.VarChar(20), value: String(estado).trim() });
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
  // Obtener IdProducto
  const prod = await p.request().input('Codigo', sql.VarChar(50), code)
    .query('SELECT TOP 1 IdProducto FROM inv.productos WHERE Codigo = @Codigo');
  if (prod.recordset.length === 0) {
    const e = new Error('Producto no encontrado'); e.code = 'NOT_FOUND'; throw e;
  }
  const idProd = prod.recordset[0].IdProducto;

  // Actualizar campos básicos si vienen
  const setParts = [];
  const reqUpd = p.request();
  reqUpd.input('IdProducto', sql.Int, idProd);
  if (typeof nombre === 'string') { setParts.push('Nombre = @Nombre'); reqUpd.input('Nombre', sql.VarChar(150), nombre); }
  if (precioCosto != null) { setParts.push('PrecioCosto = @PrecioCosto'); reqUpd.input('PrecioCosto', sql.Decimal(18,2), Number(precioCosto)); }
  if (precioVenta != null) { setParts.push('PrecioVenta = @PrecioVenta'); reqUpd.input('PrecioVenta', sql.Decimal(18,2), Number(precioVenta)); }
  if (cantidad != null) { setParts.push('Cantidad = @Cantidad'); reqUpd.input('Cantidad', sql.Int, Number(cantidad)); }

  // Si vienen categorías, sincronizar relación M:N
  let finalCats = null;
  if (Array.isArray(categorias)) {
    // Mapear nombres a IdCategoria
    const names = categorias.map(s => s.trim()).filter(Boolean);
    if (names.length) {
      const inList = names.map((_, i) => `@N${i}`).join(',');
      const reqCats = p.request();
      names.forEach((n, i) => reqCats.input(`N${i}`, sql.VarChar(100), n));
      const catRows = (await reqCats.query(`SELECT IdCategoria, Nombre FROM inv.categorias WHERE Nombre IN (${inList})`)).recordset;
      const idMap = new Map(catRows.map(r => [r.Nombre.toLowerCase(), r.IdCategoria]));
      const desiredIds = new Set(names.map(n => idMap.get(n.toLowerCase())).filter(v => v));

      // Obtener actuales
      const currentRows = (await p.request().input('IdProducto', sql.Int, idProd)
        .query('SELECT IdCategoria FROM inv.producto_categoria WHERE IdProducto = @IdProducto')).recordset;
      const currentIds = new Set(currentRows.map(r => r.IdCategoria));

      // Inserts
      for (const idCat of desiredIds) {
        if (!currentIds.has(idCat)) {
          await p.request().input('IdProducto', sql.Int, idProd).input('IdCategoria', sql.Int, idCat)
            .query('INSERT INTO inv.producto_categoria(IdProducto, IdCategoria) VALUES(@IdProducto, @IdCategoria)');
        }
      }
      // Deletes
      for (const idCat of currentIds) {
        if (!desiredIds.has(idCat)) {
          await p.request().input('IdProducto', sql.Int, idProd).input('IdCategoria', sql.Int, idCat)
            .query('DELETE FROM inv.producto_categoria WHERE IdProducto=@IdProducto AND IdCategoria=@IdCategoria');
        }
      }
      finalCats = names; // Para reflejar en columna de texto
    } else {
      // Si viene array vacío, limpiar asociaciones
      await p.request().input('IdProducto', sql.Int, idProd)
        .query('DELETE FROM inv.producto_categoria WHERE IdProducto=@IdProducto');
      finalCats = [];
    }
  }

  // Sincronizar columna de texto Categorias si corresponde
  if (finalCats) {
    setParts.push('Categorias = @Categorias');
    reqUpd.input('Categorias', sql.NVarChar(200), finalCats.join('; '));
  }
  if (setParts.length) {
    await reqUpd.query(`UPDATE inv.productos SET ${setParts.join(', ')} WHERE IdProducto = @IdProducto`);
  }

  // Devolver el producto actualizado desde la vista
  const updated = await getProductoByCodigo(code);
  return updated;
}

module.exports = { createProducto, listProductos, getProductoByCodigo, updateProductoByCodigo };
