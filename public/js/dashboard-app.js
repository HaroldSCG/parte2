/**
 * ============================================================================
 * DASHBOARD-APP.JS - Sistema de Gestión Comercial/Académica
 * ============================================================================
 * 
 * AUDITORÍA DEL CÓDIGO - 31 de Octubre, 2025
 * -------------------------------------------
 * 
 * RESUMEN EJECUTIVO:
 * - Total de líneas: 4341
 * - Funcionalidad: 29% operativo, 71% sin soporte de backend
 * - Estado: REQUIERE LIMPIEZA Y REFACTORIZACIÓN
 * 
 * MÓDULOS IMPLEMENTADOS:
 * ----------------------
 * 1. ❌ CATEGORÍAS (líneas 593-1040)    - NO hay tabla tbCategoria en BD
 * 2. ❌ PRODUCTOS (líneas 2180-3369)    - NO hay tabla tbProducto en BD
 * 3. ❌ INVENTARIO (líneas 1738-1950)   - NO hay tabla tbInventario en BD
 * 4. ❌ VENTAS (líneas 1953-2177)       - NO hay tabla tbVenta en BD
 * 5. ❌ REPORTES (líneas 1164-1735)     - Depende de ventas/inventario
 * 6. ✅ USUARIOS (líneas 397-409)        - FUNCIONAL con UserManager.js
 * 7. ⚠️ OVERVIEW (líneas 1141-1161)     - Usa datos estáticos (mock)
 * 
 * RECOMENDACIONES:
 * ---------------
 * 1. INMEDIATO: Comentar/eliminar módulos sin backend (3082 líneas)
 * 2. CORTO PLAZO: Implementar gestión de estudiantes (tabla existe en BD)
 * 3. MEDIANO PLAZO: Integrar bitácoras de accesos y transacciones
 * 4. LARGO PLAZO: Decidir si implementar módulos comerciales o eliminarlos
 * 
 * ============================================================================
 */

