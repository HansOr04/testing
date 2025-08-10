-- src/infrastructure/database/migrations/sqlserver/003_create_areas_table.sql

-- ============================================================================
-- MIGRACIÓN: 003_create_areas_table.sql
-- DESCRIPCIÓN: Crear tabla de áreas por sucursal
-- BASE DE DATOS: SQL Server 2019
-- DEPENDENCIAS: 002_create_sucursales_table.sql
-- ============================================================================

-- Usar la base de datos
USE [AsistenciaDB];
GO

-- Verificar si la tabla ya existe y eliminarla si es necesario (solo en desarrollo)
IF OBJECT_ID('dbo.areas', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.areas;
    PRINT 'Tabla areas eliminada (desarrollo)';
END
GO

-- Crear tabla areas
CREATE TABLE dbo.areas (
    -- Clave primaria
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Información básica del área
    nombre NVARCHAR(200) NOT NULL,
    codigo NVARCHAR(20) NOT NULL,
    descripcion NVARCHAR(500) NULL,
    
    -- Relación con sucursal
    sucursal_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Configuración de horarios específicos del área
    horario_inicio TIME NOT NULL DEFAULT '08:00:00',
    horario_fin TIME NOT NULL DEFAULT '17:00:00',
    horario_almuerzo_inicio TIME NULL DEFAULT '12:00:00',
    horario_almuerzo_fin TIME NULL DEFAULT '13:00:00',
    
    -- Días laborales del área
    trabaja_lunes BIT NOT NULL DEFAULT 1,
    trabaja_martes BIT NOT NULL DEFAULT 1,
    trabaja_miercoles BIT NOT NULL DEFAULT 1,
    trabaja_jueves BIT NOT NULL DEFAULT 1,
    trabaja_viernes BIT NOT NULL DEFAULT 1,
    trabaja_sabado BIT NOT NULL DEFAULT 0,
    trabaja_domingo BIT NOT NULL DEFAULT 0,
    
    -- Límites de horas y personal
    limite_semanal_horas DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
    limite_diario_horas DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
    capacidad_maxima_empleados INT NOT NULL DEFAULT 50,
    empleados_actuales INT NOT NULL DEFAULT 0,
    
    -- Configuración de tolerancias específicas del área
    tolerancia_entrada_minutos INT NULL, -- NULL = usar tolerancia de sucursal
    tolerancia_salida_minutos INT NULL,   -- NULL = usar tolerancia de sucursal
    
    -- Configuración de descansos específica del área
    permite_descansos BIT NOT NULL DEFAULT 1,
    max_descansos_dia INT NOT NULL DEFAULT 2,
    duracion_descanso_minutos INT NOT NULL DEFAULT 15,
    
    -- Configuración de horas extras
    permite_horas_extras BIT NOT NULL DEFAULT 1,
    requiere_autorizacion_extras BIT NOT NULL DEFAULT 1,
    max_horas_extras_dia DECIMAL(4, 2) NOT NULL DEFAULT 4.00,
    max_horas_extras_semana DECIMAL(5, 2) NOT NULL DEFAULT 12.00,
    
    -- Configuración de costos específicos del área
    tarifa_hora_regular DECIMAL(10, 2) NULL, -- NULL = usar tarifa de sucursal
    tarifa_hora_extra_25 DECIMAL(10, 2) NULL,
    tarifa_hora_extra_50 DECIMAL(10, 2) NULL,
    tarifa_hora_extra_100 DECIMAL(10, 2) NULL,
    
    -- Configuración de ubicación dentro de la sucursal
    ubicacion_fisica NVARCHAR(200) NULL, -- Ej: "Piso 2, Ala Norte"
    requiere_acceso_especial BIT NOT NULL DEFAULT 0,
    
    -- Supervisor del área
    supervisor_id UNIQUEIDENTIFIER NULL,
    
    -- Configuración de reportes
    genera_reportes_propios BIT NOT NULL DEFAULT 0,
    codigo_centro_costo NVARCHAR(20) NULL,
    
    -- Estado del área
    is_active BIT NOT NULL DEFAULT 1,
    fecha_inicio_operaciones DATE NULL,
    fecha_fin_operaciones DATE NULL,
    
    -- Configuración de dispositivos biométricos asignados
    dispositivos_asignados NVARCHAR(MAX) NULL, -- JSON con IDs de dispositivos
    
    -- Metadatos adicionales
    configuracion_especial NVARCHAR(MAX) NULL, -- JSON para configuraciones específicas
    notas NVARCHAR(1000) NULL,
    
    -- Campos de auditoría (timestamps)
    created_at DATETIME2(3) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(3) NOT NULL DEFAULT GETUTCDATE(),
    deleted_at DATETIME2(3) NULL,
    
    -- Información de creación/modificación
    created_by UNIQUEIDENTIFIER NULL,
    updated_by UNIQUEIDENTIFIER NULL,
    
    -- Foreign keys (sin cascadas circulares)
    CONSTRAINT FK_areas_sucursal FOREIGN KEY (sucursal_id) 
        REFERENCES dbo.sucursales(id) ON DELETE NO ACTION,
    CONSTRAINT FK_areas_supervisor FOREIGN KEY (supervisor_id) 
        REFERENCES dbo.users(id) ON DELETE SET NULL,
    CONSTRAINT FK_areas_created_by FOREIGN KEY (created_by) 
        REFERENCES dbo.users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_areas_updated_by FOREIGN KEY (updated_by) 
        REFERENCES dbo.users(id) ON DELETE NO ACTION
);
GO

-- Crear índices para optimizar consultas
CREATE UNIQUE INDEX IX_areas_codigo_sucursal ON dbo.areas(codigo, sucursal_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_areas_sucursal ON dbo.areas(sucursal_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_areas_nombre ON dbo.areas(nombre) WHERE deleted_at IS NULL;
CREATE INDEX IX_areas_active ON dbo.areas(is_active, deleted_at);
CREATE INDEX IX_areas_supervisor ON dbo.areas(supervisor_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_areas_horarios ON dbo.areas(horario_inicio, horario_fin) WHERE deleted_at IS NULL;
CREATE INDEX IX_areas_capacidad ON dbo.areas(capacidad_maxima_empleados, empleados_actuales);
CREATE INDEX IX_areas_centro_costo ON dbo.areas(codigo_centro_costo) WHERE codigo_centro_costo IS NOT NULL;
GO

-- Crear trigger para actualizar updated_at automáticamente
IF OBJECT_ID('dbo.TR_areas_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_areas_updated_at;
GO

CREATE TRIGGER TR_areas_updated_at
ON dbo.areas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.areas 
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT DISTINCT id FROM inserted);
END
GO

-- Constraints de validación
ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_codigo_format 
CHECK (codigo LIKE '[A-Z]%' AND LEN(codigo) BETWEEN 2 AND 20);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_horario_valido 
CHECK (horario_fin > horario_inicio);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_almuerzo_valido 
CHECK (
    (horario_almuerzo_inicio IS NULL AND horario_almuerzo_fin IS NULL) OR
    (horario_almuerzo_inicio IS NOT NULL AND horario_almuerzo_fin IS NOT NULL AND 
     horario_almuerzo_fin > horario_almuerzo_inicio)
);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_limite_horas_diario 
CHECK (limite_diario_horas BETWEEN 1.0 AND 14.0);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_limite_horas_semanal 
CHECK (limite_semanal_horas BETWEEN 5.0 AND 70.0);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_capacidad_empleados 
CHECK (capacidad_maxima_empleados > 0 AND empleados_actuales >= 0);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_empleados_vs_capacidad 
CHECK (empleados_actuales <= capacidad_maxima_empleados);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_tolerancia_entrada 
CHECK (tolerancia_entrada_minutos IS NULL OR tolerancia_entrada_minutos BETWEEN 0 AND 60);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_tolerancia_salida 
CHECK (tolerancia_salida_minutos IS NULL OR tolerancia_salida_minutos BETWEEN 0 AND 60);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_max_extras_dia 
CHECK (max_horas_extras_dia BETWEEN 0.0 AND 8.0);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_max_extras_semana 
CHECK (max_horas_extras_semana BETWEEN 0.0 AND 30.0);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_duracion_descanso 
CHECK (duracion_descanso_minutos BETWEEN 5 AND 60);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_fechas_operacion 
CHECK (fecha_fin_operaciones IS NULL OR fecha_fin_operaciones >= fecha_inicio_operaciones);
GO

ALTER TABLE dbo.areas 
ADD CONSTRAINT CK_areas_al_menos_un_dia_laboral 
CHECK (
    trabaja_lunes = 1 OR trabaja_martes = 1 OR trabaja_miercoles = 1 OR 
    trabaja_jueves = 1 OR trabaja_viernes = 1 OR trabaja_sabado = 1 OR trabaja_domingo = 1
);
GO

-- Crear vista para consultas comunes de áreas activas con información de sucursal
IF OBJECT_ID('dbo.vw_areas_completa', 'V') IS NOT NULL
    DROP VIEW dbo.vw_areas_completa;
GO

CREATE VIEW dbo.vw_areas_completa AS
SELECT 
    a.id,
    a.nombre AS area_nombre,
    a.codigo AS area_codigo,
    a.descripcion,
    s.nombre AS sucursal_nombre,
    s.codigo AS sucursal_codigo,
    s.ciudad,
    a.horario_inicio,
    a.horario_fin,
    a.limite_diario_horas,
    a.limite_semanal_horas,
    a.capacidad_maxima_empleados,
    a.empleados_actuales,
    CAST((CAST(a.empleados_actuales AS FLOAT) / a.capacidad_maxima_empleados * 100) AS DECIMAL(5,2)) AS porcentaje_ocupacion,
    a.permite_horas_extras,
    a.requiere_autorizacion_extras,
    sup.nombre + ' ' + sup.apellido AS supervisor_nombre,
    sup.email AS supervisor_email,
    a.ubicacion_fisica,
    a.codigo_centro_costo,
    a.is_active,
    -- Días laborales concatenados
    CASE 
        WHEN a.trabaja_lunes = 1 THEN 'L' ELSE '' END +
    CASE 
        WHEN a.trabaja_martes = 1 THEN 'M' ELSE '' END +
    CASE 
        WHEN a.trabaja_miercoles = 1 THEN 'X' ELSE '' END +
    CASE 
        WHEN a.trabaja_jueves = 1 THEN 'J' ELSE '' END +
    CASE 
        WHEN a.trabaja_viernes = 1 THEN 'V' ELSE '' END +
    CASE 
        WHEN a.trabaja_sabado = 1 THEN 'S' ELSE '' END +
    CASE 
        WHEN a.trabaja_domingo = 1 THEN 'D' ELSE '' END AS dias_laborales,
    a.created_at,
    a.updated_at
FROM dbo.areas a
INNER JOIN dbo.sucursales s ON a.sucursal_id = s.id
LEFT JOIN dbo.users sup ON a.supervisor_id = sup.id
WHERE a.deleted_at IS NULL 
    AND a.is_active = 1
    AND s.deleted_at IS NULL 
    AND s.is_active = 1;
GO

-- Crear función para verificar si un área está operativa en un día específico
IF OBJECT_ID('dbo.fn_area_operativa_en_dia', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_area_operativa_en_dia;
GO

CREATE FUNCTION dbo.fn_area_operativa_en_dia(
    @area_id UNIQUEIDENTIFIER,
    @fecha DATE
)
RETURNS BIT
AS
BEGIN
    DECLARE @result BIT = 0;
    DECLARE @dia_semana INT = DATEPART(WEEKDAY, @fecha); -- 1=Domingo, 2=Lunes, etc.
    
    SELECT @result = CASE @dia_semana
        WHEN 1 THEN trabaja_domingo
        WHEN 2 THEN trabaja_lunes
        WHEN 3 THEN trabaja_martes
        WHEN 4 THEN trabaja_miercoles
        WHEN 5 THEN trabaja_jueves
        WHEN 6 THEN trabaja_viernes
        WHEN 7 THEN trabaja_sabado
        ELSE 0
    END
    FROM dbo.areas 
    WHERE id = @area_id 
        AND deleted_at IS NULL 
        AND is_active = 1
        AND (fecha_inicio_operaciones IS NULL OR @fecha >= fecha_inicio_operaciones)
        AND (fecha_fin_operaciones IS NULL OR @fecha <= fecha_fin_operaciones);
    
    RETURN ISNULL(@result, 0);
END
GO

-- Crear función para calcular horas laborales de un área en una fecha
IF OBJECT_ID('dbo.fn_calcular_horas_laborales_area', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_calcular_horas_laborales_area;
GO

CREATE FUNCTION dbo.fn_calcular_horas_laborales_area(
    @area_id UNIQUEIDENTIFIER,
    @fecha DATE
)
RETURNS DECIMAL(4, 2)
AS
BEGIN
    DECLARE @horas DECIMAL(4, 2) = 0;
    DECLARE @horario_inicio TIME;
    DECLARE @horario_fin TIME;
    DECLARE @almuerzo_inicio TIME;
    DECLARE @almuerzo_fin TIME;
    DECLARE @minutos_almuerzo INT = 0;
    
    -- Verificar si el área opera en esta fecha
    IF dbo.fn_area_operativa_en_dia(@area_id, @fecha) = 0
        RETURN 0;
    
    -- Obtener horarios del área
    SELECT 
        @horario_inicio = horario_inicio,
        @horario_fin = horario_fin,
        @almuerzo_inicio = horario_almuerzo_inicio,
        @almuerzo_fin = horario_almuerzo_fin
    FROM dbo.areas 
    WHERE id = @area_id;
    
    -- Calcular minutos totales de trabajo
    DECLARE @minutos_totales INT = DATEDIFF(MINUTE, @horario_inicio, @horario_fin);
    
    -- Restar tiempo de almuerzo si aplica
    IF @almuerzo_inicio IS NOT NULL AND @almuerzo_fin IS NOT NULL
    BEGIN
        SET @minutos_almuerzo = DATEDIFF(MINUTE, @almuerzo_inicio, @almuerzo_fin);
        SET @minutos_totales = @minutos_totales - @minutos_almuerzo;
    END
    
    -- Convertir a horas
    SET @horas = CAST(@minutos_totales AS DECIMAL(4, 2)) / 60.0;
    
    RETURN @horas;
END
GO

-- Crear procedimiento para actualizar contador de empleados
IF OBJECT_ID('dbo.sp_actualizar_contador_empleados_area', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_actualizar_contador_empleados_area;
GO

CREATE PROCEDURE dbo.sp_actualizar_contador_empleados_area
    @area_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @count INT;
    
    -- Contar empleados activos en el área (se implementará cuando exista la tabla employees)
    -- Por ahora, solo actualizar el trigger para mantener consistencia
    
    UPDATE dbo.areas 
    SET updated_at = GETUTCDATE()
    WHERE id = @area_id;
END
GO

-- Insertar áreas de ejemplo para las sucursales existentes
DECLARE @sucursal_centro UNIQUEIDENTIFIER;
DECLARE @sucursal_norte UNIQUEIDENTIFIER;

SELECT @sucursal_centro = id FROM dbo.sucursales WHERE codigo = 'SCH001';
SELECT @sucursal_norte = id FROM dbo.sucursales WHERE codigo = 'SNQ002';

INSERT INTO dbo.areas (
    nombre, codigo, descripcion, sucursal_id,
    horario_inicio, horario_fin, horario_almuerzo_inicio, horario_almuerzo_fin,
    limite_diario_horas, limite_semanal_horas,
    capacidad_maxima_empleados, empleados_actuales,
    permite_horas_extras, requiere_autorizacion_extras,
    ubicacion_fisica, codigo_centro_costo,
    created_at, updated_at
) VALUES 
-- Áreas para Sucursal Centro Histórico
(
    'Administración',
    'ADM',
    'Área administrativa de la sucursal centro',
    @sucursal_centro,
    '08:00:00', '17:00:00', '12:00:00', '13:00:00',
    8.00, 40.00,
    15, 0,
    1, 1,
    'Piso 2, Oficinas principales',
    'CC-ADM-001',
    GETUTCDATE(), GETUTCDATE()
),
(
    'Ventas',
    'VEN',
    'Área de ventas y atención al cliente',
    @sucursal_centro,
    '08:30:00', '18:00:00', '13:00:00', '14:00:00',
    8.50, 42.50,
    25, 0,
    1, 1,
    'Piso 1, Área de atención',
    'CC-VEN-001',
    GETUTCDATE(), GETUTCDATE()
),
(
    'Producción',
    'PROD',
    'Área de producción y manufactura',
    @sucursal_centro,
    '07:00:00', '16:00:00', '12:00:00', '13:00:00',
    8.00, 40.00,
    40, 0,
    1, 1,
    'Planta baja, Área de producción',
    'CC-PROD-001',
    GETUTCDATE(), GETUTCDATE()
),

-- Áreas para Sucursal Norte
(
    'Administración Norte',
    'ADMN',
    'Área administrativa de la sucursal norte',
    @sucursal_norte,
    '08:30:00', '17:30:00', '12:30:00', '13:30:00',
    8.00, 40.00,
    12, 0,
    1, 1,
    'Piso 3, Oficinas administrativas',
    'SN-ADM-001',
    GETUTCDATE(), GETUTCDATE()
),
(
    'Logística',
    'LOG',
    'Área de logística y almacenamiento',
    @sucursal_norte,
    '06:00:00', '15:00:00', '11:00:00', '12:00:00',
    8.00, 40.00,
    30, 0,
    1, 1,
    'Bodega principal',
    'SN-LOG-001',
    GETUTCDATE(), GETUTCDATE()
);
GO

-- Mostrar información de las áreas creadas
SELECT 
    'areas' AS table_name,
    COUNT(*) AS total_areas,
    COUNT(CASE WHEN is_active = 1 THEN 1 END) AS active_areas,
    SUM(capacidad_maxima_empleados) AS capacidad_total,
    SUM(empleados_actuales) AS empleados_totales,
    COUNT(DISTINCT sucursal_id) AS sucursales_con_areas
FROM dbo.areas;
GO

PRINT 'Migración 003_create_areas_table.sql ejecutada exitosamente';
PRINT 'Tabla areas creada con configuración completa de horarios y capacidades';
PRINT 'Áreas de ejemplo creadas para ambas sucursales';
GO