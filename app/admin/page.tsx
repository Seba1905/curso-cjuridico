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
    <div className="escaneo-page">
      <div className="escaneo-header">
        <p className="escaneo-wordmark">Consultorio Jurídico Unicordoba</p>
        <h2>Control de asistencia</h2>
        <p>Escanea el código QR del estudiante para registrar su asistencia</p>
      </div>

      <div className="escaneo-layout">
        <div className="escaneo-scanner">
          <div className="escaneo-frame">
            <div id="qr-reader" />
            <span className="escaneo-corner tl" />
            <span className="escaneo-corner tr" />
            <span className="escaneo-corner bl" />
            <span className="escaneo-corner br" />
          </div>
          {cameraError && <p className="escaneo-camera-error">{cameraError}</p>}
          {!cameraError && !scanning && <p className="escaneo-camera-hint">Activando cámara...</p>}
        </div>

        <div className="escaneo-info">
          {!found && !lookupError && (
            <p className="escaneo-placeholder">Esperando a escanear un código QR...</p>
          )}

          {lookupError && (
            <div>
              <div className="form-message error">{lookupError}</div>
              <button className="btn-secundario" onClick={escanearOtro}>
                Escanear otro
              </button>
            </div>
          )}

          {found && <p className="escaneo-placeholder">Código leído. Mostrando carnet...</p>}
        </div>
      </div>

      {found && (
        <div className="carnet-overlay" role="dialog" aria-modal="true">
          <div className="carnet-modal">
            <button
              type="button"
              className="carnet-close"
              onClick={escanearOtro}
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="carnet-ribbon">
              <span className="carnet-hole" aria-hidden="true" />
              <div className="carnet-check">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12.5L9.5 17L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="carnet-wordmark">Consultorio Jurídico Unicordoba</p>
            </div>

            <div className="carnet-body">
              <h3 className="carnet-nombre">{found.nombre_completo}</h3>

              <dl className="escaneo-datos">
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

              <div className="escaneo-rule" />

              <p className="escaneo-reuniones-label">Asistencia por reunión</p>
              <div className="escaneo-reuniones">
                {REUNIONES.map((r) => {
                  const marcada = marcadas.includes(r);
                  return (
                    <button
                      key={r}
                      className={marcada ? 'escaneo-reunion marcada' : 'escaneo-reunion'}
                      onClick={() => marcarAsistencia(r)}
                      disabled={marcada || marking === r}
                    >
                      {marcada ? '✓ ' : ''}Reunión {r}
                    </button>
                  );
                })}
              </div>

              <button className="btn-secundario" onClick={escanearOtro}>
                Escanear otro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}