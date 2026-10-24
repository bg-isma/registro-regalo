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
  | "soon"
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
  invalid: "Revisa el nombre, la dirección, el teléfono, el email y la casilla.",
  captcha: "Confirma que no eres un robot.",
  config: "Falta la clave secreta de reCAPTCHA en Apps Script.",
  code: "El código no coincide.",
  expired: "El código ha caducado. Pide otro.",
  wait: "Espera un minuto antes de pedir otro código.",
  soon: "Espera un momento y vuelve a enviar el formulario.",
  quota: "Hoy no podemos enviar más códigos. Inténtalo mañana.",
  error: "No se ha podido completar. Inténtalo otra vez.",
  missing: "Falta la URL de Google en .env.local.",
};

const campo =
  "mt-2 w-full border-0 border-b border-line bg-transparent py-3 text-base text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-ink";

const boton =
  "order-3 mt-5 bg-ink px-7 py-3.5 text-[0.68rem] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-[var(--yellow)] hover:text-ink disabled:cursor-wait disabled:opacity-60 lg:col-span-7 lg:col-start-1 lg:justify-self-start";

const enColumna = "order-3 lg:col-span-7 lg:col-start-1";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const TIPOS = [
  { id: "Oficio", texto: "Afilar un cuchillo, coser una tela, encender un horno." },
  { id: "Lectura", texto: "Tres textos, elegidos para empezar por uno." },
  { id: "Mirada", texto: "Una carta para leer un lugar al llegar." },
];

function telefonoValido(valor: string) {
  let texto = valor.replace(/[\s.-]/g, "");
  if (texto.startsWith("+34")) texto = texto.slice(3);
  else if (texto.startsWith("0034")) texto = texto.slice(4);
  return /^[6789]\d{8}$/.test(texto);
}

function quitarEnlace() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("t")) return;
  url.searchParams.delete("t");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

function casillaMarcada(form: HTMLFormElement) {
  const casilla = form.elements.namedItem("acepta");
  return casilla instanceof HTMLInputElement && casilla.checked;
}

function camposRellenos(form: HTMLFormElement) {
  const data = new FormData(form);
  return ["nombre", "calle", "codigoPostal", "provincia", "email", "telefono"].every(
    (campo) => String(data.get(campo) || "").trim().length > 0,
  );
}

