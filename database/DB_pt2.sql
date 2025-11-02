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
