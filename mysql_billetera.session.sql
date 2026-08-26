UPDATE cuentas
SET saldo = 1500000.00
WHERE id_usuario = 2
AND tipo_cuenta = 'corriente';

SELECT
	u.id_usuario,
	u.nombre,
	c.id_cuenta,
	c.tipo_cuenta,
	c.saldo,
	c.estado
FROM usuario u
INNER JOIN cuentas c
	ON u.id_usuario = c.id_usuario
WHERE u.id_usuario = 2
ORDER BY c.tipo_cu