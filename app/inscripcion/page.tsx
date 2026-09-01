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

    // 1. Crear usuario en Supabase Auth (documento = contraseña)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: correo,
      password: documento,
    });

    if (authError) {
      setMessage({ type: 'error', text: authError.message });
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setMessage({
        type: 'error',
        text: 'No se pudo crear la cuenta. Intenta de nuevo.',
      });
      setLoading(false);
      return;
    }

    // 2. Crear el perfil en la tabla participantes
    const { error: dbError } = await supabase.from('participantes').insert({
      id: userId,
      nombre_completo: nombreCompleto,
      documento,
      correo,
      telefono,
      semestre: semestre ? Number(semestre) : null,
      consultorio: consultorio || null,
    });

    if (dbError) {
      setMessage({ type: 'error', text: dbError.message });
      setLoading(false);
      return;
    }

    setMessage({
      type: 'success',
      text: '¡Inscripción exitosa! Ya puedes iniciar sesión con tu correo y documento.',
    });
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>
          Consultorio Jurídico
          <span>Unicórdoba</span>
        </h1>
        <p>Completa tu inscripción para continuar</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Formulario de inscripción</h2>
          <p className="subtitle">Tu contraseña será tu número de documento</p>

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
                placeholder="Ej. 1067123456"
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
                placeholder="tucorreo@unicordoba.edu.co"
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
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}