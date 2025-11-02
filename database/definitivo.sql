/* =========================================================
   PROYECTO DE LABORATORIO – PARTE 1
   SISTEMA DE GESTIÓN DE ESTUDIANTES Y USUARIOS
   Seguridad, roles, bitácoras, recuperación de contraseña
   + Optimización con índices y permisos mínimos necesarios
   + GRANT de vista y validación de rol NULL
   ========================================================= */
------------------------------------------------------------
-- 0) CREACIÓN DE BASE DE DATOS Y ESQUEMA
------------------------------------------------------------

IF DB_ID('AcademicoDB') IS NULL
    CREATE DATABASE AcademicoDB;
GO
USE AcademicoDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'seg')
    EXEC('CREATE SCHEMA seg AUTHORIZATION dbo;');
GO

------------------------------------------------------------
-- 1) TABLAS
------------------------------------------------------------
-- Usuarios
IF OBJECT_ID('seg.tbUsuario') IS NOT NULL DROP TABLE seg.tbUsuario;
CREATE TABLE seg.tbUsuario
(
    IdUsuario        INT IDENTITY(1,1) PRIMARY KEY,
    Usuario          VARCHAR(50)   NOT NULL UNIQUE,
    Nombres          VARCHAR(100)  NOT NULL,
    Apellidos        VARCHAR(100)  NOT NULL,
    HashPassword     VARBINARY(32) NOT NULL,  -- SHA2_256 de 32 bits
    Salt             VARBINARY(16) NOT NULL,
    Correo           VARCHAR(120)  NOT NULL UNIQUE,
    Rol              VARCHAR(20)   NOT NULL CHECK (Rol IN ('admin','secretaria')),
    Estado           BIT           NOT NULL CONSTRAINT DF_tbUsuario_Estado DEFAULT(1),
    FechaCreacion    DATETIME2(0)  NOT NULL CONSTRAINT DF_tbUsuario_FC DEFAULT(SYSDATETIME()),
    UltimoCambioPass DATETIME2(0)  NULL,
    EsPasswordTemporal BIT         NOT NULL CONSTRAINT DF_tbUsuario_TempPass DEFAULT(0),
    FechaExpiraPassword DATETIME2(0) NULL
);
GO

-- Estudiantes (Carné como Primary Key - SIN Estado)
IF OBJECT_ID('seg.tbEstudiante') IS NOT NULL DROP TABLE seg.tbEstudiante;
CREATE TABLE seg.tbEstudiante
(
    Carne         VARCHAR(20)  PRIMARY KEY,
    Nombres       VARCHAR(100) NOT NULL,
    Apellidos     VARCHAR(100) NOT NULL,
    Carrera       VARCHAR(100) NOT NULL,
    FechaNac      DATE         NULL,
    Correo        VARCHAR(120) NULL,
    Telefono      VARCHAR(25)  NULL,
    FechaRegistro DATETIME2(0) NOT NULL CONSTRAINT DF_tbEst_FR DEFAULT(SYSDATETIME())
);
GO

-- Bitácora de accesos (SIN IP_Cliente)
IF OBJECT_ID('seg.tbBitacoraAcceso') IS NOT NULL DROP TABLE seg.tbBitacoraAcceso;
CREATE TABLE seg.tbBitacoraAcceso
(
    IdAcceso   BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario  INT         NOT NULL,
    Usuario    VARCHAR(50) NOT NULL,
    FechaHora  DATETIME2(0) NOT NULL CONSTRAINT DF_BitAcceso_FH DEFAULT(SYSDATETIME()),
    Resultado  VARCHAR(20)  NOT NULL  -- OK o FAIL
);
GO

-- Bitácora de transacciones
IF OBJECT_ID('seg.tbBitacoraTransacciones') IS NOT NULL DROP TABLE seg.tbBitacoraTransacciones;
CREATE TABLE seg.tbBitacoraTransacciones
(
    IdTransaccion BIGINT IDENTITY(1,1) PRIMARY KEY,
    FechaHora     DATETIME2(0) NOT NULL CONSTRAINT DF_BitTx_FH DEFAULT(SYSDATETIME()),
    Usuario       VARCHAR(50)  NOT NULL,
    IdUsuario     INT          NOT NULL,
    Operacion     VARCHAR(30)  NOT NULL,
    Entidad       VARCHAR(30)  NOT NULL,
    ClaveEntidad  VARCHAR(100) NOT NULL,
    Detalle       NVARCHAR(4000) NULL
);
GO

-- Recuperación de contraseña (tokens)
IF OBJECT_ID('seg.tbRecuperacionContrasena') IS NOT NULL DROP TABLE seg.tbRecuperacionContrasena;
CREATE TABLE seg.tbRecuperacionContrasena
(
    IdToken       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    IdUsuario     INT NOT NULL,
    Token         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    FechaCreacion DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    FechaExpira   DATETIME2(0) NOT NULL,
    Usado         BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Rec_User FOREIGN KEY(IdUsuario) REFERENCES seg.tbUsuario(IdUsuario)
);
GO

------------------------------------------------------------
-- 1.1) ÍNDICES NO CLUSTER / OPTIMIZATION
------------------------------------------------------------

-- tbUsuario
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbUsuario_Rol_Estado' AND object_id = OBJECT_ID('seg.tbUsuario'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_tbUsuario_Rol_Estado
    ON seg.tbUsuario (Rol, Estado)
    INCLUDE (Usuario, Nombres, Apellidos, Correo, FechaCreacion);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbUsuario_FechaCreacion' AND object_id = OBJECT_ID('seg.tbUsuario'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_tbUsuario_FechaCreacion
    ON seg.tbUsuario (FechaCreacion);
END
GO

-- Índice para búsquedas por apellidos y nombres
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbUsuario_Apellidos_Nombres' AND object_id = OBJECT_ID('seg.tbUsuario'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_tbUsuario_Apellidos_Nombres
    ON seg.tbUsuario (Apellidos, Nombres)
    INCLUDE (Usuario, Correo, Rol, Estado);
END
GO

-- tbEstudiante (actualizados sin Estado)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbEstudiante_Apellidos_Nombres' AND object_id = OBJECT_ID('seg.tbEstudiante'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_tbEstudiante_Apellidos_Nombres
    ON seg.tbEstudiante (Apellidos, Nombres)
    INCLUDE (Carrera, FechaRegistro);
END
GO

-- Índice por carrera para consultas frecuentes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbEstudiante_Carrera' AND object_id = OBJECT_ID('seg.tbEstudiante'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_tbEstudiante_Carrera
    ON seg.tbEstudiante (Carrera)
    INCLUDE (Nombres, Apellidos, FechaRegistro);
END
GO

-- tbBitacoraAcceso (AJUSTADO - sin IP_Cliente)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BitAcceso_IdUsuario_Fecha' AND object_id = OBJECT_ID('seg.tbBitacoraAcceso'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_BitAcceso_IdUsuario_Fecha
    ON seg.tbBitacoraAcceso (IdUsuario, FechaHora DESC)
    INCLUDE (Resultado, Usuario);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BitAcceso_FAIL' AND object_id = OBJECT_ID('seg.tbBitacoraAcceso'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_BitAcceso_FAIL
    ON seg.tbBitacoraAcceso (Resultado)
    INCLUDE (IdUsuario, FechaHora)
    WHERE Resultado = 'FAIL';
END
GO

-- tbBitacoraTransacciones
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BitTx_Fecha' AND object_id = OBJECT_ID('seg.tbBitacoraTransacciones'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_BitTx_Fecha
    ON seg.tbBitacoraTransacciones (FechaHora DESC)
    INCLUDE (Usuario, Operacion, Entidad, ClaveEntidad);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BitTx_Operacion_Entidad' AND object_id = OBJECT_ID('seg.tbBitacoraTransacciones'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_BitTx_Operacion_Entidad
    ON seg.tbBitacoraTransacciones (Operacion, Entidad)
    INCLUDE (FechaHora, Usuario, ClaveEntidad);
END
GO

-- tbRecuperacionContrasena
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Recuperacion_Token' AND object_id = OBJECT_ID('seg.tbRecuperacionContrasena'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_Recuperacion_Token
    ON seg.tbRecuperacionContrasena (Token);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Recuperacion_Vigente' AND object_id = OBJECT_ID('seg.tbRecuperacionContrasena'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Recuperacion_Vigente
    ON seg.tbRecuperacionContrasena (IdUsuario, FechaCreacion DESC)
    INCLUDE (FechaExpira, Token)       
    WHERE Usado = 0;
END
GO

------------------------------------------------------------
-- 2) FUNCIONES DE UTILIDAD
------------------------------------------------------------

-- Validar contraseña fuerte
IF OBJECT_ID('seg.fn_IsPasswordStrong') IS NOT NULL DROP FUNCTION seg.fn_IsPasswordStrong;
GO
CREATE FUNCTION seg.fn_IsPasswordStrong (@pwd NVARCHAR(200))
RETURNS BIT
AS
BEGIN
    DECLARE @ok BIT = 1;
    IF LEN(@pwd) < 8 SET @ok = 0;
    IF @pwd NOT LIKE '%[A-Z]%' SET @ok = 0;
    IF @pwd NOT LIKE '%[a-z]%' SET @ok = 0;
    IF @pwd NOT LIKE '%[0-9]%' SET @ok = 0;
    IF @pwd NOT LIKE '%[^0-9A-Za-z]%' SET @ok = 0;
    RETURN @ok;
END;
GO

-- Hash con salt (SHA2-256)
IF OBJECT_ID('seg.fn_HashWithSalt') IS NOT NULL DROP FUNCTION seg.fn_HashWithSalt;
GO
CREATE FUNCTION seg.fn_HashWithSalt (@pwd NVARCHAR(200), @salt VARBINARY(16))
RETURNS VARBINARY(32)
AS
BEGIN
    RETURN HASHBYTES('SHA2_256', @salt + CONVERT(VARBINARY(400), @pwd));
END;
GO

-- Generar carné automático (Año + 5 dígitos aleatorios) - COMO PROCEDIMIENTO
IF OBJECT_ID('seg.sp_GenerarCarne') IS NOT NULL DROP PROCEDURE seg.sp_GenerarCarne;
GO
CREATE PROCEDURE seg.sp_GenerarCarne
    @CarneGenerado VARCHAR(20) OUTPUT
AS
BEGIN
    DECLARE @ano VARCHAR(4) = CAST(YEAR(SYSDATETIME()) AS VARCHAR(4));
    DECLARE @aleatorio VARCHAR(5);

    -- Generar 5 dígitos aleatorios usando CHECKSUM y NEWID()
    SET @aleatorio = RIGHT('00000' + CAST(ABS(CHECKSUM(NEWID())) % 100000 AS VARCHAR(5)), 5);

    SET @CarneGenerado = @ano + @aleatorio;
END;
GO

------------------------------------------------------------
-- 3) PROCEDIMIENTOS ALMACENADOS
------------------------------------------------------------

-- Registrar usuario
IF OBJECT_ID('seg.sp_RegistrarUsuario') IS NOT NULL DROP PROCEDURE seg.sp_RegistrarUsuario;
GO
CREATE PROCEDURE seg.sp_RegistrarUsuario
    @Usuario     VARCHAR(50),
    @Nombres     VARCHAR(100),
    @Apellidos   VARCHAR(100),
    @Correo      VARCHAR(120),
    @Rol         VARCHAR(20),
    @Password    NVARCHAR(200),
    @Confirmar   NVARCHAR(200),
    @Mensaje     NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Usuario=@Usuario)
    BEGIN SET @Mensaje=N'Usuario ya existe'; RETURN 101; END

    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Correo=@Correo)
    BEGIN SET @Mensaje=N'Correo duplicado'; RETURN 102; END

    IF @Rol NOT IN ('admin','secretaria')
    BEGIN SET @Mensaje=N'Rol inválido'; RETURN 103; END

    IF seg.fn_IsPasswordStrong(@Password)=0
    BEGIN SET @Mensaje=N'Contraseña débil'; RETURN 201; END

    IF @Password<>@Confirmar
    BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @salt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32)=seg.fn_HashWithSalt(@Password,@salt);

    INSERT INTO seg.tbUsuario(Usuario,Nombres,Apellidos,HashPassword,Salt,Correo,Rol,Estado,UltimoCambioPass)
    VALUES(@Usuario,@Nombres,@Apellidos,@hash,@salt,@Correo,@Rol,1,SYSDATETIME());

    SET @Mensaje=N'Usuario registrado';
    RETURN 0;
END;
GO

/* agregamos vendedor
ALTER PROCEDURE seg.sp_RegistrarUsuario
    @Usuario     VARCHAR(50),
    @Nombres     VARCHAR(100),
    @Apellidos   VARCHAR(100),
    @Correo      VARCHAR(120),
    @Rol         VARCHAR(20),
    @Password    NVARCHAR(200),
    @Confirmar   NVARCHAR(200),
    @Mensaje     NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Usuario=@Usuario)
    BEGIN SET @Mensaje=N'Usuario ya existe'; RETURN 101; END

    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Correo=@Correo)
    BEGIN SET @Mensaje=N'Correo duplicado'; RETURN 102; END

    -- ✅ Aquí agregamos 'vendedor' como rol permitido
    IF @Rol NOT IN ('admin','secretaria','vendedor')
    BEGIN SET @Mensaje=N'Rol inválido'; RETURN 103; END

    IF seg.fn_IsPasswordStrong(@Password)=0
    BEGIN SET @Mensaje=N'Contraseña débil'; RETURN 201; END

    IF @Password<>@Confirmar
    BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @salt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32)=seg.fn_HashWithSalt(@Password,@salt);

    INSERT INTO seg.tbUsuario(Usuario,Nombres,Apellidos,HashPassword,Salt,Correo,Rol,Estado,UltimoCambioPass)
    VALUES(@Usuario,@Nombres,@Apellidos,@hash,@salt,@Correo,@Rol,1,SYSDATETIME());

    SET @Mensaje=N'Usuario registrado';
    RETURN 0;
END;
GO

*/

-- Login (AJUSTADO - sin IP_Cliente)
IF OBJECT_ID('seg.sp_LoginUsuario') IS NOT NULL DROP PROCEDURE seg.sp_LoginUsuario;
GO
CREATE PROCEDURE seg.sp_LoginUsuario
    @Usuario    VARCHAR(50),
    @Password   NVARCHAR(200),
    @Mensaje    NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id INT,@salt VARBINARY(16),@hash VARBINARY(32),@calc VARBINARY(32),@estado BIT;

    SELECT @id=IdUsuario,@salt=Salt,@hash=HashPassword,@estado=Estado
    FROM seg.tbUsuario WHERE Usuario=@Usuario;

    IF @id IS NULL OR @estado=0
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado)
        VALUES(ISNULL(@id,-1),@Usuario,'FAIL');
        SET @Mensaje=N'Credenciales inválidas'; RETURN 301;
    END

    SET @calc=seg.fn_HashWithSalt(@Password,@salt);
    IF @calc<>@hash
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado)
        VALUES(@id,@Usuario,'FAIL');
        SET @Mensaje=N'Credenciales inválidas'; RETURN 302;
    END

    INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado)
    VALUES(@id,@Usuario,'OK');

    SET @Mensaje=N'Login correcto';
    RETURN 0;
END;
GO

-- Insertar estudiante (CON GENERACIÓN AUTOMÁTICA DE CARNÉ)
IF OBJECT_ID('seg.sp_InsertarEstudiante') IS NOT NULL DROP PROCEDURE seg.sp_InsertarEstudiante;
GO
CREATE PROCEDURE seg.sp_InsertarEstudiante
    @UsuarioEjecutor VARCHAR(50),
    @Nombres VARCHAR(100),
    @Apellidos VARCHAR(100),
    @Carrera VARCHAR(100),
    @FechaNac DATE=NULL,
    @Correo VARCHAR(120)=NULL,
    @Telefono VARCHAR(25)=NULL,
    @CarneGenerado VARCHAR(20) OUTPUT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rol VARCHAR(20), @idUser INT;
    SELECT @rol=Rol, @idUser=IdUsuario
    FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;

    IF @rol IS NULL OR @rol NOT IN('admin','secretaria')
    BEGIN SET @Mensaje=N'Sin permisos'; RETURN 401; END

    -- Generar carné único (máximo 10 intentos)
    DECLARE @intentos INT = 0;
    DECLARE @carneTemp VARCHAR(20);

    WHILE @intentos < 10
    BEGIN
        EXEC seg.sp_GenerarCarne @carneTemp OUTPUT;

        IF NOT EXISTS(SELECT 1 FROM seg.tbEstudiante WHERE Carne=@carneTemp)
        BEGIN
            SET @CarneGenerado = @carneTemp;
            BREAK;
        END

        SET @intentos = @intentos + 1;
    END

    IF @CarneGenerado IS NULL
    BEGIN SET @Mensaje=N'Error generando carné único'; RETURN 499; END

    INSERT INTO seg.tbEstudiante(Carne,Nombres,Apellidos,Carrera,FechaNac,Correo,Telefono)
    VALUES(@CarneGenerado,@Nombres,@Apellidos,@Carrera,@FechaNac,@Correo,@Telefono);

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUser,'INSERTAR_ESTUDIANTE','tbEstudiante',@CarneGenerado,N'Inserción registrada - Carné: ' + @CarneGenerado);

    SET @Mensaje=N'Estudiante insertado con carné: ' + @CarneGenerado;
    RETURN 0;
