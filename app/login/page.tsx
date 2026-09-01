'use client';

import { useEffect, useRef, useState } from 'react';
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

const REUNIONES = [1, 2, 3, 4] as const;

export default function AdminPage() {
  const scannerRef = useRef<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const [found, setFound] = useState<Participante | null>(null);
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [marking, setMarking] = useState<number | null>(null);

  // Inicia la cámara y el lector de QR al montar la página.
  useEffect(() => {
    let isMounted = true;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!isMounted) return;

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => handleScan(decodedText),
          () => {
            // errores de frame individuales (no detecta QR); se ignoran
          }
        )
        .then(() => setScanning(true))
        .catch(() => {
          setCameraError(
            'No se pudo acceder a la cámara. Revisa los permisos del navegador.'
          );
        });
    });

    return () => {
      isMounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(codigo: string) {
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }

    setLookupError(null);
    setFound(null);
    setMarcadas([]);

    const { data: participante, error: dbError } = await supabase
      .from('participantes')
      .select('id, nombre_completo, documento, correo, telefono, semestre, consultorio')
      .eq('qr_code', codigo)
      .maybeSingle();

    if (dbError || !participante) {
      setLookupError('Este código QR no corresponde a ningún participante inscrito.');
      return;
    }

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('reunion')
      .eq('participante_id', participante.id);

    setFound(participante as Participante);
    setMarcadas((asistencias ?? []).map((a) => a.reunion as number));
  }

  async function marcarAsistencia(reunion: number) {
    if (!found || marcadas.includes(reunion)) return;
    setMarking(reunion);

    const { error } = await supabase
      .from('asistencias')
      .insert({ participante_id: found.id, reunion });

    // 23505 = ya existía (choque con la restricción unique), lo tratamos como éxito
    if (!error || error.code === '23505') {
      setMarcadas((prev) => [...prev, reunion]);
    }

    setMarking(null);
  }

  function escanearOtro() {
    setFound(null);
    setLookupError(null);
    setMarcadas([]);
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  }

  return (
    <div className="page">
      <header className="header">
        <p className="wordmark">Consultorio Jurídico Unicordoba</p>
        <h1>Control de asistencia</h1>
        <p className="subtitle">Escanea el código QR del estudiante para registrar su asistencia</p>
      </header>

      <div className="layout">
        <div className="scanner-panel">
          <div className="scan-frame">
            <div id="qr-reader" />
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
          </div>
          {cameraError && <p className="camera-error">{cameraError}</p>}
          {!cameraError && !scanning && <p className="camera-hint">Activando cámara...</p>}
        </div>

        <div className="info-panel">
          {!found && !lookupError && (
            <p className="placeholder">Esperando a escanear un código QR...</p>
          )}

          {lookupError && (
            <div className="result">
              <p className="lookup-error">{lookupError}</p>
              <button className="secondary" onClick={escanearOtro}>
                Escanear otro
              </button>
            </div>
          )}

          {found && (
            <div className="result">
              <h2>{found.nombre_completo}</h2>
              <dl>
                <dt>Documento</dt>
                <dd>{found.documento}</dd>
                <dt>Correo</dt>
                <dd>{found.correo}</dd>
                <dt>Teléfono</dt>
                <dd>{found.telefono}</dd>
                {found.semestre && (
                  <>
                    <dt>Semestre</dt>
                    <dd>{found.semestre}</dd>
                  </>
                )}
                {found.consultorio && (
                  <>
                    <dt>Consultorio</dt>
                    <dd>{found.consultorio}</dd>
                  </>
                )}
              </dl>

              <div className="rule" />

              <p className="reuniones-label">Asistencia por reunión</p>
              <div className="reuniones">
                {REUNIONES.map((r) => {
                  const marcada = marcadas.includes(r);
                  return (
                    <button
                      key={r}
                      className={marcada ? 'reunion marcada' : 'reunion'}
                      onClick={() => marcarAsistencia(r)}
                      disabled={marcada || marking === r}
                    >
                      {marcada ? '✓ ' : ''}Reunión {r}
                    </button>
                  );
                })}
              </div>

              <button className="secondary" onClick={escanearOtro}>
                Escanear otro
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .page {
          min-height: 100vh;
          padding: 32px 20px 60px;
          background: radial-gradient(120% 140% at 50% -10%, #163f2f 0%, #0b2b21 55%, #081f18 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #f7f4ec;
        }

        .header {
          text-align: center;
          max-width: 480px;
          margin: 0 auto 32px;
        }

        .wordmark {
          margin: 0 0 6px;
          font-size: 12.5px;
          color: #d9cfa8;
        }

        h1 {
          margin: 0 0 8px;
          font-family: 'Poppins', system-ui, sans-serif;
          font-weight: 600;
          font-size: 26px;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #cdd6cd;
        }

        .layout {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          max-width: 880px;
          margin: 0 auto;
          justify-content: center;
        }

        .scanner-panel {
          flex: 1 1 320px;
          max-width: 340px;
        }

        .scan-frame {
          position: relative;
          background: #081f18;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 1 / 1;
        }

        .scan-frame :global(#qr-reader) {
          width: 100% !important;
          height: 100% !important;
        }

        .scan-frame :global(video) {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
        }

        .corner {
          position: absolute;
          width: 28px;
          height: 28px;
          border: 3px solid #c9a227;
          pointer-events: none;
        }

        .tl {
          top: 10px;
          left: 10px;
          border-right: none;
          border-bottom: none;
        }
        .tr {
          top: 10px;
          right: 10px;
          border-left: none;
          border-bottom: none;
        }
        .bl {
          bottom: 10px;
          left: 10px;
          border-right: none;
          border-top: none;
        }
        .br {
          bottom: 10px;
          right: 10px;
          border-left: none;
          border-top: none;
        }

        .camera-error,
        .camera-hint {
          margin-top: 12px;
          font-size: 13.5px;
          color: #e3c9c9;
          text-align: center;
        }

        .camera-hint {
          color: #cdd6cd;
        }

        .info-panel {
          flex: 1 1 340px;
          max-width: 380px;
          background: #f7f4ec;
          border-radius: 8px;
          padding: 26px 26px 28px;
          color: #17231b;
        }

        .placeholder {
          color: #6b675c;
          font-size: 14px;
          text-align: center;
          margin: 40px 0;
        }

        h2 {
          margin: 0 0 16px;
          font-family: 'Poppins', system-ui, sans-serif;
          font-size: 21px;
          font-weight: 600;
        }

        dl {
          margin: 0;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 6px 14px;
          font-size: 13.5px;
        }

        dt {
          color: #6b675c;
        }

        dd {
          margin: 0;
          text-align: right;
        }

        .rule {
          width: 100%;
          height: 1px;
          background: #e4dcc4;
          margin: 20px 0 16px;
        }

        .reuniones-label {
          margin: 0 0 10px;
          font-size: 13px;
          color: #45493f;
        }

        .reuniones {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        .reunion {
          padding: 10px 8px;
          border: 1px solid #d8d2bf;
          border-radius: 4px;
          background: #fffdf8;
          font-size: 13.5px;
          font-weight: 500;
          font-family: inherit;
          color: #17231b;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .reunion:hover:not(:disabled) {
          border-color: #1f6f4a;
        }

        .reunion.marcada {
          background: #eaf3ec;
          border-color: #1f6f4a;
          color: #1f6f4a;
          cursor: default;
        }

        .reunion:disabled {
          opacity: 0.85;
        }

        .lookup-error {
          background: #fbeaea;
          color: #9c3b3b;
          border: 1px solid #eecccc;
          border-radius: 4px;
          padding: 12px 14px;
          font-size: 13.5px;
          margin: 0 0 18px;
        }

        .secondary {
          width: 100%;
          padding: 11px;
          border: 1px solid #17231b;
          border-radius: 4px;
          background: transparent;
          color: #17231b;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .secondary:hover {
          background: #17231b;
          color: #f7f4ec;
        }
      `}</style>
    </div>
  );
}