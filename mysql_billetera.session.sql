-- SQLBook: Code
START TRANSACTION;

UPDATE cuentas AS c
INNER JOIN usuario AS u
    ON u.id_usuario = c.id_usuario
SET c.saldo = 50000
WHERE TRIM(LOWER(u.nombre)) = 'JUAN pepe'
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
WHERE TRIM(LOWER(u.nombre)) = 'JUAN pepe'
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
    a.id_usuario,
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