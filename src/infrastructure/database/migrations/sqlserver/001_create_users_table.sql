-- src/infrastructure/database/migrations/sqlserver/001_create_users_table.sql

-- ============================================================================
-- MIGRACIÓN: 001_create_users_table.sql
-- DESCRIPCIÓN: Crear tabla de usuarios del sistema
-- BASE DE DATOS: SQL Server 2019
-- DEPENDENCIAS: Ninguna (tabla base)
-- ============================================================================

-- Usar la base de datos
USE [AsistenciaDB];
GO

-- Verificar si la tabla ya existe y eliminarla si es necesario (solo en desarrollo)
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.users;
    PRINT 'Tabla users eliminada (desarrollo)';
END
GO

-- Crear tabla users
CREATE TABLE dbo.users (
    -- Clave primaria
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Información básica del usuario
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    
    -- Role del usuario en el sistema
    role NVARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'ENCARGADO_SUCURSAL', 'EMPLEADO')),
    
    -- Estado del usuario
    is_active BIT NOT NULL DEFAULT 1,
    
    -- Información de sesión
    last_login DATETIME2(3) NULL,
    login_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME2(3) NULL,
    
    -- Configuración de seguridad
    password_expires_at DATETIME2(3) NULL,
    must_change_password BIT NOT NULL DEFAULT 0,
    two_factor_enabled BIT NOT NULL DEFAULT 0,
    two_factor_secret NVARCHAR(255) NULL,
    
    -- Información adicional
    phone NVARCHAR(20) NULL,
    avatar_url NVARCHAR(500) NULL,
    timezone NVARCHAR(50) NOT NULL DEFAULT 'America/Guayaquil',
    language NVARCHAR(10) NOT NULL DEFAULT 'es',
    
    -- Campos de auditoría (timestamps)
    created_at DATETIME2(3) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(3) NOT NULL DEFAULT GETUTCDATE(),
    deleted_at DATETIME2(3) NULL,
    
    -- Información de creación/modificación
    created_by UNIQUEIDENTIFIER NULL,
    updated_by UNIQUEIDENTIFIER NULL,
    
    -- Metadatos adicionales
    metadata NVARCHAR(MAX) NULL -- JSON para información adicional
);
GO

-- Crear índices para optimizar consultas
CREATE INDEX IX_users_email ON dbo.users(email) WHERE deleted_at IS NULL;
CREATE INDEX IX_users_role ON dbo.users(role) WHERE deleted_at IS NULL AND is_active = 1;
CREATE INDEX IX_users_active ON dbo.users(is_active, deleted_at);
CREATE INDEX IX_users_last_login ON dbo.users(last_login) WHERE is_active = 1;
CREATE INDEX IX_users_created_at ON dbo.users(created_at);
CREATE INDEX IX_users_deleted_at ON dbo.users(deleted_at) WHERE deleted_at IS NOT NULL;
GO

-- Crear trigger para actualizar updated_at automáticamente
IF OBJECT_ID('dbo.TR_users_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_users_updated_at;
GO

CREATE TRIGGER TR_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.users 
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT DISTINCT id FROM inserted);
END
GO

