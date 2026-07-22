const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

async function listarMovimientos(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [rows] = await pool.query(
    `SELECT cm.*,
            CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
            p.nombre AS producto_nombre,
            p.codigo AS producto_codigo
     FROM caja_movimiento cm
     JOIN usuario u ON cm.id_usuario = u.id
     LEFT JOIN producto p ON cm.id_producto = p.id
     WHERE cm.id_empresa = ?
     ORDER BY cm.fecha DESC`,
    [id_empresa]
  );
  res.json(rows);
}

async function crearMovimiento(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id: id_usuario } = req.user;
  const { tipo, id_producto, cantidad, precio_unit, monto: montoManual, descripcion } = req.body;

  if (!tipo) return res.status(400).json({ message: 'Tipo requerido' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let monto;

    if (id_producto && cantidad != null && precio_unit != null) {
      monto = Number(cantidad) * Number(precio_unit);

      const [prod] = await conn.query(
        'SELECT id FROM producto WHERE id=? AND id_empresa=?',
        [id_producto, id_empresa]
      );
      if (!prod.length) {
        await conn.rollback();
        return res.status(404).json({ message: 'Producto no encontrado en esta empresa' });
      }

      // venta descuenta stock, compra lo suma
      const delta = tipo === 'venta' ? -Number(cantidad) : Number(cantidad);
      await conn.query('UPDATE producto SET stock = stock + ? WHERE id=?', [delta, id_producto]);
    } else {
      if (!montoManual) {
        await conn.rollback();
        return res.status(400).json({ message: 'Monto requerido para movimientos sin producto' });
      }
      monto = Number(montoManual);
    }

    const [result] = await conn.query(
      `INSERT INTO caja_movimiento
       (id_empresa, id_usuario, tipo, id_producto, cantidad, precio_unit, monto, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_empresa, id_usuario, tipo,
        id_producto || null,
        cantidad != null ? Number(cantidad) : null,
        precio_unit != null ? Number(precio_unit) : null,
        monto,
        descripcion || null,
      ]
    );

    await conn.commit();
    res.status(201).json({ id: result.insertId, tipo, monto, id_producto, cantidad, precio_unit });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Error al registrar movimiento' });
  } finally {
    conn.release();
  }
}

async function resumenCaja(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [rows] = await pool.query(
    `SELECT
       SUM(CASE WHEN tipo IN ('venta','ingreso') THEN monto ELSE 0 END)       AS total_ingresos,
       SUM(CASE WHEN tipo IN ('compra','egreso')  THEN monto ELSE 0 END)       AS total_egresos,
       SUM(CASE WHEN tipo IN ('venta','ingreso') THEN monto ELSE -monto END)   AS saldo
     FROM caja_movimiento WHERE id_empresa=?`,
    [id_empresa]
  );
  res.json(rows[0]);
}

async function eliminarMovimiento(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM caja_movimiento WHERE id=? AND id_empresa=?',
      [id, id_empresa]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }

    const mov = rows[0];

    // Revertir el stock si el movimiento tenía producto
    if (mov.id_producto && mov.cantidad != null) {
      const delta = mov.tipo === 'venta' ? Number(mov.cantidad) : -Number(mov.cantidad);
      await conn.query('UPDATE producto SET stock = stock + ? WHERE id=?', [delta, mov.id_producto]);
    }

    await conn.query('DELETE FROM caja_movimiento WHERE id=?', [id]);
    await conn.commit();
    res.json({ message: 'Movimiento eliminado' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar movimiento' });
  } finally {
    conn.release();
  }
}

module.exports = { listarMovimientos, crearMovimiento, resumenCaja, eliminarMovimiento };