export function RegistroForm() {
  const [aviso, setAviso] = useState("");
  const [tono, setTono] = useState<Tono>("error");
  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState<"datos" | "codigo" | "abriendo">("datos");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [tipo, setTipo] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [campos, setCampos] = useState(false);
  const [errores, setErrores] = useState({ nombre: "", provincia: "", email: "", cp: "", telefono: "" });
  const caja = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const abierto = useRef(Date.now());
  const listo = campos && tipo !== "" && acepta;

  function revisar(form: HTMLFormElement) {
    const data = new FormData(form);
    const nombre = String(data.get("nombre") || "").trim();
    const provincia = String(data.get("provincia") || "").trim();
    const correo = String(data.get("email") || "").trim();
    const cp = String(data.get("codigoPostal") || "").trim();
    const telefono = String(data.get("telefono") || "").trim();
    setCampos(camposRellenos(form));
    setAcepta(casillaMarcada(form));
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
      telefono:
        telefono.length > 0 && !telefonoValido(telefono) ? "Escribe un teléfono de 9 números." : "",
    });
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("t") || "";
    if (!/^[0-9a-f-]{36}$/i.test(token)) return;
    const endpoint = process.env.NEXT_PUBLIC_REGISTRO_URL;
    if (!endpoint) {
      setTono("error");
      setAviso(textos.missing);
      return;
    }
    let cancelado = false;
    setPaso("abriendo");
    fetch(endpoint, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "abrir", token }),
    })
      .then((respuesta) => respuesta.text())
      .then((texto) => JSON.parse(texto) as { ok?: boolean; email?: string })
      .then((parsed) => {
        if (cancelado) return;
        if (parsed?.ok && parsed.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email)) {
          setEmail(parsed.email);
          setPaso("codigo");
          return;
        }
        quitarEnlace();
        setPaso("datos");
        setTono("error");
        setAviso("Este enlace ha caducado. Pide el código otra vez.");
      })
      .catch(() => {
        if (cancelado) return;
        setPaso("datos");
        setTono("error");
        setAviso(textos.error);
      });
    return () => {
      cancelado = true;
    };
  }, []);

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
    return JSON.parse(await respuesta.text()) as { ok?: boolean; pending?: boolean; code?: string; email?: string };
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
      code === "soon" ||
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
    if (!casillaMarcada(form)) {
      setTono("error");
      setAviso("Acepta la política de privacidad para enviar el formulario.");
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
    if (String(data.get("comentarios_extra") || "").trim()) {
      setEmail(String(data.get("email") || "").trim().toLowerCase());
      setPaso("codigo");
      mostrar("sent", "info");
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
        telefono: String(data.get("telefono") || ""),
        tipo,
        email: correo,
        acepta: data.get("acepta") === "on",
        captcha,
        comentarios_extra: String(data.get("comentarios_extra") || ""),
        transcurrido: Date.now() - abierto.current,
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
        setAcepta(false);
        setCampos(false);
        setErrores({ nombre: "", provincia: "", email: "", cp: "", telefono: "" });
        setCaptcha("");
        if (window.grecaptcha && widget.current !== null) window.grecaptcha.reset(widget.current);
        quitarEnlace();
        setPaso("datos");
        mostrar("ok", "ok");
        return;
      }
      avisoDe(parsed.code);
      if (parsed.code === "expired") {
        quitarEnlace();
        setPaso("datos");
      }
    } catch {
      mostrar("error", "error");
    } finally {
      setEnviando(false);
    }
  }

  const color = tono === "error" ? "text-orange" : "text-ink";

  return (
    <>
      {paso === "codigo" ? (
      <form
        className={`${enColumna} mt-5 max-w-md`}
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
            autoFocus
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
            quitarEnlace();
            setPaso("datos");
            setCaptcha("");
            setAviso("");
            if (window.grecaptcha && widget.current !== null) window.grecaptcha.reset(widget.current);
          }}
        >
          Usar otro email
        </button>
      </form>
      ) : null}

      {paso === "abriendo" ? (
        <p className={`${enColumna} mt-5 text-base leading-relaxed text-ink`}>Abriendo el código…</p>
      ) : null}

      <form
        ref={formulario}
        className="contents"
        hidden={paso !== "datos"}
        noValidate
        onInput={(event) => revisar(event.currentTarget)}
        onChange={(event) => revisar(event.currentTarget)}
        onSubmit={onSolicitar}
      >
      <fieldset className={`${enColumna} mt-5`}>
        <p className="trampa" aria-hidden="true">
          <label>
            Comentarios extra
            <input name="comentarios_extra" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </p>
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
      <label className={`${enColumna} mt-6 block`}>
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

      <label className={`${enColumna} mt-4 block`}>
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

      <div className={`${enColumna} mt-4 grid gap-4 sm:grid-cols-2`}>
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

      <label className={`${enColumna} mt-4 block`}>
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

      <label className={`${enColumna} mt-4 block`}>
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Teléfono</span>
        <input
          className={campo}
          name="telefono"
          type="tel"
          inputMode="tel"
          required
          maxLength={16}
          autoComplete="tel"
          placeholder="612 345 678"
        />
        {errores.telefono ? <p className="mt-2 text-xs leading-relaxed text-orange">{errores.telefono}</p> : null}
      </label>

      <div className="order-3 mt-5 grid grid-cols-1 gap-4 lg:col-span-12 lg:col-start-1 lg:grid-cols-12 lg:items-center lg:gap-x-8">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-ink lg:col-span-7">
          <input className="mt-1 size-4 shrink-0 accent-ink" name="acepta" type="checkbox" required />
          <span>
            He leído la <Link className="underline" href="/privacidad">política de privacidad</Link> y acepto recibir el código en este email y el conocimiento en esta dirección.
          </span>
        </label>

        {listo && SITE_KEY ? (
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <div className="min-h-[78px]" ref={caja} />
          </div>
        ) : null}
        {listo && !SITE_KEY ? (
          <p className="text-center text-sm leading-relaxed text-orange lg:col-span-5 lg:text-right">
            Falta la clave de sitio de reCAPTCHA. Pégala en .env.local.
          </p>
        ) : null}
      </div>

      <button className={boton} type="submit" disabled={enviando}>
        {enviando ? "Enviando código…" : "Enviar código"}
      </button>

      </form>

      <p className={`${enColumna} mt-4 min-h-6 max-w-md text-sm leading-relaxed ${color}`} role="status">
        {aviso}
      </p>
    </>
  );
}