-- Crear función para validar email
IF OBJECT_ID('dbo.fn_validate_email', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_validate_email;
GO

CREATE FUNCTION dbo.fn_validate_email(@email NVARCHAR(255))
RETURNS BIT
AS
BEGIN
    DECLARE @result BIT = 0;
    
    IF @email LIKE '%_@_%._%' 
        AND @email NOT LIKE '%@%@%'
        AND @email NOT LIKE '%.@%'
        AND @email NOT LIKE '%@.%'
        AND LEN(@email) > 5
        AND LEN(@email) < 255
    BEGIN
        SET @result = 1;
    END
    
    RETURN @result;
END
GO

-- Agregar constraint para validar email usando la función
ALTER TABLE dbo.users 
ADD CONSTRAINT CK_users_email_format 
CHECK (dbo.fn_validate_email(email) = 1);
GO

-- Constraint para validar que el password hash no esté vacío
ALTER TABLE dbo.users 
ADD CONSTRAINT CK_users_password_not_empty 
CHECK (LEN(TRIM(password_hash)) > 10);
GO

-- Constraint para validar timezone
ALTER TABLE dbo.users 
ADD CONSTRAINT CK_users_timezone 
CHECK (timezone IN ('America/Guayaquil', 'America/New_York', 'America/Los_Angeles', 'UTC'));
GO

-- Constraint para validar language
ALTER TABLE dbo.users 
ADD CONSTRAINT CK_users_language 
CHECK (language IN ('es', 'en'));
GO

-- Constraint para validar que locked_until sea mayor a created_at
ALTER TABLE dbo.users 
ADD CONSTRAINT CK_users_locked_until 
CHECK (locked_until IS NULL OR locked_until > created_at);
GO

-- Insertar usuario administrador por defecto
INSERT INTO dbo.users (
    email, 
    password_hash, 
    nombre, 
    apellido, 
    role, 
    is_active,
    must_change_password,
    created_at,
    updated_at
) VALUES (
    'admin@hansor04.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwSxPRqZ8Qr.9Zm', -- password: admin123
    'Administrador',
    'Sistema',
    'ADMIN',
    1,
    1, -- Debe cambiar contraseña en el primer login
    GETUTCDATE(),
    GETUTCDATE()
);
GO

-- Crear vista para consultas comunes de usuarios activos
IF OBJECT_ID('dbo.vw_active_users', 'V') IS NOT NULL
    DROP VIEW dbo.vw_active_users;
GO

CREATE VIEW dbo.vw_active_users AS
SELECT 
    id,
    email,
    nombre,
    apellido,
    CONCAT(nombre, ' ', apellido) AS nombre_completo,
    role,
    is_active,
    last_login,
    DATEDIFF(day, last_login, GETUTCDATE()) AS dias_sin_login,
    two_factor_enabled,
    phone,
    timezone,
    language,
    created_at,
    updated_at
FROM dbo.users
WHERE deleted_at IS NULL 
    AND is_active = 1;
GO

-- Crear procedimiento almacenado para login de usuario
IF OBJECT_ID('dbo.sp_user_login', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_user_login;
GO

CREATE PROCEDURE dbo.sp_user_login
    @email NVARCHAR(255),
    @password_hash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @user_id UNIQUEIDENTIFIER;
    DECLARE @is_locked BIT = 0;
    DECLARE @login_attempts INT;
    
    -- Verificar si el usuario existe y obtener información
    SELECT 
        @user_id = id,
        @login_attempts = login_attempts,
        @is_locked = CASE 
            WHEN locked_until IS NOT NULL AND locked_until > GETUTCDATE() THEN 1 
            ELSE 0 
        END
    FROM dbo.users 
    WHERE email = @email 
        AND deleted_at IS NULL;
    
    -- Si el usuario no existe
    IF @user_id IS NULL
    BEGIN
        SELECT 'USER_NOT_FOUND' AS result, NULL AS user_data;
        RETURN;
    END
    
    -- Si el usuario está bloqueado
    IF @is_locked = 1
    BEGIN
        SELECT 'USER_LOCKED' AS result, NULL AS user_data;
        RETURN;
    END
    
    -- Verificar contraseña
    IF EXISTS (
        SELECT 1 FROM dbo.users 
        WHERE id = @user_id 
            AND password_hash = @password_hash
            AND is_active = 1
    )
    BEGIN
        -- Login exitoso: resetear intentos y actualizar last_login
        UPDATE dbo.users 
        SET 
            login_attempts = 0,
            last_login = GETUTCDATE(),
            locked_until = NULL
        WHERE id = @user_id;
        
        -- Retornar datos del usuario
        SELECT 
            'SUCCESS' AS result,
            (
                SELECT 
                    id,
                    email,
                    nombre,
                    apellido,
                    role,
                    is_active,
                    last_login,
                    must_change_password,
                    two_factor_enabled,
                    timezone,
                    language
                FROM dbo.users 
                WHERE id = @user_id
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ) AS user_data;
    END
    ELSE
    BEGIN
        -- Login fallido: incrementar intentos
        SET @login_attempts = @login_attempts + 1;
        
        UPDATE dbo.users 
        SET 
            login_attempts = @login_attempts,
            locked_until = CASE 
                WHEN @login_attempts >= 5 THEN DATEADD(MINUTE, 30, GETUTCDATE())
                ELSE NULL 
            END
        WHERE id = @user_id;
        
        SELECT 'INVALID_PASSWORD' AS result, @login_attempts AS login_attempts;
    END
END
GO

-- Crear procedimiento para cambio de contraseña
IF OBJECT_ID('dbo.sp_change_password', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_change_password;
GO

CREATE PROCEDURE dbo.sp_change_password
    @user_id UNIQUEIDENTIFIER,
    @old_password_hash NVARCHAR(255),
    @new_password_hash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar contraseña actual
    IF NOT EXISTS (
        SELECT 1 FROM dbo.users 
        WHERE id = @user_id 
            AND password_hash = @old_password_hash
            AND is_active = 1
            AND deleted_at IS NULL
    )
    BEGIN
        SELECT 'INVALID_CURRENT_PASSWORD' AS result;
        RETURN;
    END
    
    -- Actualizar contraseña
    UPDATE dbo.users 
    SET 
        password_hash = @new_password_hash,
        must_change_password = 0,
        password_expires_at = DATEADD(DAY, 90, GETUTCDATE()),
        updated_at = GETUTCDATE()
    WHERE id = @user_id;
    
    SELECT 'SUCCESS' AS result;
END
GO

-- Mostrar información de la tabla creada
SELECT 
    'users' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(CASE WHEN is_active = 1 THEN 1 END) AS active_users,
    COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) AS admin_users
FROM dbo.users;
GO

PRINT 'Migración 001_create_users_table.sql ejecutada exitosamente';
PRINT 'Tabla users creada con índices, triggers, constraints y procedimientos';
PRINT 'Usuario administrador por defecto creado: admin@hansor04.com';
GO