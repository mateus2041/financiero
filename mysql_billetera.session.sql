-- SQLBook: Code
START TRANSACTION;

UPDATE cuentas AS c
INNER JOIN usuario AS u
    ON u.id_usuario = c.id_usuario
SET c.saldo = 50000
WHERE LOWER(TRIM(u.nombre)) = 'juan pepe'
  AND c.tipo_cuenta IN ('corriente', 'ahorros');

SELECT
    u.id_usuario,
    u.nombre,
    c.id_cuenta,
    c.tipo_cuenta,
    c.saldo,
    c.estado
FROM usuario AS u
INNER JOIN cuentas AS c
    ON u.id_usuario = c.id_usuario
WHERE LOWER(TRIM(u.nombre)) = 'juan pepe'
  AND c.tipo_cuenta IN ('corriente', 'ahorros')
ORDER BY c.tipo_cuenta;

COMMIT;
-- SQLBook: Code
CREATE TABLE IF NOT EXISTS asesores_banco (
    id_asesor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(50),
    email VARCHAR(100),
    codigo_asesor VARCHAR(30) NOT NULL UNIQUE,
    especialidad VARCHAR(100),
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT
    a.id_asesor,
    a.nombre,
    a.email,
    a.codigo_asesor,
    a.especialidad,
    a.estado,
    a.fecha_ingreso
FROM asesores_banco AS a
ORDER BY a.id_asesor;
-- SQLBook: Code
START TRANSACTION;

UPDATE usuario
SET rol = 'asesor'
WHERE id_usuario = 9;

INSERT INTO asesores_banco (
    nombre,
    documento,
    email,
    codigo_asesor,
    especialidad,
    estado,
    fecha_ingreso
)
SELECT
    u.nombre,
    u.documento,
    u.email,
    'asesores2014',
    'Créditos y ahorro',
    'activo',
    CURRENT_TIMESTAMP
FROM usuario AS u
WHERE u.id_usuario = 9
ON DUPLICATE KEY UPDATE
    especialidad = 'Créditos y ahorro',
    estado = 'activo';

COMMIT;
-- SQLBook: Code
SELECT id_usuario, nombre, documento, rol
FROM usuario
WHERE rol = 'asesor';
-- SQLBook: Code
SELECT 
    u.id_usuario,
    u.documento,
    u.nombre,
    u.rol,
    a.codigo_asesor,
    a.estado
FROM usuario u
INNER JOIN asesores_banco a
    ON LOWER(TRIM(a.email)) = LOWER(TRIM(u.email))
WHERE a.codigo_asesor = 'asesores2014';
-- SQLBook: Code
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS administradores;
DROP TABLE IF EXISTS asesores_banco;
DROP TABLE IF EXISTS cuentas;
DROP TABLE IF EXISTS usuario;

SET FOREIGN_KEY_CHECKS = 1;
-- SQLBook: Code
START TRANSACTION;

DELETE FROM administradores
WHERE id_usuario = 1;

DELETE FROM asesores_banco
WHERE documento = (
    SELECT documento FROM usuario WHERE id_usuario = 1
);

DELETE FROM cuentas
WHERE id_usuario = 1;

DELETE FROM usuario
WHERE id_usuario = 1;

COMMIT;
-- SQLBook: Code
CREATE TABLE IF NOT EXISTS administradores (
    id_administrador INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    codigo_administrador VARCHAR(30) NOT NULL UNIQUE,
    fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_administradores_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

SELECT
    a.id_administrador,
    a.id_usuario,
    a.codigo_administrador,
    a.fecha_ingreso
FROM administradores AS a
ORDER BY a.id_administrador;
-- SQLBook: Code
START TRANSACTION;

UPDATE usuario
SET rol = 'administrador'
WHERE id_usuario = 10;

INSERT INTO administradores (
    id_usuario,
    codigo_administrador,
    fecha_ingreso
)
SELECT
    u.id_usuario,
    'mateus20452@',
    CURRENT_TIMESTAMP
FROM usuario AS u
WHERE u.id_usuario = 10
ON DUPLICATE KEY UPDATE
    codigo_administrador = 'mateus20452@';

COMMIT;
-- SQLBook: Code
START TRANSACTION;

DELETE FROM asesores_banco
WHERE documento = (
    SELECT documento FROM usuario WHERE id_usuario = 9
); -- cambia 9 por el ID correcto

COMMIT;
-- SQLBook: Code
START TRANSACTION;

DELETE FROM administradores
WHERE id_administrador = 1; -- cambia 1 por el ID correcto

COMMIT;
-- SQLBook: Code
SHOW TABLES LIKE 'usuario';
-- SQLBook: Code
DROP TABLE IF EXISTS usuario;
-- SQLBook: Code
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `Usuarios`;
SET FOREIGN_KEY_CHECKS = 1;
-- SQLBook: Code
SET @id_usuario = 5;

START TRANSACTION;

DELETE FROM transferencias_breb
WHERE id_cuenta_origen IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 )
 OR id_cuenta_destino IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 )
 OR id_llave_destino IN (
    SELECT id_llave FROM llaves_breb WHERE id_usuario = @id_usuario
 )
 OR id_transaccion IN (
    SELECT t.id_transaccion
    FROM transacciones AS t
    INNER JOIN cuentas AS c ON c.id_cuenta = t.id_cuenta
    WHERE c.id_usuario = @id_usuario
 );

