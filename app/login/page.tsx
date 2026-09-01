'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Participante = {
  nombre_completo: string;
  qr_code: string;
  rol: string;
};

export default function LoginPage() {
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

    if (data.rol !== 'estudiante') {
      setError('Esta vista está disponible solo para el rol estudiante.');
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
    <div className="page">
      <div className="watermark" aria-hidden="true" />

      {!participante ? (
        <div className="card">
          <div className="ribbon">
            <span className="hole" aria-hidden="true" />
            <p className="wordmark">Consultorio Jurídico Unicordoba</p>
          </div>

          <div className="card-body">
            <h1>Curso</h1>
            <h1>Teórico-Práctico</h1>
            <p className="subtitle">Ingresa para ver tu credencial</p>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  id="correo"
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder=""
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
                  placeholder=""
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card credential">
          <div className="ribbon">
            <span className="hole" aria-hidden="true" />
            <p className="wordmark">Consultorio Jurídico Unicordoba</p>
          </div>

          <div className="card-body">
            <p className="eyebrow-free">Curso Teórico-Práctico</p>
            <h3 className="name">{participante.nombre_completo}</h3>

            <div className="rule" />

            <div className="qr-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl} alt="Código QR de acceso" width={200} height={200} />
            </div>

            <p className="caption">Presenta este código al ingresar a cada sesión</p>
            <p className="code">{participante.qr_code}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          position: relative;
          background: radial-gradient(120% 140% at 50% -10%, #163f2f 0%, #0b2b21 55%, #081f18 100%);
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        .watermark {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image: repeating-linear-gradient(
              45deg,
              transparent 0 38px,
              #c9a227 38px 39px
            ),
            repeating-linear-gradient(-45deg, transparent 0 38px, #c9a227 38px 39px);
          pointer-events: none;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 380px;
          background: #f7f4ec;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.5);
        }

        .credential {
          animation: rise 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .credential {
            animation: none;
          }
        }

        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .ribbon {
          position: relative;
          background: linear-gradient(135deg, #1f6f4a, #123d2e);
          padding: 22px 24px 16px;
          text-align: center;
        }

        .hole {
          position: absolute;
          top: -11px;
          left: 50%;
          transform: translateX(-50%);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #081f18;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 0 4px #f7f4ec;
        }

        .wordmark {
          margin: 6px 0 0;
          color: #eae3cf;
          font-size: 12.5px;
          letter-spacing: 0.02em;
          font-weight: 500;
        }

        .card-body {
          padding: 32px 28px 34px;
          text-align: center;
        }

        h1 {
          margin: 0 0 6px;
          font-family: 'Poppins', system-ui, sans-serif;
          font-weight: 600;
          font-size: 26px;
          color: #17231b;
          line-height: 1.2;
        }

        .subtitle {
          margin: 0 0 24px;
          color: #6b675c;
          font-size: 14px;
          line-height: 1.5;
        }

        .eyebrow-free {
          margin: 0 0 2px;
          color: #6b675c;
          font-size: 13px;
        }

        .name {
          font-size: 28px;
          margin-bottom: 18px;
        }

        .rule {
          width: 56px;
          height: 2px;
          background: #c9a227;
          margin: 0 auto 22px;
        }

        .field {
          text-align: left;
          margin-bottom: 16px;
        }

        label {
          display: block;
          font-size: 13px;
          color: #45493f;
          margin-bottom: 6px;
          font-weight: 500;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 13px;
          border: 1px solid #d8d2bf;
          border-radius: 4px;
          background: #fffdf8;
          font-size: 15px;
          font-family: inherit;
          color: #17231b;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        input:focus-visible {
          border-color: #1f6f4a;
          box-shadow: 0 0 0 3px rgba(31, 111, 74, 0.18);
        }

        button {
          width: 100%;
          margin-top: 6px;
          padding: 12px;
          border: none;
          border-radius: 4px;
          background: #17231b;
          color: #f7f4ec;
          font-size: 15px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        button:hover:not(:disabled) {
          background: #1f6f4a;
        }

        button:focus-visible {
          outline: 2px solid #c9a227;
          outline-offset: 2px;
        }

        button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .error {
          background: #fbeaea;
          color: #9c3b3b;
          border: 1px solid #eecccc;
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 13.5px;
          margin-bottom: 18px;
          text-align: left;
        }

        .qr-frame {
          display: inline-flex;
          padding: 14px;
          background: #ffffff;
          border: 1px solid #e4dcc4;
          border-radius: 6px;
          box-shadow: 0 8px 20px -10px rgba(0, 0, 0, 0.25);
          margin-bottom: 18px;
        }

        .qr-frame img {
          display: block;
          width: 200px;
          height: 200px;
        }

        .caption {
          margin: 0 0 10px;
          color: #45493f;
          font-size: 13.5px;
        }

        .code {
          margin: 0;
          color: #9a9584;
          font-size: 12px;
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}