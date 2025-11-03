const express = require('express');
const controller = require('../controllers/categorias.controller');

const router = express.Router();

/**
 * @route GET /api/categorias
 * @desc Listar todas las categorías
 * @query soloActivas - Boolean (default: true)
 * @access Private
 */
router.get('/', controller.listarCategorias);

/**
 * @route GET /api/categorias/:id
 * @desc Obtener una categoría específica por ID
 * @access Private
 */
router.get('/:id', controller.obtenerCategoria);

/**
 * @route POST /api/categorias
 * @desc Crear una nueva categoría
 * @body { nombre, descripcion }
 * @access Private (requiere autenticación)
 */
router.post('/', controller.crearCategoria);

/**
 * @route PUT /api/categorias/:id
 * @desc Actualizar una categoría existente
 * @body { nombre, descripcion, activo }
 * @access Private (requiere autenticación)
 */
router.put('/:id', controller.actualizarCategoria);

/**
 * @route DELETE /api/categorias/:id
 * @desc Eliminar una categoría (física o lógicamente)
 * @query fisica - Boolean (default: false) - true para eliminación física
 * @access Private (requiere autenticación)
 */
router.delete('/:id', controller.eliminarCategoria);

module.exports = router;