END;
GO

-- Actualizar estudiante
IF OBJECT_ID('seg.sp_ActualizarEstudiante') IS NOT NULL DROP PROCEDURE seg.sp_ActualizarEstudiante;
GO
CREATE PROCEDURE seg.sp_ActualizarEstudiante
    @UsuarioEjecutor VARCHAR(50),
    @Carne VARCHAR(20),
    @Nombres VARCHAR(100),
    @Apellidos VARCHAR(100),
    @Carrera VARCHAR(100),
    @FechaNac DATE=NULL,
    @Correo VARCHAR(120)=NULL,
    @Telefono VARCHAR(25)=NULL,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rol VARCHAR(20), @idUser INT;
    SELECT @rol=Rol, @idUser=IdUsuario
    FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;

    IF @rol<>'admin' BEGIN SET @Mensaje=N'Solo admin puede actualizar'; RETURN 403; END

    IF NOT EXISTS(SELECT 1 FROM seg.tbEstudiante WHERE Carne=@Carne)
    BEGIN SET @Mensaje=N'Estudiante no existe'; RETURN 404; END

    UPDATE seg.tbEstudiante
    SET Nombres=@Nombres,Apellidos=@Apellidos,Carrera=@Carrera,
        FechaNac=@FechaNac,Correo=@Correo,Telefono=@Telefono
    WHERE Carne=@Carne;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUser,'ACTUALIZAR_ESTUDIANTE','tbEstudiante',@Carne,N'Actualización registrada');

    SET @Mensaje=N'Estudiante actualizado';
    RETURN 0;
END;
GO

-- Eliminar estudiante
IF OBJECT_ID('seg.sp_EliminarEstudiante') IS NOT NULL DROP PROCEDURE seg.sp_EliminarEstudiante;
GO
CREATE PROCEDURE seg.sp_EliminarEstudiante
    @UsuarioEjecutor VARCHAR(50),
    @Carne VARCHAR(20),
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rol VARCHAR(20),@idUser INT;
    SELECT @rol=Rol,@idUser=IdUsuario FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;
    IF @rol<>'admin' BEGIN SET @Mensaje=N'Solo admin puede eliminar'; RETURN 405; END

    IF NOT EXISTS(SELECT 1 FROM seg.tbEstudiante WHERE Carne=@Carne)
    BEGIN SET @Mensaje=N'Estudiante no existe'; RETURN 404; END

    DELETE FROM seg.tbEstudiante WHERE Carne=@Carne;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUser,'ELIMINAR_ESTUDIANTE','tbEstudiante',@Carne,N'Eliminación registrada (Carné=' + @Carne + N')');

    SET @Mensaje=N'Estudiante eliminado';
    RETURN 0;
END;
GO

-- Actualizar contraseña
IF OBJECT_ID('seg.sp_ActualizarContrasena') IS NOT NULL DROP PROCEDURE seg.sp_ActualizarContrasena;
GO
CREATE PROCEDURE seg.sp_ActualizarContrasena
    @Usuario VARCHAR(50),
    @PasswordActual NVARCHAR(200),
    @PasswordNueva NVARCHAR(200),
    @ConfirmarNueva NVARCHAR(200),
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id INT,@salt VARBINARY(16),@hash VARBINARY(32),@calc VARBINARY(32);
    SELECT @id=IdUsuario,@salt=Salt,@hash=HashPassword FROM seg.tbUsuario WHERE Usuario=@Usuario AND Estado=1;
    IF @id IS NULL BEGIN SET @Mensaje=N'Usuario inválido'; RETURN 301; END

    SET @calc=seg.fn_HashWithSalt(@PasswordActual,@salt);
    IF @calc<>@hash BEGIN SET @Mensaje=N'Contraseña actual incorrecta'; RETURN 303; END

    IF seg.fn_IsPasswordStrong(@PasswordNueva)=0
    BEGIN SET @Mensaje=N'Contraseña nueva débil'; RETURN 201; END

    IF @PasswordNueva<>@ConfirmarNueva
    BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @newSalt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @newHash VARBINARY(32)=seg.fn_HashWithSalt(@PasswordNueva,@newSalt);

    UPDATE seg.tbUsuario
    SET HashPassword=@newHash,Salt=@newSalt,UltimoCambioPass=SYSDATETIME()
    WHERE IdUsuario=@id;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@Usuario,@id,'CAMBIO_CONTRASENA','tbUsuario',CONCAT('IdUsuario=',@id),N'Password actualizado por el usuario');

    SET @Mensaje=N'Contraseña actualizada';
    RETURN 0;
END;
GO

-- Actualizar usuario (solo admin)
IF OBJECT_ID('seg.sp_ActualizarUsuario') IS NOT NULL DROP PROCEDURE seg.sp_ActualizarUsuario;
GO
CREATE PROCEDURE seg.sp_ActualizarUsuario
    @UsuarioEjecutor VARCHAR(50),
    @IdUsuario INT,
    @Usuario VARCHAR(50),
    @Nombres VARCHAR(100),
    @Apellidos VARCHAR(100),
    @Correo VARCHAR(120),
    @Rol VARCHAR(20),
    @Estado BIT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rolEjecutor VARCHAR(20), @idUserEjecutor INT;
    
    -- Validar que quien ejecuta sea admin
    SELECT @rolEjecutor=Rol, @idUserEjecutor=IdUsuario
    FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;
    
    IF @rolEjecutor<>'admin' 
    BEGIN SET @Mensaje=N'Solo admin puede actualizar usuarios'; RETURN 601; END

    -- Validar que el usuario a actualizar exista
    IF NOT EXISTS(SELECT 1 FROM seg.tbUsuario WHERE IdUsuario=@IdUsuario)
    BEGIN SET @Mensaje=N'Usuario no existe'; RETURN 602; END

    -- Validar rol válido
    IF @Rol NOT IN ('admin','secretaria')
    BEGIN SET @Mensaje=N'Rol inválido'; RETURN 103; END

    -- Validar usuario único (excluyendo el actual)
    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Usuario=@Usuario AND IdUsuario<>@IdUsuario)
    BEGIN SET @Mensaje=N'Usuario ya existe'; RETURN 101; END

    -- Validar correo único (excluyendo el actual)
    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Correo=@Correo AND IdUsuario<>@IdUsuario)
    BEGIN SET @Mensaje=N'Correo duplicado'; RETURN 102; END

    -- Realizar actualización
    UPDATE seg.tbUsuario
    SET Usuario=@Usuario, Nombres=@Nombres, Apellidos=@Apellidos, Correo=@Correo, Rol=@Rol, Estado=@Estado
    WHERE IdUsuario=@IdUsuario;

    -- Registrar en bitácora
    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUserEjecutor,'ACTUALIZAR_USUARIO','tbUsuario',CONCAT('IdUsuario=',@IdUsuario),
           N'Usuario actualizado: ' + @Usuario + N', Nombres: ' + @Nombres + N' ' + @Apellidos + N', Rol: ' + @Rol + N', Estado: ' + CAST(@Estado AS NVARCHAR(1)));

    SET @Mensaje=N'Usuario actualizado correctamente';
    RETURN 0;
END;
GO

-- Deshabilitar usuario (solo admin - eliminación lógica)
IF OBJECT_ID('seg.sp_DeshabilitarUsuario') IS NOT NULL DROP PROCEDURE seg.sp_DeshabilitarUsuario;
GO
CREATE PROCEDURE seg.sp_DeshabilitarUsuario
    @UsuarioEjecutor VARCHAR(50),
    @IdUsuario INT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rolEjecutor VARCHAR(20), @idUserEjecutor INT, @usuarioEliminar VARCHAR(50);

    -- Validar que quien ejecuta sea admin
    SELECT @rolEjecutor=Rol, @idUserEjecutor=IdUsuario
    FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;

    IF @rolEjecutor<>'admin'
    BEGIN SET @Mensaje=N'Solo admin puede deshabilitar usuarios'; RETURN 603; END

    -- Validar que el usuario a deshabilitar exista y esté activo
    SELECT @usuarioEliminar=Usuario
    FROM seg.tbUsuario WHERE IdUsuario=@IdUsuario AND Estado=1;

    IF @usuarioEliminar IS NULL
    BEGIN SET @Mensaje=N'Usuario no existe o ya está inactivo'; RETURN 604; END

    -- Prevenir auto-deshabilitación
    IF @idUserEjecutor=@IdUsuario
    BEGIN SET @Mensaje=N'No puede deshabilitarse a sí mismo'; RETURN 605; END

    -- Cambiar estado a inactivo
    UPDATE seg.tbUsuario
    SET Estado=0
    WHERE IdUsuario=@IdUsuario;

    -- Registrar en bitácora
    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUserEjecutor,'DESHABILITAR_USUARIO','tbUsuario',CONCAT('IdUsuario=',@IdUsuario),
           N'Usuario deshabilitado: ' + @usuarioEliminar);

    SET @Mensaje=N'Usuario deshabilitado correctamente';
    RETURN 0;
END;
GO

-- Eliminar usuario físicamente (solo admin - eliminación física)
IF OBJECT_ID('seg.sp_EliminarUsuario') IS NOT NULL DROP PROCEDURE seg.sp_EliminarUsuario;
GO
CREATE PROCEDURE seg.sp_EliminarUsuario
    @UsuarioEjecutor VARCHAR(50),
    @IdUsuario INT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rolEjecutor VARCHAR(20), @idUserEjecutor INT, @usuarioEliminar VARCHAR(50);

    -- Validar que quien ejecuta sea admin
    SELECT @rolEjecutor=Rol, @idUserEjecutor=IdUsuario
    FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;

    IF @rolEjecutor<>'admin'
    BEGIN SET @Mensaje=N'Solo admin puede eliminar usuarios'; RETURN 603; END

    -- Validar que el usuario a eliminar exista
    SELECT @usuarioEliminar=Usuario
    FROM seg.tbUsuario WHERE IdUsuario=@IdUsuario;

    IF @usuarioEliminar IS NULL
    BEGIN SET @Mensaje=N'Usuario no existe'; RETURN 604; END

    -- Prevenir auto-eliminación
    IF @idUserEjecutor=@IdUsuario
    BEGIN SET @Mensaje=N'No puede eliminarse a sí mismo'; RETURN 605; END

    -- Registrar en bitácora ANTES de eliminar
    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUserEjecutor,'ELIMINAR_USUARIO_FISICO','tbUsuario',CONCAT('IdUsuario=',@IdUsuario),
           N'Usuario eliminado físicamente: ' + @usuarioEliminar);

    -- Eliminación física (DELETE del registro)
    DELETE FROM seg.tbUsuario WHERE IdUsuario=@IdUsuario;

    SET @Mensaje=N'Usuario eliminado permanentemente';
    RETURN 0;
END;
GO

-- Rehabilitar usuario (solo admin - cambiar estado a activo)
IF OBJECT_ID('seg.sp_RehabilitarUsuario') IS NOT NULL DROP PROCEDURE seg.sp_RehabilitarUsuario;
GO
CREATE PROCEDURE seg.sp_RehabilitarUsuario
    @UsuarioEjecutor VARCHAR(50),
    @IdUsuario INT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rolEjecutor VARCHAR(20), @idUserEjecutor INT, @usuarioRehabilitar VARCHAR(50);

    -- Validar que quien ejecuta sea admin
    SELECT @rolEjecutor=Rol, @idUserEjecutor=IdUsuario
    FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;

    IF @rolEjecutor<>'admin'
    BEGIN SET @Mensaje=N'Solo admin puede rehabilitar usuarios'; RETURN 606; END

    -- Validar que el usuario a rehabilitar exista y esté inactivo
    SELECT @usuarioRehabilitar=Usuario
    FROM seg.tbUsuario WHERE IdUsuario=@IdUsuario AND Estado=0;

    IF @usuarioRehabilitar IS NULL
    BEGIN SET @Mensaje=N'Usuario no existe o ya está activo'; RETURN 607; END

    -- Cambiar estado a activo
    UPDATE seg.tbUsuario
    SET Estado=1
    WHERE IdUsuario=@IdUsuario;

    -- Registrar en bitácora
    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUserEjecutor,'REHABILITAR_USUARIO','tbUsuario',CONCAT('IdUsuario=',@IdUsuario),
           N'Usuario rehabilitado: ' + @usuarioRehabilitar);

    SET @Mensaje=N'Usuario rehabilitado correctamente';
    RETURN 0;
END;
GO

-- Cambiar contraseña temporal
IF OBJECT_ID('seg.sp_CambiarPasswordTemporal') IS NOT NULL DROP PROCEDURE seg.sp_CambiarPasswordTemporal;
GO
CREATE PROCEDURE seg.sp_CambiarPasswordTemporal
    @Usuario VARCHAR(50),
    @PasswordActual NVARCHAR(200),
    @PasswordNueva NVARCHAR(200),
    @ConfirmarNueva NVARCHAR(200),
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id INT,@salt VARBINARY(16),@hash VARBINARY(32),@calc VARBINARY(32),@esTemporal BIT,@fechaExpira DATETIME2(0);

    SELECT @id=IdUsuario,@salt=Salt,@hash=HashPassword,@esTemporal=EsPasswordTemporal,@fechaExpira=FechaExpiraPassword
    FROM seg.tbUsuario WHERE Usuario=@Usuario AND Estado=1;

    IF @id IS NULL BEGIN SET @Mensaje=N'Usuario inválido'; RETURN 301; END
    IF @esTemporal = 0 BEGIN SET @Mensaje=N'La contraseña no es temporal'; RETURN 302; END

    -- Verificar si la contraseña temporal ha expirado
    IF @fechaExpira IS NOT NULL AND SYSDATETIME() > @fechaExpira
    BEGIN
        SET @Mensaje = N'La contraseña temporal ha expirado. Solicita una nueva.';
        RETURN 305;
    END

    SET @calc=seg.fn_HashWithSalt(@PasswordActual,@salt);
    IF @calc<>@hash BEGIN SET @Mensaje=N'Contraseña actual incorrecta'; RETURN 303; END

    IF seg.fn_IsPasswordStrong(@PasswordNueva)=0
        BEGIN SET @Mensaje=N'Contraseña nueva débil'; RETURN 201; END
    IF @PasswordNueva<>@ConfirmarNueva
        BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @newSalt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @newHash VARBINARY(32)=seg.fn_HashWithSalt(@PasswordNueva,@newSalt);

    UPDATE seg.tbUsuario
    SET HashPassword=@newHash,Salt=@newSalt,UltimoCambioPass=SYSDATETIME(),EsPasswordTemporal=0,FechaExpiraPassword=NULL
    WHERE IdUsuario=@id;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@Usuario,@id,'CAMBIO_PASSWORD_TEMPORAL','tbUsuario',CONCAT('IdUsuario=',@id),N'Password temporal cambiado por el usuario');

    SET @Mensaje=N'Contraseña actualizada exitosamente';
    RETURN 0;
END;
GO

-- Registrar usuario desde panel de admin (con validación de permisos)
IF OBJECT_ID('seg.sp_RegistrarUsuarioAdmin') IS NOT NULL DROP PROCEDURE seg.sp_RegistrarUsuarioAdmin;
GO
CREATE PROCEDURE seg.sp_RegistrarUsuarioAdmin
    @UsuarioEjecutor VARCHAR(50),
    @Usuario     VARCHAR(50),
    @Nombres     VARCHAR(100),
    @Apellidos   VARCHAR(100),
    @Correo      VARCHAR(120),
    @Rol         VARCHAR(20),
    @Password    NVARCHAR(200),
    @Mensaje     NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rolEjecutor VARCHAR(20), @idUserEjecutor INT;

    -- Validar que quien ejecuta sea admin
    SELECT @rolEjecutor=Rol, @idUserEjecutor=IdUsuario
    FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;

    IF @rolEjecutor<>'admin'
    BEGIN SET @Mensaje=N'Solo admin puede crear usuarios'; RETURN 608; END

    -- Validaciones de negocio
    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Usuario=@Usuario)
    BEGIN SET @Mensaje=N'Usuario ya existe'; RETURN 101; END

    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Correo=@Correo)
    BEGIN SET @Mensaje=N'Correo duplicado'; RETURN 102; END

    IF @Rol NOT IN ('admin','secretaria')
    BEGIN SET @Mensaje=N'Rol inválido'; RETURN 103; END

    IF seg.fn_IsPasswordStrong(@Password)=0
    BEGIN SET @Mensaje=N'Contraseña débil'; RETURN 201; END

    -- Crear usuario
    DECLARE @salt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32)=seg.fn_HashWithSalt(@Password,@salt);

    INSERT INTO seg.tbUsuario(Usuario,Nombres,Apellidos,HashPassword,Salt,Correo,Rol,Estado,UltimoCambioPass,EsPasswordTemporal)
    VALUES(@Usuario,@Nombres,@Apellidos,@hash,@salt,@Correo,@Rol,1,SYSDATETIME(),1);

    -- Registrar en bitácora
    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@UsuarioEjecutor,@idUserEjecutor,'CREAR_USUARIO','tbUsuario',@Usuario,
           N'Usuario creado: ' + @Usuario + N', Nombres: ' + @Nombres + N' ' + @Apellidos + N', Rol: ' + @Rol);

    SET @Mensaje=N'Usuario creado correctamente';
    RETURN 0;