DELETE FROM tarjetas
WHERE id_cuenta IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 );

DELETE FROM llaves_breb
WHERE id_usuario = @id_usuario
   OR id_cuenta IN (
       SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
   );

DELETE FROM transacciones
WHERE id_cuenta IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 );

DELETE FROM cuentas
WHERE id_usuario = @id_usuario;

DELETE FROM notificaciones
WHERE id_usuario = @id_usuario;

DELETE FROM control_topes_breb
WHERE id_usuario = @id_usuario;

DELETE FROM administradores
WHERE id_usuario = @id_usuario;

DELETE FROM asesores_banco
WHERE documento = (
    SELECT documento FROM usuario WHERE id_usuario = @id_usuario
);

DELETE FROM usuario
WHERE id_usuario = @id_usuario;

COMMIT;
-- SQLBook: Code
SET @id_usuario = 2  ;

START TRANSACTION;

DELETE FROM transferencias_breb
WHERE id_cuenta_origen IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 )
 OR id_cuenta_destino IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 )
 OR id_llave_destino IN (
    SELECT id_llave FROM llaves_breb WHERE id_usuario = @id_usuario
 )
 OR id_transaccion IN (
    SELECT t.id_transaccion
    FROM transacciones AS t
    INNER JOIN cuentas AS c ON c.id_cuenta = t.id_cuenta
    WHERE c.id_usuario = @id_usuario
 );

DELETE FROM tarjetas
WHERE id_cuenta IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 );

DELETE FROM llaves_breb
WHERE id_usuario = @id_usuario
   OR id_cuenta IN (
       SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
   );

DELETE FROM transacciones
WHERE id_cuenta IN (
    SELECT id_cuenta FROM cuentas WHERE id_usuario = @id_usuario
 );

DELETE FROM cuentas
WHERE id_usuario = @id_usuario;

DELETE FROM notificaciones
WHERE id_usuario = @id_usuario;

DELETE FROM control_topes_breb
WHERE id_usuario = @id_usuario;

DELETE FROM administradores
WHERE id_usuario = @id_usuario;

DELETE FROM asesores_banco
WHERE documento = (
    SELECT documento FROM usuario WHERE id_usuario = @id_usuario
);

DELETE FROM usuario
WHERE id_usuario = @id_usuario;

