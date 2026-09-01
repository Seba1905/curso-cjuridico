'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const CONSULTORIOS = [
  'Derecho Público',
  'Derecho Privado',
  'Derecho Penal',
  'Derecho Laboral',
];

export default function InscripcionPage() {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [documento, setDocumento] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [semestre, setSemestre] = useState('');
  const [consultorio, setConsultorio] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Se guarda directo en la tabla `participantes`, sin auth ni verificación.
    const { error: dbError } = await supabase.from('participantes').insert({
      nombre_completo: nombreCompleto,
      documento,
      correo,
      telefono,
      semestre: semestre ? Number(semestre) : null,
      consultorio: consultorio || null,
    });

    if (dbError) {
      const esDocumentoDuplicado =
        dbError.code === '23505' && dbError.message.includes('participantes_documento_key');

      setMessage({
        type: 'error',
        text: esDocumentoDuplicado
          ? 'Este número de documento ya está registrado.'
          : dbError.message,
      });
      setLoading(false);
      return;
    }

    setMessage({
      type: 'success',
      text: '¡Inscripción exitosa!',
    });
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>
          Curso Teórico-Práctico
          <span>Consultorio Juridico Unicordoba</span>
        </h1>
        <p>Completa tu inscripción para continuar</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Formulario de inscripción</h2>
          <div>
            <h1></h1>
          </div>

          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="nombreCompleto">Nombre completo</label>
              <input
                id="nombreCompleto"
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Nombre y apellidos"
              />
            </div>

            <div className="field">
              <label htmlFor="documento">Número de documento</label>
              <input
                id="documento"
                type="text"
                required
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej. 123456789"
              />
            </div>

            <div className="field">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@correo.com"
              />
            </div>

            <div className="field">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="300 000 0000"
              />
            </div>

            <div className="field">
              <label htmlFor="semestre">
                Semestre <span className="opcional">(opcional)</span>
              </label>
              <input
                id="semestre"
                type="number"
                min={1}
                max={12}
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                placeholder="Ej. 7"
              />
            </div>

            <div className="field">
              <label htmlFor="consultorio">
                Consultorio <span className="opcional">(opcional)</span>
              </label>
              <select
                id="consultorio"
                value={consultorio}
                onChange={(e) => setConsultorio(e.target.value)}
              >
                <option value="">Selecciona una opción</option>
                {CONSULTORIOS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Inscribirme'}
            </button>
          </form>

          <div className="switch-mode">
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a>
          </div>
        </div>
      </div>
    </div>
  );
}