const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

// Genera slots de tiempo entre hora_inicio y hora_fin con duración dada (en minutos)
function generarSlots(horaInicio, horaFin, duracion) {
  const slots = [];
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);
  let actual = hi * 60 + mi;
  const fin = hf * 60 + mf;
  while (actual + duracion <= fin) {
    const hIni = String(Math.floor(actual / 60)).padStart(2, '0') + ':' + String(actual % 60).padStart(2, '0');
    actual += duracion;
    const hFin = String(Math.floor(actual / 60)).padStart(2, '0') + ':' + String(actual % 60).padStart(2, '0');
    slots.push({ hora_inicio: hIni, hora_fin: hFin });
  }
  return slots;
}

// Obtiene turnos para una fecha y profesional (o todos los profesionales)
async function listarPorFecha(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { fecha, id_profesional } = req.query;
  if (!fecha) return res.status(400).json({ message: 'Parámetro fecha requerido (YYYY-MM-DD)' });

  let sql = `SELECT t.*,
               p.nombre AS profesional_nombre, p.especialidad,
               pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido, pa.telefono AS paciente_telefono, pa.dni AS paciente_dni
             FROM turno t
             JOIN profesional p ON p.id = t.id_profesional
             LEFT JOIN paciente pa ON pa.id = t.id_paciente
             WHERE t.id_empresa = ? AND t.fecha = ?`;
  const params = [id_empresa, fecha];
  if (id_profesional) {
    sql += ' AND t.id_profesional = ?';
    params.push(id_profesional);
  }
  sql += ' ORDER BY t.id_profesional, t.hora_inicio';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}

// Obtiene turnos para un rango de fechas (para vista semanal)
async function listarPorSemana(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { fecha_desde, fecha_hasta, id_profesional } = req.query;
  if (!fecha_desde || !fecha_hasta) return res.status(400).json({ message: 'Parámetros fecha_desde y fecha_hasta requeridos' });

  let sql = `SELECT t.*,
               p.nombre AS profesional_nombre, p.especialidad,
               pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido, pa.telefono AS paciente_telefono
             FROM turno t
             JOIN profesional p ON p.id = t.id_profesional
             LEFT JOIN paciente pa ON pa.id = t.id_paciente
             WHERE t.id_empresa = ? AND t.fecha BETWEEN ? AND ?`;
  const params = [id_empresa, fecha_desde, fecha_hasta];
  if (id_profesional) {
    sql += ' AND t.id_profesional = ?';
    params.push(id_profesional);
  }
  sql += ' ORDER BY t.fecha, t.id_profesional, t.hora_inicio';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}

// Genera automáticamente los slots de turno para un día basado en agenda_config
async function generarTurnosDia(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { fecha, id_profesional } = req.body;
  if (!fecha) return res.status(400).json({ message: 'fecha requerida (YYYY-MM-DD)' });

  const fechaDate = new Date(fecha + 'T00:00:00');
  const diaSemana = (fechaDate.getDay() + 6) % 7; // 0=Lunes...6=Domingo

  let configSql = 'SELECT * FROM agenda_config WHERE id_empresa = ? AND dia_semana = ? AND activo = 1';
  const configParams = [id_empresa, diaSemana];
  if (id_profesional) {
    configSql += ' AND id_profesional = ?';
    configParams.push(id_profesional);
  }
  const [configs] = await pool.query(configSql, configParams);
  if (!configs.length) return res.status(404).json({ message: 'No hay configuración de agenda para ese día' });

  let creados = 0;
  let omitidos = 0;
  for (const cfg of configs) {
    const slots = generarSlots(cfg.hora_inicio, cfg.hora_fin, cfg.duracion_turno);
    for (const slot of slots) {
      try {
        await pool.query(
          'INSERT INTO turno (id_empresa, id_profesional, fecha, hora_inicio, hora_fin, estado) VALUES (?, ?, ?, ?, ?, "disponible")',
          [id_empresa, cfg.id_profesional, fecha, slot.hora_inicio, slot.hora_fin]
        );
        creados++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') { omitidos++; } else throw err;
      }
    }
  }
  res.json({ creados, omitidos, message: `${creados} turno(s) generado(s), ${omitidos} ya existían` });
}

async function crear(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id_profesional, fecha, hora_inicio, hora_fin, id_paciente, notas, estado } = req.body;
  if (!id_profesional || !fecha || !hora_inicio || !hora_fin)
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  try {
    const [result] = await pool.query(
      'INSERT INTO turno (id_empresa, id_profesional, id_paciente, fecha, hora_inicio, hora_fin, estado, notas, id_usuario_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id_empresa, id_profesional, id_paciente || null, fecha, hora_inicio, hora_fin, estado || 'disponible', notas?.trim() || null, req.user.id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya existe un turno en ese horario para ese profesional' });
    throw err;
  }
}

async function actualizar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id_paciente, estado, notas, hora_inicio, hora_fin } = req.body;
  const [result] = await pool.query(
    'UPDATE turno SET id_paciente = ?, estado = ?, notas = ?, hora_inicio = COALESCE(?, hora_inicio), hora_fin = COALESCE(?, hora_fin) WHERE id = ? AND id_empresa = ?',
    [id_paciente || null, estado, notas?.trim() || null, hora_inicio || null, hora_fin || null, req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Turno no encontrado' });
  res.json({ ok: true });
}

async function eliminar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [result] = await pool.query(
    'DELETE FROM turno WHERE id = ? AND id_empresa = ?',
    [req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Turno no encontrado' });
  res.json({ ok: true });
}

module.exports = { listarPorFecha, listarPorSemana, generarTurnosDia, crear, actualizar, eliminar };