COMMIT;
-- SQLBook: Code
INSERT INTO usuario (
    nombre,
    email,
    password,
    telefono,
    direccion,
    documento,
    rol,
    tope_ahorros,
    tope_corriente
) VALUES (
    'luis fernando',
    'luisssmate802@gmail.com',
    'REEMPLAZA_AQUI_POR_UN_HASH_BCRYPT',
    '3001234567',
    'Calle 10 #20-30',
    '1234567890',
    'usuario',
    0,
    0
);
-- SQLBook: Code
SELECT *
FROM tarjetas;
-- SQLBook: Code
SELECT RIGHT(numero_tarjeta, 4) AS ultimos_digitos
FROM tarjetas;
-- SQLBook: Code
SELECT 
    u.id_usuario,
    c.id_cuenta,
    t.numero_tarjeta,
    RIGHT(t.numero_tarjeta, 4) AS ultimos_digitos
FROM usuario u
LEFT JOIN cuentas c ON c.id_usuario = u.id_usuario
LEFT JOIN tarjetas t ON t.id_cuenta = c.id_cuenta;
-- SQLBook: Code
SELECT 
    u.id_usuario,
    c.id_cuenta,
    t.numero_tarjeta,
    RIGHT(t.numero_tarjeta, 4) AS ultimos_digitos
FROM usuario u
JOIN cuentas c ON c.id_usuario = u.id_usuario
JOIN tarjetas t ON t.id_cuenta = c.id_cuenta
WHERE u.id_usuario = 14;
-- SQLBook: Code
SELECT
    u.id_usuario,
    u.nombre,
    c.id_cuenta,
    t.id_tarjeta,
    RIGHT(t.numero_tarjeta, 6) AS ultimos_digitos,
    t.estado
FROM usuario AS u
JOIN cuentas AS c ON c.id_usuario = u.id_usuario
JOIN tarjetas AS t ON t.id_cuenta = c.id_cuenta
WHERE u.id_usuario = 14;
-- SQLBook: Code
SELECT
    id_tarjeta,
    id_cuenta,
    RIGHT(numero_tarjeta, 6) AS ultimos_digitos,
    estado
FROM tarjetas;
-- SQLBook: Code
SHOW COLUMNS FROM tarjetas;
-- SQLBook: Code
SELECT
    u.id_usuario,
    u.nombre,
    RIGHT(t.numero_tarjeta, 6) AS ultimos_digitos,
    t.fecha_expiracion,
    t.codigo_seguridad,
    t.estado
FROM usuario u
JOIN cuentas c ON c.id_usuario = u.id_usuario
JOIN tarjetas t ON t.id_cuenta = c.id_cuenta
WHERE u.id_usuario = 14;
-- SQLBook: Code
SELECT
    RIGHT(t.numero_tarjeta, 6) AS ultimos_digitos,
    t.fecha_expiracion,
    t.codigo_seguridad,
    t.estado
FROM cuentas c
JOIN tarjetas t ON t.id_cuenta = c.id_cuenta
WHERE c.id_usuario = 14;
-- SQLBook: Code
START TRANSACTION;

SELECT *
FROM tarjetas
WHERE id_tarjeta = 5;

DELETE FROM tarjetas
WHERE id_tarjeta = 5;

COMMIT;
-- SQLBook: Code
USE billetera;