END;
GO

-- Listar usuarios (solo admin)
IF OBJECT_ID('seg.sp_ListarUsuarios') IS NOT NULL DROP PROCEDURE seg.sp_ListarUsuarios;
GO
CREATE PROCEDURE seg.sp_ListarUsuarios
    @UsuarioEjecutor VARCHAR(50),
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @rolEjecutor VARCHAR(20);
    
    -- Validar que quien ejecuta sea admin
    SELECT @rolEjecutor=Rol FROM seg.tbUsuario WHERE Usuario=@UsuarioEjecutor AND Estado=1;
    
    IF @rolEjecutor<>'admin' 
    BEGIN SET @Mensaje=N'Solo admin puede listar usuarios'; RETURN 606; END

    -- Retornar lista de usuarios (sin contraseñas)
    SELECT IdUsuario, Usuario, Nombres, Apellidos, Correo, Rol, Estado, FechaCreacion, UltimoCambioPass
    FROM seg.tbUsuario
    ORDER BY Apellidos, Nombres;

    SET @Mensaje=N'Lista de usuarios obtenida';
    RETURN 0;
END;
GO

-- Generar token recuperación (invalida anteriores)
IF OBJECT_ID('seg.sp_GenerarTokenRecuperacion') IS NOT NULL DROP PROCEDURE seg.sp_GenerarTokenRecuperacion;
GO
CREATE PROCEDURE seg.sp_GenerarTokenRecuperacion
    @Correo VARCHAR(120),
    @Token UNIQUEIDENTIFIER OUTPUT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id INT;
    SELECT @id=IdUsuario FROM seg.tbUsuario WHERE Correo=@Correo AND Estado=1;
    IF @id IS NULL BEGIN SET @Mensaje=N'Correo no registrado'; RETURN 304; END

    -- invalidar tokens previos no usados
    UPDATE seg.tbRecuperacionContrasena
      SET Usado = 1
    WHERE IdUsuario=@id AND Usado=0;

    SET @Token=NEWID();
    INSERT INTO seg.tbRecuperacionContrasena(IdUsuario,Token,FechaExpira)
    VALUES(@id,@Token,DATEADD(MINUTE,30,SYSDATETIME()));

    SET @Mensaje=N'Token generado';
    RETURN 0;
END;
GO

-- Recuperar contraseña (valida token vigente y más reciente)
IF OBJECT_ID('seg.sp_RecuperarContrasena') IS NOT NULL DROP PROCEDURE seg.sp_RecuperarContrasena;
GO
CREATE PROCEDURE seg.sp_RecuperarContrasena
    @Token UNIQUEIDENTIFIER,
    @PasswordNueva NVARCHAR(200),
    @Confirmar NVARCHAR(200),
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id INT,@expira DATETIME2,@usado BIT;

    SELECT TOP 1
        @id     = IdUsuario,
        @expira = FechaExpira,
        @usado  = Usado
    FROM seg.tbRecuperacionContrasena
    WHERE Token=@Token
    ORDER BY FechaCreacion DESC;

    IF @id IS NULL            BEGIN SET @Mensaje=N'Token inválido';   RETURN 501; END
    IF @usado=1               BEGIN SET @Mensaje=N'Token usado';      RETURN 502; END
    IF SYSDATETIME()>@expira  BEGIN SET @Mensaje=N'Token expirado';   RETURN 503; END

    IF seg.fn_IsPasswordStrong(@PasswordNueva)=0
        BEGIN SET @Mensaje=N'Contraseña débil'; RETURN 201; END
    IF @PasswordNueva<>@Confirmar
        BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @salt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32)=seg.fn_HashWithSalt(@PasswordNueva,@salt);

    UPDATE seg.tbUsuario
      SET HashPassword=@hash, Salt=@salt, UltimoCambioPass=SYSDATETIME()
    WHERE IdUsuario=@id;

    UPDATE seg.tbRecuperacionContrasena
      SET Usado=1
    WHERE Token=@Token;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    SELECT Usuario, IdUsuario, 'RECUPERAR_CONTRASENA','tbUsuario', CONCAT('IdUsuario=',@id), N'Password reseteado vía token'
    FROM seg.tbUsuario WHERE IdUsuario=@id;

    SET @Mensaje=N'Contraseña actualizada con éxito';
    RETURN 0;
END;
GO

-- Limpieza de tokens expirados 
IF OBJECT_ID('seg.sp_LimpiarTokensExpirados') IS NOT NULL DROP PROCEDURE seg.sp_LimpiarTokensExpirados;
GO
CREATE PROCEDURE seg.sp_LimpiarTokensExpirados
AS
BEGIN
    SET NOCOUNT ON;
    -- Marca como usados todos los tokens vencidos (por seguridad) o purga si prefieres
    UPDATE seg.tbRecuperacionContrasena
      SET Usado = 1
    WHERE Usado = 0 AND FechaExpira < SYSDATETIME();
END;
GO

-- Listado de estudiantes
IF OBJECT_ID('seg.sp_ListarEstudiantes') IS NOT NULL DROP PROCEDURE seg.sp_ListarEstudiantes;
GO
CREATE PROCEDURE seg.sp_ListarEstudiantes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Carne, Nombres, Apellidos, Carrera, Correo, Telefono, FechaRegistro
    FROM seg.tbEstudiante
    ORDER BY Apellidos, Nombres;
END;
GO

------------------------------------------------------------
-- 4) ROLES Y USUARIOS EN SQL SERVER
------------------------------------------------------------
USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name='login_admin')
    CREATE LOGIN login_admin WITH PASSWORD='Adm!n_2025*', CHECK_POLICY=ON, CHECK_EXPIRATION=ON;
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name='login_secretaria')
    CREATE LOGIN login_secretaria WITH PASSWORD='Secr3t_*2025', CHECK_POLICY=ON, CHECK_EXPIRATION=ON;
GO

USE AcademicoDB;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='usr_admin')
    CREATE USER usr_admin FOR LOGIN login_admin;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='usr_secretaria')
    CREATE USER usr_secretaria FOR LOGIN login_secretaria;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='rol_admin_app')
    CREATE ROLE rol_admin_app AUTHORIZATION dbo;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='rol_secretaria_app')
    CREATE ROLE rol_secretaria_app AUTHORIZATION dbo;

-- Estilo moderno para membresía de roles:
BEGIN TRY
    ALTER ROLE rol_admin_app      ADD MEMBER usr_admin;
END TRY BEGIN CATCH END CATCH;
BEGIN TRY
    ALTER ROLE rol_secretaria_app ADD MEMBER usr_secretaria;
END TRY BEGIN CATCH END CATCH;

-- Permisos: principio de menor privilegio
GRANT SELECT,INSERT,UPDATE,DELETE ON SCHEMA::seg TO rol_admin_app;
GRANT EXECUTE ON SCHEMA::seg TO rol_admin_app;

-- Secretaria: sólo lo necesario
REVOKE SELECT ON OBJECT::seg.tbUsuario FROM rol_secretaria_app; -- por si acaso
GRANT SELECT,INSERT ON seg.tbEstudiante TO rol_secretaria_app;

GRANT EXECUTE ON OBJECT::seg.sp_InsertarEstudiante         TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_ListarEstudiantes          TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_LoginUsuario               TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_ActualizarContrasena       TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_GenerarTokenRecuperacion   TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_RecuperarContrasena        TO rol_secretaria_app;

------------------------------------------------------------
-- 5) OPTIMIZACIÓN, VISTAS Y ESTADÍSTICAS
------------------------------------------------------------
IF OBJECT_ID('seg.sp_ActualizarEstadisticas') IS NOT NULL DROP PROCEDURE seg.sp_ActualizarEstadisticas;
GO
CREATE PROCEDURE seg.sp_ActualizarEstadisticas
AS
BEGIN
    SET NOCOUNT ON;
    EXEC sp_updatestats;
END;
GO

IF OBJECT_ID('seg.vw_Estudiantes') IS NOT NULL DROP VIEW seg.vw_Estudiantes;
GO
CREATE VIEW seg.vw_Estudiantes AS
SELECT Carne,Nombres,Apellidos,Carrera,Correo,Telefono,FechaRegistro
FROM seg.tbEstudiante;
GO

-- Dar permisos sobre la vista DESPUÉS de crearla
GRANT SELECT ON OBJECT::seg.vw_Estudiantes TO rol_secretaria_app;
GO

------------------------------------------------------------
-- 6) PRUEBAS RÁPIDAS (SMOKE)
------------------------------------------------------------
DECLARE @msg NVARCHAR(200),@tk UNIQUEIDENTIFIER;
EXEC seg.sp_RegistrarUsuario 'harold','harold','Demo','vendedor@demo.com','vendedor',N'haroldscg7!',N'haroldscg7!',@msg OUTPUT; SELECT @msg AS MsgVendedor;

-- Registrar admin y secretaria (DATOS REALES)
EXEC seg.sp_RegistrarUsuario 'henryOo','Henry Otoniel','Yalibat Pacay','henryalibat4@gmail.com','admin',N'Adm!n_2025*',N'Adm!n_2025*',@msg OUTPUT; SELECT @msg AS MsgAdmin;
EXEC seg.sp_RegistrarUsuario 'EdinGei','Edin','Coy Lem','coyedin521@gmail.com','secretaria',N'Secr3t_*2025',N'Secr3t_*2025',@msg OUTPUT; SELECT @msg AS MsgSecretaria;
EXEC seg.sp_RegistrarUsuario 'henryOo','Henry Otoniel','Yalibat Pacay','henryalibat4@gmail.com','admin',N'Adm!n_2025*',N'Adm!n_2025*',@msg OUTPUT; SELECT @msg AS MsgAdmin;


-- Login (SIN IP_Cliente)
EXEC seg.sp_LoginUsuario 'henryOo',N'Adm!n_2025*',@msg OUTPUT; SELECT @msg AS MsgLogin;

-- Insertar 20 estudiantes con datos aleatorios
DECLARE @carneGen VARCHAR(20);
DECLARE @msg NVARCHAR(200),@tk UNIQUEIDENTIFIER;

-- Estudiante 1
EXEC seg.sp_InsertarEstudiante 'EdinGei','María Elena','González Martínez','Ingeniería','1999-03-15','maria.gonzalez@email.com','2234-5678',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 2
EXEC seg.sp_InsertarEstudiante 'henryOo','Carlos Roberto','López Hernández','Administración','2000-07-22','carlos.lopez@email.com','2345-6789',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 3
EXEC seg.sp_InsertarEstudiante 'EdinGei','Ana Sofía','Pérez García','Administración','1998-11-08','ana.perez@email.com','2456-7890',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 4
EXEC seg.sp_InsertarEstudiante 'henryOo','Luis Fernando','Ramírez Torres','Ingeniería','2001-02-14','luis.ramirez@email.com','2567-8901',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 5
EXEC seg.sp_InsertarEstudiante 'EdinGei','Gabriela María','Morales Jiménez','Psicología','1999-09-30','gabriela.morales@email.com','2678-9012',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 6
EXEC seg.sp_InsertarEstudiante 'henryOo','Diego Alejandro','Castillo Vargas','Ingeniería','2000-05-12','diego.castillo@email.com','2789-0123',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 7
EXEC seg.sp_InsertarEstudiante 'EdinGei','Isabella Nicole','Herrera Sánchez','Medicina','1998-12-03','isabella.herrera@email.com','2890-1234',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 8
EXEC seg.sp_InsertarEstudiante 'henryOo','Sebastián David','Ortega Cruz','Derecho','2001-04-18','sebastian.ortega@email.com','2901-2345',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 9
EXEC seg.sp_InsertarEstudiante 'EdinGei','Valeria Alejandra','Mendoza Flores','Ingeniería','1999-08-27','valeria.mendoza@email.com','3012-3456',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 10
EXEC seg.sp_InsertarEstudiante 'henryOo','Andrés Felipe','Silva Rojas','Derecho','2000-01-09','andres.silva@email.com','3123-4567',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 11
EXEC seg.sp_InsertarEstudiante 'EdinGei','Camila Fernanda','Guerrero Luna','Derecho','1998-06-21','camila.guerrero@email.com','3234-5678',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 12
EXEC seg.sp_InsertarEstudiante 'henryOo','Nicolás Emilio','Vega Moreno','Ingeniería','2001-10-05','nicolas.vega@email.com','3345-6789',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 13
EXEC seg.sp_InsertarEstudiante 'EdinGei','Sophia Valentina','Campos Rivera','Medicina','1999-12-17','sophia.campos@email.com','3456-7890',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 14
EXEC seg.sp_InsertarEstudiante 'henryOo','Mateo Alejandro','Restrepo Gómez','Ingeniería','2000-03-28','mateo.restrepo@email.com','3567-8901',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 15
EXEC seg.sp_InsertarEstudiante 'EdinGei','Mariana José','Aguilar Díaz','Ingenieria','1998-09-11','mariana.aguilar@email.com','3678-9012',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 16
EXEC seg.sp_InsertarEstudiante 'henryOo','Samuel Antonio','Córdoba Vargas','Medicina','2001-07-02','samuel.cordoba@email.com','3789-0123',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 17
EXEC seg.sp_InsertarEstudiante 'EdinGei','Regina Paola','Molina Santos','Derecho','1999-05-25','regina.molina@email.com','3890-1234',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 18
EXEC seg.sp_InsertarEstudiante 'henryOo','Emiliano José','Navarro Peña','Ingeniería','2000-11-13','emiliano.navarro@email.com','3901-2345',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 19
EXEC seg.sp_InsertarEstudiante 'EdinGei','Renata Sofía','Delgado Ruiz','Medicina','1998-08-07','renata.delgado@email.com','4012-3456',@carneGen OUTPUT,@msg OUTPUT;
-- Estudiante 20
EXEC seg.sp_InsertarEstudiante 'henryOo','Maximiliano Andrés','Paredes Acosta','Ingeniería','2001-01-20','maximiliano.paredes@email.com','4123-4567',@carneGen OUTPUT,@msg OUTPUT;

SELECT 'Estudiantes insertados correctamente' AS Resultado;

-- Listar estudiantes vía SP
EXEC seg.sp_ListarEstudiantes;

-- Generar token recuperación
EXEC seg.sp_GenerarTokenRecuperacion 'henryalibat4@gmail.com',@tk OUTPUT,@msg OUTPUT; SELECT @msg AS MsgToken,@tk AS Token;

-- Recuperar contraseña con token
EXEC seg.sp_RecuperarContrasena @tk, N'Adm!n_2025**Nuevo', N'Adm!n_2025**Nuevo', @msg OUTPUT; SELECT @msg AS MsgRecuperar;

-- Limpieza de tokens expirados (no debería afectar tokens recién usados)
EXEC seg.sp_LimpiarTokensExpirados;

--Prueba nomas
SELECT name, type_desc FROM sys.objects WHERE schema_id=SCHEMA_ID('seg');
GO

-- Prueba de validación de usuario duplicado
DECLARE @msg NVARCHAR(200);
EXEC seg.sp_RegistrarUsuario 'henryOo','Henry Duplicado','Test Test','henryalibat4@gmail.com','admin',N'Adm!n_2025*',N'Adm!n_2025*',@msg OUTPUT;
SELECT @msg AS MsgUsuarioDuplicado;
EXEC seg.sp_RegistrarUsuario 'henryOo','Henry Otro','Test Test','otro@uni.edu','admin',N'Adm!n_2025*',N'Adm!n_2025*',@msg OUTPUT;
SELECT @msg AS MsgEmailDuplicado;
GO

-- Verificar funciones creadas
USE AcademicoDB;
GO
SELECT *
FROM sys.objects
WHERE name = 'fn_IsPasswordStrong' AND type = 'FN';
GO

-- Prueba con usuario secretaria (ACTUALIZADO - sin parámetro Carne)
DECLARE @msg NVARCHAR(200), @carneGen VARCHAR(20);
EXECUTE AS USER='usr_secretaria';
EXEC seg.sp_InsertarEstudiante 'EdinGei','Pedro Antonio','López Morales','Administración de Empresas','1999-06-15','pedro@uni.edu','555-8888',@carneGen OUTPUT,@msg OUTPUT;
SELECT @msg AS MsgSecretaria, @carneGen AS CarneGenerado;
REVERT;

-- Actualizar estadísticas y listar estudiantes
EXEC seg.sp_ActualizarEstadisticas;
EXEC seg.sp_ListarEstudiantes;
GO

-- *** NUEVAS PRUEBAS PARA CRUD DE USUARIOS ***

-- Pruebas de gestión de usuarios (solo admin)
DECLARE @msg NVARCHAR(200);

-- 1. Listar usuarios (como admin)
EXEC seg.sp_ListarUsuarios 'henryOo', @msg OUTPUT;
SELECT @msg AS MsgListarUsuarios;

