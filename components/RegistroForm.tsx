"use client";

import { useEffect, useRef, useState } from "react";

type Codigo =
  | "ok"
  | "duplicate"
  | "invalid"
  | "error"
  | "missing"
  | "captcha"
  | "config"
  | "code"
  | "expired"
  | "wait"
  | "quota"
  | "sent";

type Tono = "ok" | "info" | "error";

type Grecaptcha = {
  ready: (callback: () => void) => void;
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const textos: Record<Codigo, string> = {
  ok: "Registro hecho. Te escribiremos a este email con el regalo.",
  sent: "Te hemos enviado un código. Revisa la bandeja y el spam.",
  duplicate: "Este email ya está registrado.",
  invalid: "Revisa el nombre, el email y la casilla de aceptación.",
  captcha: "Confirma que no eres un robot.",
  config: "Falta la clave secreta de reCAPTCHA en Apps Script.",
  code: "El código no coincide.",
  expired: "El código ha caducado. Pide otro.",
  wait: "Espera un minuto antes de pedir otro código.",
  quota: "Hoy no podemos enviar más códigos. Inténtalo mañana.",
  error: "No se ha podido completar. Inténtalo otra vez.",
  missing: "Falta la URL de Google en .env.local.",
};

const campo =
  "mt-2 w-full border-0 border-b border-ink/25 bg-transparent py-3 text-lg text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-wax";

const boton =
  "mt-8 bg-wax px-7 py-3.5 text-sm tracking-wide text-paper transition-colors hover:bg-wax-deep disabled:cursor-wait disabled:opacity-60";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export function RegistroForm() {
  const [aviso, setAviso] = useState("");
  const [tono, setTono] = useState<Tono>("error");
  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState<"datos" | "codigo">("datos");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const caja = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !caja.current) return;
    let cancelado = false;

    function montar() {
      if (cancelado || !caja.current || !window.grecaptcha || widget.current !== null) return;
      widget.current = window.grecaptcha.render(caja.current, {
        sitekey: SITE_KEY || "",
        callback: (token) => setCaptcha(token),
        "expired-callback": () => setCaptcha(""),
        "error-callback": () => setCaptcha(""),
      });
    }

    if (window.grecaptcha) {
      window.grecaptcha.ready(montar);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit&hl=es";
    script.async = true;
    script.onload = () => window.grecaptcha?.ready(montar);
    document.body.appendChild(script);

    return () => {
      cancelado = true;
    };
  }, []);

  function mostrar(codigo: Codigo, siguiente: Tono) {
    setTono(siguiente);
    setAviso(textos[codigo]);
  }

  async function post(body: Record<string, unknown>) {
    const endpoint = process.env.NEXT_PUBLIC_REGISTRO_URL;
    if (!endpoint) {
      mostrar("missing", "error");
      return null;
    }
    const respuesta = await fetch(endpoint, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    return JSON.parse(await respuesta.text()) as { ok?: boolean; pending?: boolean; code?: string };
  }

  function avisoDe(code: string | undefined) {
    if (
      code === "duplicate" ||
      code === "invalid" ||
      code === "captcha" ||
      code === "config" ||
      code === "code" ||
      code === "expired" ||
      code === "wait" ||
      code === "quota" ||
      code === "error"
    ) {
      mostrar(code, "error");
      return;
    }
    mostrar("error", "error");
  }

  async function onSolicitar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!SITE_KEY) {
      setTono("error");
      setAviso("Falta la clave de sitio de reCAPTCHA. Pégala en .env.local.");
      return;
    }
    if (!captcha) {
      mostrar("captcha", "error");
      return;
    }

    setEnviando(true);
    setAviso("");
    try {
      const correo = String(data.get("email") || "");
      const parsed = await post({
        action: "solicitar",
        nombre: String(data.get("nombre") || ""),
        email: correo,
        acepta: data.get("acepta") === "on",
        captcha,
      });
      if (!parsed) return;
      if (parsed.ok && parsed.pending) {
        setEmail(correo.trim().toLowerCase());
        setPaso("codigo");
        mostrar("sent", "info");
        return;
      }
      avisoDe(parsed.code);
      if (window.grecaptcha && widget.current !== null) {
        window.grecaptcha.reset(widget.current);
        setCaptcha("");
      }
    } catch {
      mostrar("error", "error");
    } finally {
      setEnviando(false);
    }
  }

  async function onConfirmar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setEnviando(true);
    setAviso("");
    try {
      const parsed = await post({
        action: "confirmar",
        email,
        codigo: String(data.get("codigo") || ""),
      });
      if (!parsed) return;
      if (parsed.ok) {
        formulario.current?.reset();
        setCaptcha("");
        if (window.grecaptcha && widget.current !== null) window.grecaptcha.reset(widget.current);
        setPaso("datos");
        mostrar("ok", "ok");
        return;
      }
      avisoDe(parsed.code);
      if (parsed.code === "expired") setPaso("datos");
    } catch {
      mostrar("error", "error");
    } finally {
      setEnviando(false);
    }
  }

  const color = tono === "error" ? "text-wax" : "text-ink";

  return (
    <>
      <form
        className="mt-10 max-w-md"
        hidden={paso !== "codigo"}
        onSubmit={onConfirmar}
      >
        <p className="text-base leading-relaxed text-ink">
          Escribe el código de 6 cifras que hemos enviado a {email}.
        </p>
        <label className="mt-6 block">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Código</span>
          <input
            className={`${campo} tracking-[0.4em]`}
            name="codigo"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            minLength={6}
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="000000"
          />
        </label>
        <button className={boton} type="submit" disabled={enviando}>
          {enviando ? "Comprobando…" : "Confirmar email"}
        </button>
        <button
          className="mt-4 block text-sm text-muted underline-offset-4 hover:underline"
          type="button"
          onClick={() => {
            setPaso("datos");
            setCaptcha("");
            setAviso("");
            if (window.grecaptcha && widget.current !== null) window.grecaptcha.reset(widget.current);
          }}
        >
          Usar otro email
        </button>
      </form>

      <form
        ref={formulario}
        className="mt-10 max-w-md"
        hidden={paso !== "datos"}
        onSubmit={onSolicitar}
      >
      <label className="block">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Nombre</span>
        <input
          className={campo}
          name="nombre"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="Tu nombre"
        />
      </label>

      <label className="mt-6 block">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Email</span>
        <input
          className={campo}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="tu@correo.com"
        />
      </label>

      <label className="mt-7 flex items-start gap-3 text-sm leading-relaxed text-ink">
        <input className="mt-1 size-4 accent-wax" name="acepta" type="checkbox" required />
        <span>Acepto recibir el código y el regalo en este email.</span>
      </label>

      {SITE_KEY ? (
        <div className="mt-7 min-h-[78px]" ref={caja} />
      ) : (
        <p className="mt-7 text-sm leading-relaxed text-wax">
          Falta la clave de sitio de reCAPTCHA. Pégala en .env.local.
        </p>
      )}

      <button className={boton} type="submit" disabled={enviando}>
        {enviando ? "Enviando código…" : "Enviar código"}
      </button>

      </form>

      <p className={`mt-4 min-h-6 max-w-md text-sm leading-relaxed ${color}`} role="status">
        {aviso}
      </p>
    </>
  );
}