CREATE TABLE IF NOT EXISTS `ubicacionesPorCiudad` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ciudad VARCHAR(100) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    barrios JSON NOT NULL,
    UNIQUE KEY uq_ciudad_localidad (ciudad, localidad)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ubicacionesPorCiudad` (ciudad, localidad, barrios) VALUES
('Bogotá', 'Usaquén', '["Cedritos", "Santa Bárbara", "San Patricio", "Otro"]'),
('Bogotá', 'Chapinero', '["Chapinero Alto", "Chapinero Central", "Rosales", "Otro"]'),
('Bogotá', 'La Candelaria', '["La Catedral", "Las Aguas", "Centro Administrativo", "Otro"]'),
('Bogotá', 'Santa Fe', '["Las Nieves", "San Diego", "La Perseverancia", "Otro"]'),
('Bogotá', 'San Cristóbal', '["20 de Julio", "San Blas", "San Martín de Loba", "Otro"]'),
('Bogotá', 'Usme', '["Usme Centro", "La Flora", "Gran Yomasa", "Otro"]'),
('Bogotá', 'Tunjuelito', '["Venecia", "Fátima", "San Vicente Ferrer", "Otro"]'),
('Bogotá', 'Bosa', '["Bosa Centro", "La Despensa", "El Porvenir", "Bosa La Estación", "Bosa Nova", "Bosa Piamonte", "Ciudadela El Recreo", "El Corzo", "La Libertad", "San Bernardino", "San Pablo Bosa", "Santa Fe Bosa", "Antonia Santos", "Brasil", "Campo Verde", "Carlos Albán Holguín", "El Anhelo", "El Progreso", "Escocia", "Islandia", "Jiménez de Quesada", "La Paz Bosa", "Olarte", "Paso Ancho", "Villa del Río", "Villa Sonia", "Villa Anny", "Villas del Progreso", "Otro"]'),
('Bogotá', 'Kennedy', '["Ciudad Kennedy", "Castilla", "Timiza", "Otro"]'),
('Bogotá', 'Fontibón', '["Fontibón Centro", "Modelia", "Villemar", "Otro"]'),
('Bogotá', 'Engativá', '["Engativá Centro", "Las Ferias", "Boyacá Real", "Otro"]'),
('Bogotá', 'Suba', '["Suba Centro", "Niza", "La Campiña", "Otro"]'),
('Bogotá', 'Barrios Unidos', '["Doce de Octubre", "La Castellana", "Metrópolis", "Otro"]'),
('Bogotá', 'Teusaquillo', '["Teusaquillo", "La Soledad", "Galerías", "Otro"]'),
('Bogotá', 'Los Mártires', '["Ricaurte", "Paloquemao", "Santa Isabel", "Otro"]'),
('Bogotá', 'Antonio Nariño', '["Restrepo", "Ciudad Berna", "Policarpa", "Otro"]'),
('Bogotá', 'Puente Aranda', '["Ciudad Montes", "Alcalá", "Muzu", "Otro"]'),
('Bogotá', 'Rafael Uribe Uribe', '["Quiroga", "Marruecos", "Diana Turbay", "Otro"]'),
('Bogotá', 'Ciudad Bolívar', '["Arborizadora", "San Francisco", "Lucero", "Otro"]'),
('Bogotá', 'Sumapaz', '["San Juan", "Nazareth", "Betania", "Otro"]'),
('Medellín', 'Centro', '["Centro", "Boston", "Prado", "Otro"]'),
('Cali', 'Centro', '["Centro", "San Fernando", "Granada", "Otro"]'),
('Barranquilla', 'Centro', '["Centro", "El Prado", "Alto Prado", "Otro"]'),
('Cartagena', 'Centro', '["Centro", "Getsemaní", "Manga", "Otro"]'),
('Bucaramanga', 'Centro', '["Centro", "Cabecera", "San Francisco", "Otro"]'),
('Pereira', 'Centro', '["Centro", "Cuba", "Alamos", "Otro"]'),
('Cúcuta', 'Centro', '["Centro", "Caobos", "La Riviera", "Otro"]'),
('Ibagué', 'Centro', '["Centro", "La Pola", "Piedrapintada", "Otro"]'),
('Manizales', 'Centro', '["Centro", "Palogrande", "Chipre", "Otro"]'),
('Armenia', 'Centro', '["Centro", "Granada", "La Castellana", "Otro"]'),
('Pasto', 'Centro', '["Centro", "San Ignacio", "Las Cuadras", "Otro"]'),
('Villavicencio', 'Centro', '["Centro", "Barzal", "La Esperanza", "Otro"]'),
('Neiva', 'Centro', '["Centro", "Quirinal", "La Toma", "Otro"]'),
('Montería', 'Centro', '["Centro", "La Castellana", "La Coquera", "Otro"]'),
('Sincelejo', 'Centro', '["Centro", "La Pajuela", "Venecia", "Otro"]'),
('Tunja', 'Centro', '["Centro", "Las Nieves", "Maldonado", "Otro"]'),
('Popayán', 'Centro', '["Centro", "San Camilo", "El Recuerdo", "Otro"]'),
('Santa Marta', 'Centro', '["Centro", "Bellavista", "El Rodadero", "Otro"]'),
('Valledupar', 'Centro', '["Centro", "Novalito", "Mayales", "Otro"]');

SELECT ciudad, localidad, barrios
FROM `ubicacionesPorCiudad`
ORDER BY ciudad, localidad;
-- SQLBook: Code
USE billetera;

START TRANSACTION;

-- Cambia el rol únicamente a los usuarios seleccionados.
UPDATE usuario
SET rol = 'asesor'
WHERE rol = 'usuario'
  AND documento IN (
      'TEST-00000100',
      'TEST-00000200',
      'TEST-00000300',
      'TEST-00000400'
  );

-- Actualiza los datos del asesor, pero conserva su código generado.
UPDATE asesores_banco AS a
INNER JOIN usuario AS u
    ON LOWER(TRIM(u.email)) = LOWER(TRIM(a.email))
SET
    a.nombre = u.nombre,
    a.documento = u.documento,
    a.email = u.email,
    a.especialidad = 'Asesoria bancaria',
    a.estado = 'activo'
WHERE u.rol = 'asesor'
  AND u.documento IN (
      'TEST-00000100',
      'TEST-00000200',
      'TEST-00000300',
      'TEST-00000400'
  );

COMMIT;

-- Verifica el rol, el código existente y si falta el registro de asesor.
SELECT
    u.nombre,
    u.documento,
    u.rol,
    a.codigo_asesor,
    a.estado
FROM usuario AS u
LEFT JOIN asesores_banco AS a
    ON LOWER(TRIM(a.email)) = LOWER(TRIM(u.email))
WHERE u.documento IN (
    'TEST-00000100',
    'TEST-00000200',
    'TEST-00000300',
    'TEST-00000400'
)
ORDER BY u.documento;
-- SQLBook: Code
USE billetera;

-- Comprueba cuántos asesores están registrados.
SELECT COUNT(*) AS total_asesores
FROM asesores_banco;

START TRANSACTION;

-- Activa los asesores que aparecen como inactivos.
UPDATE asesores_banco
SET estado = 'activo'
WHERE estado = 'inactivo';

COMMIT;

-- Consulta el correo y el código automático de cada asesor.
SELECT
    id_asesor,
    nombre,
    email,
    codigo_asesor,
    estado
FROM asesores_banco
ORDER BY id_asesor;
-- SQLBook: Code
UPDATE usuario
SET rol = 'usuario'
WHERE id_usuario = 2
  AND rol = 'asesor';

SELECT id_usuario, nombre, rol
FROM usuario
WHERE id_usuario = 2;
-- SQLBook: Code
UPDATE usuario
SET email = 'luisssm@gmail.com'

WHERE id_usuario = 25;

SELECT id_usuario, nombre, email
FROM usuario
WHERE id_usuario = 25;

WHERE id_usuario = 25;

SELECT id_usuario, nombre, email
FROM usuario
WHERE id_usuario = 25;
-- SQLBook: Code
USE billetera;

DELETE FROM usuario
WHERE id_usuario BETWEEN 701 AND 1004;
-- SQLBook: Code

USE billetera;

SELECT id_usuario, nombre, email, documento
FROM usuario
WHERE email = 'luissmate89@gmail.com'
   OR documento = '1234567890';
-- SQLBook: Code
INSERT INTO usuario (
    nombre, email, `password`, telefono, direccion, documento,
    rol, tope_ahorros, tope_corriente
)
VALUES (
    'Nombre completo',
    'luissmate89@gmail.com',
    'mateus20452@',
    '3000000000',
    'calle 87 sur 91-85',
    '1234567890',
    'usuario',
    0,
    0
);

SET @id_usuario_nuevo = LAST_INSERT_ID();
SET @numero_cuenta_nuevo = CONCAT(
    LPAD(FLOOR(RAND() * 1000000000), 9, '0'),
    LPAD(FLOOR(RAND() * 10000000), 7, '0')
);

INSERT INTO cuentas (
    numero_cuenta, id_usuario, tipo_cuenta, tipo_operacion, saldo, estado
)
VALUES (
    @numero_cuenta_nuevo,
    @id_usuario_nuevo,
    'ahorros',
    'debito',
    0,
    'activa'
);

SELECT id_usuario, nombre, email
FROM usuario
WHERE id_usuario = @id_usuario_nuevo;

SELECT id_cuenta, numero_cuenta, id_usuario, tipo_cuenta, saldo, estado
FROM cuentas
WHERE id_usuario = @id_usuario_nuevo;
-- SQLBook: Code
DELETE FROM asesores_banco
WHERE id_asesor BETWEEN 2 AND 20;
-- SQLBook: Code
-- 1. Eliminar notificaciones
DELETE FROM notificaciones
WHERE id_usuario = 3;

<<<<<<< HEAD
START TRANSACTION;

-- 1. Eliminar las notificaciones del usuario
DELETE FROM notificaciones
WHERE id_usuario = 1;

-- 2. Eliminar el usuario
DELETE FROM usuario
WHERE id_usuario = 1;

COMMIT;
-- SQLBook: Code
USE billetera;

START TRANSACTION;

-- 1. Eliminar notificaciones
DELETE FROM notificaciones
WHERE id_usuario = 1;

-- 2. Eliminar cuentas
DELETE FROM cuentas
WHERE id_usuario = 1;

-- 3. Eliminar la relación de administrador antes del usuario
DELETE FROM administradores
WHERE id_usuario = 1;

-- 4. Eliminar usuario
DELETE FROM usuario
WHERE id_usuario = 1;

COMMIT;
-- SQLBook: Code
DELETE FROM administradores WHERE id_usuario = 1;
DELETE FROM usuario WHERE id_usuario = 1;
-- SQLBook: Code
DELETE FROM administradores
WHERE id_administrador = 1;
-- SQLBook: Code
DELETE FROM billetera.asesores_banco WHERE id_asesor = 1;
=======
ALTER TABLE usuario DROP COLUMN email;
-- SQLBook: Code
USE billetera;

ALTER TABLE usuario
ADD COLUMN email VARCHAR(100) NULL;

CREATE UNIQUE INDEX ix_usuario_email
ON usuario (email);
-- SQLBook: Code
SELECT DATABASE();
SHOW COLUMNS FROM billetera.usuario LIKE 'email';
-- SQLBook: Code
ALTER TABLE billetera.usuario
MODIFY COLUMN email VARCHAR(100) NULL
AFTER id_usuario;
>>>>>>> feat/pulga-correciones
=======
-- 2. Eliminar cuentas
DELETE FROM cuentas
WHERE id_usuario = 3;

-- 3. Eliminar usuario
DELETE FROM usuario
WHERE id_usuario = 3;
-- SQLBook: Code
SELECT DATABASE();
SHOW COLUMNS FROM asesores_banco LIKE 'id_usuario';
SHOW INDEX FROM asesores_banco;
-- SQLBook: Code
ALTER TABLE asesores_banco DROP COLUMN id_usuario;


-- SQLBook: Code
USE billetera;

START TRANSACTION;

INSERT INTO usuario (
    nombre, email, password, telefono, direccion, codigo_postal,
    ciudad, localidad, barrio, llave_bre_b, documento, rol,
    codigo_registro, estado, tope_ahorros, tope_corriente,
    fecha_creacion, id_tipo_doc
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
    datos.llave_bre_b,
    datos.documento,
    datos.rol,
    datos.codigo_registro,
    datos.estado,
    datos.tope_ahorros,
    datos.tope_corriente,
    CURRENT_TIMESTAMP,
    datos.id_tipo_doc
FROM (
    SELECT
        'Mateo Alejandro Cardenas Rivas' AS nombre,
        'luissmate89@gmail.com' AS email,
        '$argon2id$v=19$m=65536,t=3,p=4$I6T03ntvrZUSIqSU8p6TUg$HsOTH4aIlWXnHKHCHNuPAEUbriAWUFMNwiSDQv6WyS8' AS password,
        '0000000001' AS telefono,
        'Calle 10 # 20-01' AS direccion,
        '110001' AS codigo_postal,
        'Bogota' AS ciudad,
        'Usaquen' AS localidad,
        'Santa Ana' AS barrio,
        'prueba0001' AS llave_bre_b,
        'TESTDOC000001' AS documento,
        'usuario' AS rol,
        '900001' AS codigo_registro,
        'activo' AS estado,
        5000000 AS tope_ahorros,
        3000000 AS tope_corriente,
        1 AS id_tipo_doc
    UNION ALL
    SELECT
        'Sebastian Emiliano Torres Beltran',
        'kirogmateus@gmail.com',
        '$argon2id$v=19$m=65536,t=3,p=4$I6T03ntvrZUSIqSU8p6TUg$HsOTH4aIlWXnHKHCHNuPAEUbriAWUFMNwiSDQv6WyS8',
        '0000000002',
        'Carrera 11 # 21-02',
        '110002',
        'Bogota',
        'Suba',
        'El Prado',
        'prueba0002',
        'TESTDOC000002',
        'usuario',
        '900002',
        'activo',
        5000000,
        3000000,
        1
    UNION ALL
    SELECT
        'Nicolas Esteban Valderrama Cruz',
        'finaciero2026@gmail.com',
        '$argon2id$v=19$m=65536,t=3,p=4$I6T03ntvrZUSIqSU8p6TUg$HsOTH4aIlWXnHKHCHNuPAEUbriAWUFMNwiSDQv6WyS8',
        '0000000003',
        'Calle 12 # 22-03',
        '110003',
        'Bogota',
        'Kennedy',
        'Timiza',
        'prueba0003',
        'TESTDOC000003',
        'usuario',
        '900003',
        'activo',
        5000000,
        3000000,
        1
) AS datos
WHERE NOT EXISTS (
    SELECT 1
    FROM usuario AS u
    WHERE BINARY LOWER(TRIM(u.email)) =
          BINARY LOWER(TRIM(datos.email))
);

INSERT INTO cuentas (
    numero_cuenta, id_usuario, tipo_cuenta, tipo_operacion, saldo, estado
)
SELECT
    CONCAT('9', LPAD(u.id_usuario, 15, '0')),
    u.id_usuario,
    'corriente',
    'debito',
    0,
    'inactiva'
FROM usuario AS u
WHERE (
       (BINARY LOWER(TRIM(u.email)) = BINARY 'luissmate89@gmail.com'
        AND u.nombre = 'Mateo Alejandro Cardenas Rivas')
    OR (BINARY LOWER(TRIM(u.email)) = BINARY 'kirogmateus@gmail.com'
        AND u.nombre = 'Sebastian Emiliano Torres Beltran')
    OR (BINARY LOWER(TRIM(u.email)) = BINARY 'finaciero2026@gmail.com'
        AND u.nombre = 'Nicolas Esteban Valderrama Cruz')
)
AND NOT EXISTS (
    SELECT 1
    FROM cuentas AS c
    WHERE c.id_usuario = u.id_usuario
      AND c.tipo_cuenta = 'corriente'
)
AND NOT EXISTS (
    SELECT 1
    FROM cuentas AS c
    WHERE BINARY c.numero_cuenta =
          BINARY CONCAT('9', LPAD(u.id_usuario, 15, '0'))
);

COMMIT;
-- SQLBook: Code
USE billetera;

UPDATE usuario
SET documento = '1043219876'
WHERE id_usuario = 28;
-- SQLBook: Code
USE billetera;

UPDATE usuario
SET email = 'luisssmateus802@gmail.com'
WHERE id_usuario = 25;
-- SQLBook: Code
START TRANSACTION;

SET @id_usuario = 4;

DELETE FROM notificaciones
WHERE id_usuario = @id_usuario;

DELETE t
FROM tarjetas AS t
JOIN cuentas AS c ON c.id_cuenta = t.id_cuenta
WHERE c.id_usuario = @id_usuario;

DELETE FROM cuentas
WHERE id_usuario = @id_usuario;

DELETE FROM usuario
WHERE id_usuario = @id_usuario;

COMMIT;