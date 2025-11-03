const service = require('../services/categorias.service');

/**
 * Listar todas las categorías
 * GET /api/categorias?soloActivas=true
 */
async function listarCategorias(req, res) {
  try {
    const soloActivas = req.query.soloActivas !== 'false'; // Default true
    const categorias = await service.listarCategorias(soloActivas);
    
    return res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error en listarCategorias:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las categorías'
    });
  }
}

/**
 * Obtener una categoría por ID
 * GET /api/categorias/:id
 */
async function obtenerCategoria(req, res) {
  try {
    const { id } = req.params;
    const idCategoria = parseInt(id);
    
    if (isNaN(idCategoria)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }
    
    const categoria = await service.obtenerCategoria(idCategoria);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error en obtenerCategoria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la categoría'
    });
  }
}

/**
 * Crear una nueva categoría
 * POST /api/categorias
 * Body: { nombre, descripcion }
 */
async function crearCategoria(req, res) {
  try {
    const { nombre, descripcion } = req.body;
    const usuario = req.user?.usuario || 'sistema';
    
    // Validaciones
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }
    
    const result = await service.crearCategoria(usuario, nombre.trim(), descripcion?.trim() || null);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.mensaje
      });
    }
    
    return res.status(201).json({
      success: true,
      message: result.mensaje,
      idCategoria: result.idCategoria
    });
  } catch (error) {
    console.error('Error en crearCategoria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la categoría'
    });
  }
}

/**
 * Actualizar una categoría
 * PUT /api/categorias/:id
 * Body: { nombre, descripcion, activo }
 */
async function actualizarCategoria(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    const usuario = req.user?.usuario || 'sistema';
    const idCategoria = parseInt(id);
    
    if (isNaN(idCategoria)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }
    
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }
    
    const result = await service.actualizarCategoria(
      usuario,
      idCategoria,
      nombre.trim(),
      descripcion?.trim() || null,
      activo !== false // Default true
    );
    
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
  } catch (error) {
    console.error('Error en actualizarCategoria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la categoría'
    });
  }
}

/**
 * Eliminar una categoría
 * DELETE /api/categorias/:id?fisica=false
 */
async function eliminarCategoria(req, res) {
  try {
    const { id } = req.params;
    const fisica = req.query.fisica === 'true';
    const usuario = req.user?.usuario || 'sistema';
    const idCategoria = parseInt(id);
    
    if (isNaN(idCategoria)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }
    
    const result = await service.eliminarCategoria(usuario, idCategoria, fisica);
    
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
  } catch (error) {
    console.error('Error en eliminarCategoria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la categoría'
    });
  }
}

/**
 * Obtener productos de una categoría
 * GET /api/categorias/:id/productos?page=1&limit=20
 */
async function obtenerProductosCategoria(req, res) {
  try {
    const { id } = req.params;
    const idCategoria = parseInt(id);
    
    if (isNaN(idCategoria)) {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }
    
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros de paginación deben ser mayores a 0'
      });
    }
    
    console.log('📦 Solicitud de productos de categoría:', { idCategoria, page, limit });
    
    const productos = await service.obtenerProductosCategoria(idCategoria, page, limit);
    
    const totalRegistros = productos.length > 0 ? productos[0].TotalRegistros || productos.length : 0;
    const totalPaginas = Math.ceil(totalRegistros / limit);
    
    return res.json({
      success: true,
      data: productos,
      pagination: {
        page,
        limit,
        total: totalRegistros,
        totalPages: totalPaginas,
        hasMore: page < totalPaginas
      }
    });
  } catch (error) {
    console.error('Error en obtenerProductosCategoria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los productos de la categoría'
    });
  }
}

module.exports = {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerProductosCategoria
};
