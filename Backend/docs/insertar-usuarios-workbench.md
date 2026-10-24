# Crear e insertar usuarios desde MySQL Workbench

Este ejemplo crea las tablas mínimas `tipo_documento` y `usuario` y agrega
cuatro usuarios ficticios con información completa. Está escrito para MySQL 8,
usa InnoDB y respeta los campos y relaciones del modelo del proyecto.

> **Importante:** si la aplicación ya administra esta base, aplique cambios de
> esquema con Alembic, no modificando tablas manualmente. `CREATE TABLE IF NOT
> EXISTS` no actualiza una tabla que ya existe. En la configuración actual del
> proyecto la base de datos se llama `billetera`.

## Ejecutar en MySQL Workbench

1. Conéctese al servidor MySQL.
2. Abra una pestaña SQL nueva.
3. Pegue y ejecute el script completo.
4. Revise la tabla de resultados de la consulta de verificación al final.

## Script SQL

```sql
CREATE DATABASE IF NOT EXISTS billetera
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE billetera;

CREATE TABLE IF NOT EXISTS tipo_documento (
    id_tipo_doc INT NOT NULL AUTO_INCREMENT,
    nombre_doc VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_tipo_doc),
    KEY ix_tipo_documento_id_tipo_doc (id_tipo_doc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NULL,
    direccion VARCHAR(200) NULL,
    codigo_postal VARCHAR(6) NULL,
    ciudad VARCHAR(100) NULL,
    localidad VARCHAR(100) NULL,
    barrio VARCHAR(100) NULL,
    llave_bre_b VARCHAR(100) NULL,
    documento VARCHAR(50) NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario',
    codigo_registro VARCHAR(6) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    tope_ahorros DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    tope_corriente DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    fecha_creacion DATETIME NULL,
    id_tipo_doc INT NULL,
    PRIMARY KEY (id_usuario),
    KEY ix_usuario_id_usuario (id_usuario),
    UNIQUE KEY ix_usuario_email (email),
    UNIQUE KEY uq_usuario_documento (documento),
    UNIQUE KEY uq_usuario_llave_bre_b (llave_bre_b),
    UNIQUE KEY codigo_registro (codigo_registro),
    CONSTRAINT fk_usuario_tipo_documento
        FOREIGN KEY (id_tipo_doc)
        REFERENCES tipo_documento (id_tipo_doc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;

INSERT INTO tipo_documento (nombre_doc)
SELECT 'Cédula de ciudadanía'
WHERE NOT EXISTS (
    SELECT 1
    FROM tipo_documento
    WHERE nombre_doc = 'Cédula de ciudadanía'
);

INSERT INTO tipo_documento (nombre_doc)
SELECT 'Cédula de extranjería'
WHERE NOT EXISTS (
    SELECT 1
    FROM tipo_documento
    WHERE nombre_doc = 'Cédula de extranjería'
);

-- Registros ficticios de demostración. Todos usan la contraseña de prueba
-- DemoTemporal123! y su hash Argon2 compatible con el backend.
INSERT INTO usuario (
    nombre,
    email,
    password,
    telefono,
    direccion,
    codigo_postal,
    ciudad,
    localidad,
    barrio,
    documento,
    rol,
    estado,
    tope_ahorros,
    tope_corriente,
    fecha_creacion,
    id_tipo_doc
)
SELECT
    datos.nombre,
    datos.email,
    datos.password,
    datos.telefono,
    datos.direccion,
    datos.codigo_postal,
    datos.ciudad,
    datos.localidad,
    datos.barrio,
    datos.documento,
    datos.rol,
    datos.estado,
    datos.tope_ahorros,
    datos.tope_corriente,
    CURRENT_TIMESTAMP,
    td.id_tipo_doc
FROM (
    SELECT
        'Ana María Torres' AS nombre,
        'ana.torres@example.com' AS email,
        '$argon2id$v=19$m=65536,t=3,p=4$UCqFEMI459xbCyFk7N37fw$z8LU6/SePQQJV2UmURv7SOPTbuVBe4DUQPDAsHHsMCI' AS password,
        '3001234567' AS telefono,
        'Calle 10 # 20-30' AS direccion,
        '110111' AS codigo_postal,
        'Bogotá' AS ciudad,
        'Usaquén' AS localidad,
        'Centro' AS barrio,
        'DEMO-1001' AS documento,
        'Cédula de ciudadanía' AS tipo_documento,
        'usuario' AS rol,
        'activo' AS estado,
        1500000.00 AS tope_ahorros,
        800000.00 AS tope_corriente
    UNION ALL
    SELECT
        'Carlos Andrés Rojas',
        'carlos.rojas@example.com',
        '$argon2id$v=19$m=65536,t=3,p=4$UCqFEMI459xbCyFk7N37fw$z8LU6/SePQQJV2UmURv7SOPTbuVBe4DUQPDAsHHsMCI',
        '3102345678',
        'Carrera 45 # 12-18',
        '050021',
        'Medellín',
        'Laureles',
        'Estadio',
        'DEMO-1002',
        'Cédula de ciudadanía',
        'usuario',
        'activo',
        2000000.00,
        1000000.00
    UNION ALL
    SELECT
        'Laura Fernanda Gómez',
        'laura.gomez@example.com',
        '$argon2id$v=19$m=65536,t=3,p=4$UCqFEMI459xbCyFk7N37fw$z8LU6/SePQQJV2UmURv7SOPTbuVBe4DUQPDAsHHsMCI',
        '3203456789',
        'Avenida 6 # 23-45',
        '760045',
        'Cali',
        'San Fernando',
        'El Cedro',
        'DEMO-1003',
        'Cédula de ciudadanía',
        'usuario',
        'activo',
        1200000.00,
        600000.00
    UNION ALL
    SELECT
        'Diego Felipe Mendoza',
        'diego.mendoza@example.com',
        '$argon2id$v=19$m=65536,t=3,p=4$UCqFEMI459xbCyFk7N37fw$z8LU6/SePQQJV2UmURv7SOPTbuVBe4DUQPDAsHHsMCI',
        '3154567890',
        'Calle 8 # 14-22',
        '050034',
        'Medellín',
        'El Poblado',
        'Manila',
        'DEMO-1004',
        'Cédula de extranjería',
        'usuario',
        'activo',
        900000.00,
        500000.00
) AS datos
INNER JOIN tipo_documento AS td
    ON td.nombre_doc = datos.tipo_documento;

COMMIT;

-- Verificar el usuario y el tipo de documento relacionado.
SELECT
    u.id_usuario,
    u.nombre,
    u.email,
    u.telefono,
    u.documento,
    u.rol,
    u.estado,
    u.fecha_creacion,
    td.nombre_doc AS tipo_documento
FROM usuario AS u
LEFT JOIN tipo_documento AS td
    ON td.id_tipo_doc = u.id_tipo_doc
WHERE u.email IN (
    'ana.torres@example.com',
    'carlos.rojas@example.com',
    'laura.gomez@example.com',
    'diego.mendoza@example.com'
)
ORDER BY u.id_usuario;
```

