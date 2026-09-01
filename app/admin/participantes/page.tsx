'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Participante = {
  id: string;
  nombre_completo: string;
  documento: string;
  correo: string;
  telefono: string;
  semestre: number | null;
  consultorio: string | null;
};

type AsistenciasPorParticipante = Record<string, number[]>;

const REUNIONES = [1, 2, 3, 4] as const;

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciasPorParticipante>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marcando, setMarcando] = useState<string | null>(null); // `${participanteId}-${reunion}`

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: personas, error: personasError } = await supabase
      .from('participantes')
      .select('id, nombre_completo, documento, correo, telefono, semestre, consultorio')
      .eq('rol', 'estudiante')
      .order('nombre_completo', { ascending: true });

    if (personasError) {
      setError(personasError.message);
      setLoading(false);
      return;
    }

    const ids = (personas ?? []).map((p) => p.id);

    const { data: registros, error: asistenciasError } = ids.length
      ? await supabase.from('asistencias').select('participante_id, reunion').in('participante_id', ids)
      : { data: [], error: null };

    if (asistenciasError) {
      setError(asistenciasError.message);
      setLoading(false);
      return;
    }

    const mapa: AsistenciasPorParticipante = {};
    (registros ?? []).forEach((r) => {
      const lista = mapa[r.participante_id] ?? [];
      lista.push(r.reunion as number);
      mapa[r.participante_id] = lista;
    });

    setParticipantes((personas ?? []) as Participante[]);
    setAsistencias(mapa);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  async function alternarAsistencia(participanteId: string, reunion: number) {
    const marcadas = asistencias[participanteId] ?? [];
    const yaMarcada = marcadas.includes(reunion);
    const clave = `${participanteId}-${reunion}`;
    setMarcando(clave);

    if (yaMarcada) {
      const { error: deleteError } = await supabase
        .from('asistencias')
        .delete()
        .eq('participante_id', participanteId)
        .eq('reunion', reunion);

      if (!deleteError) {
        setAsistencias((prev) => ({
          ...prev,
          [participanteId]: (prev[participanteId] ?? []).filter((r) => r !== reunion),
        }));
      }
    } else {
      const { error: insertError } = await supabase
        .from('asistencias')
        .insert({ participante_id: participanteId, reunion });

      // 23505 = ya existía (choque con la restricción unique), lo tratamos como éxito
      if (!insertError || (insertError as { code?: string }).code === '23505') {
        setAsistencias((prev) => ({
          ...prev,
          [participanteId]: [...(prev[participanteId] ?? []), reunion],
        }));
      }
    }

    setMarcando(null);
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Participantes</h2>
        <p>Estudiantes inscritos y su asistencia por reunión</p>
      </div>

      {loading && <p className="admin-estado-cargando">Cargando participantes...</p>}

      {!loading && error && (
        <div className="form-message error" style={{ maxWidth: 1100, margin: '0 auto 20px' }}>
          {error}
        </div>
      )}

      {!loading && !error && participantes.length === 0 && (
        <p className="admin-estado-vacio">Aún no hay estudiantes inscritos.</p>
      )}

      {!loading && !error && participantes.length > 0 && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Semestre</th>
                <th>Consultorio</th>
                <th>Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((p) => {
                const marcadas = asistencias[p.id] ?? [];
                return (
                  <tr key={p.id}>
                    <td>{p.nombre_completo}</td>
                    <td>{p.documento}</td>
                    <td>{p.correo}</td>
                    <td>{p.telefono}</td>
                    <td className={p.semestre ? '' : 'sin-dato'}>{p.semestre ?? 'Sin dato'}</td>
                    <td className={p.consultorio ? '' : 'sin-dato'}>{p.consultorio ?? 'Sin dato'}</td>
                    <td>
                      <div className="asistencia-chips">
                        {REUNIONES.map((r) => {
                          const marcada = marcadas.includes(r);
                          const clave = `${p.id}-${r}`;
                          return (
                            <button
                              key={r}
                              className={marcada ? 'asistencia-chip marcada' : 'asistencia-chip'}
                              onClick={() => alternarAsistencia(p.id, r)}
                              disabled={marcando === clave}
                              title={`Reunión ${r}${marcada ? ' (asistió)' : ''}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}