(() => {
  // ============================================================================
  // CONFIGURACIÓN DE NAVEGACIÓN
  // ============================================================================
  // ⚠️ ACTUALIZACIÓN 2025-11-01: Revisión de definitivo.sql completa
  // 
  // ✅ BASE DE DATOS: Esquema 'com' (comercial) YA ESTÁ IMPLEMENTADO al 100%
  //    Tablas encontradas:
  //    - com.tbCategoria ✅
  //    - com.tbProducto ✅
  //    - com.tbProductoCategoria ✅ (relación N:N)
  //    - com.tbStock ✅ (con trigger automático)
  //    - com.tbInventario ✅ (con índices)
  //    - com.tbVenta ✅
  //    - com.tbDetalleVenta ✅ (con trigger de descuento)
  //    Stored Procedures: 4 reportes implementados ✅
  //    Triggers: 2 automáticos funcionando ✅
  // 
  // ❌ BACKEND: Endpoints NO implementados (0%)
  //    Falta implementar en server.js:
  //    - /api/categorias, /api/productos, /api/inventario,
  //      /api/ventas, /api/reportes
  // 
  // ❌ FRONTEND: Mock data sin conexión real (0%)
  //    DASHBOARD_DATA tiene datos estáticos de demostración
  // 
  // 📊 Estado: BD 100% | Backend 0% | Frontend 0% = 33% Total
  // ==========================================================================
  
  const NAV_ITEMS = {
    admin: [
      { id: 'categorias', label: 'Categorías', icon: 'fa-layer-group' },      // BD ✅ | Backend ❌ | Frontend ❌
      { id: 'productos', label: 'Productos', icon: 'fa-box-open' },           // BD ✅ | Backend ❌ | Frontend ❌
      { id: 'inventario', label: 'Inventario', icon: 'fa-boxes-stacked' },    // BD ✅ | Backend ❌ | Frontend ❌
      { id: 'ventas', label: 'Ventas', icon: 'fa-cash-register' },            // BD ✅ | Backend ❌ | Frontend ❌
      { id: 'reportes', label: 'Reportes', icon: 'fa-file-lines' },           // BD ✅ | Backend ❌ | Frontend ❌
      // Nuevo: Gestión de usuarios (después de Reportes)
      { id: 'usuarios', label: 'Usuarios', icon: 'fa-users' }                 // ✅ FUNCIONAL COMPLETO (BD + Backend + Frontend)
    ],
    secretaria: [
      { id: 'inventario', label: 'Inventario', icon: 'fa-boxes-stacked' },    // BD ✅ | Backend ❌ | Frontend ❌
      { id: 'ventas', label: 'Ventas', icon: 'fa-cash-register' },            // BD ✅ | Backend ❌ | Frontend ❌
      { id: 'reportes', label: 'Reportes', icon: 'fa-file-lines' }            // BD ✅ | Backend ❌ | Frontend ❌
    ]
  };

  // ============================================================================
  // CONFIGURACIÓN DE ROL - TEXTOS Y ETIQUETAS
  // ============================================================================
  // ℹ️ Esta configuración es cosmética y puede mantenerse
  const ROLE_COPY = {
    admin: {
      badge: 'Administrador general',
      roleLabel: 'Administrador',
      avatar: 'fa-user-shield',
      overviewTitle: 'Panel administrativo',
      overviewSubtitle: 'Control total de categoras, inventario, ventas y reportes.',
      modulesTitle: 'Mdulos prioritarios'
    },
    secretaria: {
      badge: 'Secretara acadmica',
      roleLabel: 'Secretara',
      avatar: 'fa-user-check',
      overviewTitle: 'Panel operativo',
      overviewSubtitle: 'Visin consolidada de ventas e inventario para soporte acadmico.',
      modulesTitle: 'Accesos rpidos'
    }
  };

  // ============================================================================
  // DATOS ESTÁTICOS DE DEMOSTRACIÓN (MOCK DATA)
  // ============================================================================
  // CLEAR: ⚠️ ACTUALIZACIÓN 2025-11-01
  // 
  // Este objeto completo contiene datos ficticios para demostración visual.
  // 
  // ✅ DESCUBRIMIENTO IMPORTANTE: Las tablas SÍ EXISTEN en definitivo.sql
  //    - com.tbCategoria ✅
  //    - com.tbProducto ✅
  //    - com.tbStock ✅
  //    - com.tbInventario ✅
  //    - com.tbVenta ✅
  //    - com.tbDetalleVenta ✅
  // 
  // ❌ PROBLEMA: Los endpoints NO están implementados en server.js
  //    Falta crear:
  //    - src/routes/categorias.routes.js
  //    - src/controllers/categorias.controller.js
  //    - Y similar para productos, inventario, ventas, reportes
  // 
  // 📋 PLAN DE MIGRACIÓN:
  //    1. Implementar endpoints en backend (siguiendo patrón de usuarios.routes.js)
  //    2. Reemplazar este DASHBOARD_DATA con llamadas a API
  //    3. Eliminar mock data cuando todo esté conectado
  // 
  // Afectado: categorías (23), productos (8), movimientos inventario (5), 
  // ventas (3), estadísticas falsas. Total: ~354 líneas de datos estáticos.
  // ============================================================================
  const DASHBOARD_DATA = {
    admin: {
      overview: {
        stats: [
          { label: 'Ventas del mes', value: '$58,400', trend: '+12% vs. abril', icon: 'fa-sack-dollar', tone: 'success' },
          { label: 'Productos activos', value: '142', trend: '+8 incorporados', icon: 'fa-boxes-stacked', tone: 'info' },
          { label: 'Categoras configuradas', value: '18', trend: '3 pendientes de revisin', icon: 'fa-layer-group', tone: 'warning' },
          { label: 'Alertas resueltas', value: '92%', trend: 'Tiempo medio 18h', icon: 'fa-shield-halved', tone: 'success' }
        ],
        modules: [
          { target: 'productos', title: 'Productos', description: 'Administra catlogo, precios y descuentos.', icon: 'fa-box-open', link: 'Ir al catlogo' },
          { target: 'categorias', title: 'Categoras', description: 'Agrupa productos en mltiples categoras.', icon: 'fa-tags', link: 'Gestionar categoras' },
          { target: 'inventario', title: 'Inventario', description: 'Controla entradas, salidas y stock crtico.', icon: 'fa-warehouse', link: 'Ver inventario' },
          { target: 'ventas', title: 'Ventas', description: 'Audita transacciones y descuentos aplicados.', icon: 'fa-cart-flatbed', link: 'Detalle de ventas' }
        ],
        alerts: [
          { type: 'warning', title: 'Stock crtico', description: '7 productos por debajo del mnimo establecido.', icon: 'fa-triangle-exclamation' },
          { type: 'info', title: 'Revisin de precios', description: '5 productos listos para actualizar precio de venta.', icon: 'fa-pen-to-square' },
          { type: 'success', title: 'ndice de cumplimiento', description: 'Backlog de reportes atendido al 96%.', icon: 'fa-circle-check' }
        ],
        highlights: [
          { icon: 'fa-flask', title: 'Producto destacado', description: 'Reactivos Qumicos: 420 unidades vendidas en el mes.' },
          { icon: 'fa-user-tie', title: 'Usuario con ms ventas', description: 'secretaria02 con 48 transacciones exitosas.' },
          { icon: 'fa-clock-rotate-left', title: 'Reporte ms consultado', description: 'Ventas por fecha (58 descargas).' }
        ],
        salesTrend: {
          subtitle: 'Ingresos expresados en miles (Q)',
          badge: 'Comparativo trimestral',
          data: [
            { label: 'Ene', value: 32 },
            { label: 'Feb', value: 45 },
            { label: 'Mar', value: 41 },
            { label: 'Abr', value: 52 },
            { label: 'May', value: 58 }
          ]
        },
        categoryMix: {
          subtitle: 'Participacin sobre el total de ventas',
          data: [
            { label: 'Laboratorio', value: 38, color: '#3b82f6' },
            { label: 'Tecnologa', value: 27, color: '#a855f7' },
            { label: 'Papelera', value: 18, color: '#10b981' },
            { label: 'Servicios', value: 9, color: '#f59e0b' },
            { label: 'Otros', value: 8, color: '#ef4444' }
          ]
        }
      },
      reportes: {
        subtitle: '',
        summary: [
          { icon: 'fa-chart-line', label: 'Ingresos mensuales', value: '$125,800' },
          { icon: 'fa-receipt', label: 'rdenes procesadas', value: '268' },
          { icon: 'fa-user-shield', label: 'Usuarios con acceso', value: '4 perfiles' }
        ],
        filters: [
          { id: 'fecha', type: 'date-range', label: 'Rango de fechas' },
          { id: 'usuario', type: 'select', label: 'Usuario', options: ['Todos', 'admin', 'secretaria01', 'secretaria02'] },
          { id: 'categoria', type: 'select', label: 'Categora', options: ['Todas', 'Laboratorio', 'Tecnologa', 'Papelera', 'Servicios'] },
          { id: 'formato', type: 'select', label: 'Formato', options: ['Consolidado', 'Detallado'] }
        ],
        table: {
          head: ['Fecha', 'Usuario', 'Categora', 'Ventas', 'Ingresos'],
          rows: [
            ['18/05/2025', 'admin', 'Laboratorio', '22', '$8,760'],
            ['18/05/2025', 'secretaria02', 'Papelera', '9', '$1,540'],
            ['17/05/2025', 'secretaria01', 'Tecnologa', '14', '$6,320'],
            ['17/05/2025', 'admin', 'Servicios', '6', '$2,180'],
            ['16/05/2025', 'secretaria02', 'Laboratorio', '11', '$4,260']
          ]
        },
        charts: [
          {
            type: 'bar',
            title: 'Ventas por usuario',
            subtitle: 'ltimos 7 das (en miles)',
            data: [
              { label: 'admin', value: 15 },
              { label: 'secretaria01', value: 11 },
              { label: 'secretaria02', value: 13 },
              { label: 'secretaria03', value: 9 }
            ]
          },
          {
            type: 'bar',
            title: 'Ventas por categora',
            subtitle: 'Participacin porcentual',
            data: [
              { label: 'Laboratorio', value: 38 },
              { label: 'Tecnologa', value: 27 },
              { label: 'Papelera', value: 18 },
              { label: 'Servicios', value: 9 },
              { label: 'Otros', value: 8 }
            ]
          }
        ]
      },
      ventas: {
        subtitle: '.',
        stats: [
          { label: 'Ingresos diarios', value: '$6,540', trend: '+8% vs. ayer', icon: 'fa-sack-dollar', tone: 'success' },
          { label: 'Tickets emitidos', value: '54', trend: 'Promedio 62', icon: 'fa-receipt', tone: 'info' },
          { label: 'Descuentos aplicados', value: '$820', trend: 'Campaa vigente', icon: 'fa-percent', tone: 'warning' }
        ],
        trend: [
          { label: 'Lun', value: 9 },
          { label: 'Mar', value: 11 },
          { label: 'Mi', value: 13 },
          { label: 'Jue', value: 7 },
          { label: 'Vie', value: 15 }
        ],
        topProducts: [
          { name: 'Reactivos Qumicos', units: 420, delta: '+18%' },
          { name: 'Kit de ingeniera', units: 310, delta: '+9%' },
          { name: 'Microscopio escolar', units: 185, delta: '+4%' },
          { name: 'Licencia software CAD', units: 96, delta: '+12%' }
        ],
        log: [
          { date: '18/05 16:20', user: 'admin', category: 'Laboratorio', subtotal: '$420', discount: '$0', total: '$420' },
          { date: '18/05 14:57', user: 'secretaria02', category: 'Papelera', subtotal: '$215', discount: '$15', total: '$200' },
          { date: '18/05 12:33', user: 'secretaria01', category: 'Servicios', subtotal: '$780', discount: '$0', total: '$780' },
          { date: '18/05 10:02', user: 'admin', category: 'Tecnologa', subtotal: '$1,120', discount: '$80', total: '$1,040' }
        ]
      },
      productos: {
        stats: [
          { label: 'Productos activos', value: '142', trend: 'En catlogo', icon: 'fa-boxes-stacked', tone: 'success' },
          { label: 'Con descuento', value: '18%', trend: 'Campaas activas', icon: 'fa-tags', tone: 'info' },
          { label: 'Pendientes de revisin', value: '9', trend: 'Solicitud de precio', icon: 'fa-clipboard-check', tone: 'warning' }
        ],
        list: [
          { code: 'LAB-0021', name: 'Reactivo A-90', categories: ['Laboratorio'], cost: 'Q22.40', price: 'Q38.99', status: 'En stock' },
          { code: 'TEC-0312', name: 'Calculadora cientfica FX', categories: ['Tecnologa', 'Papelera'], cost: 'Q45.00', price: 'Q69.90', status: 'En stock' },
          { code: 'SER-0104', name: 'Licencia software CAD', categories: ['Servicios', 'Tecnologa'], cost: 'Q180.00', price: 'Q245.00', status: 'En stock' },
          { code: 'PAP-0718', name: 'Cuaderno profesional', categories: ['Papelera'], cost: 'Q1.60', price: 'Q2.99', status: 'En stock' },
          { code: 'LAB-0045', name: 'Pipeta automtica 10ml', categories: ['Laboratorio'], cost: 'Q28.00', price: 'Q46.50', status: 'Bajo stock' }
        ]
      }
    },
    secretaria: {
      overview: {
        stats: [
          { label: 'Ventas registradas hoy', value: '$4,820', trend: '+5% vs. ayer', icon: 'fa-sack-dollar', tone: 'success' },
          { label: 'rdenes procesadas', value: '38', trend: 'Pendientes: 2', icon: 'fa-receipt', tone: 'info' },
          { label: 'Alertas activas', value: '3', trend: 'Prioriza stock crtico', icon: 'fa-bell', tone: 'warning' }
        ],
        modules: [
          { target: 'reportes', title: 'Reportes de ventas', description: 'Genera archivos para gerencia acadmica.', icon: 'fa-file-lines', link: 'Ir a reportes' },
          { target: 'inventario', title: 'Inventario', description: 'Consulta existencias y movimientos.', icon: 'fa-boxes-stacked', link: 'Ver inventario' },
          { target: 'ventas', title: 'Ventas', description: 'Valida tickets y descuentos aplicados.', icon: 'fa-cash-register', link: 'Bitcora de ventas' }
        ],
        alerts: [
          { type: 'warning', title: 'Reactivo A-90', description: 'Stock disponible para 4 das.', icon: 'fa-flask' },
          { type: 'info', title: 'Reporte pendiente', description: 'Ventas por usuario debe enviarse a las 17:00.', icon: 'fa-paper-plane' }
        ],
        highlights: [],
        salesTrend: {
          subtitle: 'Ingresos expresados en miles (Q)',
          badge: 'Actualizado cada hora',
          data: [
            { label: 'Lun', value: 9 },
            { label: 'Mar', value: 11 },
            { label: 'Mi', value: 8 },
            { label: 'Jue', value: 7 },
            { label: 'Vie', value: 12 }
          ]
        },
        categoryMix: {
          subtitle: 'Participacin sobre el total de ventas',
          data: [
            { label: 'Laboratorio', value: 41, color: '#3b82f6' },
            { label: 'Papelera', value: 23, color: '#10b981' },
            { label: 'Servicios', value: 20, color: '#f59e0b' },
            { label: 'Otros', value: 16, color: '#ef4444' }
          ]
        }
      },
      reportes: {
        subtitle: 'Consulta ventas y movimientos de inventario autorizados.',
        summary: [
          { icon: 'fa-chart-column', label: 'Ingresos semana', value: '$22,410' },
          { icon: 'fa-file-contract', label: 'Reportes generados', value: '12' }
        ],
        filters: [
          { id: 'fecha', type: 'date-range', label: 'Rango de fechas' },
          { id: 'usuario', type: 'select', label: 'Usuario', options: ['Todos', 'secretaria01', 'secretaria02'] },
          { id: 'categoria', type: 'select', label: 'Categora', options: ['Todas', 'Laboratorio', 'Papelera', 'Servicios'] }
        ],
        table: {
          head: ['Fecha', 'Usuario', 'Categora', 'Ventas', 'Ingresos'],
          rows: [
            ['18/05/2025', 'secretaria02', 'Papelera', '9', '$1,540'],
            ['18/05/2025', 'secretaria01', 'Servicios', '6', '$2,180'],
            ['17/05/2025', 'secretaria02', 'Laboratorio', '11', '$4,260'],
            ['17/05/2025', 'secretaria01', 'Laboratorio', '8', '$3,240']
          ]
        },
        charts: [
          {
            type: 'bar',
            title: 'Ventas diarias',
            subtitle: 'Semana en curso (miles de Q)',
            data: [
              { label: 'Lun', value: 8 },
              { label: 'Mar', value: 9 },
              { label: 'Mi', value: 6 },
              { label: 'Jue', value: 7 },
              { label: 'Vie', value: 10 }
            ]
          }
        ]
      },
      ventas: {
        subtitle: 'Seguimiento de ventas registradas por el rol Secretara.',
        stats: [
          { label: 'Ingresos hoy', value: '$4,820', trend: '+5% vs. ayer', icon: 'fa-sack-dollar', tone: 'success' },
          { label: 'Tickets emitidos', value: '38', trend: 'Pendientes: 2', icon: 'fa-ticket', tone: 'info' }
        ],
        trend: [
          { label: 'Lun', value: 7 },
          { label: 'Mar', value: 8 },
          { label: 'Mi', value: 6 },
          { label: 'Jue', value: 5 },
          { label: 'Vie', value: 9 }
        ],
        topProducts: [
          { name: 'Reactivos Qumicos', units: 210, delta: '+12%' },
          { name: 'Cuadernos profesionales', units: 168, delta: '+6%' },
          { name: 'Kits de laboratorio', units: 120, delta: '+8%' }
        ],
        log: [
          { date: '18/05 14:57', user: 'secretaria02', category: 'Papelera', subtotal: '$215', discount: '$15', total: '$200' },
          { date: '18/05 12:33', user: 'secretaria01', category: 'Servicios', subtotal: '$780', discount: '$0', total: '$780' },
          { date: '17/05 18:02', user: 'secretaria02', category: 'Laboratorio', subtotal: '$540', discount: '$20', total: '$520' }
        ]
      }
    }
  };

  const PASSWORD_RULES = [
    { id: 'req-length', test: value => value.length >= 8 },
    { id: 'req-uppercase', test: value => /[A-Z]/.test(value) },
    { id: 'req-lowercase', test: value => /[a-z]/.test(value) },
    { id: 'req-number', test: value => /[0-9]/.test(value) },
    { id: 'req-symbol', test: value => /[^A-Za-z0-9]/.test(value) }
  ];

  const modalManager = createModalManager();

  const API_ENDPOINTS = {
    userById: id => `/api/usuarios/${id}`,
    updateUser: id => `/api/usuarios/${id}`,
    changePassword: '/api/usuarios/cambiar-password',
    categorias: '/api/categorias',
    categoriaById: id => `/api/categorias/${id}`,
    productos: '/api/productos',
    productoById: codigo => `/api/productos/${codigo}`,
    inventario: '/api/inventario',
    inventarioMovimientos: '/api/inventario/movimientos',
    inventarioStock: '/api/inventario/stock',
    ventas: '/api/ventas',
    ventaById: id => `/api/ventas/${id}`,
    reportes: '/api/reportes',
    reportesVentas: '/api/reportes/ventas',
    reportesInventario: '/api/reportes/inventario',
    reportesTopProductos: '/api/reportes/top-productos',
    reportesIngresos: '/api/reportes/ingresos'
  };

  let profileState = null;
  let categoryState = [];
  let categoryFormMode = 'create';
  let categoryTargetId = null;
  let openCategoryMenuId = null;
  let categoryProductsState = { items: [], page: 1, pageSize: 10, total: 0, name: '' };
  let categoriesPager = { page: 1, pageSize: 9, total: 0 };
  let productTransient = [];
  let productEdits = {};
  let productDeletes = new Set();
  let productsPager = { page: 1, pageSize: 10, total: 0 };
  let invMovPager = { page: 1, pageSize: 10, total: 0 };

  const sections = {
    overview: document.getElementById('overviewSection'),
    reportes: document.getElementById('reportesSection'),
    inventario: document.getElementById('inventarioSection'),
    ventas: document.getElementById('ventasSection'),
    productos: document.getElementById('productosSection'),
    categorias: document.getElementById('categoriasSection'),
    // Nuevo: sección de Usuarios
    usuarios: document.getElementById('usuariosSection')
  };

  const navMenu = document.getElementById('sidebarMenu');
  const dropdownToggle = document.getElementById('userMenuToggle');
  const userDropdown = document.getElementById('userDropdown');
  const themeTextNode = document.getElementById('themeText');
  const themeIconNode = document.getElementById('themeIcon');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebarElement = document.getElementById('sidebar');
  const role = resolveRole();
  let currentTheme = resolveTheme();

  applyTheme(currentTheme);
  document.body.setAttribute('data-user-role', role);

  hydrateHeader(role);
  updateThemeIndicator();
  buildNavigation(role);
  hydrateSections(role);
  registerEvents(role);

  // Gestión de usuarios: bootstrap perezoso cuando la sección esté activa
  let userManagerInstance = null;
  let usersBootstrapped = false;

  function ensureUsersBootstrapped() {
    if (usersBootstrapped) return;
    try {
      if (typeof window.ApiService === 'function' && typeof window.UIManager === 'function' && typeof window.UserManager === 'function') {
        const api = new window.ApiService();
        const ui = new window.UIManager();
        userManagerInstance = new window.UserManager(api, ui);
        usersBootstrapped = true;
        userManagerInstance.loadUsersData()?.catch(err => console.error('Error cargando usuarios:', err));
      }
    } catch (err) {
      console.error('No se pudo inicializar Gestión de Usuarios:', err);
    }
  }

  // Si la vista inicia en Usuarios (por querystring o localStorage), cargarla
  try {
    if (sections.usuarios && sections.usuarios.classList.contains('active') && role === 'admin') {
      ensureUsersBootstrapped();
    }
  } catch (_) {}

  function resolveRole() {
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role');
    if (paramRole && (paramRole === 'admin' || paramRole === 'secretaria')) {
      localStorage.setItem('userRole', paramRole);
    }
    const stored = localStorage.getItem('userRole');
    if (stored === 'admin' || stored === 'secretaria') {
      return stored;
    }
    return 'secretaria';
  }

  function resolveTheme() {
    const stored = localStorage.getItem('dashboardTheme');
    return stored === 'dark' ? 'dark' : 'light';
  }

  function createModalManager() {
    const active = new Set();

    function open(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      active.add(modalId);
      document.body.classList.add('modal-open');
    }

    function close(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      active.delete(modalId);
      if (modalId === 'changePasswordModal') {
        resetChangePasswordModal();
      }
      if (modalId === 'categoryModal') {
        clearCategoryForm();
      }
      if (modalId === 'profileModal') {
        clearProfileMessage();
      }
      if (active.size === 0) {
        document.body.classList.remove('modal-open');
      }
    }

    function closeAll() {
      Array.from(active).forEach(close);
      active.clear();
      document.body.classList.remove('modal-open');
    }

    return {
      open,
      close,
      closeAll,
      isOpen: modalId => active.has(modalId)
    };
  }

  async function apiRequest(url, { method = 'GET', body = null } = {}) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body !== null && body !== undefined) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      let data = {};

      try {
        data = await response.json();
      } catch (_) {
        // Ignorar si la respuesta no es JSON
      }

      if (!response.ok || data?.success === false) {
        const message = data?.message || `Error HTTP ${response.status}`;
        throw new Error(message);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexin.');
      }
      throw error;
    }
  }

  function setProfileLoading(isLoading, message = 'Cargando perfil...') {
    const container = document.getElementById('profileMessageContainer');
    if (!container) return;

    if (isLoading) {
      container.dataset.loading = 'true';
      container.className = 'message-container info';
      container.innerHTML = `
        <div class="message info">
          <i class="fas fa-spinner fa-pulse"></i>
          <span>${message}</span>
        </div>
      `;
    } else if (container.dataset.loading === 'true') {
      delete container.dataset.loading;
      clearProfileMessage();
    }
  }

  function setProfileMessage(type, message) {
    const container = document.getElementById('profileMessageContainer');
    if (!container) return;
    if (container.dataset.loading) {
      delete container.dataset.loading;
    }
    container.className = `message-container ${type}`;
    container.innerHTML = `
      <div class="message ${type}">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-circle-info'}"></i>
        <span>${message}</span>
      </div>
    `;
  }

  function clearProfileMessage() {
    const container = document.getElementById('profileMessageContainer');
    if (!container) return;
    if (container.dataset.loading) {
      delete container.dataset.loading;
    }
    container.className = 'message-container';
    container.innerHTML = '';
  }

  function refreshSessionData({ nombres, apellidos, email, rol }) {
    const fullName = [nombres, apellidos].filter(Boolean).join(' ').trim() || 'Usuario';
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = fullName;
    }

    localStorage.setItem('userName', fullName);
    if (email) localStorage.setItem('userEmail', email);

    const stored = getStoredUserData();
    const normalizedRole = normalizeRoleValue(rol || stored.rol);
    localStorage.setItem('userRole', normalizedRole);
    const roleElement = document.getElementById('userRole');
    if (roleElement) {
      roleElement.textContent = formatRoleLabel(normalizedRole);
    }
    document.body.setAttribute('data-user-role', normalizedRole);
    const updatedData = {
      ...stored,
      nombres,
      apellidos,
      correo: email,
      email,
      userName: fullName,
      rol: normalizedRole
    };
    localStorage.setItem('userData', JSON.stringify(updatedData));
  }

  // ============================================================================
  // SECCIÓN: MÓDULO DE CATEGORÍAS (LÍNEAS 687-1062)
  // ============================================================================
  // CLEAR: ⚠️ ACTUALIZACIÓN 2025-11-01 - Módulo completo de categorías - 375 líneas
  // 
  // ✅ BASE DE DATOS: Tabla com.tbCategoria YA EXISTE en definitivo.sql
  //    Estructura:
  //    - IdCategoria INT IDENTITY(1,1) PRIMARY KEY
  //    - Nombre VARCHAR(100) NOT NULL UNIQUE
  //    - Descripcion VARCHAR(200) NULL
  //    - Activo BIT NOT NULL DEFAULT 1
  //    - FechaRegistro DATETIME2(0) NOT NULL
  //    
  //    Relación: N:N con com.tbProducto a través de com.tbProductoCategoria
  // 
  // ❌ BACKEND: Endpoints NO implementados
  //    Falta crear:
  //    1. src/routes/categorias.routes.js
  //    2. src/controllers/categorias.controller.js
  //    3. Endpoints necesarios:
  //       - GET /api/categorias (listar)
  //       - GET /api/categorias/:id (obtener una)
  //       - POST /api/categorias (crear)
  //       - PUT /api/categorias/:id (actualizar)
  //       - DELETE /api/categorias/:id (eliminar/desactivar)
  // 
  // ❌ FRONTEND: Mock data sin conexión
  //    3. Eliminar datos mock DASHBOARD_DATA.categorias
  //    4. Conectar formularios con API real
  // 
  // Funciones afectadas:
  // - normalizeCategory() - Formateo de datos de categoría
  // - handleCategoryGridClick() - Navegación entre vistas
  // - openCategoryForm() - Formulario de creación/edición
  // - deleteCategory() - Eliminación de categorías
  // - renderCategorias() - Renderizado completo del módulo (430 líneas)

  function normalizeCategory(item = {}, index = 0) {
    const nameRaw = (item.name || item.Nombre || `Categora ${index + 1}`).toString().trim();
    const name = nameRaw || `Categora ${index + 1}`;
    const description = (item.description || item.Descripcion || '').toString();
    const color = (item.color || '#3b82f6').toString();
    
    // Usar IdCategoria del backend como ID principal, o generar slug
    let slug = '';
    if (item.IdCategoria) {
      slug = item.IdCategoria.toString();
    } else if (item.id || item.slug) {
      slug = (item.id || item.slug).toString().trim();
    }
    
    if (!slug) {
      slug = generateCategorySlug(name, index + 1);
    }

    const rawCount = item.productsCount ?? item.products ?? item.total ?? item.cantidad ?? 0;
    const productsCount = Number.isFinite(rawCount) ? Math.max(0, Number(rawCount)) : Math.max(0, parseInt(rawCount, 10) || 0);

    return {
      id: slug,
      slug,
      name,
      description,
      color,
      productsCount
    };
  }

  function generateCategorySlug(name, suffix) {
    const base = (name || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'categoria';
    if (!suffix) return base;
    const safeSuffix = suffix.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${base}-${safeSuffix.replace(/^-+|-+$/g, '') || 'nuevo'}`;
  }

  function generateUniqueCategoryId(name) {
    const base = generateCategorySlug(name);
    let attempt = 0;
    let candidate = base;
    const source = Array.isArray(categoryState) ? categoryState : [];
    while (source.some(category => category.id === candidate)) {
      attempt += 1;
      candidate = `${base}-${attempt + 1}`;
    }
    return candidate;
  }

  // Paleta de colores apta para claro/oscuro
  function getRandomCategoryColor() {
    const palette = [
      '#3b82f6', // blue-500
      '#0ea5e9', // sky-500
      '#22c55e', // green-500
      '#10b981', // emerald-500
      '#a855f7', // purple-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#14b8a6'  // teal-500
    ];
    const idx = Math.floor(Math.random() * palette.length);
    return palette[idx];
  }

  function getCategoryById(categoryId) {
    if (!categoryState) return null;
    return categoryState.find(category => category.id === categoryId) || null;
  }

  function handleCategoryGridClick(event, currentRole) {
    const isAdmin = currentRole === 'admin';
    const actionEl = event.target.closest('[data-category-action]');
    if (actionEl) {
      const action = actionEl.dataset.categoryAction;
      const categoryId = actionEl.dataset.categoryId;
      if (!categoryId) return;

      switch (action) {
        case 'toggleMenu':
          event.preventDefault();
          event.stopPropagation();
          toggleCategoryMenu(categoryId);
          break;
        case 'detail':
          closeCategoryMenu();
          openCategoryDetail(categoryId);
          break;
        case 'edit':
          if (!isAdmin) return;
          closeCategoryMenu();
          openCategoryForm('edit', categoryId);
          break;
        case 'delete':
          if (!isAdmin) return;
          closeCategoryMenu();
          openCategoryDelete(categoryId);
          break;
        default:
          break;
      }
      return;
    }

    const card = event.target.closest('.category-card');
    if (card) {
      const categoryId = card.dataset.categoryId;
      if (categoryId) {
        closeCategoryMenu();
        openCategoryProducts(categoryId);
      }
    }
  }

  function toggleCategoryMenu(categoryId) {
    if (openCategoryMenuId === categoryId) {
      closeCategoryMenu();
      return;
    }

    closeCategoryMenu();

    const menu = document.querySelector(`.category-menu[data-category-id="${categoryId}"]`);
    if (menu) {
      menu.classList.add('show');
      openCategoryMenuId = categoryId;
    }
  }

  function closeCategoryMenu() {
    if (!openCategoryMenuId) return;
    const menu = document.querySelector(`.category-menu[data-category-id="${openCategoryMenuId}"]`);
    if (menu) {
      menu.classList.remove('show');
    }
    openCategoryMenuId = null;
  }

  function openCategoryForm(mode, categoryId = null) {
    if (role !== 'admin') return;
    closeCategoryMenu();
    categoryFormMode = mode;
    categoryTargetId = categoryId;
    clearCategoryFormMessage();

    const title = document.getElementById('categoryFormTitle');
    const submitBtn = document.getElementById('categoryFormSubmit');
    const nameField = document.getElementById('categoryName');
    const descriptionField = document.getElementById('categoryDescription');
    // campos removidos: color y total de productos
    const slugField = document.getElementById('categorySlug');

    if (!nameField || !descriptionField || !slugField) {
      showToast('Formulario de categora no disponible.', 'error');
      return;
    }

    if (mode === 'edit' && categoryId) {
      const category = getCategoryById(categoryId);
      if (!category) {
        showToast('Categora no encontrada.', 'error');
        return;
      }
      if (title) title.innerHTML = '<i class="fas fa-pen"></i> Editar categora';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';

      nameField.value = category.name;
      descriptionField.value = category.description;
      slugField.value = category.id;
    } else {
      if (title) title.innerHTML = '<i class="fas fa-layer-group"></i> Nueva categora';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar categora';

      nameField.value = '';
      descriptionField.value = '';
      slugField.value = generateCategorySlug('categoria', Date.now().toString(36));
      categoryTargetId = null;
      updateCategorySlugPreview(nameField.value);
    }

    modalManager.open('categoryModal');
  }

  function updateCategorySlugPreview(name) {
    if (categoryFormMode === 'edit') return;
    const slugField = document.getElementById('categorySlug');
    if (!slugField) return;
    const preview = generateCategorySlug(name || 'categoria');
    slugField.value = preview;
  }

  function setCategoryFormMessage(type, message) {
    const container = document.getElementById('categoryFormMessage');
    if (!container) return;
    container.className = `message-container ${type}`;
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-triangle',
      info: 'fa-circle-info',
      warning: 'fa-exclamation-triangle'
    };
    container.innerHTML = `
      <div class="message ${type}">
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
      </div>
    `;
  }

  function clearCategoryFormMessage() {
    const container = document.getElementById('categoryFormMessage');
    if (!container) return;
    container.className = 'message-container';
    container.innerHTML = '';
  }

  function clearCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (!form) return;
    form.reset();
    const slugField = document.getElementById('categorySlug');
    if (slugField) {
      slugField.value = generateCategorySlug('categoria', Date.now().toString(36));
    }
    clearCategoryFormMessage();
  }

  async function handleCategoryFormSubmit(event) {
    event.preventDefault();
    if (role !== 'admin') return;

    const name = document.getElementById('categoryName')?.value?.trim() || '';
    const description = document.getElementById('categoryDescription')?.value?.trim() || '';

    if (!name) {
      setCategoryFormMessage('error', 'El nombre de la categora es obligatorio.');
      return;
    }

    if (!Array.isArray(categoryState)) {
      categoryState = [];
    }

    setCategoryFormMessage('info', categoryFormMode === 'edit' ? 'Guardando cambios...' : 'Creando categora...');

    try {
      if (categoryFormMode === 'edit') {
        // Actualizar categoría existente
        const category = getCategoryById(categoryTargetId);
        if (!category) {
          setCategoryFormMessage('error', 'La categora seleccionada ya no existe.');
          return;
        }

        const response = await apiRequest(API_ENDPOINTS.categoriaById(categoryTargetId), {
          method: 'PUT',
          body: {
            nombre: name,
            descripcion: description
          }
        });

        if (response.success) {
          // Recargar categorías desde API para obtener datos actualizados
          await loadCategorias();
          await renderCategorias();
          showToast('Categora actualizada.', 'success');
          modalManager.close('categoryModal');
        } else {
          setCategoryFormMessage('error', response.message || 'Error al actualizar categoría');
        }
      } else {
        // Crear nueva categoría
        const response = await apiRequest(API_ENDPOINTS.categorias, {
          method: 'POST',
          body: {
            nombre: name,
            descripcion: description
          }
        });

        if (response.success) {
          // Recargar categorías desde API
          await loadCategorias();
          await renderCategorias();
          showToast('Categora creada correctamente.', 'success');
          modalManager.close('categoryModal');
        } else {
          setCategoryFormMessage('error', response.message || 'Error al crear categoría');
        }
      }
    } catch (error) {
      console.error('Error en operación de categoría:', error);
      setCategoryFormMessage('error', error.message || 'Error en la operación');
    }
  }

  function openCategoryProducts(categoryId) {
    const category = getCategoryById(categoryId);
    if (!category) {
      showToast('Categora no encontrada.', 'error');
      return;
    }

    categoryTargetId = categoryId;
    closeCategoryMenu();

    const modal = document.getElementById('categoryProductsModal');
    if (!modal) {
      showToast('Vista de productos no disponible.', 'warning');
      return;
    }

    const titleEl = document.getElementById('productsCategoryName');
    const messageEl = document.getElementById('productsCategoryMessage');
    const helperEl = document.getElementById('productsCategoryHelper');
    const colorEl = document.getElementById('productsCategoryColor');
    const bodyEl = document.getElementById('categoryProductsBody');
    const count = category.productsCount ?? 0;

    if (titleEl) titleEl.textContent = category.name;
    if (messageEl) messageEl.textContent = 'A continuacin se muestran los productos asociados a esta categora.';
    if (helperEl) {
      helperEl.textContent = count === 0
        ? 'An no hay productos registrados.'
        : `Actualmente se muestran ${count} ${count === 1 ? 'producto' : 'productos'} en el catlogo.`;
    }
    if (colorEl) {
      colorEl.style.background = category.color || '#3b82f6';
    }

    // Poblar la tabla con los productos de la categora (fuente: dataset del dashboard)
    if (bodyEl) {
      const products = getProductsForCategory(category.name);
      if (!products.length) {
        bodyEl.innerHTML = `
          <tr>
            <td colspan="6"><p class="empty-state">No hay productos asociados a esta categora.</p></td>
          </tr>
        `;
      } else {
        bodyEl.innerHTML = products.map(p => `
          <tr>
            <td>${p.code}</td>
            <td>${p.name}</td>
            <td>${(p.categories || []).map(cat => `<span class="tag">${cat}</span>`).join(' ')}</td>
            <td>${p.cost}</td>
            <td>${p.price}</td>
            <td><span class="status-chip ${p.status === 'Activo' ? 'success' : 'warning'}">${p.status}</span></td>
          </tr>
        `).join('');
      }
    }

    // Configurar y renderizar paginacin dentro del modal
    const pageSizeSelect = document.getElementById('categoryProductsPageSize');
    const prevBtn = document.getElementById('categoryProductsPrev');
    const nextBtn = document.getElementById('categoryProductsNext');

    const listForCategory = getProductsForCategory(category.name);
    const defaultSize = Number(pageSizeSelect?.value || 10) || 10;
    categoryProductsState = {
      items: listForCategory,
      page: 1,
      pageSize: defaultSize,
      total: listForCategory.length,
      name: category.name
    };

    renderCategoryProductsPage();

    if (pageSizeSelect) {
      pageSizeSelect.onchange = () => {
        const newSize = Number(pageSizeSelect.value) || 10;
        categoryProductsState.pageSize = newSize;
        categoryProductsState.page = 1;
        renderCategoryProductsPage();
      };
    }
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (categoryProductsState.page > 1) {
          categoryProductsState.page -= 1;
          renderCategoryProductsPage();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const maxPage = Math.max(1, Math.ceil(categoryProductsState.total / categoryProductsState.pageSize));
        if (categoryProductsState.page < maxPage) {
          categoryProductsState.page += 1;
          renderCategoryProductsPage();
        }
      };
    }

    modalManager.open('categoryProductsModal');
  }

  function openCategoryDetail(categoryId) {
    closeCategoryMenu();
    const category = getCategoryById(categoryId);
    if (!category) {
      showToast('Categora no encontrada.', 'error');
      return;
    }

    categoryTargetId = categoryId;
    closeCategoryMenu();

    const nameEl = document.getElementById('detailCategoryName');
    const productsEl = document.getElementById('detailCategoryProducts');
    const descriptionEl = document.getElementById('detailCategoryDescription');
    const colorEl = document.getElementById('detailCategoryColor');
    const detailActions = document.querySelector('#categoryDetailModal .detail-actions');
    const detailEditBtn = document.querySelector('[data-category-action="detail-edit"]');
    const detailDeleteBtn = document.querySelector('[data-category-action="detail-delete"]');

    if (nameEl) nameEl.textContent = category.name;
    const count = category.productsCount ?? 0;
    if (productsEl) productsEl.textContent = `${count} ${count === 1 ? 'producto asociado' : 'productos asociados'}`;
    if (descriptionEl) descriptionEl.textContent = category.description || 'Sin descripcin registrada.';
    if (colorEl) colorEl.style.background = category.color || '#3b82f6';
    if (detailActions) {
      detailActions.style.display = role === 'admin' ? 'flex' : 'none';
    }
    if (detailEditBtn) detailEditBtn.setAttribute('data-category-id', categoryId);
    if (detailDeleteBtn) detailDeleteBtn.setAttribute('data-category-id', categoryId);

    modalManager.open('categoryDetailModal');
  }

  function openCategoryDelete(categoryId) {
    const category = getCategoryById(categoryId);
    if (!category) {
      showToast('Categora no encontrada.', 'error');
      return;
    }
    categoryTargetId = categoryId;
    const label = document.getElementById('deleteCategoryName');
    if (label) label.textContent = category.name;
    modalManager.close('categoryDetailModal');
    modalManager.open('categoryDeleteModal');
  }

  async function deleteCategory() {
    if (!categoryState || !categoryTargetId) return;
    closeCategoryMenu();
    
    const index = categoryState.findIndex(category => category.id === categoryTargetId);
    if (index === -1) {
      showToast('La categora ya no existe.', 'error');
      return;
    }

    try {
      const response = await apiRequest(API_ENDPOINTS.categoriaById(categoryTargetId), {
        method: 'DELETE'
      });

      if (response.success) {
        // Recargar categorías desde API
        await loadCategorias();
        await renderCategorias();
        modalManager.close('categoryDeleteModal');
        showToast('Categora eliminada.', 'success');
        categoryTargetId = null;
      } else {
        showToast(response.message || 'Error al eliminar categoría', 'error');
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      showToast(error.message || 'Error al eliminar categoría', 'error');
    }
  }

  function escapeHtml(value) {
    return (value ?? '').toString().replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char] || char);
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }

  function updateThemeIndicator() {
    if (!themeTextNode || !themeIconNode) return;
    if (currentTheme === 'dark') {
      themeTextNode.textContent = 'Tema Claro';
      themeIconNode.className = 'fas fa-sun';
    } else {
      themeTextNode.textContent = 'Tema Oscuro';
      themeIconNode.className = 'fas fa-moon';
    }
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dashboardTheme', currentTheme);
    applyTheme(currentTheme);
    updateThemeIndicator();
    showToast(`Tema ${currentTheme === 'dark' ? 'oscuro' : 'claro'} activado.`);
  }

  function hydrateHeader(currentRole) {
    const copy = ROLE_COPY[currentRole];
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = userName;
    const storedRole = localStorage.getItem('userRole') || copy.roleLabel;
    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) userRoleEl.textContent = formatRoleLabel(storedRole);
    const roleBadgeEl = document.getElementById('roleBadge');
    if (roleBadgeEl) roleBadgeEl.textContent = copy.badge;
    const userAvatarEl = document.getElementById('userAvatar');
    if (userAvatarEl) userAvatarEl.className = `fas ${copy.avatar}`;
    const overviewTitleEl = document.getElementById('overviewTitle');
    if (overviewTitleEl) overviewTitleEl.textContent = copy.overviewTitle;
    const overviewSubtitleEl = document.getElementById('overviewSubtitle');
    if (overviewSubtitleEl) overviewSubtitleEl.textContent = copy.overviewSubtitle;
    const overviewModulesTitleEl = document.getElementById('overviewModulesTitle');
    if (overviewModulesTitleEl) overviewModulesTitleEl.textContent = copy.modulesTitle;
  }

  function buildNavigation(currentRole) {
    const available = NAV_ITEMS[currentRole];
    navMenu.innerHTML = available.map((item, index) => `
      <li class="nav-item${index === 0 ? ' active' : ''}" data-section="${item.id}">
        <a href="#" class="nav-link">
          <i class="fas ${item.icon}"></i>
          ${item.label}
        </a>
      </li>
    `).join('');

    const allowed = new Set(available.map(item => item.id));
    Object.entries(sections).forEach(([id, element]) => {
      if (!element) return;
      if (!allowed.has(id)) {
        element.classList.add('hidden-by-role');
      } else {
        element.classList.remove('hidden-by-role');
      }
    });

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('section');
    const firstAvailable = available[0]?.id || 'overview';
    // Preferir 'reportes' como inicio si existe
    const preferred = allowed.has('reportes') ? 'reportes' : firstAvailable;
    const initial = requested && allowed.has(requested) ? requested : preferred;
    setActiveSection(initial);
  }

  function hydrateSections(currentRole) {
    // Ya no usamos DASHBOARD_DATA - cada módulo carga sus datos dinámicamente
    // Renderizar overview solo si existe en el DOM
    if (sections.overview && document.getElementById('overviewStats')) {
      try {
        renderOverview();
      } catch (err) {
        console.error('Error renderizando overview:', err);
      }
    }
    
    try {
      renderReportes();
    } catch (err) {
      console.error('Error renderizando reportes:', err);
    }
    
    // renderInventario es async - necesita manejo especial
    renderInventario().catch(err => {
      console.error('Error renderizando inventario:', err);
    });
    
    try {
      renderVentas();
    } catch (err) {
      console.error('Error renderizando ventas:', err);
    }
    
    if (currentRole === 'admin') {
      try {
        renderProductos();
      } catch (err) {
        console.error('Error renderizando productos:', err);
      }
      
      renderCategorias().catch(err => {
        console.error('Error renderizando categorías:', err);
      });
    }
  }

  // ============================================================================
  // SECCIÓN: MÓDULO DE OVERVIEW/DASHBOARD (LÍNEAS 1207-1229)
  // ============================================================================
  // CLEAR: Vista general del dashboard - 23 líneas
  // ⚠️ PARCIALMENTE FUNCIONAL: Combina datos reales y ficticios
  // Esta vista muestra un resumen de todos los módulos. Actualmente usa datos
  // mock porque depende de módulos comerciales no implementados.
  // Para hacerla funcional:
  // 1. Implementar endpoints: GET /api/dashboard/stats
  // 2. Reemplazar datos mock con llamadas reales a API
  // 3. Mostrar solo estadísticas de módulos implementados (usuarios, bitácoras)
  // 
  // Funciones afectadas:
  // - renderOverview() - Renderizado de vista general

  function renderOverview() {
    // Temporalmente usando DASHBOARD_DATA hasta completar refactorización de todos los módulos
    const data = DASHBOARD_DATA[role]?.overview;
    if (!data) return;

    const statsEl = document.getElementById('overviewStats');
    const modulesEl = document.getElementById('overviewModules');
    const alertsEl = document.getElementById('alertsList');
    const highlightsEl = document.getElementById('overviewHighlights');
    const salesChartEl = document.getElementById('salesChart');
    const pieEl = document.getElementById('categoryPie');
    const legendEl = document.getElementById('categoryLegend');
    const catSubEl = document.getElementById('categoryChartSubtitle');

    if (statsEl) buildStats(statsEl, data.stats);
    if (modulesEl) buildModules(modulesEl, data.modules);
    if (alertsEl) buildAlerts(alertsEl, data.alerts);
    if (highlightsEl) buildHighlights(highlightsEl, data.highlights);
    if (salesChartEl) {
      renderBarChart(salesChartEl, data.salesTrend.data, { badgeId: 'salesChartBadge', subtitleId: 'salesChartSubtitle', subtitle: data.salesTrend.subtitle, badge: data.salesTrend.badge });
    }
    if (pieEl && legendEl) {
      renderPieChart(pieEl, legendEl, data.categoryMix.data, data.categoryMix.subtitle);
    }
    if (catSubEl) catSubEl.textContent = data.categoryMix.subtitle;
  }

  // ============================================================================
  // SECCIÓN: MÓDULO DE REPORTES (LÍNEAS 1310-1881)
  // ============================================================================
  // CLEAR: ⚠️ ACTUALIZACIÓN 2025-11-01 - Módulo completo de reportes - 571 líneas
  // 
  // ✅ BASE DE DATOS: 4 Stored Procedures de reportes YA IMPLEMENTADOS
  //    
  //    1. com.sp_ReporteVentasPorFecha
  //       Parámetros: @FechaInicio, @FechaFin, @Usuario, @IdCategoria
  //       Retorna: Desglose de ventas con productos, categorías, totales
  //    
  //    2. com.sp_ReporteInventarioActual
  //       Parámetros: @IdProducto, @IdCategoria, @UltimosMov
  //       Retorna: Stock actual + historial de movimientos
  //    
  //    3. com.sp_ReporteProductosMasVendidos
  //       Parámetros: @TopN, @FechaInicio, @FechaFin
  //       Retorna: Top N productos más vendidos con totales
  //    
  //    4. com.sp_ReporteIngresosTotales
  //       Parámetros: @Anio, @Mes
  //       Retorna: Ingresos mensuales o diarios
  //    
  //    Permisos: rol_secretaria_app tiene EXECUTE en los 4 SP
  // 
  // ❌ BACKEND: Endpoints NO implementados
  //    Falta crear:
  //    1. src/routes/reportes.routes.js
  //    2. src/controllers/reportes.controller.js
  //    3. Endpoints necesarios:
  //       - GET /api/reportes/ventas (ejecutar sp_ReporteVentasPorFecha)
  //       - GET /api/reportes/inventario (ejecutar sp_ReporteInventarioActual)
  //       - GET /api/reportes/productos-vendidos (ejecutar sp_ReporteProductosMasVendidos)
  //       - GET /api/reportes/ingresos (ejecutar sp_ReporteIngresosTotales)
  //       - GET /api/reportes/export/:tipo (exportar a PDF/Excel)
  // 
  // ❌ FRONTEND: Mock data sin conexión
  //    Eliminar DASHBOARD_DATA.reports y conectar con API
  //    Implementar gráficas con Chart.js usando datos reales
  // 
  // Funciones afectadas:
  // - renderReportes() - Renderizado principal con filtros
  // - initReportsModule() - Inicialización con gráficas (Chart.js)
  // - buildSalesChart() - Gráfica de ventas
  // - buildCategoryMixChart() - Gráfica de mix de categorías
  // ============================================================================

  function renderReportes() {
    // Temporalmente usando DASHBOARD_DATA hasta completar refactorización
    const data = DASHBOARD_DATA[role]?.reportes;
    
    const section = document.getElementById('reportesSection');
    if (!section) return;

    const subtitle = (data && data.subtitle) ? data.subtitle : '';
    section.innerHTML = [
      '<div class="section-header">',
      '  <h1 id="reportTitle">Reportes</h1>',
      `  <p id="reportSubtitle">${escapeHtml(subtitle)}</p>`,
      '</div>',
      '<div class="tabs-container">',
      '  <div class="tabs-nav">',
      '    <button class="tab-btn active" id="repTabVentas"><i class="fas fa-file-invoice-dollar"></i> Ventas</button>',
      '    <button class="tab-btn" id="repTabInventario"><i class="fas fa-warehouse"></i> Inventario</button>',
      '    <button class="tab-btn" id="repTabTop"><i class="fas fa-ranking-star"></i> Top productos</button>',
      '    <button class="tab-btn" id="repTabIngresos"><i class="fas fa-chart-line"></i> Ingresos</button>',
      '  </div>',
      '</div>',
      '<div class="panel-card">',
      '  <div class="card-header" style="align-items:center; gap:12px;">',
      '    <h3 id="repViewTitle">Ventas por rango</h3>',
      '    <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">',
      '      <button class="btn btn-secondary btn-sm" id="repOpenFiltersBtn"><i class="fas fa-filter"></i> Filtros</button>',
      '      <div class="dropdown">',
      '        <button class="btn btn-primary btn-sm" id="repExportPdf"><i class="fas fa-file-pdf"></i> PDF</button>',
      '        <button class="btn btn-primary btn-sm" id="repExportXls"><i class="fas fa-file-excel"></i> Excel</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="panel-body" id="repMainBody" style="padding:16px;">',
      '    <!-- Secciones (Resultados y Gráficas) se inyectan dinámicamente -->',
      '  </div>',
      '</div>'
      ,
      // Modal de filtros
      '<div class="modal-overlay" id="reportFiltersModal" aria-hidden="true">',
      '  <div class="modal-container">',
      '    <div class="modal-header">',
      '      <h2 id="reportFiltersTitle"><i class="fas fa-filter"></i> Filtros</h2>',
      '      <button class="modal-close" data-action="closeModal" data-modal="reportFiltersModal"><i class="fas fa-times"></i></button>',
      '    </div>',
      '    <div class="modal-body">',
      '      <div id="repFiltersModalBox" class="advanced-filters"></div>',
      '    </div>',
      '    <div class="modal-footer">',
      '      <button type="button" class="btn-secondary" id="repModalClearBtn">Limpiar</button>',
      '      <button type="button" class="btn-primary" id="repModalApplyBtn"><i class="fas fa-check"></i> Aplicar</button>',
      '    </div>',
      '  </div>',
      '</div>'
      ,
      // Modal de gráfica (pie chart)
      '<div class="modal-overlay" id="reportChartModal" aria-hidden="true">',
      '  <div class="modal-container">',
      '    <div class="modal-header">',
      '      <h2 id="reportChartTitle"><i class="fas fa-chart-pie"></i> Gráfica</h2>',
      '      <button class="modal-close" data-action="closeModal" data-modal="reportChartModal"><i class="fas fa-times"></i></button>',
      '    </div>',
      '    <div class="modal-body">',
      '      <div class="pie-chart-wrapper">',
      '        <div class="pie-chart" id="repChartPie"></div>',
      '        <ul class="pie-legend" id="repChartLegend"></ul>',
      '      </div>',
      '      <p class="card-subtitle" id="repChartSubtitle" style="margin-top:12px; color:#64748b;">Diseño de ejemplo (pendiente integración).</p>',
      '    </div>',
      '    <div class="modal-footer">',
      '      <button type="button" class="btn-primary" data-action="closeModal" data-modal="reportChartModal"><i class="fas fa-check"></i> Cerrar</button>',
      '    </div>',
      '  </div>',
      '</div>'
      ].join('');

    initReportsModule();
  }

  function initReportsModule() {
    setupReportsTabs();
    window.resetReportBaseLayout && window.resetReportBaseLayout();
    renderReportsView('ventas');

    document.getElementById('repOpenFiltersBtn')?.addEventListener('click', () => modalManager.open('reportFiltersModal'));
    document.getElementById('repModalApplyBtn')?.addEventListener('click', () => { modalManager.close('reportFiltersModal'); showToast('Filtros aplicados', 'success'); });
    document.getElementById('repModalClearBtn')?.addEventListener('click', () => {
      const box = document.getElementById('repFiltersModalBox');
      if (box) box.querySelectorAll('input,select').forEach(el => { if (el.type === 'date' || el.tagName === 'SELECT' || el.type === 'text' || el.type === 'number') el.value = ''; });
      showToast('Filtros limpios');
    });
    document.getElementById('repExportPdf')?.addEventListener('click', () => showToast('Exportacin PDF en construccin'));
    document.getElementById('repExportXls')?.addEventListener('click', () => showToast('Exportacin Excel en construccin'));
  }

  // Abre modal con gráfica de pastel (diseño estático por ahora)
  function openReportPieModal(title, dataset = []) {
    const titleEl = document.getElementById('reportChartTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fas fa-chart-pie"></i> ${escapeHtml(title || 'Gráfica')}`;

    const pieEl = document.getElementById('repChartPie');
    const legendEl = document.getElementById('repChartLegend');
    if (pieEl && legendEl) {
      const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#64748b'];
      const data = (dataset || []).map((d, i) => ({
        label: d.label,
        value: Number(d.value) || 0,
        color: d.color || palette[i % palette.length]
      }));
      renderPieChart(pieEl, legendEl, data, '');
    }
    modalManager.open('reportChartModal');
  }

  function setupReportsTabs() {
    const map = {
      ventas: document.getElementById('repTabVentas'),
      inventario: document.getElementById('repTabInventario'),
      top: document.getElementById('repTabTop'),
      ingresos: document.getElementById('repTabIngresos')
    };
    const activate = key => {
      Object.entries(map).forEach(([k, btn]) => btn?.classList.toggle('active', k === key));
      if (key !== 'inventario') {
        window.resetReportBaseLayout && window.resetReportBaseLayout();
      }
      renderReportsView(key);
    };
    map.ventas?.addEventListener('click', () => activate('ventas'));
    map.inventario?.addEventListener('click', () => activate('inventario'));
    map.top?.addEventListener('click', () => activate('top'));
    map.ingresos?.addEventListener('click', () => activate('ingresos'));
  }

  // Construye (si hace falta) el layout base de Reportes para vistas no-inventario (sin Indicadores)
  function ensureReportsBase() {
    const mainBody = document.getElementById('repMainBody');
    if (!mainBody) return null;
    const hasTable = !!document.getElementById('repTableHead');
    if (!hasTable) {
      mainBody.innerHTML = [
        '<div class="panel-subcard" style="margin-bottom:16px;">',
        '  <div class="card-header"><h3>Resultados</h3></div>',
        '  <div class="table-responsive" style="padding:0 12px 12px;">',
        '    <table class="data-table">',
        '      <thead><tr id="repTableHead"></tr></thead>',
        '      <tbody id="repTableBody"></tbody>',
        '    </table>',
        '  </div>',
        '</div>',
        '<div class="panel-subcard" style="margin-bottom:16px;">',
        '  <div class="card-header" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">',
        '    <h3>Graficas</h3>',
        '    <button class="btn btn-primary btn-sm" id="repChartsPdfBtn" style="display:none;"><i class="fas fa-file-pdf"></i> PDF</button>',
        '  </div>',
        '  <div class="insights-grid" id="repChartsBox" style="padding:12px;"></div>',
        '</div>'
      ].join('');
    }
    return {
      summaryBox: null,
      chartsBox: document.getElementById('repChartsBox'),
      head: document.getElementById('repTableHead'),
      body: document.getElementById('repTableBody')
    };
  }

  // Paginación para tablas de Reportes (vistas no-inventario)
  window.repTablePager = window.repTablePager || { items: [], page: 1, pageSize: 10, total: 0 };
  function ensureReportTablePaginationUI() {
    const bodyEl = document.getElementById('repTableBody');
    if (!bodyEl) return;
    if (document.getElementById('repTablePagination')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-pagination';
    wrapper.id = 'repTablePagination';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '12px';
    wrapper.style.justifyContent = 'space-between';
    wrapper.style.marginTop = '12px';
    wrapper.style.flexWrap = 'wrap';
    wrapper.innerHTML = [
      '<div class="pagination-left" style="display:flex; align-items:center; gap:10px;">',
      '  <label for="repPageSize" style="font-size:0.9rem; color:var(--text-muted, #64748b);">Mostrar</label>',
      '  <select id="repPageSize" class="filter-select" style="min-width:80px;">',
      '    <option value="5">5</option>',
      '    <option value="10" selected>10</option>',
      '    <option value="20">20</option>',
      '  </select>',
      '  <span style="font-size:0.9rem; color:var(--text-muted, #64748b);">por página</span>',
      '</div>',
      '<div class="pagination-right" style="display:flex; align-items:center; gap:10px;">',
      '  <span id="repPageInfo" style="font-size:0.9rem; color:var(--text-muted, #64748b);">Mostrando 0–0 de 0</span>',
      '  <div class="pagination-buttons" style="display:flex; gap:8px;">',
      '    <button type="button" class="btn btn-secondary btn-sm" id="repPrev"><i class="fas fa-chevron-left"></i> Anterior</button>',
      '    <button type="button" class="btn btn-secondary btn-sm" id="repNext">Siguiente <i class="fas fa-chevron-right"></i></button>',
      '  </div>',
      '</div>'
    ].join('');
    const tableBox = bodyEl.closest('.table-responsive') || bodyEl.parentElement;
    if (tableBox && tableBox.parentElement) {
      tableBox.parentElement.insertAdjacentElement('beforeend', wrapper);
    }
  }

  function renderReportTablePage() {
    const body = document.getElementById('repTableBody');
    const head = document.getElementById('repTableHead');
    const infoEl = document.getElementById('repPageInfo');
    const prevBtn = document.getElementById('repPrev');
    const nextBtn = document.getElementById('repNext');
    const pageSizeSelect = document.getElementById('repPageSize');
    if (!body || !head) return;
    const cols = head ? (head.querySelectorAll('th').length || 1) : 1;
    const list = Array.isArray(window.repTablePager.items) ? window.repTablePager.items : [];
    window.repTablePager.total = list.length;
    if (pageSizeSelect) {
      const v = Number(pageSizeSelect.value || window.repTablePager.pageSize || 10) || 10;
      window.repTablePager.pageSize = v;
    }
    if (list.length === 0) {
      body.innerHTML = `<tr><td colspan="${cols}"><p class="empty-state">Sin datos disponibles.</p></td></tr>`;
      if (infoEl) infoEl.textContent = 'Mostrando 0–0 de 0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }
    const maxPage = Math.max(1, Math.ceil(window.repTablePager.total / (window.repTablePager.pageSize || 10)));
    const safePage = Math.min(Math.max(1, window.repTablePager.page || 1), maxPage);
    if (safePage !== window.repTablePager.page) window.repTablePager.page = safePage;
    const start = (safePage - 1) * (window.repTablePager.pageSize || 10);
    const end = Math.min(start + (window.repTablePager.pageSize || 10), window.repTablePager.total);
    const slice = list.slice(start, end);
    body.innerHTML = slice.map(row => `<tr>${(row || []).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    if (infoEl) infoEl.textContent = `Mostrando ${start + 1}–${end} de ${window.repTablePager.total}`;
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= maxPage;
  }

  function initReportTablePagination() {
    const pageSizeSelect = document.getElementById('repPageSize');
    const prevBtn = document.getElementById('repPrev');
    const nextBtn = document.getElementById('repNext');
    if (pageSizeSelect) {
      window.repTablePager.pageSize = Number(pageSizeSelect.value || 10) || 10;
      pageSizeSelect.onchange = () => { window.repTablePager.pageSize = Number(pageSizeSelect.value) || 10; window.repTablePager.page = 1; renderReportTablePage(); };
    }
    if (prevBtn) prevBtn.onclick = () => { if (window.repTablePager.page > 1) { window.repTablePager.page -= 1; renderReportTablePage(); } };
    if (nextBtn) nextBtn.onclick = () => { const maxPage = Math.max(1, Math.ceil((window.repTablePager.total || 0) / (window.repTablePager.pageSize || 10))); if (window.repTablePager.page < maxPage) { window.repTablePager.page += 1; renderReportTablePage(); } };
  }

  // Paginación placeholders para vista Inventario dentro de Reportes (2 tablas)
  function ensureReportsInventarioPaginationUI() {
    const critBody = document.getElementById('invCritBody');
    const movBody = document.getElementById('invMovBody');
    const setup = (bodyEl, baseId) => {
      if (!bodyEl) return;
      const paginationId = `${baseId}Pagination`;
      if (document.getElementById(paginationId)) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-pagination';
      wrapper.id = paginationId;
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '12px';
      wrapper.style.justifyContent = 'space-between';
      wrapper.style.marginTop = '12px';
      wrapper.style.flexWrap = 'wrap';
      wrapper.innerHTML = [
        `<div class="pagination-left" style="display:flex; align-items:center; gap:10px;">`,
        `  <label for="${baseId}PageSize" style="font-size:0.9rem; color:var(--text-muted, #64748b);">Mostrar</label>`,
        `  <select id="${baseId}PageSize" class="filter-select" style="min-width:80px;">`,
        '    <option value="5">5</option>',
        '    <option value="10" selected>10</option>',
        '    <option value="20">20</option>',
        '  </select>',
        '  <span style="font-size:0.9rem; color:var(--text-muted, #64748b);">por página</span>',
        '</div>',
        `<div class="pagination-right" style="display:flex; align-items:center; gap:10px;">`,
        `  <span id="${baseId}PageInfo" style="font-size:0.9rem; color:var(--text-muted, #64748b);">Mostrando 0–0 de 0</span>`,
        '  <div class="pagination-buttons" style="display:flex; gap:8px;">',
        `    <button type="button" class="btn btn-secondary btn-sm" id="${baseId}Prev"><i class="fas fa-chevron-left"></i> Anterior</button>`,
        `    <button type="button" class="btn btn-secondary btn-sm" id="${baseId}Next">Siguiente <i class="fas fa-chevron-right"></i></button>`,
        '  </div>',
        '</div>'
      ].join('');
      const tableBox = bodyEl.closest('.table-responsive') || bodyEl.parentElement;
      if (tableBox && tableBox.parentElement) {
        tableBox.parentElement.insertAdjacentElement('beforeend', wrapper);
      }
      // Inicial: sin datos
      const prevBtn = document.getElementById(`${baseId}Prev`);
      const nextBtn = document.getElementById(`${baseId}Next`);
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    };
    setup(critBody, 'repInvCrit');
    setup(movBody, 'repInvMov');
  }

  // Helpers de HTML para filtros en modal (uso general)
  function selectFilterHtml(label, id, options) {
    const opts = (options || []).map(o => `<option>${o}</option>`).join('');
    return `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <select id="${id}" class="filter-select">${opts}</select>
      </div>`;
  }

  function dateFilterHtml(fromId, toId) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="${fromId}" class="filter-input" />
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="${toId}" class="filter-input" />
        </div>
      </div>`;
  }

  function renderReportsView(key) {
    const title = document.getElementById('repViewTitle');
    const filtersModalBox = document.getElementById('repFiltersModalBox');
    const mainBody = document.getElementById('repMainBody');
    if (!filtersModalBox || !mainBody) return;
    // Las referencias a contenedores se obtienen mediante ensureReportsBase()

    const T = {
      ventas: {
        title: 'Ventas por rango',
        filters: [
          { id: 'fecha', type: 'date-range', label: 'Rango de fechas' },
          { id: 'usuario', type: 'select', label: 'Usuario', options: ['Todos'] },
          { id: 'categoria', type: 'select', label: 'Categora', options: ['Todas'] }
        ],
        summary: [
          { icon: 'fa-receipt', label: 'Tickets', value: '' },
          { icon: 'fa-money-bill', label: 'Total', value: '' }
        ],
        table: { head: ['Fecha', 'Usuario', 'Categora', 'Subtotal', 'Descuento', 'Total'], rows: [] },
        charts: [{ title: 'Ventas por da', data: [{ label: 'Lun', value: 9 }, { label: 'Mar', value: 11 }, { label: 'Mi', value: 13 }, { label: 'Jue', value: 7 }, { label: 'Vie', value: 15 }] }]
      },
      inventario: {
        title: 'Inventario actual',
        filters: [
          { id: 'vista', type: 'select', label: 'Vista', options: ['Stock crtico', 'Entradas', 'Salidas'] },
          { id: 'fechaInv', type: 'date-range', label: 'Rango de fechas' }
        ],
        summary: [
          { icon: 'fa-boxes-stacked', label: 'Productos crticos', value: '' },
          { icon: 'fa-arrow-right-arrow-left', label: 'Movimientos', value: '' }
        ],
        table: { head: ['Cdigo', 'Producto', 'Disponible', 'Mnimo'], rows: [] },
        charts: [{ title: 'Movimientos recientes', data: [{ label: 'Entra', value: 25 }, { label: 'Sale', value: 19 }] }]
      },
      top: {
        title: 'Top 10 productos',
        filters: [
          { id: 'fechaTop', type: 'date-range', label: 'Rango de fechas' },
          { id: 'categoriaTop', type: 'select', label: 'Categora', options: ['Todas'] }
        ],
        summary: [
          { icon: 'fa-ranking-star', label: 'Productos', value: '10' },
          { icon: 'fa-box', label: 'Unidades totales', value: '' }
        ],
        table: { head: ['Producto', 'Unidades'], rows: [] },
        charts: [{ title: 'Participacin', data: [{ label: 'Prod A', value: 30 }, { label: 'Prod B', value: 20 }, { label: 'Prod C', value: 15 }] }]
      },
      ingresos: {
        title: 'Ingresos totales',
        filters: [
          { id: 'periodo', type: 'select', label: 'Periodo', options: ['Mensual', 'Anual'] },
          { id: 'fechaIng', type: 'date-range', label: 'Rango de fechas' }
        ],
        summary: [
          { icon: 'fa-calendar', label: 'Periodo', value: '' },
          { icon: 'fa-chart-line', label: 'Ingresos', value: '' }
        ],
        table: { head: ['Periodo', 'Ingresos'], rows: [] },
        charts: [{ title: 'Ingresos', data: [{ label: 'Ene', value: 32 }, { label: 'Feb', value: 45 }, { label: 'Mar', value: 41 }, { label: 'Abr', value: 52 }, { label: 'May', value: 58 }] }]
      }
    };

    const conf = T[key] || T.ventas;
    if (title) title.textContent = conf.title;
    // Filters en modal
    const modTitle = document.getElementById('reportFiltersTitle');
    if (modTitle) modTitle.innerHTML = `<i class="fas fa-filter"></i> Filtros de ${conf.title}`;
    filtersModalBox.innerHTML = buildReportFiltersModalContent(key, conf);
    // Restaurar botones globales por defecto; Inventario los ocultar
    const _openBtnAll = document.getElementById('repOpenFiltersBtn');
    const _topPdfAll = document.getElementById('repExportPdf');
    const _topXlsAll = document.getElementById('repExportXls');
    if (_openBtnAll) _openBtnAll.style.display = '';
    if (_topPdfAll) _topPdfAll.style.display = '';
    if (_topXlsAll) _topXlsAll.style.display = '';

    // Asegurar layout base para vistas no-inventario
    const base = ensureReportsBase();
    let summaryBox, chartsBox, head, body;
    if (base) { ({ summaryBox, chartsBox, head, body } = base); }

    // Layout especfico para Inventario: 2 tablas con acciones
    if (key === 'inventario') {
      const openBtn = document.getElementById('repOpenFiltersBtn');
      const topPdfBtn = document.getElementById('repExportPdf');
      const topXlsBtn = document.getElementById('repExportXls');
      if (openBtn) openBtn.style.display = 'none';
      if (topPdfBtn) topPdfBtn.style.display = 'none';
      if (topXlsBtn) topXlsBtn.style.display = 'none';
      mainBody.innerHTML = [
        '<div class="panel-subcard" style="margin-bottom:16px;">',
        '  <div class="card-header" style="align-items:center; gap:12px;">',
        '    <h3>Stock crtico</h3>',
        '    <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">',
        '      <button class="btn btn-secondary btn-sm" id="invCritFiltersBtn"><i class="fas fa-filter"></i> Filtros</button>',
        '      <button class="btn btn-primary btn-sm" id="invCritPdfBtn"><i class="fas fa-file-pdf"></i> PDF</button>',
        '      <button class="btn btn-primary btn-sm" id="invCritXlsBtn"><i class="fas fa-file-excel"></i> Excel</button>',
        '      <button class="btn btn-secondary btn-sm" id="invCritChartBtn"><i class="fas fa-chart-pie"></i> Gráfica</button>',
        '    </div>',
        '  </div>',
        '  <div class="table-responsive">',
        '    <table class="data-table">',
        '      <thead><tr id="invCritHead"></tr></thead>',
        '      <tbody id="invCritBody"></tbody>',
        '    </table>',
        '  </div>',
        '</div>',
        '<div class="panel-subcard">',
        '  <div class="card-header" style="align-items:center; gap:12px;">',
        '    <h3>Movimientos (entradas y salidas)</h3>',
        '    <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">',
        '      <button class="btn btn-secondary btn-sm" id="invMovFiltersBtn"><i class="fas fa-filter"></i> Filtros</button>',
        '      <button class="btn btn-primary btn-sm" id="invMovPdfBtn"><i class="fas fa-file-pdf"></i> PDF</button>',
        '      <button class="btn btn-primary btn-sm" id="invMovXlsBtn"><i class="fas fa-file-excel"></i> Excel</button>',
        '      <button class="btn btn-secondary btn-sm" id="invMovChartBtn"><i class="fas fa-chart-pie"></i> Gráfica</button>',
        '    </div>',
        '  </div>',
        '  <div class="table-responsive">',
        '    <table class="data-table">',
        '      <thead><tr id="invMovHead"></tr></thead>',
        '      <tbody id="invMovBody"></tbody>',
        '    </table>',
        '  </div>',
        '</div>'
      ].join('');

      const critHead = document.getElementById('invCritHead');
      const movHead = document.getElementById('invMovHead');
      if (critHead) critHead.innerHTML = ['Cdigo', 'Producto', 'Disponible', 'Mnimo'].map(h => `<th>${h}</th>`).join('');
      if (movHead) movHead.innerHTML = ['Fecha', 'Tipo', 'Producto', 'Cantidad'].map(h => `<th>${h}</th>`).join('');
      const critBody = document.getElementById('invCritBody');
      const movBody = document.getElementById('invMovBody');
      if (critBody) critBody.innerHTML = '<tr><td colspan="4"><p class="empty-state">Pendiente de backend.</p></td></tr>';
      if (movBody) movBody.innerHTML = '<tr><td colspan="4"><p class="empty-state">Pendiente de backend.</p></td></tr>';

      document.getElementById('invCritPdfBtn')?.addEventListener('click', () => showToast('Exportacin PDF (Stock crtico)'));
      document.getElementById('invCritXlsBtn')?.addEventListener('click', () => showToast('Exportacin Excel (Stock crtico)'));
      document.getElementById('invMovPdfBtn')?.addEventListener('click', () => showToast('Exportacin PDF (Movimientos)'));
      document.getElementById('invMovXlsBtn')?.addEventListener('click', () => showToast('Exportacin Excel (Movimientos)'));

      // Botones de 'Gráfica' — abren modal con pie chart de ejemplo
      document.getElementById('invCritChartBtn')?.addEventListener('click', () => {
        const data = [
          { label: 'En stock', value: 70 },
          { label: 'Crítico', value: 20 },
          { label: 'Agotado', value: 10 }
        ];
        openReportPieModal('Stock crítico', data);
      });
      document.getElementById('invMovChartBtn')?.addEventListener('click', () => {
        const data = [
          { label: 'Entradas', value: 60 },
          { label: 'Salidas', value: 40 }
        ];
        openReportPieModal('Movimientos de inventario', data);
      });

      document.getElementById('invCritFiltersBtn')?.addEventListener('click', () => {
        const modTitle2 = document.getElementById('reportFiltersTitle');
        if (modTitle2) modTitle2.innerHTML = '<i class="fas fa-filter"></i> Filtros de Stock crítico';
        const box2 = document.getElementById('repFiltersModalBox');
        if (box2) box2.innerHTML = `<div class="filter-form"><div class="form-row">${selectFilterHtml('Categoría crítica', 'fCritCategoria', ['Todas'])}<div></div></div></div>`;
        modalManager.open('reportFiltersModal');
      });
      document.getElementById('invMovFiltersBtn')?.addEventListener('click', () => {
        const modTitle3 = document.getElementById('reportFiltersTitle');
        if (modTitle3) modTitle3.innerHTML = '<i class="fas fa-filter"></i> Filtros de Movimientos';
        const box3 = document.getElementById('repFiltersModalBox');
        if (box3) box3.innerHTML = `
          <div class="filter-form">
            <div class="form-row">
              ${selectFilterHtml('Categoría crítica', 'fMovCategoria', ['Todas'])}
              ${selectFilterHtml('Tipo', 'fMovTipo', ['Todos', 'Entradas', 'Salidas'])}
            </div>
          </div>`;
        modalManager.open('reportFiltersModal');
      });
      // Paginación placeholders para ambas tablas
      ensureReportsInventarioPaginationUI();
      return;
    }
    const base2 = ensureReportsBase();
    if (!base2) return;
    ({ summaryBox, chartsBox, head, body } = base2);
    // Sin panel de Indicadores; omitimos buildSummary
    // Charts
    renderChartCollection(chartsBox, conf.charts);
    // Table + paginación
    head.innerHTML = conf.table.head.map(h => `<th>${h}</th>`).join('');
    ensureReportTablePaginationUI();
    window.repTablePager = { items: Array.isArray(conf.table.rows) ? conf.table.rows : [], page: 1, pageSize: Number(document.getElementById('repPageSize')?.value || 10) || 10, total: 0 };
    initReportTablePagination();
    renderReportTablePage();
  }

  function buildReportFiltersModalContent(key, conf) {
    const wrap = (inner) => `<div class="filter-form">${inner}</div>`;
    const dateGroup = (fromId, toId) => `
      <div class="form-row">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="${fromId}" class="filter-input" />
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="${toId}" class="filter-input" />
        </div>
      </div>`;
    const selectGroup = (label, id, options) => `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <select id="${id}" class="filter-select">${(options || []).map(o => `<option>${o}</option>`).join('')}</select>
      </div>`;

    switch (key) {
      case 'ventas':
        return wrap(`
          ${dateGroup('fVentasDesde', 'fVentasHasta')}
          <div class="form-row">
            ${selectGroup('Usuario', 'fVentasUsuario', ['Todos'])}
            ${selectGroup('Categora', 'fVentasCategoria', ['Todas'])}
          </div>
        `);
      case 'inventario':
        return wrap(`
          <div class="form-row">
            ${selectGroup('Vista', 'fInvVista', ['Stock crtico', 'Entradas', 'Salidas'])}
            <div></div>
          </div>
          ${dateGroup('fInvDesde', 'fInvHasta')}
        `);
      case 'top':
        return wrap(`
          ${dateGroup('fTopDesde', 'fTopHasta')}
          <div class="form-row">
            ${selectGroup('Categora', 'fTopCategoria', ['Todas'])}
            <div></div>
          </div>
        `);
      case 'ingresos':
        return wrap(`
          <div class="form-row">
            ${selectGroup('Periodo', 'fIngPeriodo', ['Mensual', 'Anual'])}
            <div></div>
          </div>
          ${dateGroup('fIngDesde', 'fIngHasta')}
        `);
      default:
        return wrap('');
    }
  }

  // ============================================================================
  // SECCIÓN: MÓDULO DE INVENTARIO (LÍNEAS 1902-2114)
  // ============================================================================
  // CLEAR: ⚠️ ACTUALIZACIÓN 2025-11-01 - Módulo completo de inventario - 212 líneas
  // 
  // ✅ BASE DE DATOS: Tablas com.tbInventario y com.tbStock YA EXISTEN
  //    
  //    com.tbStock (existencias actuales materializadas):
  //    - IdProducto INT PRIMARY KEY FK
  //    - Existencia INT NOT NULL DEFAULT 0
  //    - FechaActualizacion DATETIME2(0)
  //    Actualización automática con trigger trg_ActualizarStock_Inventario
  //    
  //    com.tbInventario (movimientos de inventario):
  //    - IdMovimiento BIGINT IDENTITY(1,1) PRIMARY KEY
  //    - IdProducto INT NOT NULL FK
  //    - Cantidad INT NOT NULL
  //    - Tipo VARCHAR(20) -- 'ENTRADA', 'SALIDA', 'VENTA', 'COMPRA', 'AJUSTE'
  //    - Usuario VARCHAR(50) NOT NULL
  //    - FechaMovimiento DATETIME2(0)
  //    - Observacion VARCHAR(500)
  //    Índice: IX_tbInventario_IdProducto_Fecha
  //    
  //    Stored Procedure: com.sp_ReporteInventarioActual
  // 
  // ❌ BACKEND: Endpoints NO implementados
  //    Falta crear:
  //    1. src/routes/inventario.routes.js
  //    2. src/controllers/inventario.controller.js
  //    3. Endpoints necesarios:
  //       - GET /api/inventario (listar stock actual)
  //       - GET /api/inventario/movimientos (historial con filtros)
  //       - POST /api/inventario/movimiento (registrar entrada/salida)
  //       - GET /api/inventario/reporte (ejecutar sp_ReporteInventarioActual)
  // 
  // ❌ FRONTEND: Mock data sin conexión
  //    Eliminar DASHBOARD_DATA.inventory y conectar con API
  // 
  // Funciones afectadas:
  // - renderInventario() - Renderizado principal con stats y timeline
  // - buildInventoryTable() - Tabla de productos críticos
  // - initInventoryModule() - Inicialización del módulo
  // ============================================================================

  async function renderInventario() {
    // Cargar datos desde API
    const result = await loadInventarioData();
    const data = result.data;
    
    if (!data) return;
    
    document.getElementById('inventorySubtitle').textContent = data.subtitle || '';
    buildStats(document.getElementById('inventoryStats'), data.stats);
    buildTimeline(document.getElementById('inventoryTimeline'), data.timeline);
    buildAlerts(document.getElementById('inventoryAlerts'), data.alerts);
    buildInventoryTable(document.querySelector('#inventoryTable tbody'), data.critical);
    ensureInventoryMovementsPaginationUI();
    
    // Configurar el modal de entrada (usa el modal del HTML)
    setupInventoryEntryModal();
    
    // Configurar el botón de nueva entrada
    const newEntryBtn = document.getElementById('inventoryNewEntryBtn');
    if (newEntryBtn) {
      newEntryBtn.onclick = () => {
        // Limpiar y abrir modal
        const form = document.getElementById('inventoryEntryForm');
        if (form) form.reset();
        const prodInput = document.getElementById('invEntryProdInput');
        if (prodInput) prodInput.removeAttribute('data-product-id');
        setInvEntryMessage('', '');
        modalManager.open('inventoryEntryModal');
      };
    }
    
    // Cargar movimientos de inventario
    await renderInventoryMovements();
  }

  // Garantiza que los controles de paginación de la bitácora existan en el DOM
  function ensureInventoryMovementsPaginationUI() {
    if (document.getElementById('inventoryMovementsPagination')) return;
    const table = document.getElementById('inventoryMovementsTable');
    if (!table || !table.parentElement) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-pagination';
    wrapper.id = 'inventoryMovementsPagination';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '12px';
    wrapper.style.justifyContent = 'space-between';
    wrapper.style.marginTop = '12px';
    wrapper.style.flexWrap = 'wrap';
    wrapper.innerHTML = `
      <div class="pagination-left" style="display:flex; align-items:center; gap:10px;">
        <label for="invMovPageSize" style="font-size:0.9rem; color:var(--text-muted, #64748b);">Mostrar</label>
        <select id="invMovPageSize" class="filter-select" style="min-width:80px;">
          <option value="5">5</option>
          <option value="10" selected>10</option>
          <option value="20">20</option>
        </select>
        <span style="font-size:0.9rem; color:var(--text-muted, #64748b);">por página</span>
      </div>
      <div class="pagination-right" style="display:flex; align-items:center; gap:10px;">
        <span id="invMovPageInfo" style="font-size:0.9rem; color:var(--text-muted, #64748b);">Mostrando 0–0 de 0</span>
        <div class="pagination-buttons" style="display:flex; gap:8px;">
          <button type="button" class="btn btn-secondary btn-sm" id="invMovPrev">
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="invMovNext">
            Siguiente <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
    table.parentElement.insertAdjacentElement('afterend', wrapper);
  }

  // Estado simple en memoria (solo UI)
  window.inventoryMovements = window.inventoryMovements || [];

  // Función para inicializar paginación de movimientos
  function initInventoryMovementsPagination() {
    const pageSizeSelect = document.getElementById('invMovPageSize');
    const prevBtn = document.getElementById('invMovPrev');
    const nextBtn = document.getElementById('invMovNext');

    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', () => {
        invMovPager.pageSize = parseInt(pageSizeSelect.value) || 10;
        invMovPager.page = 1;
        renderInventoryMovements();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (invMovPager.page > 1) {
          invMovPager.page--;
          renderInventoryMovements();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const total = window.inventoryMovements?.length || 0;
        const maxPage = Math.ceil(total / (invMovPager.pageSize || 10));
        if (invMovPager.page < maxPage) {
          invMovPager.page++;
          renderInventoryMovements();
        }
      });
    }
  }

  async function renderInventoryMovements() {
    const tbody = document.querySelector('#inventoryMovementsTable tbody');
    const infoEl = document.getElementById('invMovPageInfo');
    const prevBtn = document.getElementById('invMovPrev');
    const nextBtn = document.getElementById('invMovNext');
    const pageSizeSelect = document.getElementById('invMovPageSize');
    if (!tbody) return;
    
    // Cargar movimientos desde API
    const result = await loadInventoryMovements(invMovPager.pageSize || 100);
    const list = result.movimientos || [];
    
    // Guardar en memoria para paginación local (temporal)
    window.inventoryMovements = list;

    invMovPager.total = list.length;
    if (pageSizeSelect) {
      invMovPager.pageSize = Number(pageSizeSelect.value || invMovPager.pageSize || 10) || 10;
    }

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><p class="empty-state">Sin movimientos registrados.</p></td></tr>';
      if (infoEl) infoEl.textContent = 'Mostrando 0–0 de 0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    const maxPage = Math.max(1, Math.ceil(invMovPager.total / (invMovPager.pageSize || 10)));
    const safePage = Math.min(Math.max(1, invMovPager.page || 1), maxPage);
    if (safePage !== invMovPager.page) invMovPager.page = safePage;
    const start = (safePage - 1) * (invMovPager.pageSize || 10);
    const end = Math.min(start + (invMovPager.pageSize || 10), invMovPager.total);
    const slice = list.slice(start, end);

    tbody.innerHTML = slice.map(m => `
      <tr>
        <td>${formatDateTimeSafe(m.date)}</td>
        <td><span class="tag">${m.type}</span></td>
        <td>${m.product}</td>
        <td>${m.qty}</td>
        <td>${m.ref || '-'}</td>
      </tr>
    `).join('');

    if (infoEl) infoEl.textContent = `Mostrando ${start + 1}–${end} de ${invMovPager.total}`;
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= maxPage;
  }

  function initInventoryMovementsPagination() {
    const pageSizeSelect = document.getElementById('invMovPageSize');
    const prevBtn = document.getElementById('invMovPrev');
    const nextBtn = document.getElementById('invMovNext');
    if (pageSizeSelect) {
      invMovPager.pageSize = Number(pageSizeSelect.value || 10) || 10;
      pageSizeSelect.onchange = () => {
        invMovPager.pageSize = Number(pageSizeSelect.value) || 10;
        invMovPager.page = 1;
        renderInventoryMovements();
      };
    }
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (invMovPager.page > 1) {
          invMovPager.page -= 1;
          renderInventoryMovements();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const maxPage = Math.max(1, Math.ceil((invMovPager.total || 0) / (invMovPager.pageSize || 10)));
        if (invMovPager.page < maxPage) {
          invMovPager.page += 1;
          renderInventoryMovements();
        }
      };
    }
  }

  function formatDateTimeSafe(d) { try { const t = new Date(d); return isNaN(t) ? '' : t.toLocaleString('es-ES'); } catch { return '' } }

  // ============================================================================
  // SECCIÓN: MÓDULO DE VENTAS (LÍNEAS 2161-2385)
  // ============================================================================
  // CLEAR: ⚠️ ACTUALIZACIÓN 2025-11-01 - Módulo completo de ventas - 224 líneas
  // 
  // ✅ BASE DE DATOS: Tablas com.tbVenta y com.tbDetalleVenta YA EXISTEN
  //    
  //    com.tbVenta (cabecera de ventas):
  //    - IdVenta BIGINT IDENTITY(1,1) PRIMARY KEY
  //    - Usuario VARCHAR(50) NOT NULL
  //    - FechaVenta DATETIME2(0)
  //    - Subtotal DECIMAL(12,2)
  //    - DescuentoTotal DECIMAL(12,2)
  //    - Total DECIMAL(12,2)
  //    - Observacion VARCHAR(500)
  //    Índice: IX_tbVenta_FechaVenta
  //    
  //    com.tbDetalleVenta (líneas de la venta):
  //    - IdDetalle BIGINT IDENTITY(1,1) PRIMARY KEY
  //    - IdVenta BIGINT NOT NULL FK
  //    - IdProducto INT NOT NULL FK
  //    - Cantidad INT NOT NULL
  //    - PrecioUnitario DECIMAL(10,2)
  //    - Descuento DECIMAL(10,2)
  //    Trigger: trg_RegistrarVenta_DescontarStock (descuenta inventario automáticamente)
  //    
  //    Stored Procedures: 
  //    - com.sp_ReporteVentasPorFecha
  //    - com.sp_ReporteProductosMasVendidos
  //    - com.sp_ReporteIngresosTotales
  // 
  // ❌ BACKEND: Endpoints NO implementados
  //    Falta crear:
  //    1. src/routes/ventas.routes.js
  //    2. src/controllers/ventas.controller.js
  //    3. Endpoints necesarios:
  //       - GET /api/ventas (listar con paginación y filtros)
  //       - GET /api/ventas/:id (obtener una con detalle)
  //       - POST /api/ventas (crear venta con items - trigger descuenta stock automáticamente)
  //       - GET /api/ventas/reportes (ejecutar sp_ReporteVentasPorFecha)
  // 
  // ❌ FRONTEND: Mock data sin conexión
  //    Eliminar DASHBOARD_DATA.sales y conectar con API
  //    Implementar sistema POS completo
  // 
  // Funciones afectadas:
  // - renderVentas() - Renderizado principal
  // - setupPOS() - Sistema de punto de venta con carrito
  // - handlePOSAddProduct() - Agregar productos al carrito
  // - handlePOSCheckout() - Procesar venta
  // ============================================================================

  function renderVentas() {
    // Temporalmente usando DASHBOARD_DATA hasta completar refactorización
    const data = DASHBOARD_DATA[role]?.ventas;
    
    const section = document.getElementById('ventasSection');
    if (!section) return;
    // Si existe la estructura est1tica (tabla #salesTable), hidratar sin reemplazar todo
    const staticBody = document.querySelector('#salesTable tbody');
    if (staticBody) {
      const subEl = document.getElementById('salesSubtitle');
      if (subEl) subEl.textContent = (data && data.subtitle) ? data.subtitle : '';
      const rows = ((data && data.log) || []).map(item => `
        <tr>
          <td>${escapeHtml(item.date || '')}</td>
          <td>${escapeHtml(item.user || '')}</td>
          <td>${escapeHtml(item.category || '')}</td>
          <td>${escapeHtml(item.subtotal || '')}</td>
          <td>${escapeHtml(item.discount || '')}</td>
          <td>${escapeHtml(item.total || '')}</td>
        </tr>
      `).join('');
      staticBody.innerHTML = rows;
      return;
    }

    const subtitle = (data && data.subtitle) ? data.subtitle : 'Facturación y registro de ventas';
    section.innerHTML = [
      '<div class="section-header">',
      '  <h1>Seguimiento de Ventas</h1>',
      `  <p id="salesSubtitle">${escapeHtml(subtitle)}</p>`,
      '</div>',
      '<div class="tabs-container">',
      '  <div class="tabs-nav">',
      '    <button class="tab-btn active" id="salesTabBtn"><i class="fas fa-cash-register"></i> Facturación / Ventas</button>',
      '    <button class="tab-btn" id="salesLogTabBtn"><i class="fas fa-clipboard-list"></i> Bitácora de ventas</button>',
      '  </div>',
      '</div>',
      '<div id="salesPOSContent" class="bitacora-content active">',
      '  <div class="panel-card">',
      '    <div class="card-header"><h3><i class="fas fa-file-invoice"></i> Factura</h3></div>',
      '    <div class="panel-body" style="padding:16px;">',
      '      <div class="form-row">',
      '        <div class="form-group" style="position:relative;">',
      '          <label for="posProductInput">Producto (código o nombre)</label>',
      '          <input type="text" id="posProductInput" placeholder="Ingresa código o nombre..." autocomplete="off" style="width:100%; padding:12px 16px; border:1px solid #e2e8f0; border-radius:8px;">',
      '          <div id="posProductResults" style="position:absolute; left:0; right:0; top:70px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 10px 24px rgba(0,0,0,0.08); display:none; z-index:50; overflow:hidden;"></div>',
      '        </div>',
      '        <div class="form-group">',
      '          <label for="posQtyInput">Cantidad</label>',
      '          <input type="number" id="posQtyInput" min="1" title="Presiona Enter para agregar">',
      '          <small style="display:block; color:#64748b;">Presiona Enter para agregar</small>',
      '        </div>',
      '      </div>',
      '      <div class="form-row">',
      '        <div class="form-group">',
      '          <label for="salesCustomer">Cliente (opcional)</label>',
      '          <input type="text" id="salesCustomer" placeholder="Nombre o NIT">',
      '        </div>',
      '        <div class="form-group">',
      '          <label for="salesPayment">Forma de pago</label>',
      '          <select id="salesPayment" class="filter-select">',
      '            <option>Efectivo</option>',
      '            <option>Tarjeta</option>',
      '            <option>Transferencia</option>',
      '          </select>',
      '        </div>',
      '      </div>',
      '      <div class="table-responsive">',
      '        <table class="data-table" id="salesCartTable">',
      '          <thead><tr><th>Código</th><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th>Acciones</th></tr></thead>',
      '          <tbody id="salesCartBody"></tbody>',
      '        </table>',
      '      </div>',
      '      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:12px; flex-wrap:wrap;">',
      '        <div class="message-container" id="salesPOSMessage"></div>',
      '        <div style="display:flex; align-items:center; gap:12px;">',
      '          <label for="salesDiscount" style="margin:0;">Descuento</label>',
      '          <input type="number" id="salesDiscount" min="0" step="0.01" value="0" style="width:120px;">',
      '          <strong>Subtotal: <span id="salesTotal">0.00</span></strong>',
      '          <strong>Total: <span id="salesNetTotal">0.00</span></strong>',
      '          <button type="button" class="btn btn-secondary btn-sm" id="posClearBtn">Vaciar</button>',
      '          <button type="button" class="btn btn-primary" id="posCheckoutBtn"><i class="fas fa-check"></i> Finalizar venta</button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div id="salesLogContent" class="bitacora-content">',
      '  <div class="panel-card">',
      '    <div class="card-header"><h3>Bitácora de ventas</h3></div>',
      '    <div class="table-responsive">',
      '      <table class="data-table" id="salesTable">',
      '        <thead><tr><th>Fecha</th><th>Usuario</th><th>Categoría</th><th>Subtotal</th><th>Descuento</th><th>Total</th></tr></thead>',
      '        <tbody></tbody>',
      '      </table>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    initSalesModule();
  }

  function initSalesModule() {
    setupSalesTabs();
    setupPOS();
    renderSalesLog();
  }

  function setupSalesTabs() {
    const btnPOS = document.getElementById('salesTabBtn');
    const btnLog = document.getElementById('salesLogTabBtn');
    const pos = document.getElementById('salesPOSContent');
    const log = document.getElementById('salesLogContent');
    if (!btnPOS || !btnLog || !pos || !log) return;
    const activate = target => {
      const map = { pos, log };
      const btns = { pos: btnPOS, log: btnLog };
      Object.entries(map).forEach(([k, el]) => el.classList.toggle('active', (k === target)));
      Object.entries(btns).forEach(([k, b]) => b.classList.toggle('active', (k === target)));
    };
    btnPOS.onclick = () => activate('pos');
    btnLog.onclick = () => { activate('log'); renderSalesLog(); };
  }

  function setupPOS() {
    const products = (DASHBOARD_DATA[role]?.productos?.list || DASHBOARD_DATA.admin?.productos?.list || []).map(p => ({ code: p.code, name: p.name }));
    const input = document.getElementById('posProductInput');
    const box = document.getElementById('posProductResults');
    invCreateAutocomplete(input, box, products, (prod) => {
      input.value = prod.code + ' | ' + prod.name;
      box.style.display = 'none';
      const qtyEl = document.getElementById('posQtyInput');
      if (qtyEl) qtyEl.focus();
    }, { showOnFocus: false });

    const cart = [];
    function renderCart() {
      const tbody = document.getElementById('salesCartBody');
      if (!tbody) return;
      if (!cart.length) {
        tbody.innerHTML = '<tr><td colspan="6"><p class="empty-state">No hay productos en la venta.</p></td></tr>';
        updateTotals();
        return;
      }
      tbody.innerHTML = cart.map((it, idx) => {
        const subtotal = (it.price || 0) * it.qty;
        return `<tr>
          <td>${it.code}</td>
          <td>${it.name}</td>
          <td><input type=\"number\" class=\"cart-qty\" data-index=\"${idx}\" min=\"1\" value=\"${it.qty}\" style=\"width:80px; padding:6px 8px; border:1px solid #e2e8f0; border-radius:6px;\"></td>
          <td></td>
          <td>${subtotal.toFixed(2)}</td>
          <td><button type=\"button\" class=\"btn btn-secondary btn-sm\" data-remove=\"${idx}\"><i class=\"fas fa-trash\"></i></button></td>
        </tr>`;
      }).join('');
      tbody.querySelectorAll('button[data-remove]')?.forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-remove'), 10);
          if (!isNaN(i)) { cart.splice(i, 1); renderCart(); }
        });
      });
      // Editar cantidad en lnea
      tbody.querySelectorAll('input.cart-qty')?.forEach(inp => {
        inp.addEventListener('change', () => {
          const i = parseInt(inp.getAttribute('data-index'), 10);
          let q = parseInt(inp.value || '1', 10);
          if (!q || q < 1) q = 1;
          if (!isNaN(i) && cart[i]) { cart[i].qty = q; }
          renderCart();
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
        });
      });
      updateTotals();
    }

    function sumSubtotal() { return cart.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0); }
    function updateTotals() {
      const subtotal = sumSubtotal();
      const disc = parseFloat(document.getElementById('salesDiscount')?.value || '0') || 0;
      const total = Math.max(0, subtotal - Math.max(0, disc));
      const totalEl = document.getElementById('salesTotal');
      const netEl = document.getElementById('salesNetTotal');
      if (totalEl) totalEl.textContent = subtotal.toFixed(2);
      if (netEl) netEl.textContent = total.toFixed(2);
    }

    document.getElementById('salesDiscount')?.addEventListener('input', updateTotals);

    function addFromQtyEnter() {
      const val = (input?.value || '').trim();
      const qty = parseInt(document.getElementById('posQtyInput')?.value || '0', 10);
      if (!val) return invSetMessage('salesPOSMessage', 'error', 'Selecciona un producto.');
      if (!qty || qty <= 0) return invSetMessage('salesPOSMessage', 'error', 'Ingresa una cantidad vlida.');
      const code = val.split('|')[0].trim();
      const found = products.find(p => p.code === code) || { code, name: val.replace(/^.*\|/, '').trim() };
      cart.push({ code: found.code, name: found.name, qty, price: 0 });
      invClearMessage('salesPOSMessage');
      renderCart();
      const q = document.getElementById('posQtyInput'); if (q) q.value = '';
      input.value = '';
    }
    document.getElementById('posQtyInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addFromQtyEnter(); }
    });

    document.getElementById('posClearBtn')?.addEventListener('click', () => { cart.splice(0, cart.length); renderCart(); invClearMessage('salesPOSMessage'); });

    document.getElementById('posCheckoutBtn')?.addEventListener('click', () => {
      if (!cart.length) return invSetMessage('salesPOSMessage', 'error', 'Agrega productos a la venta.');
      // Backend registrar la venta; aqu solo UI
      cart.splice(0, cart.length);
      renderCart();
      invSetMessage('salesPOSMessage', 'success', 'Venta realizada.');
      try { showToast('Venta realizada', 'success'); } catch { }
    });

    // Render inicial del carrito
    renderCart();
  }

  function renderSalesLog() {
    const tbody = document.querySelector('#salesTable tbody');
    if (!tbody) return;
    // Backend poblar esta tabla; placeholder de diseo
    tbody.innerHTML = '<tr><td colspan="6"><p class="empty-state">Conectado al backend prximamente.</p></td></tr>';
  }

  // ============================================================================
  // SECCIÓN: MÓDULO DE PRODUCTOS (LÍNEAS 2378-3567)
  // ============================================================================
  // CLEAR: ⚠️ ACTUALIZACIÓN 2025-11-01 - Módulo completo de productos - 1189 líneas
  // 
  // ✅ BASE DE DATOS: Tabla com.tbProducto YA EXISTE en definitivo.sql
  //    Estructura:
  //    - IdProducto INT IDENTITY(1,1) PRIMARY KEY
  //    - Codigo VARCHAR(30) NOT NULL UNIQUE
  //    - Nombre VARCHAR(120) NOT NULL
  //    - Descripcion VARCHAR(400) NULL
  //    - PrecioCosto DECIMAL(10,2) NOT NULL
  //    - PrecioVenta DECIMAL(10,2) NOT NULL
  //    - Descuento DECIMAL(6,2) NOT NULL DEFAULT 0
  //    - Estado BIT NOT NULL DEFAULT 1
  //    - FechaRegistro DATETIME2(0) NOT NULL
  //    
  //    Relación N:N: com.tbProductoCategoria (IdProducto, IdCategoria)
  //    Índices: IX_tbProducto_Nombre, IX_tbProducto_Codigo UNIQUE
  // 
  // ❌ BACKEND: Endpoints NO implementados
  //    Falta crear:
  //    1. src/routes/productos.routes.js
  //    2. src/controllers/productos.controller.js
  //    3. Endpoints necesarios:
  //       - GET /api/productos (listar con paginación y filtros)
  //       - GET /api/productos/:id (obtener uno con categorías)
  //       - POST /api/productos (crear + asignar categorías)
  //       - PUT /api/productos/:id (actualizar + categorías)
  //       - DELETE /api/productos/:id (eliminar/desactivar)
  //       - POST /api/productos/:id/categorias (asignar categoría)
  //       - DELETE /api/productos/:id/categorias/:idCategoria (quitar)
  // 
  // ❌ FRONTEND: Mock data sin conexión
  //    Eliminar DASHBOARD_DATA.productos y conectar con API
  // 
  // Funciones principales afectadas:
  // - renderProductos() - Renderizado principal
  // - setupProductTabs() - Sistema de pestañas
  // - openProductForm() - Formulario extenso de creación/edición
  // - refreshProductTable() - Tabla con paginación
  // - handleAddProductCategory() - Gestión de categorías múltiples
  // - handleRemoveProductCategory() - Eliminar categorías asignadas
  // + 20+ funciones auxiliares para manejo de UI y datos
  // ============================================================================

  function renderProductos() {
    // Temporalmente usando DASHBOARD_DATA hasta completar refactorización
    const data = DASHBOARD_DATA[role]?.productos;
    if (!data) return;
    buildStats(document.getElementById('productStats'), data.stats);
    // La tabla se manejará con paginación desde refreshProductTable()

    // Inicializar tabs de Productos/Asociaciones
    setupProductTabs();
    buildAssociationUI(data);
    initProductsFilters();
    initProductsPagination();
    refreshProductTable();
  }

  function initProductsFilters() {
    const btnOpen = document.getElementById('productFiltersBtn');
    const selCat = document.getElementById('productFilterCategory');
    const selStatus = document.getElementById('productFilterStatus');
    const btnClear = document.getElementById('productFilterClear');
    const btnApply = document.getElementById('productFilterApply');

    function populateCategoryOptions() {
      const cats = (DASHBOARD_DATA.admin?.categorias?.list || []).map(c => c.name);
      if (!selCat) return;
      const current = selCat.value || '';
      selCat.innerHTML = '<option value="">Todas</option>' + cats.map(n => `<option value="${n}">${n}</option>`).join('');
      // restaurar seleccin previa si existe
      const opt = Array.from(selCat.options).find(o => o.value === current);
      if (opt) selCat.value = current;
    }

    btnOpen?.addEventListener('click', () => {
      populateCategoryOptions();
      modalManager.open('productFiltersModal');
    });

    btnClear?.addEventListener('click', () => {
      if (selCat) selCat.selectedIndex = 0;
      if (selStatus) selStatus.selectedIndex = 0;
      productsPager.page = 1;
      refreshProductTable();
      modalManager.close('productFiltersModal');
    });

    btnApply?.addEventListener('click', () => {
      productsPager.page = 1;
      refreshProductTable();
      modalManager.close('productFiltersModal');
    });
  }

  function setupProductTabs() {
    const btnProducts = document.getElementById('productsTabBtn');
    const btnAssoc = document.getElementById('associationTabBtn');
    const manage = document.getElementById('productsManageContent');
    const assoc = document.getElementById('productsAssocContent');
    if (!btnProducts || !btnAssoc || !manage || !assoc) return;

    const activate = target => {
      const isProducts = target === 'products';
      btnProducts.classList.toggle('active', isProducts);
      btnAssoc.classList.toggle('active', !isProducts);
      manage.classList.toggle('active', isProducts);
      assoc.classList.toggle('active', !isProducts);
    };

    btnProducts.onclick = () => activate('products');
    btnAssoc.onclick = () => activate('assoc');
  }

  function buildAssociationUI(data) {
    const productInput = document.getElementById('assocProductInput');
    const resultsBox = document.getElementById('assocProductResults');
    const grid = document.getElementById('assocCategoryGrid');
    const summary = document.getElementById('assocSummary');
    const message = document.getElementById('assocMessage');
    const search = document.getElementById('assocCategorySearch');
    const btnClear = document.getElementById('assocCatClear');
    const btnAll = document.getElementById('assocCatSelectAll');
    const btnPrev = document.getElementById('assocCatPrev');
    const btnNext = document.getElementById('assocCatNext');
    const pageInfo = document.getElementById('assocCatPageInfo');
    const saveBtn = document.getElementById('assocSaveBtn');
    if (!productInput || !grid) return;

    // Poblar productos (estticos)
    const products = (data?.list || []).map(p => ({ code: p.code, name: p.name, categories: p.categories || [] }));
    let currentProduct = products[0] || { code: '', name: '', categories: [] };
    // Prefill input para dar pista
    if (currentProduct.code) {
      productInput.value = currentProduct.code + '  ' + currentProduct.name;
    }

    // Poblar grid de categoras como chips seleccionables con paginacin
    const allCategories = (DASHBOARD_DATA.admin?.categorias?.list || []).map(c => c.name);
    let filtered = allCategories.slice();
    let page = 1;
    const pageSize = 10;
    let selectedSet = new Set();

    const renderPaged = () => {
      // lmites
      const total = filtered.length;
      const maxPage = Math.max(1, Math.ceil(total / pageSize));
      if (page > maxPage) page = maxPage;
      if (page < 1) page = 1;
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, total);

      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
      grid.style.gap = '8px';
      grid.innerHTML = filtered.slice(start, end).map(name => {
        const sel = selectedSet.has(name.toLowerCase());
        return `
          <button type="button" class="cat-chip${sel ? ' selected' : ''}" data-cat-name="${name}"
            style="display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; border:1px solid #e2e8f0; background:${sel ? '#dbeafe' : '#f8fafc'}; color:${sel ? '#1e3a8a' : '#334155'}; font-size:13px; cursor:pointer;">
            <i class="fas fa-check" style="visibility:${sel ? 'visible' : 'hidden'};"></i>
            <span>${name}</span>
          </button>
        `;
      }).join('');

      if (pageInfo) pageInfo.textContent = `Mostrando ${total ? start + 1 : 0}${end} de ${total}`;
      if (btnPrev) btnPrev.disabled = page <= 1;
      if (btnNext) btnNext.disabled = page >= maxPage;
    };

    const renderGrid = (checkedSet = new Set()) => {
      selectedSet = checkedSet;
      renderPaged();

      grid.onclick = e => {
        const chip = e.target.closest('.cat-chip');
        if (!chip) return;
        const name = chip.getAttribute('data-cat-name');
        const k = name.toLowerCase();
        const selected = chip.classList.toggle('selected');
        const icon = chip.querySelector('i');
        if (icon) icon.style.visibility = selected ? 'visible' : 'hidden';
        chip.style.background = selected ? '#dbeafe' : '#f8fafc';
        chip.style.color = selected ? '#1e3a8a' : '#334155';
        chip.style.borderColor = selected ? '#bfdbfe' : '#e2e8f0';
        if (selected) selectedSet.add(k); else selectedSet.delete(k);
        const code = currentProduct?.code || '';
        if (summary) summary.value = code + ' | ' + selectedSet.size + ' categora(s) seleccionada(s)';
      };
    };

    const updateSummary = (prod, set) => {
      if (summary) {
        summary.value = prod.code + ' | ' + set.size + ' categora(s) seleccionada(s)';
      }
      if (message) {
        message.className = 'message-container';
        message.innerHTML = '';
      }
    };

    const refreshForProduct = code => {
      const prod = products.find(p => p.code === code) || products[0];
      const set = new Set((prod.categories || []).map(x => x.toString().toLowerCase()));
      renderGrid(set);
      updateSummary(prod, set);
      // Controles
      if (search) {
        search.value = '';
        search.oninput = () => {
          const term = (search.value || '').toLowerCase();
          filtered = allCategories.filter(n => n.toLowerCase().includes(term));
          page = 1;
          renderPaged();
        };
      }
      if (btnClear) btnClear.onclick = () => {
        selectedSet.clear();
        renderPaged();
        updateSummary(prod, selectedSet);
      };
      if (btnAll) btnAll.onclick = () => {
        selectedSet = new Set(allCategories.map(n => n.toLowerCase()));
        renderPaged();
        updateSummary(prod, selectedSet);
      };
      if (btnPrev) btnPrev.onclick = () => { page = Math.max(1, page - 1); renderPaged(); };
      if (btnNext) btnNext.onclick = () => {
        const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = Math.min(maxPage, page + 1);
        renderPaged();
      };
    };

    // Autocompletado de producto (por cdigo o nombre)
    function renderProductResults(term) {
      if (!resultsBox) return;
      const t = (term || '').toLowerCase().trim();
      let matches = products;
      if (t) {
        matches = products.filter(p => p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t));
      }
      matches = matches.slice(0, 8);
      if (matches.length === 0) {
        resultsBox.style.display = 'none';
        resultsBox.innerHTML = '';
        return;
      }
      resultsBox.innerHTML = matches.map(p => `
        <div class="result-item" data-code="${p.code}" style="padding:10px 12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
          <span>${p.code}  ${p.name}</span>
          <i class="fas fa-arrow-turn-down"></i>
        </div>
      `).join('');
      resultsBox.style.display = 'block';
    }

    productInput.addEventListener('input', () => {
      renderProductResults(productInput.value);
    });
    productInput.addEventListener('focus', () => {
      renderProductResults(productInput.value);
    });
    document.addEventListener('click', (e) => {
      if (!resultsBox.contains(e.target) && e.target !== productInput) {
        resultsBox.style.display = 'none';
      }
    });
    resultsBox.addEventListener('click', (e) => {
      const item = e.target.closest('.result-item');
      if (!item) return;
      const code = item.getAttribute('data-code');
      const prod = products.find(p => p.code === code);
      if (!prod) return;
      currentProduct = prod;
      productInput.value = prod.code + ' | ' + prod.name;
      resultsBox.style.display = 'none';
      refreshForProduct(prod.code);
    });

    // Inicializar con primer producto
    if (currentProduct.code) {
      refreshForProduct(currentProduct.code);
    }

    // Guardar asociacin (solo UI)
    saveBtn?.addEventListener('click', () => {
      saveBtn.disabled = true;
      saveBtn.setAttribute('data-loading', 'true');
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Guardando...';
      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.removeAttribute('data-loading');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar asociacin';
        showToast('Asociacin actualizada correctamente.', 'success');
      }, 800);
    });
  }

  // ============================================================================
  // FUNCIÓN: loadCategorias() - Carga categorías desde API
  // ============================================================================
  async function loadCategorias() {
    try {
      const response = await apiRequest(API_ENDPOINTS.categorias);
      
      // El backend devuelve { success: true, data: [...] }
      if (response.success && Array.isArray(response.data)) {
        categoryState = response.data.map((item, index) => normalizeCategory(item, index));
        return { success: true, categorias: categoryState };
      }
      
      throw new Error(response.message || 'Error al cargar categorías');
    } catch (error) {
      console.error('Error cargando categorías:', error);
      showToast(error.message || 'Error al cargar categorías', 'error');
      categoryState = [];
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // FUNCIÓN: loadInventarioData() - Carga datos de inventario desde API
  // ============================================================================
  async function loadInventarioData() {
    try {
      // Cargar stock desde API
      const stockResponse = await apiRequest(API_ENDPOINTS.inventarioStock);
      
      if (!stockResponse.success) {
        throw new Error(stockResponse.message || 'Error al cargar stock');
      }
      
      const stockData = stockResponse.data || [];
      
      // Normalizar datos para la UI
      const inventarioData = {
        subtitle: 'Stock actualizado desde la base de datos',
        stats: [
          { 
            label: 'Productos en stock', 
            value: stockData.length.toString(), 
            trend: 'Total de productos', 
            icon: 'fa-cubes', 
            tone: 'success' 
          },
          { 
            label: 'Stock crítico', 
            value: stockData.filter(p => p.Existencia <= 10).length.toString(), 
            trend: 'Requieren atención', 
            icon: 'fa-exclamation-triangle', 
            tone: 'warning' 
          }
        ],
        timeline: [],
        alerts: stockData
          .filter(p => p.Existencia <= 10)
          .slice(0, 3)
          .map(p => ({
            type: 'warning',
            title: p.Nombre,
            description: `Stock actual ${p.Existencia} unidades`
          })),
        critical: stockData
          .filter(p => p.Existencia <= 10)
          .map(p => ({
            code: p.Codigo || `PROD-${p.IdProducto}`,
            product: p.Nombre,
            categories: [], // Se puede ampliar si hay relación con categorías
            available: p.Existencia,
            minimum: 10
          }))
      };
      
      return { success: true, data: inventarioData };
    } catch (error) {
      console.error('Error cargando inventario:', error);
      showToast(error.message || 'Error al cargar inventario', 'error');
      return { 
        success: false, 
        error: error.message,
        data: {
          subtitle: 'Error al cargar datos',
          stats: [],
          timeline: [],
          alerts: [],
          critical: []
        }
      };
    }
  }

  // ============================================================================
  // FUNCIÓN: loadInventoryMovements() - Carga movimientos desde API
  // ============================================================================
  async function loadInventoryMovements(limite = 100) {
    try {
      const response = await apiRequest(`${API_ENDPOINTS.inventarioMovimientos}?limite=${limite}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Error al cargar movimientos');
      }
      
      // Normalizar datos de la API al formato de la UI
      const movimientos = (response.data || []).map(m => ({
        date: m.FechaMovimiento,
        type: m.Tipo,
        product: `${m.CodigoProducto} | ${m.NombreProducto}`,
        qty: Math.abs(m.Cantidad),
        ref: m.Observacion || '-',
        usuario: m.Usuario
      }));
      
      return { success: true, movimientos };
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      showToast(error.message || 'Error al cargar movimientos', 'error');
      return { success: false, movimientos: [] };
    }
  }

  async function renderCategorias() {
    const grid = document.getElementById('categoryGrid');
    const createBtn = document.getElementById('newCategoryBtn');
    if (!grid) return;

    // Cargar categorías desde API si el estado está vacío
    if (!Array.isArray(categoryState) || categoryState.length === 0) {
      await loadCategorias();
    }

    const isAdmin = role === 'admin';
    grid.classList.toggle('read-only', !isAdmin);
    if (createBtn) {
      createBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    // Inicializar paginación
    const pageSizeSelect = document.getElementById('categoriesPageSize');
    const prevBtn = document.getElementById('categoriesPrev');
    const nextBtn = document.getElementById('categoriesNext');
    categoriesPager.total = categoryState.length;
    categoriesPager.pageSize = Number(pageSizeSelect?.value || categoriesPager.pageSize || 9) || 9;
    categoriesPager.page = Math.min(categoriesPager.page, Math.max(1, Math.ceil(categoriesPager.total / categoriesPager.pageSize)));

    renderCategoriesPage({ isAdmin });

    if (pageSizeSelect) {
      pageSizeSelect.onchange = () => {
        categoriesPager.pageSize = Number(pageSizeSelect.value) || 9;
        categoriesPager.page = 1;
        renderCategoriesPage({ isAdmin });
      };
    }
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (categoriesPager.page > 1) {
          categoriesPager.page -= 1;
          renderCategoriesPage({ isAdmin });
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const maxPage = Math.max(1, Math.ceil(categoriesPager.total / categoriesPager.pageSize));
        if (categoriesPager.page < maxPage) {
          categoriesPager.page += 1;
          renderCategoriesPage({ isAdmin });
        }
      };
    }
  }

  function renderCategoriesPage(options = {}) {
    const { isAdmin = false } = options;
    const grid = document.getElementById('categoryGrid');
    const infoEl = document.getElementById('categoriesPageInfo');
    const prevBtn = document.getElementById('categoriesPrev');
    const nextBtn = document.getElementById('categoriesNext');
    if (!grid) return;

    const total = Array.isArray(categoryState) ? categoryState.length : 0;
    categoriesPager.total = total;
    if (total === 0) {
      grid.innerHTML = '<p class="empty-state">No hay categorías registradas. Usa "Nueva categoría" para agregar una.</p>';
      if (infoEl) infoEl.textContent = 'Mostrando 0–0 de 0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    const maxPage = Math.max(1, Math.ceil(total / (categoriesPager.pageSize || 9)));
    const safePage = Math.min(Math.max(1, categoriesPager.page || 1), maxPage);
    if (safePage !== categoriesPager.page) categoriesPager.page = safePage;

    const pageSize = categoriesPager.pageSize || 9;
    const start = (safePage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const slice = categoryState.slice(start, end);

    buildCategoryGrid(grid, slice, { isAdmin });
    if (infoEl) infoEl.textContent = `Mostrando ${start + 1}–${end} de ${total}`;
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= maxPage;
  }

  // ============================================================================
  // SECCIÓN: FUNCIONES AUXILIARES DE UI (LÍNEAS 2675-3485)
  // ============================================================================
  // ℹ️ FUNCIONES REUTILIZABLES: Estas funciones construyen componentes de UI
  // Muchas son genéricas y pueden reutilizarse cuando se implementen los módulos.
  // Estado: Mixto - algunas funcionan con datos reales, otras con datos mock.
  // 
  // Funciones incluidas:
  // - buildStats() - Construye tarjetas de estadísticas
  // - buildModules() - Construye tarjetas de módulos
  // - buildTimeline() - Construye línea de tiempo
  // - buildAlerts() - Construye lista de alertas
  // - buildChart() - Wrapper para Chart.js
  // + 15+ funciones auxiliares más

  function buildStats(container, stats = []) {
    if (!container) return;
    container.innerHTML = stats.map(stat => `
      <article class="stat-card">
        <div class="stat-icon ${stat.tone || ''}">
          <i class="fas ${stat.icon}"></i>
        </div>
        <div class="stat-info">
          <h3>${stat.value}</h3>
          <p>${stat.label}</p>
          ${stat.trend ? `<span class="stat-trend">${stat.trend}</span>` : ''}
        </div>
      </article>
    `).join('');
  }

  function buildModules(container, modules = []) {
    if (!container) return;
    container.innerHTML = modules.map(module => `
      <article class="action-card" data-target="${module.target}">
        <div class="action-icon">
          <i class="fas ${module.icon}"></i>
        </div>
        <h3>${module.title}</h3>
        <p>${module.description}</p>
        <span class="action-link">${module.link || 'Ver detalle'} <i class="fas fa-arrow-right"></i></span>
      </article>
    `).join('');
  }

  function buildAlerts(container, alerts = []) {
    if (!container) return;
    container.innerHTML = alerts.map(alert => `
      <article class="alert-card ${alert.type || ''}">
        <div class="alert-icon">
          <i class="fas ${alert.icon || 'fa-circle-info'}"></i>
        </div>
        <div class="alert-content">
          <h4>${alert.title}</h4>
          <p>${alert.description}</p>
        </div>
      </article>
    `).join('');
  }

  function buildHighlights(container, highlights = []) {
    if (!container) return;
    container.innerHTML = highlights.map(item => `
      <article class="highlight-card">
        <div class="highlight-icon">
          <i class="fas ${item.icon || 'fa-circle-info'}"></i>
        </div>
        <div>
          <h4>${item.title}</h4>
          <p>${item.description}</p>
        </div>
      </article>
    `).join('');
  }

  function renderBarChart(container, dataset = [], options = {}) {
    if (!container) return;
    if (!dataset.length) {
      container.innerHTML = '<p class="empty-state">Sin datos disponibles.</p>';
      return;
    }
    const max = Math.max(...dataset.map(item => item.value));
    container.classList.toggle('compact', Boolean(options.compact));
    container.innerHTML = dataset.map(item => {
      const height = max === 0 ? 0 : Math.round((item.value / max) * 100);
      return `
        <div class="chart-bar" style="height:${height}%">
          <span class="chart-bar-value">${item.value}</span>
          <span class="chart-bar-label">${item.label}</span>
        </div>
      `;
    }).join('');

    if (options.badgeId && options.badge) {
      const badge = document.getElementById(options.badgeId);
      if (badge) badge.textContent = options.badge;
    }

    if (options.subtitleId && options.subtitle) {
      const subtitle = document.getElementById(options.subtitleId);
      if (subtitle) subtitle.textContent = options.subtitle;
    }
  }

  function renderPieChart(pieElement, legendElement, dataset = [], subtitle) {
    if (!pieElement || !legendElement) return;
    if (!dataset.length) {
      pieElement.style.background = '#e2e8f0';
      legendElement.innerHTML = '<li class="empty-state">Sin datos disponibles.</li>';
      return;
    }
    const total = dataset.reduce((sum, item) => sum + item.value, 0);
    let current = 0;
    const gradient = dataset.map(item => {
      const start = (current / total) * 100;
      current += item.value;
      const end = (current / total) * 100;
      return `${item.color} ${start}% ${end}%`;
    }).join(', ');
    pieElement.style.background = `conic-gradient(${gradient})`;
    legendElement.innerHTML = dataset.map(item => {
      const percentage = total === 0 ? 0 : Math.round((item.value / total) * 100);
      return `
        <li>
          <span class="legend-dot" style="background:${item.color}"></span>
          <span class="legend-label">${item.label}</span>
          <span class="legend-value">${percentage}%</span>
        </li>
      `;
    }).join('');
    if (subtitle) {
      const subtitleNode = document.getElementById('categoryChartSubtitle');
      if (subtitleNode) subtitleNode.textContent = subtitle;
    }
  }

  function buildFilters(container, filters = []) {
    if (!container) return;
    container.innerHTML = `
      <div class="filters-row">
        ${filters.map(filter => renderFilterGroup(filter)).join('')}
      </div>
      <div class="filters-actions">
        <button class="btn btn-primary btn-sm" id="applyFiltersBtn">
          <i class="fas fa-filter"></i> Aplicar filtros
        </button>
      </div>
    `;
  }

  function renderFilterGroup(filter) {
    if (filter.type === 'date-range') {
      return `
        <div class="filter-group">
          <label>${filter.label}</label>
          <div class="filter-range">
            <input type="date" class="filter-input" />
            <span>a</span>
            <input type="date" class="filter-input" />
          </div>
        </div>
      `;
    }
    if (filter.type === 'select') {
      const options = (filter.options || []).map(option => `<option value="${option}">${option}</option>`).join('');
      return `
        <div class="filter-group">
          <label for="${filter.id}">${filter.label}</label>
          <select id="${filter.id}" class="filter-select">
            ${options}
          </select>
        </div>
      `;
    }
    return '';
  }

  function buildSummary(container, summary = []) {
    if (!container) return;
    container.innerHTML = summary.map(item => `
      <div class="summary-card">
        <div class="summary-icon">
          <i class="fas ${item.icon}"></i>
        </div>
        <div>
          <p class="summary-label">${item.label}</p>
          <span class="summary-value">${item.value}</span>
        </div>
      </div>
    `).join('');
  }

  function buildTable(headContainer, bodyContainer, table) {
    if (!headContainer || !bodyContainer || !table) return;
    headContainer.innerHTML = table.head.map(column => `<th>${column}</th>`).join('');
    bodyContainer.innerHTML = table.rows.map(row => `
      <tr>
        ${row.map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `).join('');
  }

  function renderChartCollection(container, charts = []) {
    if (!container) return;
    if (!charts.length) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = charts.map((chart, i) => `
      <article class="chart-card">
        <div class="card-header">
          <div>
            <h3>${chart.title}</h3>
            <p class="card-subtitle">${chart.subtitle || ''}</p>
          </div>
        </div>
        <div class="pie-chart-wrapper">
          <div class="pie-chart" id="repPie_${i}"></div>
          <ul class="pie-legend" id="repPieLegend_${i}"></ul>
        </div>
      </article>
    `).join('');

    const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#64748b', '#f43f5e', '#84cc16', '#0ea5e9'];
    charts.forEach((chart, index) => {
      const pieEl = container.querySelector(`#repPie_${index}`);
      const legendEl = container.querySelector(`#repPieLegend_${index}`);
      const data = (chart.data || []).map((d, i) => ({
        label: d.label,
        value: d.value,
        color: d.color || palette[i % palette.length]
      }));
      renderPieChart(pieEl, legendEl, data, chart.subtitle || '');
    });
  }

  function buildTimeline(container, timeline = []) {
    if (!container) return;
    container.innerHTML = timeline.map(item => `
      <li class="timeline-item">
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-content">
          <strong>${item.action}</strong>
          <p>${item.detail}</p>
          <span class="timeline-actor"><i class="fas fa-user-circle"></i> ${item.actor}</span>
        </div>
      </li>
    `).join('');
  }

  function buildInventoryTable(bodyContainer, rows = []) {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = rows.map(row => `
      <tr>
        <td>${row.code}</td>
        <td>${row.product}</td>
        <td>${row.categories.map(cat => `<span class="tag">${cat}</span>`).join(' ')}</td>
        <td>${row.available}</td>
        <td>${row.minimum}</td>
      </tr>
    `).join('');
  }

  function buildTopProducts(container, items = []) {
    if (!container) return;
    container.innerHTML = items.map(item => `
      <li class="list-card">
        <div>
          <h4>${item.name}</h4>
          <p>${item.units} unidades</p>
        </div>
        <span class="badge badge-info">${item.delta}</span>
      </li>
    `).join('');
  }

  function buildSalesTable(bodyContainer, rows = []) {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = rows.map(row => `
      <tr>
        <td>${row.date}</td>
        <td>${row.user}</td>
        <td>${row.category}</td>
        <td>${row.subtotal}</td>
        <td>${row.discount}</td>
        <td>${row.total}</td>
      </tr>
    `).join('');
  }

  function buildProductTable(bodyContainer, products = []) {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = products.map(product => `
      <tr>
        <td>${product.code}</td>
        <td>${product.name}</td>
        <td>${product.categories.map(cat => `<span class="tag">${cat}</span>`).join(' ')}</td>
        <td>${product.cost}</td>
        <td>${product.price}</td>
        <td>
          <span class="status-chip ${getStatusChipClass(product.status)}">${product.status}</span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" data-product-action="edit" data-code="${product.code}" onclick="window.__openEditProduct('${product.code}')"><i class="fas fa-pen"></i></button>
          <button class="btn btn-secondary btn-sm" data-product-action="delete" data-code="${product.code}" onclick="window.__openDeleteProduct('${product.code}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  function getStatusChipClass(status) {
    const s = (status || '').toString().toLowerCase();
    if (s.includes('sin existencias') || s.includes('agotado')) return 'danger';
    if (s.includes('critico') || s.includes('crítico')) return 'danger';
    if (s.includes('bajo')) return 'warning';
    return 'success';
  }

  // Refresca la tabla de productos combinando base + agregados en memoria
  async function refreshProductTable() {
    const tbody = document.querySelector('#productTable tbody');
    if (!tbody) return;
    const infoEl = document.getElementById('productsPageInfo');
    const prevBtn = document.getElementById('productsPrev');
    const nextBtn = document.getElementById('productsNext');
    const pageSizeSelect = document.getElementById('productsPageSize');
    if (pageSizeSelect) {
      const size = Number(pageSizeSelect.value || productsPager.pageSize || 10) || 10;
      productsPager.pageSize = size;
    }
    const statusSel = document.getElementById('productFilterStatus');
    const estado = statusSel?.value || '';
    const params = new URLSearchParams({
      page: String(productsPager.page || 1),
      limit: String(productsPager.pageSize || 10),
      estado
    });
    try {
      const resp = await fetch(`/api/productos?${params}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || `Error HTTP ${resp.status}`);
      const rows = (data.data || []).map(r => {
        const rawCats = r.Categorias ?? r.categorias ?? '';
        const categories = Array.isArray(rawCats)
          ? rawCats
          : (typeof rawCats === 'string'
              ? rawCats.split(/[;|,]/).map(s => s.trim()).filter(Boolean)
              : []);
        return {
          code: r.Codigo || r.codigo,
          name: r.Nombre || r.nombre,
          categories,
          cost: formatMoney(Number(r.PrecioCosto ?? r.precioCosto ?? 0)),
          price: formatMoney(Number(r.PrecioVenta ?? r.precioVenta ?? 0)),
          status: r.Estado || r.estado || 'En stock'
        };
      });
      buildProductTable(tbody, rows);
      productsPager.total = data.pagination?.totalItems || rows.length;
      const start = ((data.pagination?.currentPage || 1) - 1) * (data.pagination?.itemsPerPage || rows.length) + (rows.length ? 1 : 0);
      const end = start + rows.length - (rows.length ? 0 : 0);
      if (infoEl) infoEl.textContent = `Mostrando ${start}-${end} de ${productsPager.total}`;
      if (prevBtn) prevBtn.disabled = !(data.pagination?.hasPrevPage);
      if (nextBtn) nextBtn.disabled = !(data.pagination?.hasNextPage);
    } catch (err) {
      console.error('Error cargando productos:', err);
      tbody.innerHTML = '<tr><td colspan="7"><p class="empty-state">No se pudo cargar la lista de productos.</p></td></tr>';
      if (infoEl) infoEl.textContent = 'Mostrando 0-0 de 0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    }
  }

  function initProductsPagination() {
    const pageSizeSelect = document.getElementById('productsPageSize');
    const prevBtn = document.getElementById('productsPrev');
    const nextBtn = document.getElementById('productsNext');
    if (pageSizeSelect) {
      productsPager.pageSize = Number(pageSizeSelect.value || 10) || 10;
      pageSizeSelect.onchange = () => {
        productsPager.pageSize = Number(pageSizeSelect.value) || 10;
        productsPager.page = 1;
        refreshProductTable();
      };
    }
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (productsPager.page > 1) {
          productsPager.page -= 1;
          refreshProductTable();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const maxPage = Math.max(1, Math.ceil((productsPager.total || 0) / (productsPager.pageSize || 10)));
        if (productsPager.page < maxPage) {
          productsPager.page += 1;
          refreshProductTable();
        }
      };
    }
  }

  // Versión con paginación: aplica filtro de categoría y re-renderiza tabla principal
  function applyProductsCategoryFilterPaged(categoryName) {
    const selCat = document.getElementById('productFilterCategory');
    if (selCat) selCat.value = categoryName || '';
    productsPager.page = 1;
    refreshProductTable();
  }

  // Modal: Nuevo producto
  function openProductForm(mode = 'create', code = null) {
    clearProductFormMessage();
    const modalId = 'productModal';
    const nameField = document.getElementById('productName');
    const codeField = document.getElementById('productCode');
    const descField = document.getElementById('productDescription');
    const costField = document.getElementById('productCost');
    const priceField = document.getElementById('productPrice');
    const discField = document.getElementById('productDiscount');

    if (!nameField || !codeField || !costField || !priceField) {
      showToast('Formulario de producto no disponible.', 'error');
      return;
    }

    productFormMode = mode;
    productTargetCode = code;
    document.getElementById('productForm')?.reset();
    discField && (discField.value = '0');
    if (mode === 'create') {
      codeField.value = '';
      nameField.value = '';
      descField.value = '';
      nameField.oninput = () => {
        codeField.value = generateProductCode(nameField.value || '');
      };
      codeField.value = generateProductCode(nameField.value || '');
    }

    modalManager.open(modalId);
  }

  function setProductFormMessage(type, message) {
    const container = document.getElementById('productFormMessage');
    if (!container) return;
    container.className = `message-container ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-circle-info', warning: 'fa-exclamation-triangle' };
    container.innerHTML = `
      <div class="message ${type}">
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
      </div>
    `;
  }

  function clearProductFormMessage() {
    const container = document.getElementById('productFormMessage');
    if (container) {
      container.className = 'message-container';
      container.innerHTML = '';
    }
  }

  // ---- Editar producto (modal separado) ----
  function openEditProductModal(code) {
    productFormMode = 'edit';
    productTargetCode = code || '';
    const codeEl = document.getElementById('productEditCode');
    const nameEl = document.getElementById('productEditName');
    const costEl = document.getElementById('productEditCost');
    const priceEl = document.getElementById('productEditPrice');
    if (codeEl) codeEl.value = code || '';
    if (nameEl) nameEl.value = '';
    if (costEl) costEl.value = '';
    if (priceEl) priceEl.value = '';

    // Reset y abrir modal (el grid se renderiza tras cargar datos o al activar el toggle)
    const currentWrap = document.getElementById('productEditCurrentCats');
    if (currentWrap) currentWrap.innerHTML = '';
    clearEditProductFormMessage();
    modalManager.open('productEditModal');
    // Inicializar estado del modal para esta edición
    window.__editProductState = { categories: new Set(), display: new Map(), canon: new Map() };

    // Cargar datos reales del backend
    fetch(`/api/productos/${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(data => {
        if (!data?.success || !data.product) throw new Error(data?.message || 'No se pudo obtener el producto');
        const p = data.product;
        if (nameEl) nameEl.value = p.nombre || '';
        if (costEl) costEl.value = Number(p.precioCosto ?? 0);
        if (priceEl) priceEl.value = Number(p.precioVenta ?? 0);
        const current = Array.isArray(p.categorias) ? p.categorias : [];
        const selSet = new Set(current.map(c => (c || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()));
        // Guardar estado y mapping de display
        window.__editProductState.categories = selSet;
        window.__editProductState.display = new Map(current.map(n => [ (n || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(), n ]));
        renderEditProductCategoriesGrid(selSet);
        // Pintar chips actuales de forma centralizada
        if (currentWrap) { syncEditCurrentChips(); }
      })
      .catch(err => {
        console.error('No se pudo cargar producto:', err);
        setEditProductFormMessage('error', err.message || 'No se pudo cargar el producto');
      });
  }

  function renderEditProductCategoriesGrid(selectedSet = new Set()) {
    const list = document.getElementById('productEditCategoryList');
    if (!list) return;
    const categories = (DASHBOARD_DATA.admin?.categorias?.list || []).map(c => c.name);
    const ALIAS = { tecnologa: 'tecnologia' };
    const CANON = { tecnologia: 'Tecnologia', laboratorio: 'Laboratorio', papelera: 'Papelera', servicios: 'Servicios', equipamiento: 'Equipamiento' };
    // Grid amigable de chips seleccionables
    list.style.display = 'grid';
    list.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
    list.style.gap = '8px';
    list.innerHTML = categories.map(name => {
      const rawKey = (name || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const key = ALIAS[rawKey] || rawKey; // clave canónica para comparar/guardar
      const label = CANON[key] || (key.charAt(0).toUpperCase() + key.slice(1));
      if (!window.__editProductState) window.__editProductState = { categories: new Set(), canon: new Map(), display: new Map() };
      window.__editProductState.canon.set(key, label);
      const sel = selectedSet.has(key);
      return `
        <button type="button" class="cat-chip${sel ? ' selected' : ''}" data-cat-name="${label}" data-cat-key="${key}"
          style="display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; border:1px solid #e2e8f0; background:${sel ? '#dbeafe' : '#f8fafc'}; color:${sel ? '#1e3a8a' : '#334155'}; font-size:13px; cursor:pointer;">
          <i class="fas fa-check" style="visibility:${sel ? 'visible' : 'hidden'};"></i>
          <span>${label}</span>
        </button>
      `;
    }).join('');

    // Delegacin: toggle visual
    list.onclick = (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      const selected = chip.classList.toggle('selected');
      chip.querySelector('i')?.style && (chip.querySelector('i').style.visibility = selected ? 'visible' : 'hidden');
      chip.style.background = selected ? '#dbeafe' : '#f8fafc';
      chip.style.color = selected ? '#1e3a8a' : '#334155';
      chip.style.borderColor = selected ? '#bfdbfe' : '#e2e8f0';
      const key = chip.getAttribute('data-cat-key') || '';
      const label = chip.getAttribute('data-cat-name') || '';
      if (!window.__editProductState) window.__editProductState = { categories: new Set() };
      if (selected) window.__editProductState.categories.add(key);
      else window.__editProductState.categories.delete(key);
      if (!window.__editProductState.display) window.__editProductState.display = new Map();
      if (selected) window.__editProductState.display.set(key, label);
      else window.__editProductState.display.delete(key);
      syncEditCurrentChips();
    };
  }

  function getSelectedEditCategories() {
    const set = window.__editProductState?.categories || new Set();
    return Array.from(set);
  }

  function syncEditCurrentChips() {
    const wrap = document.getElementById('productEditCurrentCats');
    if (!wrap) return;
    const keys = Array.from(window.__editProductState?.categories || new Set());
    const names = keys.map(k => (window.__editProductState?.display?.get(k)) || k.charAt(0).toUpperCase() + k.slice(1));
    if (!names.length) {
      wrap.innerHTML = '<span style="color:#64748b; font-size:13px;">Sin categorías seleccionadas.</span>';
      return;
    }
    wrap.innerHTML = '<div class="cats-inline"><span class="cats-label">Categorías actuales:</span>' +
      keys.map((k, i) => '<span class="tag plain" data-cat-key="' + k + '">' + names[i] +
        ' <button type="button" class="cat-remove" aria-label="Quitar ' + names[i] + '" title="Quitar">×</button>' +
      '</span>').join('') +
    '</div>';
    // Delegación para quitar
    wrap.onclick = (e) => {
      const btn = e.target.closest('.cat-remove');
      if (!btn) return;
      const tag = btn.closest('.tag');
      const key = tag?.getAttribute('data-cat-key') || '';
      if (tag) tag.remove();
      if (key && window.__editProductState) {
        window.__editProductState.categories.delete(key);
        window.__editProductState.display?.delete(key);
        // También deseleccionar en el grid
        const chip = document.querySelector(`.cat-chip[data-cat-key="${key}"]`);
        if (chip) {
          chip.classList.remove('selected');
          const icon = chip.querySelector('i'); if (icon) icon.style.visibility = 'hidden';
          chip.style.background = '#f8fafc'; chip.style.color = '#334155'; chip.style.borderColor = '#e2e8f0';
        }
      }
    };
  }

  function renderEditCurrentCategories(code) {
    const wrap = document.getElementById('productEditCurrentCats');
    if (!wrap) return;
    // Datos ficticios para demostracin segn cdigo
    let cats = ['Laboratorio', 'Papelera'];
    const c = (code || '').toUpperCase();
    if (c.startsWith('LAB')) cats = ['Laboratorio', 'Equipamiento'];
    else if (c.startsWith('TEC')) cats = ['Tecnologa', 'Papelera'];
    else if (c.startsWith('SER')) cats = ['Servicios'];
    wrap.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <span style="color:#64748b; font-size:13px;">Categorías actuales:</span>
        ${cats.map(n => `
          <span class=\"tag\" data-cat=\"${n}\" style=\"display:inline-flex; align-items:center; gap:6px;\">
            ${n}
            <button type=\"button\" class=\"cat-remove\" aria-label=\"Quitar ${n}\" title=\"Quitar\" style=\"border:none; background:transparent; color:#64748b; cursor:pointer; display:inline-flex; align-items:center;\">
              <i class=\"fas fa-xmark\"></i>
            </button>
          </span>
        `).join('')}
      </div>
    `;
  }

  function setEditProductFormMessage(type, message) {
    const c = document.getElementById('productEditFormMessage');
    if (!c) return;
    c.className = `message-container ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-circle-info', warning: 'fa-exclamation-triangle' };
    c.innerHTML = `<div class="message ${type}"><i class="fas ${icons[type] || icons.info}"></i><span>${message}</span></div>`;
  }
  function clearEditProductFormMessage() {
    const c = document.getElementById('productEditFormMessage');
    if (c) { c.className = 'message-container'; c.innerHTML = ''; }
  }

  function handleEditProductSubmit(event) {
    event.preventDefault();
    const code = document.getElementById('productEditCode')?.value || '';
    const name = document.getElementById('productEditName')?.value?.trim() || '';
    const cost = parseFloat(document.getElementById('productEditCost')?.value || '0');
    const price = parseFloat(document.getElementById('productEditPrice')?.value || '0');
    const keys = Array.from(window.__editProductState?.categories || new Set());
    const cats = keys.map(k => (window.__editProductState?.display?.get(k)) || (window.__editProductState?.canon?.get(k)) || (k.charAt(0).toUpperCase() + k.slice(1)));
    if (!code || !name) { setEditProductFormMessage('error','Faltan datos obligatorios.'); return; }
    setEditProductFormMessage('info','Guardando cambios...');
    fetch(`/api/productos/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: name, precioCosto: cost, precioVenta: price, categorias: cats })
    })
    .then(r => r.json())
    .then(data => {
      if (!data?.success) throw new Error(data?.message || 'No se pudo actualizar');
      setEditProductFormMessage('success','Producto actualizado.');
      showToast('Producto actualizado correctamente.','success');
      productsPager.page = 1;
      return refreshProductTable();
    })
    .then(() => setTimeout(() => modalManager.close('productEditModal'), 600))
    .catch(err => setEditProductFormMessage('error', err.message || 'No se pudo actualizar'));
  }

  // Exponer funciones para onclick inline (garantiza interaccin)
  window.__openEditProduct = function (code) { try { openEditProductModal(code); } catch (e) { console.error(e); } };
  window.__openDeleteProduct = function (code) { try { openProductDelete(code); } catch (e) { console.error(e); } };

  // Interacciones UI categoras (editar)
  (function initEditCategoriesUI() {
    const toggle = document.getElementById('productEditToggleCats');
    const section = document.getElementById('productEditCategorySection');
    const hint = document.getElementById('productEditCategoryHint');
    const search = document.getElementById('productEditCategorySearch');
    const list = document.getElementById('productEditCategoryList');
    const btnClear = document.getElementById('productEditCatClear');
    const btnAll = document.getElementById('productEditCatSelectAll');
    if (!toggle || !section) return;

    toggle.addEventListener('change', () => {
      const on = toggle.checked;
      section.style.display = on ? 'block' : 'none';
      if (hint) hint.style.display = on ? 'none' : 'block';
      if (on) {
        // Render al abrir con las categorías reales ya cargadas
        const sel = new Set(window.__editProductState?.categories || []);
        renderEditProductCategoriesGrid(sel);
      }
    });

    search?.addEventListener('input', () => {
      const term = (search.value || '').toLowerCase();
      Array.from(list?.querySelectorAll('.cat-chip') || []).forEach(chip => {
        const name = chip.textContent.trim().toLowerCase();
        chip.style.display = name.includes(term) ? '' : 'none';
      });
    });

    btnClear?.addEventListener('click', () => {
      list?.querySelectorAll('.cat-chip').forEach(chip => {
        chip.classList.remove('selected');
        const icon = chip.querySelector('i');
        if (icon) icon.style.visibility = 'hidden';
        chip.style.background = '#f8fafc';
        chip.style.color = '#334155';
        chip.style.borderColor = '#e2e8f0';
      });
    });
    btnAll?.addEventListener('click', () => {
      list?.querySelectorAll('.cat-chip').forEach(chip => {
        chip.classList.add('selected');
        const icon = chip.querySelector('i');
        if (icon) icon.style.visibility = 'visible';
        chip.style.background = '#dbeafe';
        chip.style.color = '#1e3a8a';
        chip.style.borderColor = '#bfdbfe';
      });
    });

    // Quitar categora actual (solo UI)
    const currentWrap = document.getElementById('productEditCurrentCats');
    currentWrap?.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-remove');
      if (!btn) return;
      const tag = btn.closest('.tag');
      const name = tag?.getAttribute('data-cat') || '';
      if (tag) tag.remove();
      showToast(`Categora "${name}" quitada.`, 'info');
    });
  })();

  // Captura para mejorar feedback al quitar categoría en modal de edición
  (function enhanceEditCategoryRemovalToast() {
    const wrap = document.getElementById('productEditCurrentCats');
    if (!wrap) return;
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-remove');
      if (!btn) return;
      // Interceptar antes del listener burbujeante original
      e.stopPropagation();
      // No usar stopImmediatePropagation en captura-burbuja mix (compat)
      const tag = btn.closest('.tag');
      const key = tag?.getAttribute('data-cat-key') || '';
      const label = (window.__editProductState?.display?.get(key)) || (window.__editProductState?.canon?.get(key)) || (key && (key.charAt(0).toUpperCase()+key.slice(1))) || '';
      if (tag) tag.remove();
      if (key && window.__editProductState) {
        window.__editProductState.categories.delete(key);
        window.__editProductState.display?.delete(key);
        const chip = document.querySelector(`.cat-chip[data-cat-key="${key}"]`);
        if (chip) {
          chip.classList.remove('selected');
          const icon = chip.querySelector('i'); if (icon) icon.style.visibility = 'hidden';
          chip.style.background = '#f8fafc'; chip.style.color = '#334155'; chip.style.borderColor = '#e2e8f0';
        }
      }
      showToast(`Se quitó “${label}”. No olvides guardar.`, 'info');
    }, true);
  })();
  function handleProductFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('productName')?.value?.trim() || '';
    const code = document.getElementById('productCode')?.value?.trim() || generateProductCode(name);
    const description = document.getElementById('productDescription')?.value?.trim() || '';
    const costVal = parseFloat(document.getElementById('productCost')?.value || '0');
    const priceVal = parseFloat(document.getElementById('productPrice')?.value || '0');
    const discountVal = parseFloat(document.getElementById('productDiscount')?.value || '0');
    const status = 'En stock';

    if (!name) return setProductFormMessage('error', 'El nombre es obligatorio.');
    if (isNaN(costVal) || costVal <= 0) return setProductFormMessage('error', 'Precio costo debe ser mayor a 0.');
    if (isNaN(priceVal) || priceVal <= 0) return setProductFormMessage('error', 'Precio venta debe ser mayor a 0.');
    if (priceVal < costVal) setProductFormMessage('warning', 'Advertencia: precio de venta es menor al costo.');
    if (isNaN(discountVal) || discountVal < 0 || discountVal > 100) return setProductFormMessage('error', 'Descuento debe estar entre 0 y 100.');

    // Enviar al backend para persistir en base de datos
    setProductFormMessage('info', 'Guardando producto...');
    fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: code,
        nombre: name,
        descripcion: description,
        precioCosto: costVal,
        precioVenta: priceVal,
        descuento: isNaN(discountVal) ? 0 : discountVal
      })
    })
    .then(async (resp) => {
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success) throw new Error(data.message || `Error HTTP ${resp.status}`);
      // Actualizar tabla localmente para reflejar el alta
      const prodData = {
        code: data.product?.codigo || code,
        name,
        description,
        categories: getSelectedProductCategories(), // pendiente categoría real
        cost: formatMoney(costVal),
        price: formatMoney(priceVal),
        status: status
      };
      if (productFormMode === 'edit' && productTargetCode) {
        productEdits[productTargetCode] = prodData;
      } else {
        // Dejar que la tabla recargue desde el servidor; no usar lista local
      }
      setProductFormMessage('success', 'Producto guardado.');
      productsPager.page = 1;
      await refreshProductTable();
      setTimeout(() => modalManager.close('productModal'), 700);
    })
    .catch(err => {
      console.error('Error guardando producto:', err);
      setProductFormMessage('error', err.message || 'No se pudo guardar el producto');
    });
  }

  function renderProductCategoriesGrid(selectedSet = new Set()) {
    const grid = document.getElementById('productCategoriesGrid');
    if (!grid) return;
    const categories = (DASHBOARD_DATA.admin?.categorias?.list || []).map(c => c.name);
    grid.innerHTML = categories.map(name => {
      const checked = selectedSet.has(name.toLowerCase()) ? 'checked' : '';
      return `
        <label class="tag" style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; margin:4px;">
          <input type="checkbox" data-cat-name="${name}" ${checked} style="transform:scale(1.1);"> ${name}
        </label>
      `;
    }).join('');
  }

  function getSelectedProductCategories() {
    return Array.from(document.querySelectorAll('#productCategoriesGrid input[type="checkbox"]:checked'))
      .map(el => el.getAttribute('data-cat-name'));
  }

  function getMergedProducts() {
    const base = (DASHBOARD_DATA.admin?.productos?.list || []).slice()
      .filter(p => !productDeletes.has(p.code))
      .map(p => ({ ...p, ...(productEdits[p.code] || {}) }));
    const additions = (productTransient || [])
      .filter(p => !productDeletes.has(p.code))
      .map(p => ({ ...p, ...(productEdits[p.code] || {}) }));
    return base.concat(additions);
  }

  function openProductDelete(code) {
    productTargetCode = code || '';
    const label = document.getElementById('deleteProductName');
    if (label) label.textContent = code || '';
    modalManager.open('productDeleteModal');
  }

  function formatMoney(value) {
    const num = isNaN(value) ? 0 : Number(value);
    return '$' + num.toFixed(2);
  }

  function generateProductCode(name) {
    const base = (name || 'Producto')
      .toString()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 8);
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return (base || 'PRD') + '-' + suffix;
  }

  function buildCategoryGrid(container, categories = [], options = {}) {
    if (!container) return;
    const { isAdmin = false } = options;

    if (!categories.length) {
      container.innerHTML = '<p class="empty-state">No hay categoras registradas. Usa "Nueva categora" para agregar una.</p>';
      return;
    }

    container.innerHTML = categories.map(category => {
      const id = category.id;
      const name = escapeHtml(category.name);
      const description = category.description ? escapeHtml(category.description) : 'Sin descripcin registrada.';
      const count = category.productsCount ?? 0;
      const productsLabel = `${count} ${count === 1 ? 'producto' : 'productos'}`;
      const badgeText = escapeHtml(`ID: ${category.id}`);

      const menu = isAdmin ? `
          <button class="category-menu-btn" data-category-action="toggleMenu" data-category-id="${id}">
            <i class="fas fa-ellipsis-vertical"></i>
          </button>
          <ul class="category-menu" data-category-menu data-category-id="${id}">
            <li data-category-action="detail" data-category-id="${id}"><i class="fas fa-eye"></i> Ver detalle</li>
            <li data-category-action="edit" data-category-id="${id}"><i class="fas fa-pen"></i> Editar</li>
            <li data-category-action="delete" data-category-id="${id}"><i class="fas fa-trash"></i> Eliminar</li>
          </ul>
      ` : '';

      return `
        <article class="category-card" data-category-id="${id}">
          <div class="category-card-header">
            <div class="category-icon" style="background:${category.color || '#3b82f6'};">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="category-info">
              <h4>${name}</h4>
              <span>${escapeHtml(productsLabel)}</span>
            </div>
            ${menu}
          </div>
          <p>${description}</p>
          <span class="badge badge-neutral">${badgeText}</span>
        </article>
      `;
    }).join('');
  }

  function registerEvents(currentRole) {
    dropdownToggle?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      userDropdown?.classList.toggle('show');
    });

  userDropdown?.addEventListener('click', event => {
      const actionLink = event.target.closest('a[data-action]');
      if (!actionLink) return;
      event.preventDefault();
      const action = actionLink.dataset.action;
      handleUserAction(action, currentRole)
        .catch(error => {
          console.error(' Error ejecutando accin del usuario:', error);
          showToast(error.message || 'Ocurri un error al procesar la accin.', 'error');
        });
      userDropdown.classList.remove('show');
  });

  document.addEventListener('click', event => {
    const closeBtn = event.target.closest('[data-action="closeModal"]');
    if (closeBtn) {
      event.preventDefault();
      let modalId = closeBtn.dataset.modal;
      if (!modalId && closeBtn.dataset.params) {
        try { modalId = JSON.parse(closeBtn.dataset.params)?.modal; } catch (_) {}
      }
      if (modalId) modalManager.close(modalId);
    }

    const openBtn = event.target.closest('[data-action="openModal"]');
    if (openBtn) {
      event.preventDefault();
      let modalId = openBtn.dataset.modal;
      if (!modalId && openBtn.dataset.params) {
        try { modalId = JSON.parse(openBtn.dataset.params)?.modal; } catch (_) {}
      }
      if (modalId) modalManager.open(modalId);
    }

    const toggleBtn = event.target.closest('.toggle-password');
    if (toggleBtn) {
      event.preventDefault();
      togglePasswordField(toggleBtn.dataset.toggle, toggleBtn.dataset.icon);
    }

      if (event.target.classList.contains('modal-overlay')) {
        modalManager.close(event.target.id);
      }

      if (!event.target.closest('.user-info')) {
        userDropdown?.classList.remove('show');
      }

      if (!event.target.closest('.category-card')) {
        closeCategoryMenu();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        modalManager.closeAll();
      }
    });

  navMenu.addEventListener('click', event => {
      const link = event.target.closest('.nav-link');
      if (!link) return;
      event.preventDefault();
      const item = link.closest('.nav-item');
      if (!item) return;
    setActiveSection(item.dataset.section);
    sidebarElement?.classList.remove('show');
    userDropdown?.classList.remove('show');

    if (item.dataset.section === 'usuarios' && currentRole === 'admin') {
      ensureUsersBootstrapped();
    }
  });

    // Fallback global por si el listener del sidebar no se adjunta
  document.addEventListener('click', event => {
    const link = event.target.closest('.nav-link');
    const item = event.target.closest('.nav-item');
    if (!link || !item || !item.dataset.section) return;
    event.preventDefault();
    try {
      setActiveSection(item.dataset.section);
      sidebarElement?.classList.remove('show');
      userDropdown?.classList.remove('show');
      if (item.dataset.section === 'usuarios' && currentRole === 'admin') {
        ensureUsersBootstrapped();
      }
    } catch (err) {
      console.error('Error activando seccin:', err);
    }
  });

  // Delegación para acciones específicas de Gestión de Usuarios
  document.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const userActions = new Set([
      'addUser','viewUser','editUser','updateUser','deleteUser','resetPassword',
      'performUserSearch','clearUserSearchResults','applyUserFiltersModal','clearUserFiltersModal','copyGeneratedPassword'
    ]);
    if (!userActions.has(action)) return;
    ensureUsersBootstrapped();
    if (userManagerInstance && typeof userManagerInstance.handleAction === 'function') {
      let params = {};
      if (actionEl.dataset.params) {
        try { params = JSON.parse(actionEl.dataset.params); } catch (_) {}
      }
      e.preventDefault();
      userManagerInstance.handleAction(action, params);
    }
  });

    document.getElementById('overviewModules')?.addEventListener('click', event => {
      const card = event.target.closest('.action-card');
      if (!card) return;
      const target = card.dataset.target;
      if (!target || sections[target]?.classList.contains('hidden-by-role')) return;
      setActiveSection(target);
      sidebarElement?.classList.remove('show');
    });

    mobileMenuToggle?.addEventListener('click', () => {
      sidebarElement?.classList.toggle('show');
    });

    document.querySelectorAll('button[data-export]').forEach(button => {
      button.addEventListener('click', () => {
        const format = button.dataset.export?.toUpperCase() || 'ARCHIVO';
        showToast(`Exportacin ${format} en construccin.`);
      });
    });

    document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
      showToast('Filtros aplicados. Muestra actualizada.');
    });

    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
      document.querySelectorAll('#reportFilters .filter-input, #reportFilters .filter-select').forEach(input => {
        if (input.type === 'date') input.value = '';
        else input.selectedIndex = 0;
      });
      showToast('Filtros limpios.');
    });

    document.getElementById('newProductBtn')?.addEventListener('click', () => {
      if (currentRole !== 'admin') return;
      openProductForm('create');
    });

    // Guardar producto
    document.getElementById('productForm')?.addEventListener('submit', handleProductFormSubmit);
    document.getElementById('productFormSubmit')?.addEventListener('click', () => {
      document.getElementById('productForm')?.requestSubmit();
    });

    // Acciones de fila en productos
    document.getElementById('productTable')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-product-action]');
      if (!btn) return;
      event.preventDefault();
      const code = btn.getAttribute('data-code');
      const action = btn.getAttribute('data-product-action');
      if (action === 'edit') {
        openEditProductModal(code);
      } else if (action === 'delete') {
        openProductDelete(code);
      }
    });

    // Confirmar eliminación de producto - Llamar a la API
    document.getElementById('deleteProductConfirmBtn')?.addEventListener('click', async () => {
      if (!productTargetCode) {
        showToast('Error: No se ha seleccionado un producto', 'error');
        return;
      }

      try {
        const response = await apiRequest(`/api/productos/${productTargetCode}`, {
          method: 'DELETE'
        });

        if (!response.success) {
          throw new Error(response.message || 'Error al eliminar producto');
        }

        modalManager.close('productDeleteModal');
        showToast(response.message || 'Producto eliminado correctamente', 'success');
        
        // Recargar lista de productos usando la función existente
        productsPager.page = 1;
        refreshProductTable();
      } catch (error) {
        console.error('Error eliminando producto:', error);
        showToast(error.message || 'Error al eliminar el producto', 'error');
      }
    });

    // Guardar edicin
    document.getElementById('productEditForm')?.addEventListener('submit', handleEditProductSubmit);
    document.getElementById('productEditFormSubmit')?.addEventListener('click', () => {
      document.getElementById('productEditForm')?.requestSubmit();
    });

    const categoryGrid = document.getElementById('categoryGrid');
    categoryGrid?.addEventListener('click', event => handleCategoryGridClick(event, currentRole));

    // Navegar a seccin Productos mostrando solo los de la categora seleccionada
    document.getElementById('viewCategoryInProductsBtn')?.addEventListener('click', () => {
      const category = getCategoryById(categoryTargetId || '');
      if (!category) return;
      modalManager.close('categoryProductsModal');
      setActiveSection('productos');
      applyProductsCategoryFilterPaged(category.name);
      showToast(`Filtrando productos por: ${category.name}`, 'info');
    });

    if (currentRole === 'admin') {
      document.getElementById('newCategoryBtn')?.addEventListener('click', () => {
        openCategoryForm('create');
      });

      document.getElementById('categoryForm')?.addEventListener('submit', handleCategoryFormSubmit);
      document.getElementById('categoryFormSubmit')?.addEventListener('click', () => {
        document.getElementById('categoryForm')?.requestSubmit();
      });

      document.getElementById('categoryName')?.addEventListener('input', event => {
        updateCategorySlugPreview(event.target.value || '');
      });

      document.querySelector('[data-category-action="detail-edit"]')?.addEventListener('click', event => {
        const targetId = event.currentTarget.getAttribute('data-category-id') || categoryTargetId;
        if (!targetId) return;
        modalManager.close('categoryDetailModal');
        openCategoryForm('edit', targetId);
      });

      document.querySelector('[data-category-action="detail-delete"]')?.addEventListener('click', event => {
        const targetId = event.currentTarget.getAttribute('data-category-id') || categoryTargetId;
        if (!targetId) return;
        modalManager.close('categoryDetailModal');
        openCategoryDelete(targetId);
      });

      document.getElementById('deleteConfirmBtn')?.addEventListener('click', () => {
        deleteCategory();
      });
    } else {
      const detailActions = document.querySelector('#categoryDetailModal .detail-actions');
      if (detailActions) {
        detailActions.style.display = 'none';
      }
    }

    document.getElementById('newPassword')?.addEventListener('input', event => {
      updatePasswordFeedback(event.target.value || '');
    });

    document.getElementById('confirmPassword')?.addEventListener('input', () => {
      clearPasswordMessage();
    });

    ['profileNombres', 'profileApellidos', 'profileEmail'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => clearProfileMessage());
    });

    document.querySelector('button[data-action="saveProfile"]')?.addEventListener('click', async () => {
      await handleSaveProfile();
    });

    document.querySelector('button[data-action="changePassword"]')?.addEventListener('click', async event => {
      event.preventDefault();
      await handleChangePassword();
    });

    document.getElementById('changePasswordForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await handleChangePassword();
    });
  }

  // Obtiene productos del dataset que pertenecen a una categora
  function getProductsForCategory(categoryName) {
    const data = DASHBOARD_DATA.admin?.productos?.list || [];
    const name = (categoryName || '').toString().toLowerCase();
    return data.filter(p => (p.categories || []).some(c => c.toString().toLowerCase() === name));
  }

  // Aplica filtro en la tabla de productos de la seccin Productos
  function applyProductsCategoryFilter(categoryName) {
    const tbody = document.querySelector('#productTable tbody');
    if (!tbody) return;
    const filtered = getProductsForCategory(categoryName);
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6"><p class="empty-state">No se encontraron productos para "${escapeHtml(categoryName)}".</p></td></tr>`;
      return;
    }
    buildProductTable(tbody, filtered);
  }

  async function handleUserAction(action, currentRole) {
    switch (action) {
      case 'showProfile':
        await openProfileModal(currentRole);
        break;
      case 'showChangePassword':
        openChangePasswordModal();
        break;
      case 'toggleTheme':
        toggleTheme();
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        throw new Error('Accin no reconocida.');
    }
  }

  function handleLogout() {
    ['userData', 'userRole', 'userName', 'userEmail', 'currentUser'].forEach(key => localStorage.removeItem(key));
    window.location.href = '/index.html';
  }

  async function openProfileModal(currentRole) {
    modalManager.open('profileModal');
    clearProfileMessage();
    setProfileLoading(true);
    try {
      profileState = await fetchProfileData(currentRole);
      refreshSessionData({
        nombres: profileState.nombres,
        apellidos: profileState.apellidos,
        email: profileState.email,
        rol: profileState.rol
      });
      setInputValue('profileNombres', profileState.nombres);
      setInputValue('profileApellidos', profileState.apellidos);
      setInputValue('profileEmail', profileState.email);
      setInputValue('profileRole', profileState.rolLabel);
      if (profileState.ultimoAcceso) {
        setProfileMessage('info', `ltimo acceso registrado: ${profileState.ultimoAcceso}`);
      } else {
        setProfileMessage('info', 'No hay registro de ltimo acceso.');
      }
    } catch (error) {
      console.error(' Error cargando perfil:', error);
      setProfileMessage('error', error.message || 'No se pudo cargar la informacin del perfil.');
      profileState = null;
    } finally {
      setProfileLoading(false);
    }
  }

  async function fetchProfileData(currentRole) {
    const stored = getStoredUserData() || {};
    const userId = stored.id || stored.IdUsuario;
    if (!userId) {
      throw new Error('No se encontr el usuario autenticado.');
    }

    const response = await apiRequest(API_ENDPOINTS.userById(userId));
    const user = response.usuario || {};

    const usuario = user.usuario || stored.usuario || localStorage.getItem('currentUser') || '';
    const nombres = (user.nombres ?? stored.nombres ?? '').trim();
    const apellidos = (user.apellidos ?? stored.apellidos ?? '').trim();
    const email = (user.email ?? stored.correo ?? stored.email ?? '').trim();
    const rawRole = user.rol || stored.rol || currentRole || '';
    const normalizedRole = normalizeRoleValue(rawRole || currentRole || '');
    const estadoRaw = user.estado || stored.estado || 'activo';
    const estado = estadoRaw.toString().toLowerCase();

    return {
      id: user.id || stored.id || userId,
      usuario,
      nombres,
      apellidos,
      email,
      rol: normalizedRole,
      rolLabel: formatRoleLabel(rawRole || normalizedRole),
      estado,
      ultimoAcceso: user.ultimoAcceso || '',
      fechaCreacion: user.fechaCreacion || ''
    };
  }

  function openChangePasswordModal() {
    resetChangePasswordModal();
    modalManager.open('changePasswordModal');
  }

  async function handleSaveProfile() {
    if (!profileState) {
      setProfileMessage('error', 'Vuelve a cargar el perfil antes de guardar.');
      return;
    }

    const nombres = document.getElementById('profileNombres')?.value?.trim() || '';
    const apellidos = document.getElementById('profileApellidos')?.value?.trim() || '';
    const email = document.getElementById('profileEmail')?.value?.trim() || '';

    if (!nombres || !apellidos || !email) {
      setProfileMessage('error', 'Completa nombres, apellidos y correo para continuar.');
      return;
    }

    setProfileMessage('info', 'Actualizando perfil...');
    try {
      const payload = {
        usuarioEjecutor: profileState.usuario || localStorage.getItem('currentUser') || localStorage.getItem('userName') || 'admin',
        nombres,
        apellido: apellidos,
        email,
        rol: normalizeRoleValue(profileState.rol || 'secretaria'),
        estado: profileState.estado || 'activo'
      };

      const response = await apiRequest(API_ENDPOINTS.updateUser(profileState.id), {
        method: 'PUT',
        body: payload
      });

      setProfileMessage('success', response.message || 'Perfil actualizado correctamente.');
      const updatedRole = normalizeRoleValue(profileState.rol || 'secretaria');
      profileState = {
        ...profileState,
        nombres,
        apellidos,
        email,
        rol: updatedRole,
        rolLabel: formatRoleLabel(updatedRole)
      };
      refreshSessionData({ nombres, apellidos, email, rol: updatedRole });
      showToast('Perfil actualizado correctamente.', 'success');
      setTimeout(() => {
        modalManager.close('profileModal');
      }, 1200);
    } catch (error) {
      console.error(' Error actualizando perfil:', error);
      setProfileMessage('error', error.message || 'No se pudo actualizar el perfil.');
    }
  }

  async function handleChangePassword() {
    const current = document.getElementById('currentPassword')?.value?.trim() || '';
    const next = document.getElementById('newPassword')?.value || '';
    const confirm = document.getElementById('confirmPassword')?.value || '';

    if (!current || !next || !confirm) {
      showPasswordMessage('error', 'Completa todos los campos.');
      return;
    }

    if (!isPasswordValid(next)) {
      showPasswordMessage('error', 'La nueva contrasea no cumple con los requisitos.');
      return;
    }

    if (next !== confirm) {
      showPasswordMessage('error', 'Las contraseas no coinciden.');
      return;
    }

    const stored = getStoredUserData() || {};
    const usuario = profileState?.usuario || stored.usuario || localStorage.getItem('currentUser');
    if (!usuario) {
      showPasswordMessage('error', 'No se pudo determinar el usuario autenticado.');
      return;
    }

    showPasswordMessage('info', 'Actualizando contrasea...');
    try {
      const response = await apiRequest(API_ENDPOINTS.changePassword, {
        method: 'POST',
        body: {
          usuario,
          passwordActual: current,
          passwordNueva: next,
          confirmarPassword: confirm
        }
      });

      showPasswordMessage('success', response.message || 'Contrasea actualizada correctamente.');
      showToast('Contrasea actualizada correctamente.', 'success');
      setTimeout(() => {
        modalManager.close('changePasswordModal');
      }, 1200);
    } catch (error) {
      console.error(' Error cambiando contrasea:', error);
      showPasswordMessage('error', error.message || 'No se pudo cambiar la contrasea.');
    }
  }

  function setActiveSection(sectionId) {
    Object.entries(sections).forEach(([id, element]) => {
      if (!element) return;
      element.classList.toggle('active', id === sectionId && !element.classList.contains('hidden-by-role'));
    });

    navMenu.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionId);
    });

    sidebarElement?.classList.remove('show');

    // Marcar en <body> cuando la sección de categorías está activa (para CSS específico)
    document.body.classList.toggle('section-categorias', sectionId === 'categorias');

    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    url.searchParams.set('section', sectionId);
    window.history.replaceState({}, '', url.toString());

    // Si se activa Usuarios, disparar bootstrap perezoso
    if (sectionId === 'usuarios' && role === 'admin') {
      try { ensureUsersBootstrapped(); } catch (_) {}
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return alert(message);
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-circle-info'
    };
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info} toast-icon"></i>
      <div class="toast-content">${message}</div>
      <button class="toast-close"><i class="fas fa-xmark"></i></button>
    `;
    container.appendChild(toast);
    const close = () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 250);
    };
    toast.querySelector('.toast-close')?.addEventListener('click', close);
    setTimeout(close, 3500);
  }

  function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value || '';
    }
  }

  function getStoredUserData() {
    try {
      return JSON.parse(localStorage.getItem('userData')) || {};
    } catch {
      return {};
    }
  }

  function extractNameParts(fullName) {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { nombres: '', apellidos: '' };
    }
    if (parts.length === 1) {
      return { nombres: parts[0], apellidos: '' };
    }
    const apellidos = parts.pop();
    return { nombres: parts.join(' '), apellidos };
  }

  function normalizeRoleValue(value) {
    if (!value) return 'secretaria';
    const normalized = value.toString().toLowerCase();
    if (normalized.startsWith('admin')) return 'admin';
    if (normalized.startsWith('secret')) return 'secretaria';
    return normalized;
  }

  function formatRoleLabel(role) {
    if (!role) return 'Rol';
    const normalized = String(role).toLowerCase();
    if (normalized === 'admin' || normalized === 'administrador') return 'Administrador';
    if (normalized.startsWith('secret')) return 'Secretara';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  function updatePasswordFeedback(value) {
    clearPasswordMessage();
    let score = 0;
    PASSWORD_RULES.forEach(rule => {
      const passed = rule.test(value);
      applyPasswordRule(rule.id, passed);
      if (passed) score += 1;
    });
    updateStrengthMeter(score, value);
  }

  function applyPasswordRule(ruleId, passed) {
    const item = document.getElementById(ruleId);
    if (!item) return;
    item.classList.remove('valid', 'invalid');
    item.classList.add(passed ? 'valid' : 'invalid');
    const icon = item.querySelector('i');
    if (icon) {
      icon.className = `fas ${passed ? 'fa-check' : 'fa-times'}`;
    }
  }

  function updateStrengthMeter(score, value) {
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');
    if (!fill || !text) return;

    fill.className = 'strength-fill';

    if (!value) {
      text.textContent = 'Fortaleza de la contrasea';
      return;
    }

    if (score <= 1) {
      fill.classList.add('weak');
      text.textContent = 'Muy dbil';
    } else if (score === 2) {
      fill.classList.add('fair');
      text.textContent = 'Dbil';
    } else if (score === 3) {
      fill.classList.add('good');
      text.textContent = 'Media';
    } else {
      fill.classList.add('strong');
      text.textContent = 'Fuerte';
    }
  }

  function isPasswordValid(value) {
    return PASSWORD_RULES.every(rule => rule.test(value));
  }

  function togglePasswordField(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.className = `fas ${isPassword ? 'fa-eye-slash' : 'fa-eye'}`;
  }

  function showPasswordMessage(type, message) {
    const container = document.getElementById('passwordMessageContainer');
    if (!container) return;
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-triangle',
      info: 'fa-circle-info',
      warning: 'fa-exclamation-triangle'
    };
    container.className = `message-container ${type}`;
    container.innerHTML = `
      <div class="message ${type}">
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
      </div>
    `;
  }

  function clearPasswordMessage() {
    const container = document.getElementById('passwordMessageContainer');
    if (container) {
      container.className = 'message-container';
      container.innerHTML = '';
    }
  }

  function resetChangePasswordModal() {
    document.getElementById('changePasswordForm')?.reset();
    updatePasswordFeedback('');
    clearPasswordMessage();
    PASSWORD_RULES.forEach(rule => applyPasswordRule(rule.id, false));
    ['currentPasswordIcon', 'newPasswordIcon', 'confirmPasswordIcon'].forEach(iconId => {
      const icon = document.getElementById(iconId);
      if (icon) {
        icon.className = 'fas fa-eye';
      }
    });
  }

  // Renderiza la pgina actual del listado de productos del modal por categora
  function renderCategoryProductsPage() {
    const bodyEl = document.getElementById('categoryProductsBody');
    const infoEl = document.getElementById('categoryProductsPageInfo');
    const prevBtn = document.getElementById('categoryProductsPrev');
    const nextBtn = document.getElementById('categoryProductsNext');

    if (!bodyEl || !categoryProductsState) return;
    const { items, page, pageSize, total } = categoryProductsState;

    if (!items || total === 0) {
      bodyEl.innerHTML = `<tr><td colspan="6"><p class="empty-state">No hay productos asociados a esta categora.</p></td></tr>`;
      if (infoEl) infoEl.textContent = 'Mostrando 00 de 0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), maxPage);
    if (safePage !== page) {
      categoryProductsState.page = safePage;
    }
    const start = (safePage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const slice = items.slice(start, end);

    bodyEl.innerHTML = slice.map(p => `
      <tr>
        <td>${p.code}</td>
        <td>${p.name}</td>
        <td>${(p.categories || []).map(cat => `<span class=\"tag\">${cat}</span>`).join(' ')}</td>
        <td>${p.cost}</td>
        <td>${p.price}</td>
        <td><span class=\"status-chip ${p.status === 'Activo' ? 'success' : 'warning'}\">${p.status}</span></td>
      </tr>
    `).join('');

    if (infoEl) infoEl.textContent = `Mostrando ${start + 1}${end} de ${total}`;
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= maxPage;
  }

  // === INTEGRACIÓN: Setup del modal inventoryEntryModal desde dashboard.html ===
  // Esta función integra la funcionalidad de entrada usando el modal existente en el HTML
  function setupInventoryEntryModal() {
    // Configurar el modal de entrada usando los IDs del HTML existente
    const modal = document.getElementById('inventoryEntryModal');
    if (!modal) return;
    
    // Inicializar cache de productos si no existe
    if (!window.productosCache) {
      window.productosCache = [];
    }

    const dateEl = document.getElementById('invEntryDate');
    if (dateEl) {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      dateEl.value = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    }

    // Cargar productos desde API
    async function loadProductsForEntry() {
      try {
        const response = await apiRequest(API_ENDPOINTS.productos);
        if (response.success && response.data) {
          window.productosCache = response.data.map(p => ({
            id: p.IdProducto,
            code: p.Codigo,
            name: p.Nombre
          }));
        }
      } catch (err) {
        console.error('Error cargando productos:', err);
        // Usar array vacío si hay error
        window.productosCache = [];
      }
    }

    // Inicializar autocomplete
    const input = document.getElementById('invEntryProdInput');
    const box = document.getElementById('invEntryProdResults');
    
    if (input && box) {
      input.addEventListener('input', () => {
        const term = (input.value || '').toLowerCase().trim();
        const products = window.productosCache || [];
        let matches = products;
        if (term) {
          matches = products.filter(p => 
            p.code.toLowerCase().includes(term) || 
            p.name.toLowerCase().includes(term)
          );
        }
        matches = matches.slice(0, 8);
        
        if (!matches.length) {
          box.style.display = 'none';
          box.innerHTML = '';
          return;
        }
        
        box.innerHTML = matches.map(p => `
          <div class="result-item" data-product-id="${p.id}" data-code="${p.code}" style="padding:10px 12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span>${p.code} | ${p.name}</span>
            <i class="fas fa-arrow-turn-down"></i>
          </div>
        `).join('');
        box.style.display = 'block';
      });

      input.addEventListener('focus', () => {
        if (input.value) input.dispatchEvent(new Event('input'));
      });

      box.addEventListener('click', (e) => {
        const item = e.target.closest('.result-item');
        if (!item) return;
        const id = item.getAttribute('data-product-id');
        const code = item.getAttribute('data-code');
        const products = window.productosCache || [];
        const prod = products.find(p => p.id === parseInt(id));
        if (prod) {
          input.value = prod.code + ' | ' + prod.name;
          input.setAttribute('data-product-id', prod.id);
          box.style.display = 'none';
        }
      });

      document.addEventListener('click', (e) => {
        if (box && !box.contains(e.target) && e.target !== input) {
          box.style.display = 'none';
        }
      });
    }

    // Manejador de submit
    const form = document.getElementById('inventoryEntryForm');
    const submitBtn = document.getElementById('invEntryFormSubmit');
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      const prodInput = document.getElementById('invEntryProdInput');
      const qtyInput = document.getElementById('invEntryQuantity');
      const refInput = document.getElementById('invEntryRef');
      const msgContainer = document.getElementById('invEntryFormMessage');
      
      const idProducto = parseInt(prodInput?.getAttribute('data-product-id'));
      const qty = parseInt(qtyInput?.value || '0', 10);
      const ref = refInput?.value?.trim() || '';
      
      // Validaciones
      if (!idProducto || isNaN(idProducto)) {
        setInvEntryMessage('error', 'Selecciona un producto válido de la lista.');
        return;
      }
      
      if (!qty || qty <= 0) {
        setInvEntryMessage('error', 'Ingresa una cantidad válida mayor a 0.');
        return;
      }
      
      setInvEntryMessage('info', 'Registrando entrada...');
      
      try {
        const response = await apiRequest('/api/inventario/movimiento', {
          method: 'POST',
          body: JSON.stringify({
            idProducto: idProducto,
            cantidad: qty,
            tipo: 'ENTRADA',
            observacion: ref || null
          })
        });
        
        if (!response.success) {
          throw new Error(response.message || 'Error al registrar entrada');
        }
        
        setInvEntryMessage('success', 'Entrada registrada correctamente.');
        showToast('Entrada de inventario registrada', 'success');
        
        // Limpiar formulario
        form.reset();
        prodInput.removeAttribute('data-product-id');
        
        // Recargar datos de inventario
        await renderInventario();
        
        // Cerrar modal después de un momento
        setTimeout(() => {
          modalManager.close('inventoryEntryModal');
          setInvEntryMessage('', '');
        }, 1200);
        
      } catch (err) {
        console.error('Error registrando entrada:', err);
        setInvEntryMessage('error', err.message || 'No se pudo registrar la entrada.');
      }
    };
    
    form?.addEventListener('submit', handleSubmit);
    submitBtn?.addEventListener('click', () => form?.requestSubmit());
    
    // Cargar productos al inicio
    loadProductsForEntry();
  }
  
  function setInvEntryMessage(type, msg) {
    const c = document.getElementById('invEntryFormMessage');
    if (!c) return;
    if (!type || !msg) {
      c.className = 'message-container';
      c.innerHTML = '';
      return;
    }
    c.className = `message-container ${type}`;
    const icons = { 
      success: 'fa-check-circle', 
      error: 'fa-exclamation-triangle', 
      info: 'fa-circle-info', 
      warning: 'fa-exclamation-triangle' 
    };
    c.innerHTML = `<div class="message ${type}"><i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span></div>`;
  }
})();

// Reports base layout reset (global helper, sin Indicadores)
window.resetReportBaseLayout = function () {
  try {
    var mainBody = document.getElementById('repMainBody');
    if (!mainBody) return;
    // Secciones: Resultados (tabla) > Graficas
    mainBody.innerHTML = [
      '<div class="panel-subcard" style="margin-bottom:16px;">',
      '  <div class="card-header"><h3>Resultados</h3></div>',
      '  <div class="table-responsive" style="padding:0 12px 12px;">',
      '    <table class="data-table">',
      '      <thead><tr id="repTableHead"></tr></thead>',
      '      <tbody id="repTableBody"></tbody>',
      '    </table>',
      '  </div>',
      '</div>',
      '<div class="panel-subcard" style="margin-bottom:16px;">',
      '  <div class="card-header" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">',
      '    <h3>Graficas</h3>',
      '    <button class="btn btn-primary btn-sm" id="repChartsPdfBtn" style="display:none;"><i class="fas fa-file-pdf"></i> PDF</button>',
      '  </div>',
      '  <div class="insights-grid" id="repChartsBox" style="padding:12px;"></div>',
      '</div>'
    ].join('');
  } catch (e) { }
};


