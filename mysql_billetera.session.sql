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
    id_usuario INT NOT NULL UNIQUE,
    codigo_asesor VARCHAR(30) NOT NULL UNIQUE,
    especialidad VARCHAR(100),
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asesor_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

SELECT
    a.id_asesor,
    u.nombre,
    u.email,
    a.codigo_asesor,
    a.especialidad,
    a.estado,
    a.fecha_ingreso
FROM asesores_banco AS a
INNER JOIN usuario AS u
    ON u.id_usuario = a.id_usuario
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
    estado
)
SELECT
    u.id_usuario,
    'asesores2014',
    'Créditos y ahorro',
    'activo'
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
WHERE a.codigo_asesor = 'asesores2026';
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
WHERE id_usuario = 2;

INSERT INTO administradores (
    id_usuario,
    codigo_administrador
)
SELECT
    u.id_usuario,
    'mateus2026@'
FROM usuario AS u
WHERE u.id_usuario = 2
ON DUPLICATE KEY UPDATE
    id_usuario = VALUES(id_usuario),
    codigo_administrador = VALUES(codigo_administrador);

COMMIT;
-- SQLBook: Code
START TRANSACTION;

DELETE FROM asesores_banco
WHERE id_usuario = 9; -- cambia 1 por el ID correcto

COMMIT;
-- SQLBook: Code
START TRANSACTION;

DELETE FROM administradores
WHERE id_administrador = 1; -- cambia 1 por el ID correcto

COMMIT;
-- SQLBook: Code
DROP TABLE IF EXISTS asesores_banco;
-- SQLBook: Code
DELETE FROM usuario
WHERE id_usuario = 8;
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