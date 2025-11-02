// ================================================================================
// Theme.js - Módulo de gestión de temas (claro/oscuro)
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Sistema de temas claro/oscuro
// Estado: Operativo - Cambia tema sin recargar página
//
// Responsabilidades:
//   ✅ Carga de tema desde localStorage
//   ✅ Aplicación de tema al DOM
//   ✅ Toggle entre tema claro y oscuro
//   ✅ Persistencia de preferencia de usuario
//   ✅ Actualización de iconos del botón de tema
//   ✅ Animaciones suaves de transición
//
// Temas disponibles:
//   - light: Tema claro (por defecto)
//   - dark: Tema oscuro
//
// Funcionamiento:
//   1. Al cargar, verifica tema guardado en localStorage
//   2. Si no existe, usa tema por defecto (configurado en app.config.js)
//   3. Aplica el tema agregando clase CSS al body
//   4. Usuario puede cambiar tema haciendo clic en botón de tema
//   5. Preferencia se guarda automáticamente
//
// Implementación CSS:
//   - Variables CSS personalizadas en dashboard.css
//   - body.dark-theme activa paleta oscura
//   - Transiciones suaves entre temas
//
// Dependencias:
//   - Constants (para claves de storage)
//   - AppConfig (para tema por defecto)
//   - localStorage (para persistencia)
// ================================================================================

/**
 * Gestiona los temas de la aplicación
 */
class Theme {
    constructor() {
        this.currentTheme = null;
        this.themeIcon = null;
        this.themeText = null;
    }

    /**
     * Inicializa el módulo de temas
     */
    init() {
        this.themeIcon = document.getElementById('themeIcon');
        this.themeText = document.getElementById('themeText');
        this.loadTheme();
        console.log('Theme inicializado:', this.currentTheme);
    }

    /**
     * Carga el tema guardado en localStorage
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(Constants.STORAGE_KEYS.THEME) ||
                          AppConfig.ui.defaultTheme;

        this.applyTheme(savedTheme, false);
    }

    /**
     * Aplica un tema
     * @param {string} theme - Tema a aplicar ('light' | 'dark')
     * @param {boolean} save - Si debe guardar en localStorage
     */
    applyTheme(theme, save = true) {
        // Validar tema
        if (!AppConfig.ui.themes.includes(theme)) {
            console.warn(`Tema inválido: ${theme}, usando por defecto`);
            theme = AppConfig.ui.defaultTheme;
        }

        this.currentTheme = theme;

        // Actualizar atributo del body
        document.body.setAttribute('data-theme', theme);

        // Agregar/remover clase dark-theme
        if (theme === Constants.THEMES.DARK) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Actualizar iconos
        this.updateThemeIcon(theme);

        // Guardar en localStorage si se requiere
        if (save) {
            localStorage.setItem(Constants.STORAGE_KEYS.THEME, theme);
        }

        console.log(`Tema aplicado: ${theme}`);
    }

    /**
     * Alterna entre tema claro y oscuro
     */
    toggleTheme() {
        const newTheme = this.currentTheme === Constants.THEMES.LIGHT
            ? Constants.THEMES.DARK
            : Constants.THEMES.LIGHT;

        this.applyTheme(newTheme, true);

        // Evento personalizado
        this.dispatchThemeChangeEvent(newTheme);
    }

    /**
     * Actualiza el icono del tema en el header
     * @param {string} theme - Tema actual
     */
    updateThemeIcon(theme) {
        if (!this.themeIcon || !this.themeText) {
            return;
        }

        if (theme === Constants.THEMES.DARK) {
            this.themeIcon.className = Constants.ICONS.THEME_DARK;
            this.themeText.textContent = 'Tema Claro';
        } else {
            this.themeIcon.className = Constants.ICONS.THEME;
            this.themeText.textContent = 'Tema Oscuro';
        }
    }

    /**
     * Obtiene el tema actual
     * @returns {string} Tema actual
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Verifica si el tema oscuro está activo
     * @returns {boolean} true si el tema oscuro está activo
     */
    isDarkMode() {
        return this.currentTheme === Constants.THEMES.DARK;
    }

    /**
     * Verifica si el tema claro está activo
     * @returns {boolean} true si el tema claro está activo
     */
    isLightMode() {
        return this.currentTheme === Constants.THEMES.LIGHT;
    }

    /**
     * Establece un tema específico
     * @param {string} theme - Tema a establecer
     */
    setTheme(theme) {
        this.applyTheme(theme, true);
    }

    /**
     * Detecta la preferencia del sistema operativo
     * @returns {string} Tema preferido del sistema
     */
    detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return Constants.THEMES.DARK;
        }
        return Constants.THEMES.LIGHT;
    }

    /**
     * Usa la preferencia del sistema
     */
    useSystemPreference() {
        const systemTheme = this.detectSystemPreference();
        this.applyTheme(systemTheme, true);
    }

    /**
     * Escucha cambios en la preferencia del sistema
     */
    watchSystemPreference() {
        if (!window.matchMedia) return;

        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

        darkModeQuery.addEventListener('change', (e) => {
            const newTheme = e.matches ? Constants.THEMES.DARK : Constants.THEMES.LIGHT;
            console.log('Preferencia del sistema cambió a:', newTheme);
            this.applyTheme(newTheme, true);
        });
    }

    /**
     * Dispara un evento personalizado cuando cambia el tema
     * @param {string} newTheme - Nuevo tema
     */
    dispatchThemeChangeEvent(newTheme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: newTheme,
                previousTheme: this.currentTheme === Constants.THEMES.DARK
                    ? Constants.THEMES.LIGHT
                    : Constants.THEMES.DARK
            }
        });

        document.dispatchEvent(event);
    }

    /**
     * Registra un listener para cambios de tema
     * @param {Function} callback - Función a ejecutar cuando cambia el tema
     */
    onThemeChange(callback) {
        if (typeof callback !== 'function') return;

        document.addEventListener('themechange', (e) => {
            callback(e.detail.theme, e.detail.previousTheme);
        });
    }
}

// Exportar la clase
window.Theme = Theme;
