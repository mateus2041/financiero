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
    id_usuario INT NULL,
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
    id_usuario,
    codigo_asesor,
    especialidad,
    estado,
    fecha_ingreso
)
SELECT
    u.id_usuario,
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
    ON a.id_usuario = u.id_usuario
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
WHERE id_usuario = 1;

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
WHERE id_usuario = 1;

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
WHERE u.id_usuario = 1
ON DUPLICATE KEY UPDATE
    codigo_administrador = 'mateus20452@';

COMMIT;
-- SQLBook: Code
START TRANSACTION;

DELETE FROM asesores_banco
WHERE id_usuario = 9; -- cambia 9 por el ID correcto

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
WHERE id_usuario = @id_usuario;

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
WHERE id_usuario = @id_usuario;

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

INSERT INTO usuario (
    nombre,
    email,
    `password`,
    telefono,
    direccion,
    codigo_postal,
    ciudad,
    localidad,
    barrio,
    documento,
    rol,
    estado,
    fecha_creacion,
    id_tipo_doc
)
SELECT
    CASE n.n
        WHEN 1 THEN 'Valentina Demo Pardo'
        WHEN 2 THEN 'Samuel Demo Cardenas'
        WHEN 3 THEN 'Mariana Demo Salcedo'
        WHEN 4 THEN 'Nicolas Demo Benitez'
        ELSE CONCAT('Usuario de prueba ', LPAD(n.n, 4, '0'))
    END AS nombre,

    CASE n.n
        WHEN 1 THEN 'luissmate89@gmail.com'
        WHEN 2 THEN 'luisssmateus802@gmail.com'
        WHEN 3 THEN 'kirogamateus@gmail.com'
        WHEN 4 THEN 'gitmateus8@gmail.com'
        ELSE CONCAT('usuario.prueba.', LPAD(n.n, 4, '0'), '@example.test')
    END AS email,

    -- Hash Argon2 de demostración; contraseña compartida: DemoTemporal123!
    '$argon2id$v=19$m=65536,t=3,p=4$UCqFEMI459xbCyFk7N37fw$z8LU6/SePQQJV2UmURv7SOPTbuVBe4DUQPDAsHHsMCI' AS `password`,

    CONCAT('300', LPAD(n.n, 7, '0')) AS telefono,
    CONCAT('Direccion de prueba ', n.n) AS direccion,
    LPAD(MOD(n.n, 1000000), 6, '0') AS codigo_postal,

    CASE MOD(n.n, 3)
        WHEN 0 THEN 'Bogota'
        WHEN 1 THEN 'Medellin'
        ELSE 'Cali'
    END AS ciudad,

    'Zona de prueba' AS localidad,
    CONCAT('Barrio de prueba ', LPAD(n.n, 4, '0')) AS barrio,

    CASE n.n
        WHEN 1 THEN 'PRUEBA-731001'
        WHEN 2 THEN 'PRUEBA-842002'
        WHEN 3 THEN 'PRUEBA-953003'
        WHEN 4 THEN 'PRUEBA-164004'
        ELSE CONCAT('TEST-', LPAD(n.n, 8, '0'))
    END AS documento,

    CASE
        WHEN MOD(n.n, 100) = 0 THEN 'asesor'
        ELSE 'usuario'
    END AS rol,
    'activo' AS estado,
    CURRENT_TIMESTAMP AS fecha_creacion,
    td.id_tipo_doc
FROM (
    -- Genera los números del 1 al 1000.
    SELECT 1 + d0.d + d1.d * 10 + d2.d * 100 AS n
    FROM
        (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
         UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
         UNION ALL SELECT 8 UNION ALL SELECT 9) AS d0
    CROSS JOIN
        (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
         UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
         UNION ALL SELECT 8 UNION ALL SELECT 9) AS d1
    CROSS JOIN
        (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
         UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
         UNION ALL SELECT 8 UNION ALL SELECT 9) AS d2
) AS n
CROSS JOIN (
    -- Usa un ID que ya exista en tipo_documento.
    SELECT MIN(id_tipo_doc) AS id_tipo_doc
    FROM tipo_documento
) AS td
WHERE td.id_tipo_doc IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM usuario AS existente
      WHERE existente.email = CASE n.n
          WHEN 1 THEN 'luissmate89@gmail.com'
          WHEN 2 THEN 'luisssmateus802@gmail.com'
          WHEN 3 THEN 'kirogamateus@gmail.com'
          WHEN 4 THEN 'gitmateus8@gmail.com'
          ELSE CONCAT('usuario.prueba.', LPAD(n.n, 4, '0'), '@example.test')
      END
      OR existente.documento = CASE n.n
          WHEN 1 THEN 'PRUEBA-731001'
          WHEN 2 THEN 'PRUEBA-842002'
          WHEN 3 THEN 'PRUEBA-953003'
          WHEN 4 THEN 'PRUEBA-164004'
          ELSE CONCAT('TEST-', LPAD(n.n, 8, '0'))
      END
  );

-- Registra los 10 usuarios seleccionados como asesores para permitir su acceso.
-- También corrige el rol si esos usuarios ya se habían insertado antes.
UPDATE usuario
SET rol = 'asesor'
WHERE email LIKE 'usuario.prueba.%@example.test'
  AND documento LIKE 'TEST-%'
  AND RIGHT(documento, 2) = '00';

INSERT INTO asesores_banco (
    id_usuario,
    nombre,
    documento,
    email,
    codigo_asesor,
    especialidad,
    estado
)
SELECT
    u.id_usuario,
    u.nombre,
    u.documento,
    u.email,
    CONCAT('ASESOR-', LPAD(u.id_usuario, 6, '0')),
    'Asesoría bancaria',
    'activo'
FROM usuario AS u
WHERE u.rol = 'asesor'
  AND u.email LIKE 'usuario.prueba.%@example.test'
  AND u.documento LIKE 'TEST-%'
  AND RIGHT(u.documento, 2) = '00'
  AND NOT EXISTS (
      SELECT 1
      FROM asesores_banco AS a
      WHERE a.id_usuario = u.id_usuario
  );

COMMIT;

-- Verifica los cuatro correos proporcionados y los usuarios generados.
SELECT
    u.id_usuario,
    u.nombre,
    u.email,
    u.documento,
    u.rol,
    u.id_tipo_doc,
    a.codigo_asesor
FROM usuario AS u
LEFT JOIN asesores_banco AS a
    ON a.id_usuario = u.id_usuario
WHERE u.email IN (
    'luissmate89@gmail.com',
    'luisssmateus802@gmail.com',
    'kirogamateus@gmail.com',
    'gitmateus8@gmail.com'
)
OR u.email LIKE 'usuario.prueba.%@example.test'
ORDER BY u.id_usuario;
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
    ON u.id_usuario = a.id_usuario
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
    ON a.id_usuario = u.id_usuario
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
SET email = 'kirogamateus@gmail.com'
WHERE id_usuario = 6;

SELECT id_usuario, nombre, email
FROM usuario
WHERE id_usuario = 6;