## Insertar otro usuario

Use un email y un documento que todavía no existan. `id_tipo_doc` debe
corresponder a una fila existente en `tipo_documento`; puede consultarlos con:

```sql
SELECT id_tipo_doc, nombre_doc
FROM tipo_documento
ORDER BY id_tipo_doc;
```

La contraseña debe enviarse como **hash**, nunca como texto plano. Los registros
ficticios anteriores comparten la contraseña `DemoTemporal123!`; el backend
genera hashes con `Backend.security.hash_password`. Para crear un usuario real,
reemplace el hash de demostración por uno generado por esa función y cambie los
datos de ejemplo:

```sql
INSERT INTO usuario (
    nombre,
    email,
    password,
    telefono,
    documento,
    rol,
    estado,
    fecha_creacion,
    id_tipo_doc
)
VALUES (
    'Nombre completo',
    'persona@example.com',
    '<hash Argon2 generado por el backend>',
    '3000000000',
    'DOCUMENTO-UNICO',
    'usuario',
    'activo',
    CURRENT_TIMESTAMP,
    1
);
```

Los datos y la contraseña anteriores son solo para pruebas locales; no los use
en cuentas reales. Ejecute la sección de carga de usuarios una sola vez; si la
ejecuta de nuevo, las restricciones únicas de `email` y `documento` rechazarán
los registros duplicados. `llave_bre_b` y `codigo_registro` también son únicos
cuando tienen valor.
