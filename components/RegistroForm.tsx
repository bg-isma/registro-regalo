"use client";

import Link from "next/link";
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
  ok: "Registro hecho. Te enviaremos el conocimiento a esta dirección.",
  sent: "Te hemos enviado un código. Revisa la bandeja y el spam.",
  duplicate: "Este email ya está registrado.",
  invalid: "Revisa el nombre, la dirección, el email y la casilla.",
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
  "mt-2 w-full border-0 border-b border-line bg-transparent py-3 text-base text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-ink";

const boton =
  "mt-8 bg-ink px-7 py-3.5 text-[0.68rem] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-[var(--yellow)] hover:text-ink disabled:cursor-wait disabled:opacity-60";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const TIPOS = [
  { id: "Oficio", texto: "Afilar un cuchillo, coser una tela, encender un horno." },
  { id: "Lectura", texto: "Tres textos, elegidos para empezar por uno." },
  { id: "Mirada", texto: "Una carta para leer un lugar al llegar." },
];

function camposRellenos(form: HTMLFormElement) {
  const data = new FormData(form);
  return ["nombre", "calle", "codigoPostal", "provincia", "email"].every(
    (campo) => String(data.get(campo) || "").trim().length > 0,
  );
}

export function RegistroForm() {
  const [aviso, setAviso] = useState("");
  const [tono, setTono] = useState<Tono>("error");
  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState<"datos" | "codigo">("datos");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [tipo, setTipo] = useState("");
  const [campos, setCampos] = useState(false);
  const [errores, setErrores] = useState({ nombre: "", provincia: "", email: "", cp: "" });
  const caja = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const listo = campos && tipo !== "";

  function revisar(form: HTMLFormElement) {
    const data = new FormData(form);
    const nombre = String(data.get("nombre") || "").trim();
    const provincia = String(data.get("provincia") || "").trim();
    const correo = String(data.get("email") || "").trim();
    const cp = String(data.get("codigoPostal") || "").trim();
    setCampos(camposRellenos(form));
    setErrores({
      nombre:
        nombre.length > 0 && (nombre.length < 5 || !nombre.includes(" "))
          ? "Escribe el nombre y los apellidos."
          : "",
      provincia: provincia.length === 1 ? "Escribe la provincia." : "",
      email:
        correo.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
          ? "Escribe un email válido, con @ y dominio."
          : "",
      cp: cp.length > 0 && !/^\d{5}$/.test(cp) ? "El código postal son 5 números." : "",
    });
  }

  useEffect(() => {
    if (!listo || !SITE_KEY) return;
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
    } else if (!document.querySelector("script[data-recaptcha='1']")) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit&hl=es";
      script.async = true;
      script.dataset.recaptcha = "1";
      script.onload = () => window.grecaptcha?.ready(montar);
      document.body.appendChild(script);
    }

    return () => {
      cancelado = true;
      widget.current = null;
      setCaptcha("");
    };
  }, [listo]);

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
    if (!tipo) {
      setTono("error");
      setAviso("Elige un conocimiento.");
      return;
    }
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
        calle: String(data.get("calle") || ""),
        codigoPostal: String(data.get("codigoPostal") || ""),
        provincia: String(data.get("provincia") || ""),
        tipo,
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
        setTipo("");
        setCampos(false);
        setErrores({ nombre: "", provincia: "", email: "", cp: "" });
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

  const color = tono === "error" ? "text-orange" : "text-ink";

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
        className="mt-8 w-full"
        hidden={paso !== "datos"}
        noValidate
        onInput={(event) => revisar(event.currentTarget)}
        onChange={(event) => revisar(event.currentTarget)}
        onSubmit={onSolicitar}
      >
      <fieldset>
        <legend className="mb-3 text-[0.72rem] uppercase tracking-[0.18em] text-muted">
          Elige un conocimiento
        </legend>
        <div className="grid items-stretch gap-3 sm:grid-cols-3">
        {TIPOS.map((item) => {
          const activo = tipo === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={activo}
              className={`flex h-full w-full flex-col items-start justify-start border px-4 py-4 text-left transition-colors ${
                activo ? "border-ink marca" : "border-line bg-transparent hover:border-ink"
              }`}
              onClick={() => setTipo(item.id)}
            >
              <span className="tipo-display block text-3xl uppercase leading-none">{item.id}</span>
              <span className="mt-3 block text-xs leading-relaxed">{item.texto}</span>
            </button>
          );
        })}
        </div>
      </fieldset>
      <label className="mt-12 block">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Nombre y apellidos</span>
        <input
          className={campo}
          name="nombre"
          type="text"
          required
          minLength={5}
          maxLength={80}
          autoComplete="name"
          placeholder="Nombre y apellidos"
        />
        {errores.nombre ? <p className="mt-2 text-xs leading-relaxed text-orange">{errores.nombre}</p> : null}
      </label>

      <label className="mt-6 block">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Calle</span>
        <input
          className={campo}
          name="calle"
          type="text"
          required
          minLength={5}
          maxLength={120}
          autoComplete="street-address"
          placeholder="Calle, número, piso"
        />
      </label>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Código postal</span>
          <input
            className={campo}
            name="codigoPostal"
            type="text"
            inputMode="numeric"
            required
            minLength={5}
            maxLength={5}
            pattern="[0-9]{5}"
            autoComplete="postal-code"
            placeholder="35001"
          />
          {errores.cp ? <p className="mt-2 text-xs leading-relaxed text-orange">{errores.cp}</p> : null}
        </label>
        <label className="block">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Provincia</span>
          <input
            className={campo}
            name="provincia"
            type="text"
            required
            minLength={2}
            maxLength={60}
            autoComplete="address-level1"
            placeholder="Las Palmas"
          />
          {errores.provincia ? (
            <p className="mt-2 text-xs leading-relaxed text-orange">{errores.provincia}</p>
          ) : null}
        </label>
      </div>

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
        {errores.email ? <p className="mt-2 text-xs leading-relaxed text-orange">{errores.email}</p> : null}
      </label>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-sm items-start gap-3 text-sm leading-relaxed text-ink">
          <input className="mt-1 size-4 shrink-0 accent-ink" name="acepta" type="checkbox" required />
          <span>
            He leído la <Link className="underline" href="/privacidad">política de privacidad</Link> y acepto recibir el código en este email y el conocimiento en esta dirección.
          </span>
        </label>

        {listo && SITE_KEY ? <div className="min-h-[78px] shrink-0 self-end sm:self-center" ref={caja} /> : null}
        {listo && !SITE_KEY ? (
          <p className="max-w-xs text-sm leading-relaxed text-orange sm:text-right">
            Falta la clave de sitio de reCAPTCHA. Pégala en .env.local.
          </p>
        ) : null}
      </div>

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
