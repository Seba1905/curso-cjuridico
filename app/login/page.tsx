'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Participante = {
  nombre_completo: string;
  qr_code: string;
  rol: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [documento, setDocumento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participante, setParticipante] = useState<Participante | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase
      .from('participantes')
      .select('nombre_completo, qr_code, rol')
      .eq('correo', correo)
      .eq('documento', documento)
      .maybeSingle();

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Correo o documento incorrectos.');
      setLoading(false);
      return;
    }

    if (data.rol === 'administrador') {
      router.push('/admin');
      return;
    }

    if (data.rol !== 'estudiante') {
      setError('Esta vista está disponible solo para estudiantes o administradores.');
      setLoading(false);
      return;
    }

    setParticipante(data as Participante);
    setLoading(false);
  }

  const qrImageUrl = participante
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=0&data=${encodeURIComponent(
        participante.qr_code
      )}`
    : '';

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>
          Curso Teórico-Práctico
          <span>Consultorio Juridico Unicordoba</span>
        </h1>
        <p>
          {participante
            ? 'Presenta tu credencial para ingresar a cada sesión'
            : 'Ingresa con tu correo y documento para ver tu credencial'}
        </p>
      </div>

      <div className="auth-form-side">
        {!participante ? (
          <div className="auth-card">
            <h2>Iniciar sesión</h2>
            <p className="subtitle">Consulta tu inscripción con tus datos</p>

            {error && <div className="form-message error">{error}</div>}

            <form onSubmit={handleSubmit}>
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

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Verificando...' : 'Ver mi credencial'}
              </button>
            </form>

            <div className="switch-mode">
              ¿No tienes cuenta? <a href="/">Inscríbete aquí</a>
            </div>
          </div>
        ) : (
          <div className="credencial-card">
            <div className="credencial-ribbon">
              <span className="credencial-hole" aria-hidden="true" />
              <p className="credencial-wordmark">Consultorio Jurídico Unicordoba</p>
            </div>

            <div className="credencial-body">
              <p className="credencial-eyebrow">Curso Teórico-Práctico</p>
              <h2 className="credencial-name">{participante.nombre_completo}</h2>

              <div className="credencial-rule" />

              <div className="credencial-qr-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl} alt="Código QR de acceso" width={200} height={200} />
              </div>

              <p className="credencial-caption">Presenta este código al ingresar a cada sesión</p>
              <p className="credencial-code">{participante.qr_code}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}