-- 2. Intentar actualizar usuario siendo secretaria (debe fallar)
EXEC seg.sp_ActualizarUsuario 'EdinGei', 1, 'henryOo_modificado', 'Henry Modificado', 'Yalibat Test', 'admin_nuevo@uni.edu', 'admin', 1, @msg OUTPUT;
SELECT @msg AS MsgActualizarComoSecretaria;

-- 3. Actualizar usuario como admin (debe funcionar) - ACTUALIZADO
EXEC seg.sp_ActualizarUsuario 'henryOo', 2, 'EdinGei', 'Edin Actualizado', 'Coy Lem García', 'coyedin_nuevo@gmail.com', 'secretaria', 1, @msg OUTPUT;
SELECT @msg AS MsgActualizarComoAdmin;

-- 4. Intentar eliminar a sí mismo (debe fallar)
EXEC seg.sp_EliminarUsuario 'henryOo', 1, @msg OUTPUT;
SELECT @msg AS MsgAutoEliminacion;

-- 5. Eliminar usuario válido como admin
EXEC seg.sp_EliminarUsuario 'henryOo', 2, @msg OUTPUT;
SELECT @msg AS MsgEliminarUsuario;

-- 6. Verificar que el usuario eliminado aparece inactivo
SELECT IdUsuario, Usuario, Estado FROM seg.tbUsuario WHERE IdUsuario = 2;

------------------------------------------------------------
-- PROCEDIMIENTO ADICIONAL PARA LOGIN WEB CON reCAPTCHA
------------------------------------------------------------

-- Procedimiento para validar usuario con información completa para el login web
IF OBJECT_ID('seg.sp_ValidarUsuario') IS NOT NULL
    DROP PROCEDURE seg.sp_ValidarUsuario;
GO

CREATE PROCEDURE seg.sp_ValidarUsuario
    @Usuario  VARCHAR(50),
    @Password NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE
        @id INT,
        @salt VARBINARY(16),
        @hash VARBINARY(32),
        @calc VARBINARY(32),
        @estado BIT,
        @nombres VARCHAR(100),
        @apellidos VARCHAR(100),
        @correo VARCHAR(120),
        @rol VARCHAR(20),
        @esTemporal BIT,
        @fechaExpira DATETIME2(0);

    SELECT
        @id         = IdUsuario,
        @salt       = Salt,
        @hash       = HashPassword,
        @estado     = Estado,
        @nombres    = Nombres,
        @apellidos  = Apellidos,
        @correo     = Correo,
        @rol        = Rol,
        @esTemporal = EsPasswordTemporal,
        @fechaExpira = FechaExpiraPassword
    FROM seg.tbUsuario
    WHERE Usuario = @Usuario;

    IF @id IS NULL OR @estado = 0
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado)
        VALUES(ISNULL(@id,-1), @Usuario, 'FAIL');

        SELECT
            'FAIL' AS Resultado,
            'Credenciales inválidas' AS Mensaje,
            NULL AS IdUsuario,
            NULL AS Usuario,
            NULL AS Nombres,
            NULL AS Apellidos,
            NULL AS Correo,
            NULL AS Rol,
            0 AS EsPasswordTemporal;
        RETURN 0;
    END

    -- Verificar si la contraseña temporal ha expirado
    IF @esTemporal = 1 AND @fechaExpira IS NOT NULL AND SYSDATETIME() > @fechaExpira
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado)
        VALUES(@id, @Usuario, 'FAIL');

        -- Registrar expiración en bitácora
        INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
        VALUES(@Usuario, @id, 'PASSWORD_TEMPORAL_EXPIRADO', 'tbUsuario', CONCAT('IdUsuario=', @id),
               N'Intento de login con contraseña temporal expirada (expiró: ' + FORMAT(@fechaExpira, 'dd/MM/yyyy HH:mm') + N')');

        SELECT
            'FAIL' AS Resultado,
            'La contraseña temporal ha expirado. Solicita una nueva contraseña temporal.' AS Mensaje,
            NULL AS IdUsuario,
            NULL AS Usuario,
            NULL AS Nombres,
            NULL AS Apellidos,
            NULL AS Correo,
            NULL AS Rol,
            0 AS EsPasswordTemporal;
        RETURN 0;
    END

    SET @calc = seg.fn_HashWithSalt(@Password, @salt);

    IF @calc <> @hash
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado)
        VALUES(@id, @Usuario, 'FAIL');

        SELECT
            'FAIL' AS Resultado,
            'Contraseña incorrecta' AS Mensaje,
            NULL AS IdUsuario,
            NULL AS Usuario,
            NULL AS Nombres,
            NULL AS Apellidos,
            NULL AS Correo,
            NULL AS Rol,
            0 AS EsPasswordTemporal;
        RETURN 0;
    END

    INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado)
    VALUES(@id, @Usuario, 'OK');

    SELECT
        'OK' AS Resultado,
        'Login exitoso' AS Mensaje,
        @id AS IdUsuario,
        @Usuario AS Usuario,
        @nombres AS Nombres,
        @apellidos AS Apellidos,
        @correo AS Correo,
        @rol AS Rol,
        @esTemporal AS EsPasswordTemporal;
    RETURN 0;
END;
GO

-- Otorgar permisos al procedimiento sp_ValidarUsuario
GRANT EXECUTE ON OBJECT::seg.sp_ValidarUsuario TO rol_admin_app;
GRANT EXECUTE ON OBJECT::seg.sp_ValidarUsuario TO rol_secretaria_app;
GO

------------------------------------------------------------
-- PROCEDIMIENTOS PARA RECUPERACIÓN DE CONTRASEÑA
------------------------------------------------------------

-- Procedimiento para generar contraseña temporal y enviarla por correo
IF OBJECT_ID('seg.sp_GenerarPasswordTemporal') IS NOT NULL
    DROP PROCEDURE seg.sp_GenerarPasswordTemporal;
GO

CREATE PROCEDURE seg.sp_GenerarPasswordTemporal
    @Correo VARCHAR(120),
    @PasswordTemporal NVARCHAR(200) OUTPUT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id INT, @usuario VARCHAR(50), @nombres VARCHAR(100), @apellidos VARCHAR(100);

    -- Verificar que el correo existe y está activo
    SELECT
        @id = IdUsuario,
        @usuario = Usuario,
        @nombres = Nombres,
        @apellidos = Apellidos
    FROM seg.tbUsuario
    WHERE Correo = @Correo AND Estado = 1;

    IF @id IS NULL
    BEGIN
        SET @Mensaje = N'Correo no registrado o usuario inactivo';
        RETURN 304;
    END

    -- Generar contraseña temporal segura (8 caracteres con mayúscula, minúscula, número y símbolo)
    DECLARE @chars VARCHAR(62) = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    DECLARE @symbols VARCHAR(10) = '!@#$%&*?';
    DECLARE @temp VARCHAR(20) = '';
    DECLARE @i INT = 1;

    -- Generar 6 caracteres alfanuméricos
    WHILE @i <= 6
    BEGIN
        SET @temp = @temp + SUBSTRING(@chars, ABS(CHECKSUM(NEWID())) % LEN(@chars) + 1, 1);
        SET @i = @i + 1;
    END

    -- Agregar 1 símbolo
    SET @temp = @temp + SUBSTRING(@symbols, ABS(CHECKSUM(NEWID())) % LEN(@symbols) + 1, 1);

    -- Agregar 1 número al final
    SET @temp = @temp + CAST(ABS(CHECKSUM(NEWID())) % 10 AS VARCHAR(1));

    SET @PasswordTemporal = @temp;

    -- Calcular fecha de expiración (24 horas desde ahora)
    DECLARE @fechaExpira DATETIME2(0) = DATEADD(HOUR, 24, SYSDATETIME());

    -- Actualizar usuario con la nueva contraseña temporal y su expiración
    DECLARE @salt VARBINARY(16) = CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32) = seg.fn_HashWithSalt(@PasswordTemporal, @salt);

    UPDATE seg.tbUsuario
    SET
        HashPassword = @hash,
        Salt = @salt,
        UltimoCambioPass = SYSDATETIME(),
        EsPasswordTemporal = 1,
        FechaExpiraPassword = @fechaExpira
    WHERE IdUsuario = @id;

    -- Registrar en bitácora
    INSERT INTO seg.tbBitacoraTransacciones(Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
    VALUES(@usuario, @id, 'GENERAR_PASSWORD_TEMPORAL', 'tbUsuario', CONCAT('IdUsuario=', @id),
           N'Contraseña temporal generada (expira: ' + FORMAT(@fechaExpira, 'dd/MM/yyyy HH:mm') + N') para: ' + @nombres + N' ' + @apellidos + N' (' + @Correo + N')');

    SET @Mensaje = N'Contraseña temporal generada (válida por 24 horas)';
    RETURN 0;
END;
GO

-- Procedimiento para limpiar contraseñas temporales expiradas (tarea de mantenimiento)
IF OBJECT_ID('seg.sp_LimpiarPasswordsTemporalesExpirados') IS NOT NULL
    DROP PROCEDURE seg.sp_LimpiarPasswordsTemporalesExpirados;
GO

CREATE PROCEDURE seg.sp_LimpiarPasswordsTemporalesExpirados
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @afectados INT;

    -- Marcar como no temporales las contraseñas expiradas
    UPDATE seg.tbUsuario
    SET EsPasswordTemporal = 0, FechaExpiraPassword = NULL
    WHERE EsPasswordTemporal = 1
      AND FechaExpiraPassword IS NOT NULL
      AND SYSDATETIME() > FechaExpiraPassword;

    SET @afectados = @@ROWCOUNT;

    -- Registrar en bitácora si hubo limpieza
    IF @afectados > 0
    BEGIN
        INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
        VALUES('SISTEMA', 0, 'LIMPIAR_PASSWORDS_EXPIRADOS', 'tbUsuario', 'MANTENIMIENTO',
               N'Se limpiaron ' + CAST(@afectados AS NVARCHAR(10)) + N' contraseñas temporales expiradas');
    END

    PRINT 'Limpieza completada. Contraseñas expiradas procesadas: ' + CAST(@afectados AS VARCHAR(10));
END;
GO

-- Otorgar permisos a los nuevos procedimientos
GRANT EXECUTE ON OBJECT::seg.sp_GenerarPasswordTemporal TO rol_admin_app;
GRANT EXECUTE ON OBJECT::seg.sp_GenerarPasswordTemporal TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_LimpiarPasswordsTemporalesExpirados TO rol_admin_app;
GO

PRINT '✅ Base de datos AcademicoDB creada exitosamente';
PRINT '📋 Incluye:';
PRINT '   • Tablas completas con contraseñas temporales';
PRINT '   • Sistema de expiración de contraseñas (24 horas)';
PRINT '   • Procedimiento de recuperación de contraseñas';
PRINT '   • Procedimientos almacenados actualizados';
PRINT '   • Funciones de seguridad y validación';
PRINT '   • Índices optimizados';
PRINT '   • Permisos y roles configurados';
PRINT '   • Datos de prueba insertados';
PRINT '';
PRINT '🔐 Usuarios creados:';
PRINT '   • henryOo (admin) - Password: Adm!n_2025*';
PRINT '   • EdinGei (secretaria) - Password: Secr3t_*2025';
PRINT '';
PRINT '💡 Funcionalidades incluidas:';
PRINT '   • Contraseñas temporales con expiración automática';
PRINT '   • Sistema de recuperación por correo electrónico';
PRINT '   • Validación automática de expiración en login';
PRINT '   • Limpieza automática de contraseñas expiradas';
PRINT '';
PRINT '📧 Para recuperación de contraseñas:';
PRINT '   • EXEC seg.sp_GenerarPasswordTemporal @correo, @password OUT, @msg OUT';
PRINT '   • Las contraseñas temporales expiran en 24 horas';
PRINT '';
PRINT '🧹 Para mantenimiento:';
PRINT '   • EXEC seg.sp_LimpiarPasswordsTemporalesExpirados';
PRINT '';
PRINT '📄 20 estudiantes de ejemplo han sido insertados';
PRINT '';
PRINT '🚀 ¡La base de datos está lista para usar!';
GO










/* =========================================================
   MÓDULO DE LOGIN/USUARIOS – VERSIÓN ORIGINAL (SIN EXTRAS)
   - Usuarios, roles, hashing (SHA2_256 + salt 16B)
   - Login y validación
   - Recuperación de contraseña con NEWID()
   - Contraseñas temporales (CHECKSUM(NEWID()))
   - Bitácoras e índices como en el diseño original
   ========================================================= */

------------------------------------------------------------
-- 0) DB y esquema
------------------------------------------------------------

IF DB_ID('AcademicoDB') IS NULL
    CREATE DATABASE AcademicoDB;
GO
USE AcademicoDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'seg')
    EXEC('CREATE SCHEMA seg AUTHORIZATION dbo;');
GO

------------------------------------------------------------
-- 1) TABLAS
------------------------------------------------------------

-- Usuarios (estructura original)
IF OBJECT_ID('seg.tbUsuario') IS NOT NULL DROP TABLE seg.tbUsuario;
CREATE TABLE seg.tbUsuario
(
    IdUsuario            INT IDENTITY(1,1) PRIMARY KEY,
    Usuario              VARCHAR(50)   NOT NULL,
    Nombres              VARCHAR(100)  NOT NULL,
    Apellidos            VARCHAR(100)  NOT NULL,
    HashPassword         VARBINARY(32) NOT NULL,   -- SHA2_256
    Salt                 VARBINARY(16) NOT NULL,   -- CRYPT_GEN_RANDOM(16)
    Correo               VARCHAR(120)  NOT NULL,
    Rol                  VARCHAR(20)   NOT NULL CHECK (Rol IN ('admin','secretaria')),
    Estado               BIT           NOT NULL CONSTRAINT DF_tbUsuario_Estado DEFAULT(1),
    FechaCreacion        DATETIME2(0)  NOT NULL CONSTRAINT DF_tbUsuario_FC DEFAULT(SYSDATETIME()),
    UltimoCambioPass     DATETIME2(0)  NULL,

    -- Contraseña temporal (original)
    EsPasswordTemporal   BIT           NOT NULL CONSTRAINT DF_tbUsuario_Temp DEFAULT(0),
    FechaExpiraPassword  DATETIME2(0)  NULL
);
GO

-- Unicidad (original)
CREATE UNIQUE INDEX UX_tbUsuario_Usuario ON seg.tbUsuario(Usuario);
CREATE UNIQUE INDEX UX_tbUsuario_Correo  ON seg.tbUsuario(Correo);

-- Bitácora de accesos (original, sin IP/UA)
IF OBJECT_ID('seg.tbBitacoraAcceso') IS NOT NULL DROP TABLE seg.tbBitacoraAcceso;
CREATE TABLE seg.tbBitacoraAcceso
(
    IdAcceso     BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario    INT          NULL,         -- -1 si no existe
    Usuario      VARCHAR(50)  NOT NULL,
    FechaHora    DATETIME2(0) NOT NULL CONSTRAINT DF_BitAcceso_FH DEFAULT(SYSDATETIME()),
    Resultado    VARCHAR(20)  NOT NULL      -- 'OK' | 'FAIL'
);
GO

-- Bitácora de transacciones (auditoría)
IF OBJECT_ID('seg.tbBitacoraTransacciones') IS NOT NULL DROP TABLE seg.tbBitacoraTransacciones;
CREATE TABLE seg.tbBitacoraTransacciones
(
    IdTransaccion BIGINT IDENTITY(1,1) PRIMARY KEY,
    FechaHora     DATETIME2(0) NOT NULL CONSTRAINT DF_BitTx_FH DEFAULT(SYSDATETIME()),
    Usuario       VARCHAR(50)  NOT NULL,
    IdUsuario     INT          NOT NULL,
    Operacion     VARCHAR(40)  NOT NULL,
    Entidad       VARCHAR(40)  NOT NULL,
    ClaveEntidad  VARCHAR(100) NOT NULL,
    Detalle       NVARCHAR(4000) NULL
);
GO

-- Recuperación de contraseña (token con NEWID() como en el script original)
IF OBJECT_ID('seg.tbRecuperacionContrasena') IS NOT NULL DROP TABLE seg.tbRecuperacionContrasena;
CREATE TABLE seg.tbRecuperacionContrasena
(
    IdToken        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    IdUsuario      INT             NOT NULL,
    Token          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),  -- Token expuesto (GUID)
    FechaCreacion  DATETIME2(0)    NOT NULL CONSTRAINT DF_Recup_FC DEFAULT(SYSDATETIME()),
    FechaExpira    DATETIME2(0)    NOT NULL,
    Usado          BIT             NOT NULL CONSTRAINT DF_Recup_Usado DEFAULT(0),

    CONSTRAINT FK_Rec_User FOREIGN KEY(IdUsuario) REFERENCES seg.tbUsuario(IdUsuario)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX UX_Recuperacion_Token ON seg.tbRecuperacionContrasena(Token);
