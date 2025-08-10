-- src/infrastructure/database/migrations/sqlserver/002_create_sucursales_table.sql

-- ============================================================================
-- MIGRACIÓN: 002_create_sucursales_table.sql
-- DESCRIPCIÓN: Crear tabla de sucursales del sistema
-- BASE DE DATOS: SQL Server 2019
-- DEPENDENCIAS: 001_create_users_table.sql
-- ============================================================================

-- Usar la base de datos
USE [AsistenciaDB];
GO

-- Verificar si la tabla ya existe y eliminarla si es necesario (solo en desarrollo)
IF OBJECT_ID('dbo.sucursales', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.sucursales;
    PRINT 'Tabla sucursales eliminada (desarrollo)';
END
GO

-- Crear tabla sucursales
CREATE TABLE dbo.sucursales (
    -- Clave primaria
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Información básica de la sucursal
    nombre NVARCHAR(200) NOT NULL,
    codigo NVARCHAR(20) NOT NULL UNIQUE,
    descripcion NVARCHAR(500) NULL,
    
    -- Información de ubicación
    direccion NVARCHAR(400) NOT NULL,
    ciudad NVARCHAR(100) NOT NULL DEFAULT 'Quito',
    provincia NVARCHAR(100) NOT NULL DEFAULT 'Pichincha',
    pais NVARCHAR(100) NOT NULL DEFAULT 'Ecuador',
    codigo_postal NVARCHAR(20) NULL,
    
    -- Coordenadas GPS
    latitud DECIMAL(10, 8) NULL,
    longitud DECIMAL(11, 8) NULL,
    radio_geofence DECIMAL(8, 2) NOT NULL DEFAULT 100.00, -- Radio en metros para geofencing
    
    -- Información de contacto
    telefono NVARCHAR(20) NULL,
    email NVARCHAR(255) NULL,
    website NVARCHAR(500) NULL,
    
    -- Horarios de operación (JSON)
    horarios_operacion NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON con horarios por día
    zona_horaria NVARCHAR(50) NOT NULL DEFAULT 'America/Guayaquil',
    
    -- Configuración de asistencia
    tolerancia_entrada_minutos INT NOT NULL DEFAULT 10,
    tolerancia_salida_minutos INT NOT NULL DEFAULT 10,
    horas_trabajo_diario DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
    horas_trabajo_semanal DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
    
    -- Configuración de descansos
    permite_descansos BIT NOT NULL DEFAULT 1,
    tiempo_descanso_minutos INT NOT NULL DEFAULT 30,
    max_descansos_dia INT NOT NULL DEFAULT 2,
    
    -- Configuración de almuerzo
    tiene_almuerzo BIT NOT NULL DEFAULT 1,
    tiempo_almuerzo_minutos INT NOT NULL DEFAULT 60,
    almuerzo_obligatorio BIT NOT NULL DEFAULT 1,
    
    -- Estado y configuración
    is_active BIT NOT NULL DEFAULT 1,
    permite_trabajo_remoto BIT NOT NULL DEFAULT 0,
    requiere_aprobacion_extras BIT NOT NULL DEFAULT 1,
    
    -- Responsable de la sucursal
    encargado_id UNIQUEIDENTIFIER NULL,
    
    -- Configuración financiera
    moneda NVARCHAR(10) NOT NULL DEFAULT 'USD',
    costo_hora_regular DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    costo_hora_extra_25 DECIMAL(10, 2) NOT NULL DEFAULT 6.25,
    costo_hora_extra_50 DECIMAL(10, 2) NOT NULL DEFAULT 7.50,
    costo_hora_extra_100 DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    
    -- Configuración de dispositivos biométricos
    max_dispositivos INT NOT NULL DEFAULT 4,
    ip_range_permitida NVARCHAR(100) NULL, -- Rango de IPs permitidas para dispositivos
    
    -- Configuración de reportes
    genera_reportes_automaticos BIT NOT NULL DEFAULT 1,
    frecuencia_reportes NVARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
    email_reportes NVARCHAR(255) NULL,
    
    -- Metadatos adicionales
    configuracion_adicional NVARCHAR(MAX) NULL, -- JSON para configuraciones específicas
    notas NVARCHAR(1000) NULL,
    
    -- Campos de auditoría (timestamps)
    created_at DATETIME2(3) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(3) NOT NULL DEFAULT GETUTCDATE(),
    deleted_at DATETIME2(3) NULL,
    
    -- Información de creación/modificación
    created_by UNIQUEIDENTIFIER NULL,
    updated_by UNIQUEIDENTIFIER NULL,
    
    -- Foreign keys (sin cascadas circulares)
    CONSTRAINT FK_sucursales_encargado FOREIGN KEY (encargado_id) 
        REFERENCES dbo.users(id) ON DELETE SET NULL,
    CONSTRAINT FK_sucursales_created_by FOREIGN KEY (created_by) 
        REFERENCES dbo.users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_sucursales_updated_by FOREIGN KEY (updated_by) 
        REFERENCES dbo.users(id) ON DELETE NO ACTION
);
GO

-- Crear índices para optimizar consultas
CREATE INDEX IX_sucursales_codigo ON dbo.sucursales(codigo) WHERE deleted_at IS NULL;
CREATE INDEX IX_sucursales_nombre ON dbo.sucursales(nombre) WHERE deleted_at IS NULL;
CREATE INDEX IX_sucursales_ciudad ON dbo.sucursales(ciudad, provincia) WHERE deleted_at IS NULL;
CREATE INDEX IX_sucursales_active ON dbo.sucursales(is_active, deleted_at);
CREATE INDEX IX_sucursales_encargado ON dbo.sucursales(encargado_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_sucursales_location ON dbo.sucursales(latitud, longitud) WHERE latitud IS NOT NULL;
CREATE INDEX IX_sucursales_created_at ON dbo.sucursales(created_at);
GO

-- Crear trigger para actualizar updated_at automáticamente
IF OBJECT_ID('dbo.TR_sucursales_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_sucursales_updated_at;
GO

CREATE TRIGGER TR_sucursales_updated_at
ON dbo.sucursales
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.sucursales 
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT DISTINCT id FROM inserted);
END
GO

-- Constraints de validación
ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_codigo_format 
CHECK (codigo LIKE '[A-Z][A-Z][A-Z]%' AND LEN(codigo) BETWEEN 3 AND 20);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_tolerancia_entrada 
CHECK (tolerancia_entrada_minutos BETWEEN 0 AND 60);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_tolerancia_salida 
CHECK (tolerancia_salida_minutos BETWEEN 0 AND 60);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_horas_trabajo_diario 
CHECK (horas_trabajo_diario BETWEEN 1.0 AND 12.0);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_horas_trabajo_semanal 
CHECK (horas_trabajo_semanal BETWEEN 5.0 AND 60.0);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_tiempo_descanso 
CHECK (tiempo_descanso_minutos BETWEEN 10 AND 120);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_tiempo_almuerzo 
CHECK (tiempo_almuerzo_minutos BETWEEN 30 AND 180);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_max_dispositivos 
CHECK (max_dispositivos BETWEEN 1 AND 10);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_radio_geofence 
CHECK (radio_geofence BETWEEN 10.0 AND 1000.0);
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_frecuencia_reportes 
CHECK (frecuencia_reportes IN ('DIARIO', 'SEMANAL', 'MENSUAL', 'TRIMESTRAL'));
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_moneda 
CHECK (moneda IN ('USD', 'EUR', 'COP', 'PEN', 'MXN'));
GO

-- Función para validar horarios de operación (JSON)
IF OBJECT_ID('dbo.fn_validate_horarios_operacion', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_validate_horarios_operacion;
GO

CREATE FUNCTION dbo.fn_validate_horarios_operacion(@horarios NVARCHAR(MAX))
RETURNS BIT
AS
BEGIN
    DECLARE @result BIT = 1;
    
    -- Validar que sea JSON válido (validación básica)
    IF @horarios IS NULL OR @horarios = '' OR @horarios = '{}'
    BEGIN
        SET @result = 1; -- Permitir vacío
    END
    ELSE IF @horarios NOT LIKE '{%}' OR @horarios LIKE '%""%'
    BEGIN
        SET @result = 0; -- JSON inválido
    END
    
    RETURN @result;
END
GO

ALTER TABLE dbo.sucursales 
ADD CONSTRAINT CK_sucursales_horarios_json 
CHECK (dbo.fn_validate_horarios_operacion(horarios_operacion) = 1);
GO

-- Crear vista para consultas comunes de sucursales activas
IF OBJECT_ID('dbo.vw_sucursales_activas', 'V') IS NOT NULL
    DROP VIEW dbo.vw_sucursales_activas;
GO

CREATE VIEW dbo.vw_sucursales_activas AS
SELECT 
    s.id,
    s.nombre,
    s.codigo,
    s.descripcion,
    s.direccion,
    s.ciudad,
    s.provincia,
    s.telefono,
    s.email,
    s.is_active,
    s.permite_trabajo_remoto,
    s.horas_trabajo_diario,
    s.horas_trabajo_semanal,
    u.nombre + ' ' + u.apellido AS encargado_nombre,
    u.email AS encargado_email,
    s.max_dispositivos,
    s.radio_geofence,
    s.zona_horaria,
    s.created_at,
    s.updated_at
FROM dbo.sucursales s
LEFT JOIN dbo.users u ON s.encargado_id = u.id
WHERE s.deleted_at IS NULL 
    AND s.is_active = 1;
GO

-- Crear función para calcular distancia entre coordenadas (Haversine)
-- Usando ATN2 para compatibilidad con SQL Server 2019
IF OBJECT_ID('dbo.fn_calculate_distance', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_calculate_distance;
GO

CREATE FUNCTION dbo.fn_calculate_distance(
    @lat1 DECIMAL(10, 8),
    @lon1 DECIMAL(11, 8),
    @lat2 DECIMAL(10, 8),
    @lon2 DECIMAL(11, 8)
)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @earth_radius DECIMAL(10, 2) = 6371000; -- Radio de la Tierra en metros
    DECLARE @dlat DECIMAL(10, 8) = RADIANS(@lat2 - @lat1);
    DECLARE @dlon DECIMAL(10, 8) = RADIANS(@lon2 - @lon1);
    DECLARE @a DECIMAL(20, 10);
    DECLARE @c DECIMAL(20, 10);
    DECLARE @distance DECIMAL(10, 2);
    
    SET @a = SIN(@dlat/2) * SIN(@dlat/2) + 
             COS(RADIANS(@lat1)) * COS(RADIANS(@lat2)) * 
             SIN(@dlon/2) * SIN(@dlon/2);
    
    -- Usar ATN2 para compatibilidad con SQL Server 2019
    SET @c = 2 * ATN2(SQRT(@a), SQRT(1-@a));
    SET @distance = @earth_radius * @c;
    
    RETURN @distance;
END
GO

-- Crear procedimiento para verificar geofencing
IF OBJECT_ID('dbo.sp_verify_geofence', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_verify_geofence;
GO

CREATE PROCEDURE dbo.sp_verify_geofence
    @sucursal_id UNIQUEIDENTIFIER,
    @user_lat DECIMAL(10, 8),
    @user_lon DECIMAL(11, 8)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @sucursal_lat DECIMAL(10, 8);
    DECLARE @sucursal_lon DECIMAL(11, 8);
    DECLARE @radio DECIMAL(8, 2);
    DECLARE @distance DECIMAL(10, 2);
    
    -- Obtener coordenadas de la sucursal
    SELECT 
        @sucursal_lat = latitud,
        @sucursal_lon = longitud,
        @radio = radio_geofence
    FROM dbo.sucursales 
    WHERE id = @sucursal_id 
        AND deleted_at IS NULL 
        AND is_active = 1;
    
    -- Si no hay coordenadas configuradas, permitir acceso
    IF @sucursal_lat IS NULL OR @sucursal_lon IS NULL
    BEGIN
        SELECT 'ALLOWED' AS result, 'No geofence configured' AS message, NULL AS distance;
        RETURN;
    END
    
    -- Calcular distancia
    SET @distance = dbo.fn_calculate_distance(@sucursal_lat, @sucursal_lon, @user_lat, @user_lon);
    
    -- Verificar si está dentro del radio permitido
    IF @distance <= @radio
    BEGIN
        SELECT 'ALLOWED' AS result, 'Within geofence radius' AS message, @distance AS distance;
    END
    ELSE
    BEGIN
        SELECT 'DENIED' AS result, 'Outside geofence radius' AS message, @distance AS distance;
    END
END
GO

-- Insertar sucursales de ejemplo
INSERT INTO dbo.sucursales (
    nombre, codigo, descripcion, direccion, ciudad, provincia,
    latitud, longitud, radio_geofence,
    telefono, email,
    horas_trabajo_diario, horas_trabajo_semanal,
    tolerancia_entrada_minutos, tolerancia_salida_minutos,
    horarios_operacion,
    created_at, updated_at
) VALUES 
(
    'Sucursal Centro Histórico',
    'SCH001',
    'Sucursal principal ubicada en el centro histórico de Quito',
    'García Moreno N4-49 y Espejo, Quito',
    'Quito',
    'Pichincha',
    -0.2201641,
    -78.5123274,
    150.00,
    '+593-2-2957000',
    'centro@hansor04.com',
    8.00,
    40.00,
    10,
    10,
    '{"lunes":{"inicio":"08:00","fin":"17:00"},"martes":{"inicio":"08:00","fin":"17:00"},"miercoles":{"inicio":"08:00","fin":"17:00"},"jueves":{"inicio":"08:00","fin":"17:00"},"viernes":{"inicio":"08:00","fin":"17:00"}}',
    GETUTCDATE(),
    GETUTCDATE()
),
(
    'Sucursal Norte Quito',
    'SNQ002',
    'Sucursal ubicada en el norte de Quito',
    'Av. República del Salvador N34-183 y Suiza, Quito',
    'Quito',
    'Pichincha',
    -0.1807635,
    -78.4678382,
    100.00,
    '+593-2-2269000',
    'norte@hansor04.com',
    8.00,
    40.00,
    15,
    10,
    '{"lunes":{"inicio":"08:30","fin":"17:30"},"martes":{"inicio":"08:30","fin":"17:30"},"miercoles":{"inicio":"08:30","fin":"17:30"},"jueves":{"inicio":"08:30","fin":"17:30"},"viernes":{"inicio":"08:30","fin":"17:30"}}',
    GETUTCDATE(),
    GETUTCDATE()
);
GO

-- Mostrar información de las sucursales creadas
SELECT 
    'sucursales' AS table_name,
    COUNT(*) AS total_sucursales,
    COUNT(CASE WHEN is_active = 1 THEN 1 END) AS active_sucursales,
    COUNT(CASE WHEN latitud IS NOT NULL THEN 1 END) AS with_coordinates
FROM dbo.sucursales;
GO

PRINT 'Migración 002_create_sucursales_table.sql ejecutada exitosamente';
PRINT 'Tabla sucursales creada con geofencing, horarios y configuración completa';
PRINT 'Sucursales de ejemplo creadas: Centro Histórico y Norte Quito';
GO