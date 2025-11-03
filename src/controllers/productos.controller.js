const service = require('../services/productos.service');

async function createProducto(req, res) {
  try {
    const data = await service.createProducto(req.body || {});
    return res.json({ success: true, message: 'Producto creado', product: data });
  } catch (err) {
    if (err && err.code === 'PRODUCT_CODE_EXISTS') {
      return res.status(409).json({ success: false, message: 'El código de producto ya existe' });
    }
    console.error('createProducto error:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor1', error: err.message });
  }
}

async function listProductos(req, res) {
  try {
    const { page = 1, limit = 10, search = '', estado = '' } = req.query;
    const result = await service.listProductos({ page, limit, search, estado });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('listProductos error:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor2' });
  }
}

async function getProducto(req, res) {
  try {
    const { codigo } = req.params;
    if (!codigo) return res.status(400).json({ success: false, message: 'Código requerido' });
    const prod = await service.getProductoByCodigo(codigo);
    if (!prod) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    return res.json({ success: true, product: prod });
  } catch (err) {
    console.error('getProducto error:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor3' });
  }
}

async function updateProducto(req, res) {
  try {
    const { codigo } = req.params;
    if (!codigo) return res.status(400).json({ success: false, message: 'Código requerido' });
    const { nombre, descripcion, precioCosto, precioVenta, descuento, cantidad, categorias } = req.body || {};

    // Validaciones básicas
    const updates = {};
    if (typeof nombre === 'string') updates.nombre = nombre;
    if (typeof descripcion === 'string') updates.descripcion = descripcion;
    if (precioCosto != null) {
      const v = Number(precioCosto); if (!Number.isFinite(v) || v < 0) return res.status(400).json({ success:false, message:'precioCosto inválido' });
      updates.precioCosto = v;
    }
    if (precioVenta != null) {
      const v = Number(precioVenta); if (!Number.isFinite(v) || v < 0) return res.status(400).json({ success:false, message:'precioVenta inválido' });
      updates.precioVenta = v;
    }
    if (descuento != null) {
      const v = Number(descuento); 
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        return res.status(400).json({ success:false, message:'descuento debe estar entre 0 y 100' });
      }
      updates.descuento = v;
    }
    if (cantidad != null) {
      const v = Number(cantidad); if (!Number.isInteger(v) || v < 0) return res.status(400).json({ success:false, message:'cantidad inválida' });
      updates.cantidad = v;
    }
    // Si vienen categorías (incluso array vacío), procesarlas
    let cats = undefined;
    if (Array.isArray(categorias)) {
      cats = categorias.filter(x => typeof x === 'string' && x.trim()).map(s => s.trim());
    }

    const result = await service.updateProductoByCodigo({ codigo, ...updates, categorias: cats });
    return res.json({ success: true, message: 'Producto actualizado', product: result });
  } catch (err) {
    console.error('updateProducto error:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor4' });
  }
}

async function deleteProducto(req, res) {
  try {
    const { codigo } = req.params;
    if (!codigo) return res.status(400).json({ success: false, message: 'Código requerido' });
    
    const usuario = req.user?.usuario || 'sistema';
    const eliminacionFisica = req.body?.eliminacionFisica === true || req.query?.fisica === 'true';
    
    const result = await service.deleteProductoByCodigo({ 
      codigo, 
      eliminacionFisica,
      usuarioEjecutor: usuario
    });
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: result.mensaje 
      });
    }
    
    return res.json({ 
      success: true, 
      message: result.mensaje
    });
  } catch (err) {
    if (err && err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    console.error('deleteProducto error:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

module.exports = { createProducto, listProductos, getProducto, updateProducto, deleteProducto };