CREATE NONCLUSTERED INDEX IX_Recuperacion_Vigente
ON seg.tbRecuperacionContrasena (IdUsuario, FechaCreacion DESC)
INCLUDE (FechaExpira, Token)
WHERE Usado = 0;
GO

------------------------------------------------------------
-- 1.1) ÍNDICES (originales)
------------------------------------------------------------
CREATE NONCLUSTERED INDEX IX_tbUsuario_Rol_Estado
ON seg.tbUsuario (Rol, Estado)
INCLUDE (Usuario, Nombres, Apellidos, Correo, FechaCreacion);

CREATE NONCLUSTERED INDEX IX_BitAcceso_IdUsuario_Fecha
ON seg.tbBitacoraAcceso (IdUsuario, FechaHora DESC)
INCLUDE (Resultado, Usuario);

CREATE NONCLUSTERED INDEX IX_BitAcceso_FAIL
ON seg.tbBitacoraAcceso (Resultado)
INCLUDE (IdUsuario, FechaHora, Usuario)
WHERE Resultado='FAIL';
GO

------------------------------------------------------------
-- 2) FUNCIONES (originales)
------------------------------------------------------------

-- Complejidad de contraseña
IF OBJECT_ID('seg.fn_IsPasswordStrong') IS NOT NULL DROP FUNCTION seg.fn_IsPasswordStrong;
GO
CREATE FUNCTION seg.fn_IsPasswordStrong (@pwd NVARCHAR(200))
RETURNS BIT
AS
BEGIN
    DECLARE @ok BIT = 1;
    IF LEN(@pwd) < 8 SET @ok = 0;
    IF @pwd NOT LIKE '%[A-Z]%' SET @ok = 0;
    IF @pwd NOT LIKE '%[a-z]%' SET @ok = 0;
    IF @pwd NOT LIKE '%[0-9]%' SET @ok = 0;
    IF @pwd NOT LIKE '%[^0-9A-Za-z]%' SET @ok = 0;
    RETURN @ok;
END;
GO

-- Hash SHA2-256 con salt
IF OBJECT_ID('seg.fn_HashWithSalt') IS NOT NULL DROP FUNCTION seg.fn_HashWithSalt;
GO
CREATE FUNCTION seg.fn_HashWithSalt (@pwd NVARCHAR(200), @salt VARBINARY(16))
RETURNS VARBINARY(32)
AS
BEGIN
    RETURN HASHBYTES('SHA2_256', @salt + CONVERT(VARBINARY(400), @pwd));
END;
GO

------------------------------------------------------------
-- 3) PROCEDIMIENTOS (originales)
------------------------------------------------------------

-- Alta de usuario
IF OBJECT_ID('seg.sp_RegistrarUsuario') IS NOT NULL DROP PROCEDURE seg.sp_RegistrarUsuario;
GO
CREATE PROCEDURE seg.sp_RegistrarUsuario
    @Usuario     VARCHAR(50),
    @Nombres     VARCHAR(100),
    @Apellidos   VARCHAR(100),
    @Correo      VARCHAR(120),
    @Rol         VARCHAR(20),
    @Password    NVARCHAR(200),
    @Confirmar   NVARCHAR(200),
    @Mensaje     NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Rol NOT IN ('admin','secretaria')
    BEGIN SET @Mensaje=N'Rol inválido'; RETURN 103; END

    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Usuario=@Usuario)
    BEGIN SET @Mensaje=N'Usuario ya existe'; RETURN 101; END

    IF EXISTS(SELECT 1 FROM seg.tbUsuario WHERE Correo=@Correo)
    BEGIN SET @Mensaje=N'Correo duplicado'; RETURN 102; END

    IF seg.fn_IsPasswordStrong(@Password)=0
    BEGIN SET @Mensaje=N'Contraseña débil'; RETURN 201; END

    IF @Password<>@Confirmar
    BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @salt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32)=seg.fn_HashWithSalt(@Password,@salt);

    INSERT INTO seg.tbUsuario(Usuario,Nombres,Apellidos,HashPassword,Salt,Correo,Rol,Estado,UltimoCambioPass)
    VALUES(@Usuario,@Nombres,@Apellidos,@hash,@salt,@Correo,@Rol,1,SYSDATETIME());

    SET @Mensaje=N'Usuario registrado';
    RETURN 0;
END;
GO

-- Login (comportamiento original; registra OK/FAIL; sin lockout)
IF OBJECT_ID('seg.sp_LoginUsuario') IS NOT NULL DROP PROCEDURE seg.sp_LoginUsuario;
GO
CREATE PROCEDURE seg.sp_LoginUsuario
    @Usuario     VARCHAR(50),
    @Password    NVARCHAR(200),
    @Mensaje     NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id INT,@salt VARBINARY(16),@hash VARBINARY(32),@calc VARBINARY(32),
            @estado BIT,@esTemp BIT,@expira DATETIME2(0);

    SELECT @id=IdUsuario,@salt=Salt,@hash=HashPassword,@estado=Estado,
           @esTemp=EsPasswordTemporal,@expira=FechaExpiraPassword
    FROM seg.tbUsuario WHERE Usuario=@Usuario;

    IF @id IS NULL
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado) VALUES(-1,@Usuario,'FAIL');
        SET @Mensaje=N'Usuario no existe';
        RETURN 301;
    END

    IF @estado=0
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado) VALUES(@id,@Usuario,'FAIL');
        SET @Mensaje=N'Usuario inactivo';
        RETURN 307;
    END

    SET @calc=seg.fn_HashWithSalt(@Password,@salt);
    IF @calc<>@hash
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado) VALUES(@id,@Usuario,'FAIL');
        SET @Mensaje=N'Contraseña incorrecta';
        RETURN 302;
    END

    IF @esTemp=1 AND @expira IS NOT NULL AND SYSDATETIME()>@expira
    BEGIN
        INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado) VALUES(@id,@Usuario,'FAIL');
        SET @Mensaje=N'La contraseña temporal ha expirado';
        RETURN 305;
    END

    INSERT INTO seg.tbBitacoraAcceso(IdUsuario,Usuario,Resultado) VALUES(@id,@Usuario,'OK');
    SET @Mensaje=N'Login correcto';
    RETURN 0;
END;
GO

-- Validar usuario para front (retorna datos del usuario si login OK)
IF OBJECT_ID('seg.sp_ValidarUsuario') IS NOT NULL DROP PROCEDURE seg.sp_ValidarUsuario;
GO
CREATE PROCEDURE seg.sp_ValidarUsuario
    @Usuario   VARCHAR(50),
    @Password  NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @msg NVARCHAR(200), @rc INT;
    EXEC @rc = seg.sp_LoginUsuario @Usuario=@Usuario, @Password=@Password, @Mensaje=@msg OUTPUT;

    IF @rc <> 0
    BEGIN
        SELECT 'FAIL' AS Resultado, @msg AS Mensaje,
               NULL AS IdUsuario, NULL AS Usuario, NULL AS Nombres, NULL AS Apellidos,
               NULL AS Correo, NULL AS Rol, 0 AS EsPasswordTemporal;
        RETURN 0;
    END

    SELECT
        'OK' AS Resultado,
        'Login exitoso' AS Mensaje,
        u.IdUsuario, u.Usuario, u.Nombres, u.Apellidos, u.Correo, u.Rol,
        u.EsPasswordTemporal
    FROM seg.tbUsuario u
    WHERE u.Usuario=@Usuario;
    RETURN 0;
END;
GO

-- Actualizar contraseña
IF OBJECT_ID('seg.sp_ActualizarContrasena') IS NOT NULL DROP PROCEDURE seg.sp_ActualizarContrasena;
GO
CREATE PROCEDURE seg.sp_ActualizarContrasena
    @Usuario         VARCHAR(50),
    @PasswordActual  NVARCHAR(200),
    @PasswordNueva   NVARCHAR(200),
    @ConfirmarNueva  NVARCHAR(200),
    @Mensaje         NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id INT,@salt VARBINARY(16),@hash VARBINARY(32),@calc VARBINARY(32);
    SELECT @id=IdUsuario,@salt=Salt,@hash=HashPassword
    FROM seg.tbUsuario WHERE Usuario=@Usuario AND Estado=1;

    IF @id IS NULL BEGIN SET @Mensaje=N'Usuario no existe o inactivo'; RETURN 301; END

    SET @calc=seg.fn_HashWithSalt(@PasswordActual,@salt);
    IF @calc<>@hash BEGIN SET @Mensaje=N'Contraseña actual incorrecta'; RETURN 303; END

    IF seg.fn_IsPasswordStrong(@PasswordNueva)=0
    BEGIN SET @Mensaje=N'Contraseña nueva débil'; RETURN 201; END

    IF @PasswordNueva<>@ConfirmarNueva
    BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @newSalt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @newHash VARBINARY(32)=seg.fn_HashWithSalt(@PasswordNueva,@newSalt);

    UPDATE seg.tbUsuario
    SET HashPassword=@newHash,Salt=@newSalt,UltimoCambioPass=SYSDATETIME(),
        EsPasswordTemporal=0,FechaExpiraPassword=NULL
    WHERE IdUsuario=@id;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@Usuario,@id,'CAMBIO_CONTRASENA','tbUsuario',CONCAT('IdUsuario=',@id),N'Password actualizado');

    SET @Mensaje=N'Contraseña actualizada';
    RETURN 0;
END;
GO

-- Generar token de recuperación (invalida previos) – NEWID()
IF OBJECT_ID('seg.sp_GenerarTokenRecuperacion') IS NOT NULL DROP PROCEDURE seg.sp_GenerarTokenRecuperacion;
GO
CREATE PROCEDURE seg.sp_GenerarTokenRecuperacion
    @Correo        VARCHAR(120),
    @Token         UNIQUEIDENTIFIER OUTPUT,
    @Mensaje       NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id INT;
    SELECT @id=IdUsuario FROM seg.tbUsuario WHERE Correo=@Correo AND Estado=1;
    IF @id IS NULL BEGIN SET @Mensaje=N'Correo no registrado'; RETURN 304; END

    -- Invalidar tokens previos (marcar usados)
    UPDATE seg.tbRecuperacionContrasena
      SET Usado=1
    WHERE IdUsuario=@id AND Usado=0;

    DECLARE @tk UNIQUEIDENTIFIER = NEWID();
    INSERT INTO seg.tbRecuperacionContrasena(IdUsuario,Token,FechaExpira)
    VALUES(@id,@tk,DATEADD(MINUTE,30,SYSDATETIME()));

    SET @Token=@tk;
    SET @Mensaje=N'Token generado';
    RETURN 0;
END;
GO

-- Recuperar contraseña con token (GUID)
IF OBJECT_ID('seg.sp_RecuperarContrasena') IS NOT NULL DROP PROCEDURE seg.sp_RecuperarContrasena;
GO
CREATE PROCEDURE seg.sp_RecuperarContrasena
    @Token         UNIQUEIDENTIFIER,
    @PasswordNueva NVARCHAR(200),
    @Confirmar     NVARCHAR(200),
    @Mensaje       NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id INT,@expira DATETIME2(0),@usado BIT;

    SELECT TOP 1 @id=IdUsuario,@expira=FechaExpira,@usado=Usado
    FROM seg.tbRecuperacionContrasena
    WHERE Token=@Token
    ORDER BY FechaCreacion DESC;

    IF @id IS NULL            BEGIN SET @Mensaje=N'Token inválido'; RETURN 501; END
    IF @usado=1               BEGIN SET @Mensaje=N'Token usado';    RETURN 502; END
    IF SYSDATETIME()>@expira  BEGIN SET @Mensaje=N'Token expirado'; RETURN 503; END

    IF seg.fn_IsPasswordStrong(@PasswordNueva)=0
        BEGIN SET @Mensaje=N'Contraseña débil'; RETURN 201; END
    IF @PasswordNueva<>@Confirmar
        BEGIN SET @Mensaje=N'Confirmación no coincide'; RETURN 202; END

    DECLARE @salt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32)=seg.fn_HashWithSalt(@PasswordNueva,@salt);

    UPDATE seg.tbUsuario
      SET HashPassword=@hash, Salt=@salt, UltimoCambioPass=SYSDATETIME(),
          EsPasswordTemporal=0, FechaExpiraPassword=NULL
    WHERE IdUsuario=@id;

    UPDATE seg.tbRecuperacionContrasena
      SET Usado=1
    WHERE Token=@Token;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    SELECT Usuario, IdUsuario, 'RECUPERAR_CONTRASENA','tbUsuario', CONCAT('IdUsuario=',@id), N'Password reseteado vía token'
    FROM seg.tbUsuario WHERE IdUsuario=@id;

    SET @Mensaje=N'Contraseña actualizada con éxito';
    RETURN 0;
END;
GO

-- Generar contraseña temporal (CHECKSUM(NEWID()) como original)
IF OBJECT_ID('seg.sp_GenerarPasswordTemporal') IS NOT NULL DROP PROCEDURE seg.sp_GenerarPasswordTemporal;
GO
CREATE PROCEDURE seg.sp_GenerarPasswordTemporal
    @Correo             VARCHAR(120),
    @PasswordTemporal   NVARCHAR(200) OUTPUT,
    @Mensaje            NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id INT, @usuario VARCHAR(50);
    SELECT @id=IdUsuario,@usuario=Usuario
    FROM seg.tbUsuario WHERE Correo=@Correo AND Estado=1;

    IF @id IS NULL BEGIN SET @Mensaje=N'Correo no registrado o usuario inactivo'; RETURN 304; END

    -- Generar temporal (mismo patrón original)
    DECLARE @seed INT = ABS(CHECKSUM(NEWID()));
    SET @PasswordTemporal = 'Tmp' + CAST(@seed % 1000000 AS VARCHAR(6)) + '!';

    DECLARE @fechaExpira DATETIME2(0)=DATEADD(HOUR,24,SYSDATETIME());
    DECLARE @salt VARBINARY(16)=CRYPT_GEN_RANDOM(16);
    DECLARE @hash VARBINARY(32)=seg.fn_HashWithSalt(@PasswordTemporal,@salt);

    UPDATE seg.tbUsuario
    SET HashPassword=@hash, Salt=@salt, UltimoCambioPass=SYSDATETIME(),
        EsPasswordTemporal=1, FechaExpiraPassword=@fechaExpira
    WHERE IdUsuario=@id;

    INSERT INTO seg.tbBitacoraTransacciones(Usuario,IdUsuario,Operacion,Entidad,ClaveEntidad,Detalle)
    VALUES(@usuario,@id,'GENERAR_PASSWORD_TEMPORAL','tbUsuario',CONCAT('IdUsuario=',@id),
           N'Contraseña temporal generada');

    SET @Mensaje=N'Contraseña temporal generada (24h)';
    RETURN 0;
END;
GO

-- Limpieza de contraseñas temporales expiradas (original)
IF OBJECT_ID('seg.sp_LimpiarPasswordsTemporalesExpirados') IS NOT NULL DROP PROCEDURE seg.sp_LimpiarPasswordsTemporalesExpirados;
GO
CREATE PROCEDURE seg.sp_LimpiarPasswordsTemporalesExpirados
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE seg.tbUsuario
    SET EsPasswordTemporal=0, FechaExpiraPassword=NULL
    WHERE EsPasswordTemporal=1 AND FechaExpiraPassword IS NOT NULL
      AND SYSDATETIME()>FechaExpiraPassword;
END;
GO

------------------------------------------------------------
-- 4) ROLES Y PERMISOS (originales)
------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='rol_admin_app')
    CREATE ROLE rol_admin_app AUTHORIZATION dbo;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='rol_secretaria_app')
    CREATE ROLE rol_secretaria_app AUTHORIZATION dbo;

-- Admin app: SELECT/CRUD en seg + EXEC
GRANT SELECT,INSERT,UPDATE,DELETE ON SCHEMA::seg TO rol_admin_app;
GRANT EXECUTE ON SCHEMA::seg TO rol_admin_app;

-- Secretaria/app: SPs necesarios para operar login
GRANT EXECUTE ON OBJECT::seg.sp_LoginUsuario                   TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_ValidarUsuario                 TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_ActualizarContrasena           TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_GenerarTokenRecuperacion       TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_RecuperarContrasena            TO rol_secretaria_app;
GRANT EXECUTE ON OBJECT::seg.sp_GenerarPasswordTemporal        TO rol_secretaria_app;

-- Lectura bitácoras a rol admin
GRANT SELECT ON OBJECT::seg.tbBitacoraAcceso        TO rol_admin_app;
GRANT SELECT ON OBJECT::seg.tbBitacoraTransacciones TO rol_admin_app;


-- Registrar admin y secretaria (DATOS REALES)
EXEC seg.sp_RegistrarUsuario 'henryOo','Henry Otoniel','Yalibat Pacay','henryalibat4@gmail.com','admin',N'Adm!n_2025*',N'Adm!n_2025*',@msg OUTPUT; SELECT @msg AS MsgAdmin;
EXEC seg.sp_RegistrarUsuario 'EdinGei','Edin','Coy Lem','coyedin521@gmail.com','secretaria',N'Secr3t_*2025',N'Secr3t_*2025',@msg OUTPUT; SELECT @msg AS MsgSecretaria;


