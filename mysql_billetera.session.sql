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
WHERE id_usuario = 22;

INSERT INTO administradores (
    id_usuario,
    codigo_administrador,
    fecha_ingreso
)
SELECT
    u.id_usuario,
    'atlas2222@',
    CURRENT_TIMESTAMP
FROM usuario AS u
WHERE u.id_usuario = 22
ON DUPLICATE KEY UPDATE
    codigo_administrador = 'atlas2222@';

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
DELETE FROM usuario
WHERE id_usuario = 21;
-- SQLBook: Code
SET @id_usuario = 20;

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