------------------------------------------------------------
-- 5) SMOKE TESTS (comentar en prod si no los deseas)
------------------------------------------------------------
/*
DECLARE @msg NVARCHAR(200), @tk UNIQUEIDENTIFIER, @pwdTemp NVARCHAR(200);

-- 1) Alta usuario admin
EXEC seg.sp_RegistrarUsuario 'admin01','Admin','Principal','admin@acme.com','admin',N'Adm!n_2025*',N'Adm!n_2025*',@msg OUTPUT; SELECT @msg AS AltaAdmin;

-- 2) Login OK
EXEC seg.sp_LoginUsuario 'admin01',N'Adm!n_2025*',@msg OUTPUT; SELECT @msg AS LoginOK;

-- 3) Generar token recuperación
EXEC seg.sp_GenerarTokenRecuperacion 'admin@acme.com', @tk OUTPUT, @msg OUTPUT; SELECT @msg AS MsgToken, @tk AS Token;

-- 4) Reset con token
EXEC seg.sp_RecuperarContrasena @tk, N'Adm!n_2025**Nuevo', N'Adm!n_2025**Nuevo', @msg OUTPUT; SELECT @msg AS MsgRecuperar;

-- 5) Generar password temporal
EXEC seg.sp_GenerarPasswordTemporal 'admin@acme.com', @pwdTemp OUTPUT, @msg OUTPUT;
SELECT @msg AS MsgTemp, @pwdTemp AS PasswordTemporal;
*/
GO

PRINT '✅ Módulo de login/usuarios creado (versión original, sin añadidos).';
GO




-- ===========================
-- MÓDULOS COMERCIALES (CATEGORÍAS, PRODUCTOS, INVENTARIO, VENTAS, REPORTES)
-- ===========================

-- 1. Crear esquema comercial (si no existe)
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'com')
    EXEC('CREATE SCHEMA com AUTHORIZATION dbo;');
GO

-- 2. TABLAS
------------------------------------------------------------
-- Categorías de productos
IF OBJECT_ID('com.tbCategoria') IS NOT NULL DROP TABLE com.tbCategoria;
CREATE TABLE com.tbCategoria (
    IdCategoria   INT IDENTITY(1,1) PRIMARY KEY,
    Nombre        VARCHAR(100) NOT NULL UNIQUE,
    Descripcion   VARCHAR(200) NULL,
    Activo        BIT NOT NULL DEFAULT 1,
    FechaRegistro DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);

-- Productos
IF OBJECT_ID('com.tbProducto') IS NOT NULL DROP TABLE com.tbProducto;
CREATE TABLE com.tbProducto (
    IdProducto     INT IDENTITY(1,1) PRIMARY KEY,
    Codigo         VARCHAR(30) NOT NULL UNIQUE,
    Nombre         VARCHAR(120) NOT NULL,
    Descripcion    VARCHAR(400) NULL,
    PrecioCosto    DECIMAL(10,2) NOT NULL,
    PrecioVenta    DECIMAL(10,2) NOT NULL,
    Descuento      DECIMAL(6,2) NOT NULL DEFAULT 0,
    Estado         BIT NOT NULL DEFAULT 1,
    FechaRegistro  DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);

-- Relación Producto-Categoría (muchos a muchos)
IF OBJECT_ID('com.tbProductoCategoria') IS NOT NULL DROP TABLE com.tbProductoCategoria;
CREATE TABLE com.tbProductoCategoria (
    IdProducto   INT NOT NULL,
    IdCategoria  INT NOT NULL,
    PRIMARY KEY (IdProducto, IdCategoria),
    CONSTRAINT FK_ProductoCategoria_Producto FOREIGN KEY (IdProducto) REFERENCES com.tbProducto(IdProducto),
    CONSTRAINT FK_ProductoCategoria_Categoria FOREIGN KEY (IdCategoria) REFERENCES com.tbCategoria(IdCategoria)
);

-- Stock actual (materializado)
IF OBJECT_ID('com.tbStock') IS NOT NULL DROP TABLE com.tbStock;
CREATE TABLE com.tbStock (
    IdProducto    INT PRIMARY KEY,
    Existencia    INT NOT NULL DEFAULT 0,
    FechaActualizacion DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Stock_Producto FOREIGN KEY (IdProducto) REFERENCES com.tbProducto(IdProducto)
);

-- Movimientos de inventario (entradas y salidas)
IF OBJECT_ID('com.tbInventario') IS NOT NULL DROP TABLE com.tbInventario;
CREATE TABLE com.tbInventario (
    IdMovimiento    BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdProducto      INT NOT NULL,
    Cantidad        INT NOT NULL,
    Tipo            VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA', 'VENTA', 'COMPRA', 'AJUSTE'
    Usuario         VARCHAR(50) NOT NULL,
    FechaMovimiento DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    Observacion     VARCHAR(500) NULL,
    CONSTRAINT FK_Inventario_Producto FOREIGN KEY (IdProducto) REFERENCES com.tbProducto(IdProducto)
);

-- Ventas
IF OBJECT_ID('com.tbVenta') IS NOT NULL DROP TABLE com.tbVenta;
CREATE TABLE com.tbVenta (
    IdVenta        BIGINT IDENTITY(1,1) PRIMARY KEY,
    Usuario        VARCHAR(50) NOT NULL,
    FechaVenta     DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    Subtotal       DECIMAL(12,2) NOT NULL,
    DescuentoTotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    Total          DECIMAL(12,2) NOT NULL,
    Observacion    VARCHAR(500) NULL
);

-- Detalle de ventas
IF OBJECT_ID('com.tbDetalleVenta') IS NOT NULL DROP TABLE com.tbDetalleVenta;
CREATE TABLE com.tbDetalleVenta (
    IdDetalle      BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdVenta        BIGINT NOT NULL,
    IdProducto     INT NOT NULL,
    Cantidad       INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Descuento      DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_DetalleVenta_Venta FOREIGN KEY (IdVenta) REFERENCES com.tbVenta(IdVenta),
    CONSTRAINT FK_DetalleVenta_Producto FOREIGN KEY (IdProducto) REFERENCES com.tbProducto(IdProducto)
);

------------------------------------------------------------
-- 3. ÍNDICES
------------------------------------------------------------
-- Índices recomendados para reportes y búsquedas
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbProducto_Nombre')
    CREATE NONCLUSTERED INDEX IX_tbProducto_Nombre ON com.tbProducto(Nombre);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbProducto_Codigo')
    CREATE UNIQUE NONCLUSTERED INDEX IX_tbProducto_Codigo ON com.tbProducto(Codigo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbInventario_IdProducto_Fecha')
    CREATE NONCLUSTERED INDEX IX_tbInventario_IdProducto_Fecha ON com.tbInventario(IdProducto, FechaMovimiento DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbVenta_FechaVenta')
    CREATE NONCLUSTERED INDEX IX_tbVenta_FechaVenta ON com.tbVenta(FechaVenta);

------------------------------------------------------------
-- 4. TRIGGERS PARA ACTUALIZAR STOCK AUTOMÁTICAMENTE
------------------------------------------------------------
-- Cuando se inserta un movimiento de inventario, actualizar tbStock
IF OBJECT_ID('com.trg_ActualizarStock_Inventario','TR') IS NOT NULL DROP TRIGGER com.trg_ActualizarStock_Inventario;
GO
CREATE TRIGGER com.trg_ActualizarStock_Inventario
ON com.tbInventario
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    MERGE com.tbStock AS destino
    USING (
        SELECT IdProducto, SUM(Cantidad) AS Cant
        FROM inserted
        GROUP BY IdProducto
    ) AS src
    ON destino.IdProducto = src.IdProducto
    WHEN MATCHED THEN
        UPDATE SET Existencia = destino.Existencia + src.Cant, FechaActualizacion = SYSDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (IdProducto, Existencia, FechaActualizacion) VALUES (src.IdProducto, src.Cant, SYSDATETIME());
END;
GO

-- Cuando se registra una venta se descuenta stock (debe validarse antes en backend)
IF OBJECT_ID('com.trg_RegistrarVenta_DescontarStock','TR') IS NOT NULL DROP TRIGGER com.trg_RegistrarVenta_DescontarStock;
GO
CREATE TRIGGER com.trg_RegistrarVenta_DescontarStock
ON com.tbDetalleVenta
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    -- Por cada producto vendido, crear movimiento de inventario tipo 'VENTA' y descontar stock
    INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, FechaMovimiento, Observacion)
    SELECT i.IdProducto, -i.Cantidad, 'VENTA', v.Usuario, v.FechaVenta, CONCAT('Venta automática IdVenta=', v.IdVenta)
    FROM inserted i
    INNER JOIN com.tbVenta v ON i.IdVenta = v.IdVenta;
END;
GO

------------------------------------------------------------
-- 5. VISTAS PARA REPORTES
------------------------------------------------------------
-- Vista consolidada de ventas con detalles y categorías
IF OBJECT_ID('com.vw_VentasDetalle') IS NOT NULL DROP VIEW com.vw_VentasDetalle;
GO
CREATE VIEW com.vw_VentasDetalle AS
SELECT
    v.IdVenta,
    v.FechaVenta,
    v.Usuario,
    d.IdProducto,
    p.Codigo AS CodigoProducto,
    p.Nombre AS NombreProducto,
    d.Cantidad,
    d.PrecioUnitario,
    d.Descuento,
    v.Subtotal,
    v.DescuentoTotal,
    v.Total,
    STRING_AGG(c.Nombre, ', ') AS Categorias
FROM com.tbVenta v
JOIN com.tbDetalleVenta d ON v.IdVenta = d.IdVenta
JOIN com.tbProducto p ON d.IdProducto = p.IdProducto
LEFT JOIN com.tbProductoCategoria pc ON p.IdProducto = pc.IdProducto
LEFT JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
GROUP BY v.IdVenta, v.FechaVenta, v.Usuario, d.IdProducto, p.Codigo, p.Nombre, d.Cantidad, d.PrecioUnitario, d.Descuento, v.Subtotal, v.DescuentoTotal, v.Total;

-- Vista inventario actual (stock)
IF OBJECT_ID('com.vw_InventarioActual') IS NOT NULL DROP VIEW com.vw_InventarioActual;
GO
CREATE VIEW com.vw_InventarioActual AS
SELECT
    p.IdProducto,
    p.Codigo,
    p.Nombre,
    ISNULL(s.Existencia, 0) AS Existencia,
    p.PrecioVenta,
    p.PrecioCosto
FROM com.tbProducto p
LEFT JOIN com.tbStock s ON p.IdProducto = s.IdProducto;

------------------------------------------------------------
-- 6. PROCEDIMIENTOS PARA REPORTES
------------------------------------------------------------

-- Reporte de ventas por rango de fechas y filtros
IF OBJECT_ID('com.sp_ReporteVentasPorFecha','P') IS NOT NULL DROP PROCEDURE com.sp_ReporteVentasPorFecha;
GO
CREATE PROCEDURE com.sp_ReporteVentasPorFecha
    @FechaInicio DATETIME2,
    @FechaFin DATETIME2,
    @Usuario VARCHAR(50) = NULL,
    @IdCategoria INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        v.IdVenta,
        v.FechaVenta,
        v.Usuario,
        v.Subtotal,
        v.DescuentoTotal,
        v.Total,
        d.IdProducto,
        p.Codigo AS CodigoProducto,
        p.Nombre AS NombreProducto,
        d.Cantidad,
        d.PrecioUnitario,
        d.Descuento,
        STRING_AGG(c.Nombre, ', ') AS Categorias
    FROM com.tbVenta v
    JOIN com.tbDetalleVenta d ON v.IdVenta = d.IdVenta
    JOIN com.tbProducto p ON d.IdProducto = p.IdProducto
    LEFT JOIN com.tbProductoCategoria pc ON p.IdProducto = pc.IdProducto
    LEFT JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
    WHERE v.FechaVenta BETWEEN @FechaInicio AND @FechaFin
      AND (@Usuario IS NULL OR v.Usuario = @Usuario)
      AND (@IdCategoria IS NULL OR EXISTS (
        SELECT 1 FROM com.tbProductoCategoria pc2 WHERE pc2.IdProducto = p.IdProducto AND pc2.IdCategoria = @IdCategoria
      ))
    GROUP BY v.IdVenta, v.FechaVenta, v.Usuario, v.Subtotal, v.DescuentoTotal, v.Total, d.IdProducto, p.Codigo, p.Nombre, d.Cantidad, d.PrecioUnitario, d.Descuento
    ORDER BY v.FechaVenta DESC;
END;
GO

-- Reporte de inventario actual y movimientos recientes
IF OBJECT_ID('com.sp_ReporteInventarioActual','P') IS NOT NULL DROP PROCEDURE com.sp_ReporteInventarioActual;
GO
CREATE PROCEDURE com.sp_ReporteInventarioActual
    @IdProducto INT = NULL,
    @IdCategoria INT = NULL,
    @UltimosMov INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    -- Inventario actual
    SELECT
        p.IdProducto,
        p.Codigo,
        p.Nombre,
        ISNULL(s.Existencia, 0) AS Existencia,
        p.PrecioCosto,
        p.PrecioVenta
    FROM com.tbProducto p
    LEFT JOIN com.tbStock s ON p.IdProducto = s.IdProducto
    WHERE (@IdProducto IS NULL OR p.IdProducto = @IdProducto)
      AND (@IdCategoria IS NULL OR EXISTS(
        SELECT 1 FROM com.tbProductoCategoria pc WHERE pc.IdProducto = p.IdProducto AND pc.IdCategoria = @IdCategoria
      ));

    -- Últimos movimientos
    SELECT TOP (@UltimosMov)
        i.IdMovimiento,
        i.IdProducto,
        p.Codigo,
        p.Nombre,
        i.Cantidad,
        i.Tipo,
        i.Usuario,
        i.FechaMovimiento,
        i.Observacion
    FROM com.tbInventario i
    JOIN com.tbProducto p ON i.IdProducto = p.IdProducto
    WHERE (@IdProducto IS NULL OR i.IdProducto = @IdProducto)
      AND (@IdCategoria IS NULL OR EXISTS(
        SELECT 1 FROM com.tbProductoCategoria pc WHERE pc.IdProducto = i.IdProducto AND pc.IdCategoria = @IdCategoria
      ))
    ORDER BY i.FechaMovimiento DESC;
END;
GO

-- Reporte de productos más vendidos (top N, opcional rango de fechas)
IF OBJECT_ID('com.sp_ReporteProductosMasVendidos','P') IS NOT NULL DROP PROCEDURE com.sp_ReporteProductosMasVendidos;
GO
CREATE PROCEDURE com.sp_ReporteProductosMasVendidos
    @TopN INT = 10,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@TopN)
        p.IdProducto,
        p.Codigo,
        p.Nombre,
        SUM(d.Cantidad) AS TotalVendido,
        SUM(d.Cantidad * d.PrecioUnitario - d.Descuento) AS TotalIngreso
    FROM com.tbDetalleVenta d
    JOIN com.tbVenta v ON d.IdVenta = v.IdVenta
    JOIN com.tbProducto p ON d.IdProducto = p.IdProducto
    WHERE (@FechaInicio IS NULL OR v.FechaVenta >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.FechaVenta <= @FechaFin)
    GROUP BY p.IdProducto, p.Codigo, p.Nombre
    ORDER BY TotalVendido DESC, TotalIngreso DESC;
END;
GO

-- Reporte de ingresos totales (mensual y anual)
IF OBJECT_ID('com.sp_ReporteIngresosTotales','P') IS NOT NULL DROP PROCEDURE com.sp_ReporteIngresosTotales;
GO
CREATE PROCEDURE com.sp_ReporteIngresosTotales
    @Anio INT,
    @Mes INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @Mes IS NULL
    BEGIN
        -- Totales por mes del año
        SELECT
            MONTH(FechaVenta) AS Mes,
            SUM(Total) AS TotalIngresos,
            SUM(Subtotal) AS SubtotalIngresos,
            SUM(DescuentoTotal) AS TotalDescuentos
        FROM com.tbVenta
        WHERE YEAR(FechaVenta) = @Anio
        GROUP BY MONTH(FechaVenta)
        ORDER BY Mes;
    END
    ELSE
    BEGIN
        -- Totales diarios del mes
        SELECT
            DAY(FechaVenta) AS Dia,
            SUM(Total) AS TotalIngresos,
            SUM(Subtotal) AS SubtotalIngresos,
            SUM(DescuentoTotal) AS TotalDescuentos
        FROM com.tbVenta
        WHERE YEAR(FechaVenta) = @Anio AND MONTH(FechaVenta) = @Mes
        GROUP BY DAY(FechaVenta)
        ORDER BY Dia;
    END
END;
GO

------------------------------------------------------------
-- 6.5. PROCEDIMIENTOS CRUD PARA CATEGORÍAS
------------------------------------------------------------

-- Listar categorías
IF OBJECT_ID('com.sp_ListarCategorias','P') IS NOT NULL DROP PROCEDURE com.sp_ListarCategorias;
GO
CREATE PROCEDURE com.sp_ListarCategorias
    @SoloActivas BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF @SoloActivas = 1
        SELECT IdCategoria, Nombre, Descripcion, Activo, FechaRegistro
        FROM com.tbCategoria
        WHERE Activo = 1
        ORDER BY Nombre;
    ELSE
        SELECT IdCategoria, Nombre, Descripcion, Activo, FechaRegistro
        FROM com.tbCategoria
        ORDER BY Nombre;
END;
GO

-- Obtener una categoría por ID
IF OBJECT_ID('com.sp_ObtenerCategoria','P') IS NOT NULL DROP PROCEDURE com.sp_ObtenerCategoria;
GO
CREATE PROCEDURE com.sp_ObtenerCategoria
    @IdCategoria INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdCategoria, Nombre, Descripcion, Activo, FechaRegistro
    FROM com.tbCategoria
    WHERE IdCategoria = @IdCategoria;
END;
GO

-- Crear categoría
IF OBJECT_ID('com.sp_CrearCategoria','P') IS NOT NULL DROP PROCEDURE com.sp_CrearCategoria;
GO
CREATE PROCEDURE com.sp_CrearCategoria
    @Usuario VARCHAR(50),
    @Nombre VARCHAR(100),
    @Descripcion VARCHAR(200) = NULL,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el nombre no exista
        IF EXISTS (SELECT 1 FROM com.tbCategoria WHERE Nombre = @Nombre)
        BEGIN
            SET @Mensaje = 'Error: Ya existe una categoría con ese nombre.';
            RETURN -1;
        END

        -- Insertar categoría
        INSERT INTO com.tbCategoria (Nombre, Descripcion, Activo)
        VALUES (@Nombre, @Descripcion, 1);

        DECLARE @IdCategoria INT = SCOPE_IDENTITY();

        -- Registrar en bitácora
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'INSERT', 'Categoria', CAST(@IdCategoria AS VARCHAR(10)),
               CONCAT('Categoría creada: ', @Nombre)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        SET @Mensaje = CONCAT('Categoría creada exitosamente. ID: ', @IdCategoria);
        RETURN @IdCategoria;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Actualizar categoría
IF OBJECT_ID('com.sp_ActualizarCategoria','P') IS NOT NULL DROP PROCEDURE com.sp_ActualizarCategoria;
GO
CREATE PROCEDURE com.sp_ActualizarCategoria
    @Usuario VARCHAR(50),
    @IdCategoria INT,
    @Nombre VARCHAR(100),
    @Descripcion VARCHAR(200) = NULL,
    @Activo BIT = 1,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que la categoría existe
        IF NOT EXISTS (SELECT 1 FROM com.tbCategoria WHERE IdCategoria = @IdCategoria)
        BEGIN
            SET @Mensaje = 'Error: La categoría no existe.';
            RETURN -1;
        END

        -- Validar que el nombre no esté duplicado (excepto para la misma categoría)
        IF EXISTS (SELECT 1 FROM com.tbCategoria WHERE Nombre = @Nombre AND IdCategoria <> @IdCategoria)
        BEGIN
            SET @Mensaje = 'Error: Ya existe otra categoría con ese nombre.';
            RETURN -1;
        END

        -- Actualizar categoría
        UPDATE com.tbCategoria
        SET Nombre = @Nombre,
            Descripcion = @Descripcion,
            Activo = @Activo
        WHERE IdCategoria = @IdCategoria;

        -- Registrar en bitácora
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'UPDATE', 'Categoria', CAST(@IdCategoria AS VARCHAR(10)),
               CONCAT('Categoría actualizada: ', @Nombre)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        SET @Mensaje = 'Categoría actualizada exitosamente.';
        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Eliminar/Desactivar categoría
IF OBJECT_ID('com.sp_EliminarCategoria','P') IS NOT NULL DROP PROCEDURE com.sp_EliminarCategoria;
GO
CREATE PROCEDURE com.sp_EliminarCategoria
    @Usuario VARCHAR(50),
    @IdCategoria INT,
    @EliminacionFisica BIT = 0,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que la categoría existe
        IF NOT EXISTS (SELECT 1 FROM com.tbCategoria WHERE IdCategoria = @IdCategoria)
        BEGIN
            SET @Mensaje = 'Error: La categoría no existe.';
            RETURN -1;
        END

        IF @EliminacionFisica = 1
        BEGIN
            -- Verificar si tiene productos asociados
            IF EXISTS (SELECT 1 FROM com.tbProductoCategoria WHERE IdCategoria = @IdCategoria)
            BEGIN
                SET @Mensaje = 'Error: No se puede eliminar la categoría porque tiene productos asociados.';
                RETURN -1;
            END

            -- Eliminación física
            DELETE FROM com.tbCategoria WHERE IdCategoria = @IdCategoria;

            INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
            SELECT @Usuario, u.IdUsuario, 'DELETE', 'Categoria', CAST(@IdCategoria AS VARCHAR(10)),
                   'Categoría eliminada físicamente'
            FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

            SET @Mensaje = 'Categoría eliminada exitosamente.';
        END
        ELSE
        BEGIN
            -- Eliminación lógica (desactivar)
            UPDATE com.tbCategoria SET Activo = 0 WHERE IdCategoria = @IdCategoria;

            INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
            SELECT @Usuario, u.IdUsuario, 'DISABLE', 'Categoria', CAST(@IdCategoria AS VARCHAR(10)),
                   'Categoría desactivada'
            FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

            SET @Mensaje = 'Categoría desactivada exitosamente.';
        END

        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

------------------------------------------------------------
-- 6.6. PROCEDIMIENTOS CRUD PARA PRODUCTOS
------------------------------------------------------------

-- Listar productos con paginación
IF OBJECT_ID('com.sp_ListarProductos','P') IS NOT NULL DROP PROCEDURE com.sp_ListarProductos;
GO
CREATE PROCEDURE com.sp_ListarProductos
    @Pagina INT = 1,
    @TamanoPagina INT = 10,
    @Busqueda VARCHAR(120) = NULL,
    @IdCategoria INT = NULL,
    @SoloActivos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    -- Consulta con paginación
    SELECT 
        p.IdProducto,
        p.Codigo,
        p.Nombre,
        p.Descripcion,
        p.PrecioCosto,
        p.PrecioVenta,
        p.Descuento,
        p.Estado,
        p.FechaRegistro,
        ISNULL(s.Existencia, 0) AS Existencia,
        STRING_AGG(c.Nombre, ', ') AS Categorias,
        COUNT(*) OVER() AS TotalRegistros
    FROM com.tbProducto p
    LEFT JOIN com.tbStock s ON p.IdProducto = s.IdProducto
    LEFT JOIN com.tbProductoCategoria pc ON p.IdProducto = pc.IdProducto
    LEFT JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
    WHERE (@SoloActivos = 0 OR p.Estado = 1)
      AND (@Busqueda IS NULL OR p.Nombre LIKE '%' + @Busqueda + '%' OR p.Codigo LIKE '%' + @Busqueda + '%')
      AND (@IdCategoria IS NULL OR EXISTS (
          SELECT 1 FROM com.tbProductoCategoria pc2 
          WHERE pc2.IdProducto = p.IdProducto AND pc2.IdCategoria = @IdCategoria
      ))
    GROUP BY p.IdProducto, p.Codigo, p.Nombre, p.Descripcion, p.PrecioCosto, 
             p.PrecioVenta, p.Descuento, p.Estado, p.FechaRegistro, s.Existencia
    ORDER BY p.Nombre
    OFFSET @Offset ROWS
    FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO

-- Obtener un producto por ID con sus categorías
IF OBJECT_ID('com.sp_ObtenerProducto','P') IS NOT NULL DROP PROCEDURE com.sp_ObtenerProducto;
GO
CREATE PROCEDURE com.sp_ObtenerProducto
    @IdProducto INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Datos del producto
    SELECT 
        p.IdProducto,
        p.Codigo,
        p.Nombre,
        p.Descripcion,
        p.PrecioCosto,
        p.PrecioVenta,
        p.Descuento,
        p.Estado,
        p.FechaRegistro,
        ISNULL(s.Existencia, 0) AS Existencia
    FROM com.tbProducto p
    LEFT JOIN com.tbStock s ON p.IdProducto = s.IdProducto
    WHERE p.IdProducto = @IdProducto;

    -- Categorías asociadas
    SELECT c.IdCategoria, c.Nombre
    FROM com.tbProductoCategoria pc
    JOIN com.tbCategoria c ON pc.IdCategoria = c.IdCategoria
    WHERE pc.IdProducto = @IdProducto;
END;
GO

-- Crear producto
IF OBJECT_ID('com.sp_CrearProducto','P') IS NOT NULL DROP PROCEDURE com.sp_CrearProducto;
GO
CREATE PROCEDURE com.sp_CrearProducto
    @Usuario VARCHAR(50),
    @Codigo VARCHAR(30),
    @Nombre VARCHAR(120),
    @Descripcion VARCHAR(400) = NULL,
    @PrecioCosto DECIMAL(10,2),
    @PrecioVenta DECIMAL(10,2),
    @Descuento DECIMAL(6,2) = 0,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el código no exista
        IF EXISTS (SELECT 1 FROM com.tbProducto WHERE Codigo = @Codigo)
        BEGIN
            SET @Mensaje = 'Error: Ya existe un producto con ese código.';
            RETURN -1;
        END

        -- Validar precios
        IF @PrecioCosto < 0 OR @PrecioVenta < 0
        BEGIN
            SET @Mensaje = 'Error: Los precios no pueden ser negativos.';
            RETURN -1;
        END

        IF @PrecioVenta < @PrecioCosto
        BEGIN
            SET @Mensaje = 'Advertencia: El precio de venta es menor al precio de costo.';
        END

        -- Insertar producto
        INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta, Descuento, Estado)
        VALUES (@Codigo, @Nombre, @Descripcion, @PrecioCosto, @PrecioVenta, @Descuento, 1);

        DECLARE @IdProducto INT = SCOPE_IDENTITY();

        -- Inicializar stock en 0
        INSERT INTO com.tbStock (IdProducto, Existencia) VALUES (@IdProducto, 0);

        -- Registrar en bitácora
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'INSERT', 'Producto', CAST(@IdProducto AS VARCHAR(10)),
               CONCAT('Producto creado: ', @Codigo, ' - ', @Nombre)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        IF @Mensaje IS NULL
            SET @Mensaje = CONCAT('Producto creado exitosamente. ID: ', @IdProducto);
        
        RETURN @IdProducto;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Actualizar producto
IF OBJECT_ID('com.sp_ActualizarProducto','P') IS NOT NULL DROP PROCEDURE com.sp_ActualizarProducto;
GO
CREATE PROCEDURE com.sp_ActualizarProducto
    @Usuario VARCHAR(50),
    @IdProducto INT,
    @Codigo VARCHAR(30),
    @Nombre VARCHAR(120),
    @Descripcion VARCHAR(400) = NULL,
    @PrecioCosto DECIMAL(10,2),
    @PrecioVenta DECIMAL(10,2),
    @Descuento DECIMAL(6,2) = 0,
    @Estado BIT = 1,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE IdProducto = @IdProducto)
        BEGIN
            SET @Mensaje = 'Error: El producto no existe.';
            RETURN -1;
        END

        -- Validar que el código no esté duplicado
        IF EXISTS (SELECT 1 FROM com.tbProducto WHERE Codigo = @Codigo AND IdProducto <> @IdProducto)
        BEGIN
            SET @Mensaje = 'Error: Ya existe otro producto con ese código.';
            RETURN -1;
        END

        -- Validar precios
        IF @PrecioCosto < 0 OR @PrecioVenta < 0
        BEGIN
            SET @Mensaje = 'Error: Los precios no pueden ser negativos.';
            RETURN -1;
        END

        -- Actualizar producto
        UPDATE com.tbProducto
        SET Codigo = @Codigo,
            Nombre = @Nombre,
            Descripcion = @Descripcion,
            PrecioCosto = @PrecioCosto,
            PrecioVenta = @PrecioVenta,
            Descuento = @Descuento,
            Estado = @Estado
        WHERE IdProducto = @IdProducto;

        -- Registrar en bitácora
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'UPDATE', 'Producto', CAST(@IdProducto AS VARCHAR(10)),
               CONCAT('Producto actualizado: ', @Codigo, ' - ', @Nombre)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        SET @Mensaje = 'Producto actualizado exitosamente.';
        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Asignar categoría a producto
IF OBJECT_ID('com.sp_AsignarCategoriaProducto','P') IS NOT NULL DROP PROCEDURE com.sp_AsignarCategoriaProducto;
GO
CREATE PROCEDURE com.sp_AsignarCategoriaProducto
    @Usuario VARCHAR(50),
    @IdProducto INT,
    @IdCategoria INT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE IdProducto = @IdProducto)
        BEGIN
            SET @Mensaje = 'Error: El producto no existe.';
            RETURN -1;
        END

        -- Validar que la categoría existe
        IF NOT EXISTS (SELECT 1 FROM com.tbCategoria WHERE IdCategoria = @IdCategoria)
        BEGIN
            SET @Mensaje = 'Error: La categoría no existe.';
            RETURN -1;
        END

        -- Validar que no esté ya asignada
        IF EXISTS (SELECT 1 FROM com.tbProductoCategoria WHERE IdProducto = @IdProducto AND IdCategoria = @IdCategoria)
        BEGIN
            SET @Mensaje = 'La categoría ya está asignada a este producto.';
            RETURN 0;
        END

        -- Asignar categoría
        INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria)
        VALUES (@IdProducto, @IdCategoria);

        -- Registrar en bitácora
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'INSERT', 'ProductoCategoria', 
               CONCAT(@IdProducto, '-', @IdCategoria),
               CONCAT('Categoría ', @IdCategoria, ' asignada al producto ', @IdProducto)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        SET @Mensaje = 'Categoría asignada exitosamente.';
        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Quitar categoría de producto
IF OBJECT_ID('com.sp_QuitarCategoriaProducto','P') IS NOT NULL DROP PROCEDURE com.sp_QuitarCategoriaProducto;
GO
CREATE PROCEDURE com.sp_QuitarCategoriaProducto
    @Usuario VARCHAR(50),
    @IdProducto INT,
    @IdCategoria INT,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Eliminar asociación
        DELETE FROM com.tbProductoCategoria
        WHERE IdProducto = @IdProducto AND IdCategoria = @IdCategoria;

        IF @@ROWCOUNT = 0
        BEGIN
            SET @Mensaje = 'La categoría no estaba asignada a este producto.';
            RETURN 0;
        END

        -- Registrar en bitácora
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'DELETE', 'ProductoCategoria', 
               CONCAT(@IdProducto, '-', @IdCategoria),
               CONCAT('Categoría ', @IdCategoria, ' quitada del producto ', @IdProducto)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        SET @Mensaje = 'Categoría quitada exitosamente.';
        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Eliminar/Desactivar producto
IF OBJECT_ID('com.sp_EliminarProducto','P') IS NOT NULL DROP PROCEDURE com.sp_EliminarProducto;
GO
CREATE PROCEDURE com.sp_EliminarProducto
    @Usuario VARCHAR(50),
    @IdProducto INT,
    @EliminacionFisica BIT = 0,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE IdProducto = @IdProducto)
        BEGIN
            SET @Mensaje = 'Error: El producto no existe.';
            RETURN -1;
        END

        IF @EliminacionFisica = 1
        BEGIN
            -- Verificar si tiene ventas
            IF EXISTS (SELECT 1 FROM com.tbDetalleVenta WHERE IdProducto = @IdProducto)
            BEGIN
                SET @Mensaje = 'Error: No se puede eliminar el producto porque tiene ventas registradas.';
                RETURN -1;
            END

            -- Eliminar asociaciones y registros relacionados
            DELETE FROM com.tbProductoCategoria WHERE IdProducto = @IdProducto;
            DELETE FROM com.tbInventario WHERE IdProducto = @IdProducto;
            DELETE FROM com.tbStock WHERE IdProducto = @IdProducto;
            DELETE FROM com.tbProducto WHERE IdProducto = @IdProducto;

            INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
            SELECT @Usuario, u.IdUsuario, 'DELETE', 'Producto', CAST(@IdProducto AS VARCHAR(10)),
                   'Producto eliminado físicamente'
            FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

            SET @Mensaje = 'Producto eliminado exitosamente.';
        END
        ELSE
        BEGIN
            -- Eliminación lógica (desactivar)
            UPDATE com.tbProducto SET Estado = 0 WHERE IdProducto = @IdProducto;

            INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
            SELECT @Usuario, u.IdUsuario, 'DISABLE', 'Producto', CAST(@IdProducto AS VARCHAR(10)),
                   'Producto desactivado'
            FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

            SET @Mensaje = 'Producto desactivado exitosamente.';
        END

        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

------------------------------------------------------------
-- 6.7. PROCEDIMIENTOS PARA INVENTARIO
------------------------------------------------------------

-- Registrar movimiento de inventario
IF OBJECT_ID('com.sp_RegistrarMovimientoInventario','P') IS NOT NULL DROP PROCEDURE com.sp_RegistrarMovimientoInventario;
GO
CREATE PROCEDURE com.sp_RegistrarMovimientoInventario
    @Usuario VARCHAR(50),
    @IdProducto INT,
    @Cantidad INT,
    @Tipo VARCHAR(20), -- 'ENTRADA', 'SALIDA', 'AJUSTE', 'COMPRA'
    @Observacion VARCHAR(500) = NULL,
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM com.tbProducto WHERE IdProducto = @IdProducto)
        BEGIN
            SET @Mensaje = 'Error: El producto no existe.';
            RETURN -1;
        END

        -- Validar tipo de movimiento
        IF @Tipo NOT IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'COMPRA')
        BEGIN
            SET @Mensaje = 'Error: Tipo de movimiento inválido. Use: ENTRADA, SALIDA, AJUSTE o COMPRA.';
            RETURN -1;
        END

        -- Para salidas, validar que hay suficiente stock
        IF @Tipo = 'SALIDA'
        BEGIN
            DECLARE @StockActual INT;
            SELECT @StockActual = ISNULL(Existencia, 0) FROM com.tbStock WHERE IdProducto = @IdProducto;
            
            IF @StockActual < ABS(@Cantidad)
            BEGIN
                SET @Mensaje = CONCAT('Error: Stock insuficiente. Disponible: ', @StockActual);
                RETURN -1;
            END

            -- Asegurar que la cantidad sea negativa para salidas
            IF @Cantidad > 0
                SET @Cantidad = -@Cantidad;
        END
        ELSE
        BEGIN
            -- Asegurar que la cantidad sea positiva para entradas/ajustes/compras
            IF @Cantidad < 0
                SET @Cantidad = ABS(@Cantidad);
        END

        -- Registrar movimiento (el trigger actualizará el stock automáticamente)
        INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
        VALUES (@IdProducto, @Cantidad, @Tipo, @Usuario, @Observacion);

        DECLARE @IdMovimiento BIGINT = SCOPE_IDENTITY();

        -- Registrar en bitácora de transacciones
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'INSERT', 'Inventario', CAST(@IdMovimiento AS VARCHAR(20)),
               CONCAT('Movimiento ', @Tipo, ': ', ABS(@Cantidad), ' unidades del producto ', @IdProducto)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        SET @Mensaje = CONCAT('Movimiento registrado exitosamente. ID: ', @IdMovimiento);
        RETURN @IdMovimiento;
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Consultar stock actual
IF OBJECT_ID('com.sp_ConsultarStock','P') IS NOT NULL DROP PROCEDURE com.sp_ConsultarStock;
GO
CREATE PROCEDURE com.sp_ConsultarStock
    @IdProducto INT = NULL,
    @StockMinimo INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.IdProducto,
        p.Codigo,
        p.Nombre,
        ISNULL(s.Existencia, 0) AS Existencia,
        p.PrecioCosto,
        p.PrecioVenta,
        s.FechaActualizacion,
        CASE 
            WHEN ISNULL(s.Existencia, 0) <= ISNULL(@StockMinimo, 10) THEN 'CRITICO'
            WHEN ISNULL(s.Existencia, 0) <= ISNULL(@StockMinimo, 10) * 2 THEN 'BAJO'
            ELSE 'NORMAL'
        END AS NivelStock
    FROM com.tbProducto p
    LEFT JOIN com.tbStock s ON p.IdProducto = s.IdProducto
    WHERE (@IdProducto IS NULL OR p.IdProducto = @IdProducto)
      AND p.Estado = 1
    ORDER BY ISNULL(s.Existencia, 0) ASC, p.Nombre;
END;
GO

------------------------------------------------------------
-- 6.8. PROCEDIMIENTOS PARA VENTAS
------------------------------------------------------------

-- Registrar venta completa (cabecera + detalle)
IF OBJECT_ID('com.sp_RegistrarVenta','P') IS NOT NULL DROP PROCEDURE com.sp_RegistrarVenta;
GO
CREATE PROCEDURE com.sp_RegistrarVenta
    @Usuario VARCHAR(50),
    @Observacion VARCHAR(500) = NULL,
    @Detalle NVARCHAR(MAX), -- JSON con items: [{"IdProducto":1,"Cantidad":2,"PrecioUnitario":10.00,"Descuento":0}]
    @Mensaje NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Parsear JSON del detalle
        DECLARE @DetalleTabla TABLE (
            IdProducto INT,
            Cantidad INT,
            PrecioUnitario DECIMAL(10,2),
            Descuento DECIMAL(10,2)
        );

        INSERT INTO @DetalleTabla (IdProducto, Cantidad, PrecioUnitario, Descuento)
        SELECT IdProducto, Cantidad, PrecioUnitario, Descuento
        FROM OPENJSON(@Detalle)
        WITH (
            IdProducto INT '$.IdProducto',
            Cantidad INT '$.Cantidad',
            PrecioUnitario DECIMAL(10,2) '$.PrecioUnitario',
            Descuento DECIMAL(10,2) '$.Descuento'
        );

        -- Validar que hay items
        IF NOT EXISTS (SELECT 1 FROM @DetalleTabla)
        BEGIN
            SET @Mensaje = 'Error: La venta debe tener al menos un producto.';
            ROLLBACK TRANSACTION;
            RETURN -1;
        END

        -- Validar stock para cada producto
        DECLARE @IdProducto INT, @CantidadRequerida INT, @StockDisponible INT;
        DECLARE cur CURSOR FOR SELECT IdProducto, Cantidad FROM @DetalleTabla;
        OPEN cur;
        FETCH NEXT FROM cur INTO @IdProducto, @CantidadRequerida;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            SELECT @StockDisponible = ISNULL(Existencia, 0) 
            FROM com.tbStock WHERE IdProducto = @IdProducto;

            IF @StockDisponible < @CantidadRequerida
            BEGIN
                DECLARE @NombreProducto VARCHAR(120);
                SELECT @NombreProducto = Nombre FROM com.tbProducto WHERE IdProducto = @IdProducto;
                
                SET @Mensaje = CONCAT('Error: Stock insuficiente para ', @NombreProducto, 
                                    '. Disponible: ', @StockDisponible, ', Requerido: ', @CantidadRequerida);
                CLOSE cur;
                DEALLOCATE cur;
                ROLLBACK TRANSACTION;
                RETURN -1;
            END

            FETCH NEXT FROM cur INTO @IdProducto, @CantidadRequerida;
        END
        
        CLOSE cur;
        DEALLOCATE cur;

        -- Calcular totales
        DECLARE @Subtotal DECIMAL(12,2), @DescuentoTotal DECIMAL(12,2), @Total DECIMAL(12,2);
        
        SELECT 
            @Subtotal = SUM(Cantidad * PrecioUnitario),
            @DescuentoTotal = SUM(Descuento)
        FROM @DetalleTabla;

        SET @Total = @Subtotal - @DescuentoTotal;

        -- Insertar cabecera de venta
        INSERT INTO com.tbVenta (Usuario, Subtotal, DescuentoTotal, Total, Observacion)
        VALUES (@Usuario, @Subtotal, @DescuentoTotal, @Total, @Observacion);

        DECLARE @IdVenta BIGINT = SCOPE_IDENTITY();

        -- Insertar detalle de venta (el trigger descontará el stock automáticamente)
        INSERT INTO com.tbDetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento)
        SELECT @IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento
        FROM @DetalleTabla;

        -- Registrar en bitácora
        INSERT INTO seg.tbBitacoraTransacciones (Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
        SELECT @Usuario, u.IdUsuario, 'INSERT', 'Venta', CAST(@IdVenta AS VARCHAR(20)),
               CONCAT('Venta registrada. Total: $', @Total)
        FROM seg.tbUsuario u WHERE u.Usuario = @Usuario;

        COMMIT TRANSACTION;

        SET @Mensaje = CONCAT('Venta registrada exitosamente. ID: ', @IdVenta, ', Total: $', @Total);
        RETURN @IdVenta;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END;
GO

-- Listar ventas con paginación
IF OBJECT_ID('com.sp_ListarVentas','P') IS NOT NULL DROP PROCEDURE com.sp_ListarVentas;
GO
CREATE PROCEDURE com.sp_ListarVentas
    @Pagina INT = 1,
    @TamanoPagina INT = 20,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL,
    @Usuario VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;

    SELECT 
        v.IdVenta,
        v.Usuario,
        v.FechaVenta,
        v.Subtotal,
        v.DescuentoTotal,
        v.Total,
        v.Observacion,
        COUNT(dv.IdDetalle) AS CantidadItems,
        SUM(dv.Cantidad) AS TotalUnidades,
        COUNT(*) OVER() AS TotalRegistros
    FROM com.tbVenta v
    LEFT JOIN com.tbDetalleVenta dv ON v.IdVenta = dv.IdVenta
    WHERE (@FechaInicio IS NULL OR v.FechaVenta >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.FechaVenta <= @FechaFin)
      AND (@Usuario IS NULL OR v.Usuario = @Usuario)
    GROUP BY v.IdVenta, v.Usuario, v.FechaVenta, v.Subtotal, v.DescuentoTotal, v.Total, v.Observacion
    ORDER BY v.FechaVenta DESC
    OFFSET @Offset ROWS
    FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO

-- Obtener detalle de una venta
IF OBJECT_ID('com.sp_ObtenerDetalleVenta','P') IS NOT NULL DROP PROCEDURE com.sp_ObtenerDetalleVenta;
GO
CREATE PROCEDURE com.sp_ObtenerDetalleVenta
    @IdVenta BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Datos de la venta
    SELECT 
        v.IdVenta,
        v.Usuario,
        v.FechaVenta,
        v.Subtotal,
        v.DescuentoTotal,
        v.Total,
        v.Observacion
    FROM com.tbVenta v
    WHERE v.IdVenta = @IdVenta;

    -- Items de la venta
    SELECT 
        dv.IdDetalle,
        dv.IdProducto,
        p.Codigo,
        p.Nombre,
        dv.Cantidad,
        dv.PrecioUnitario,
        dv.Descuento,
        (dv.Cantidad * dv.PrecioUnitario - dv.Descuento) AS Subtotal
    FROM com.tbDetalleVenta dv
    JOIN com.tbProducto p ON dv.IdProducto = p.IdProducto
    WHERE dv.IdVenta = @IdVenta;
END;
GO

------------------------------------------------------------
-- 7. PERMISOS Y ROLES (ADMIN/SECRETARIA)
------------------------------------------------------------
ALTER TABLE seg.tbUsuario DROP CONSTRAINT [CK__tbUsuario__Rol__...]; -- Si existe un constraint CHECK de roles, elimina antes de crear el nuevo.
ALTER TABLE seg.tbUsuario
    ADD CONSTRAINT CK_tbUsuario_Rol CHECK (Rol IN ('admin','secretaria','vendedor'));
GO
-- 2. Crear nuevo usuario y rol de SQL Server (opcional, para refinar permisos a nivel SQL Server)
USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name='login_vendedor')
    CREATE LOGIN login_vendedor WITH PASSWORD='Vend3dor_2025!', CHECK_POLICY=ON, CHECK_EXPIRATION=ON;
GO
USE AcademicoDB;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='usr_vendedor')
    CREATE USER usr_vendedor FOR LOGIN login_vendedor;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='rol_vendedor_app')
    CREATE ROLE rol_vendedor_app AUTHORIZATION dbo;
GO
-- Asignar usuario al rol
BEGIN TRY
    ALTER ROLE rol_vendedor_app ADD MEMBER usr_vendedor;
END TRY BEGIN CATCH END CATCH;
GO


-- 3. Asignar permisos por rol en el esquema com (comercial)
-- ADMIN: todos los permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::com TO rol_admin_app;
GRANT EXECUTE ON SCHEMA::com TO rol_admin_app;

-- SECRETARIA: solo consulta y reportes
GRANT SELECT ON com.tbVenta TO rol_secretaria_app;
GRANT SELECT ON com.tbDetalleVenta TO rol_secretaria_app;
GRANT SELECT ON com.tbProducto TO rol_secretaria_app;
GRANT SELECT ON com.tbCategoria TO rol_secretaria_app;
GRANT SELECT ON com.tbStock TO rol_secretaria_app;
GRANT SELECT ON com.tbInventario TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteVentasPorFecha TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteInventarioActual TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteProductosMasVendidos TO rol_secretaria_app;
GRANT EXECUTE ON com.sp_ReporteIngresosTotales TO rol_secretaria_app;

-- VENDEDOR: solo CRUD y ver inventario, NO reportes
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbProducto TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbCategoria TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbInventario TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbVenta TO rol_vendedor_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON com.tbDetalleVenta TO rol_vendedor_app;
GRANT SELECT ON com.tbStock TO rol_vendedor_app;
-- No se otorgan permisos de ejecución sobre reportes ni de acceso a vistas de reporte


DECLARE @msg NVARCHAR(200),@tk UNIQUEIDENTIFIER;
EXEC seg.sp_RegistrarUsuario 
    'harold','harold','Demo','vendedor@demo.com','vendedor',
    N'haroldscg7!',N'haroldscg7!',@msg OUTPUT; 
SELECT @msg AS MsgVendedor;

SELECT name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('seg.tbUsuario');

ALTER TABLE seg.tbUsuario DROP CONSTRAINT CK_tbUsuario_Rol;
ALTER TABLE seg.tbUsuario
ADD CONSTRAINT CK_tbUsuario_Rol CHECK (Rol IN ('admin','secretaria','vendedor'));

-----------------------------------------------------
--Pruebas
-----------------------------------------------------
-- Categorías
INSERT INTO com.tbCategoria (Nombre, Descripcion) VALUES ('Papelería', 'Artículos escolares');
INSERT INTO com.tbCategoria (Nombre, Descripcion) VALUES ('Electrónica', 'Artículos electrónicos');
INSERT INTO com.tbCategoria (Nombre, Descripcion) VALUES ('Oficina', 'Suministros de oficina');

-- Productos
INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta)
VALUES ('PEN-001', 'Bolígrafo Azul', 'Bolígrafo tinta azul', 1.00, 2.00);

INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta)
VALUES ('USB-001', 'Memoria USB 16GB', 'USB 16GB', 10.00, 15.00);

INSERT INTO com.tbProducto (Codigo, Nombre, Descripcion, PrecioCosto, PrecioVenta)
VALUES ('NOTE-001', 'Cuaderno Grande', 'Cuaderno 100 hojas', 2.50, 5.00);

-- Asociación producto-categoría (PEN-001 a Papelería y Oficina)
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria)
SELECT p.IdProducto, c.IdCategoria
FROM com.tbProducto p, com.tbCategoria c
WHERE p.Codigo = 'PEN-001' AND c.Nombre = 'Papelería';

INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria)
SELECT p.IdProducto, c.IdCategoria
FROM com.tbProducto p, com.tbCategoria c
WHERE p.Codigo = 'PEN-001' AND c.Nombre = 'Oficina';

-- Asociación USB-001 a Electrónica
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria)
SELECT p.IdProducto, c.IdCategoria
FROM com.tbProducto p, com.tbCategoria c
WHERE p.Codigo = 'USB-001' AND c.Nombre = 'Electrónica';

-- Asociación NOTE-001 a Papelería
INSERT INTO com.tbProductoCategoria (IdProducto, IdCategoria)
SELECT p.IdProducto, c.IdCategoria
FROM com.tbProducto p, com.tbCategoria c
WHERE p.Codigo = 'NOTE-001' AND c.Nombre = 'Papelería';

-- Stock inicial
INSERT INTO com.tbStock (IdProducto, Existencia)
SELECT IdProducto, 100 FROM com.tbProducto WHERE Codigo = 'PEN-001';
INSERT INTO com.tbStock (IdProducto, Existencia)
SELECT IdProducto, 40 FROM com.tbProducto WHERE Codigo = 'USB-001';
INSERT INTO com.tbStock (IdProducto, Existencia)
SELECT IdProducto, 60 FROM com.tbProducto WHERE Codigo = 'NOTE-001';

-- Entradas de inventario (simulación de compra)
INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
SELECT IdProducto, 50, 'ENTRADA', 'henryOo', 'Reposición inicial'
FROM com.tbProducto WHERE Codigo = 'PEN-001';

INSERT INTO com.tbInventario (IdProducto, Cantidad, Tipo, Usuario, Observacion)
SELECT IdProducto, 20, 'ENTRADA', 'henryOo', 'Stock inicial USB'
FROM com.tbProducto WHERE Codigo = 'USB-001';

-- Venta
DECLARE @idVenta BIGINT;
INSERT INTO com.tbVenta (Usuario, Subtotal, DescuentoTotal, Total, Observacion)
VALUES ('henryOo', 10.00, 0.00, 10.00, 'Venta de prueba');
SET @idVenta = SCOPE_IDENTITY();

-- Detalle de venta (2 bolígrafos, 1 USB)
INSERT INTO com.tbDetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento)
SELECT @idVenta, IdProducto, 2, 2.00, 0.00 FROM com.tbProducto WHERE Codigo = 'PEN-001';
INSERT INTO com.tbDetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento)
SELECT @idVenta, IdProducto, 1, 15.00, 0.00 FROM com.tbProducto WHERE Codigo = 'USB-001';


