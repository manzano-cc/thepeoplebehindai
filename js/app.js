'use strict';

const CAMPOS = ['id', 'nombre', 'es_seudonimo', 'empresa', 'pais_empresa', 'sede_europa', 'tipo_org',
  'cargo_literal', 'area', 'nivel', 'contribucion_destacada', 'foto_url', 'foto_fuente', 'licencia_foto',
  'linkedin_url', 'web_personal', 'fuente_url', 'origen', 'estado', 'fecha_verificacion'];
const OBLIGATORIOS = ['id', 'nombre', 'empresa', 'pais_empresa', 'sede_europa', 'tipo_org', 'nivel', 'origen', 'estado'];
const AREAS = ['Research', 'Pretraining', 'Post-training', 'RL', 'Safety/Alignment', 'Interpretability', 'Evals',
  'Infra', 'Inference', 'Security', 'Product', 'GTM', 'Policy', 'Operations', 'Leadership'];
const VALIDOS = {
  nivel: ['1', '2', '3', '4', '5'],
  es_seudonimo: ['si', 'no'],
  sede_europa: ['si', 'no'],
  tipo_org: ['Frontier lab', 'Open source', 'Multimedia lab', 'Academia'],
  origen: ['lista_inicial', 'busqueda'],
  estado: ['verificado', 'sin_verificar', 'cargo_cambiado', 'ya_no_esta']
};


function contar(lista, campo) {
  const m = new Map();
  for (const p of lista) {
    const k = p[campo] === '' || p[campo] == null ? '(empty)' : p[campo];
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function revisarDatos(lista) {
  const problemas = [];
  const ids = new Set();
  for (const p of lista) {
    for (const c of CAMPOS) if (!(c in p)) problemas.push(`${p.id}: missing field ${c}`);
    for (const c of OBLIGATORIOS) if (p[c] === '' || p[c] == null) problemas.push(`${p.id}: ${c} is empty`);
    for (const [c, ok] of Object.entries(VALIDOS)) if (!ok.includes(String(p[c]))) problemas.push(`${p.id}: ${c} has an unexpected value "${p[c]}"`);
    if (p.area && !AREAS.includes(p.area)) problemas.push(`${p.id}: area not in the list "${p.area}"`);
    if (ids.has(p.id)) problemas.push(`${p.id}: duplicate id`);
    ids.add(p.id);
    if (p.foto_url && Number(p.nivel) > 3 && p.empresa !== 'Ai2') problemas.push(`${p.id}: photo at level ${p.nivel}`);
    if (p.foto_url && !p.licencia_foto) problemas.push(`${p.id}: photo without license`);
    if (p.sede_europa === 'si' && Number(p.nivel) > 3) problemas.push(`${p.id}: Europe rule (level ${p.nivel})`);
    for (const c of ['foto_url', 'linkedin_url', 'web_personal', 'fuente_url']) {
      if (p[c] && !/^https?:\/\//.test(p[c])) problemas.push(`${p.id}: ${c} is not an http(s) URL`);
    }
  }
  return problemas;
}


/* ---------- Vista principal ---------- */

const POR_PAGINA = 50;
const AVATAR = 'assets/avatar.svg';
const SIN_AREA = '__sin_area__';
const MOVIL = window.matchMedia('(max-width: 767px)');

const FILTROS = [
  { clave: 'empresa', param: 'company', titulo: 'Company', valor: p => p.empresa },
  { clave: 'pais', param: 'country', titulo: 'Country', valor: p => p.pais_empresa },
  { clave: 'tipo', param: 'type', titulo: 'Organization type', valor: p => p.tipo_org },
  { clave: 'nivel', param: 'level', titulo: 'Level', valor: p => p.nivel, etiqueta: v => `Level ${v}` },
  { clave: 'area', param: 'area', titulo: 'Area', valor: p => p.area || SIN_AREA, etiqueta: v => (v === SIN_AREA ? 'No area' : v) }
];

const ICONOS = {
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
  web: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 9h-3.05a15.7 15.7 0 0 0-1.38-5.02A8.03 8.03 0 0 1 18.93 11zM12 4.04c.83 1.2 1.48 2.53 1.91 4.96h-3.82c.43-2.43 1.08-3.76 1.91-4.96zM4.26 13h3.38c.07 1.2.25 2.35.55 3.42A8.03 8.03 0 0 1 4.26 13zm3.38-2H4.26a8.03 8.03 0 0 1 3.93-5.02C7.89 7.05 7.71 8.2 7.64 11zM12 19.96c-.83-1.2-1.48-2.53-1.91-4.96h3.82c-.43 2.43-1.08 3.76-1.91 4.96zM14.18 13H9.82a16 16 0 0 1 0-2h4.36a16 16 0 0 1 0 2zm.32 6.02A15.7 15.7 0 0 0 15.88 13h3.05a8.03 8.03 0 0 1-4.43 6.02z"/></svg>',
  fuente: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>'
};

/* Logos de organización (SVG en assets/logos). Las que no tienen logo se muestran solo con texto. */
const LOGOS = {
  'OpenAI': 'openai', 'Anthropic': 'anthropic', 'Google': 'google', 'Meta': 'meta', 'Amazon': 'amazon', 'Apple': 'apple',
  'Microsoft': 'microsoft', 'NVIDIA': 'nvidia', 'xAI': 'xai', 'Ai2': 'ai2', 'Hugging Face': 'hugging-face',
  'Mistral AI': 'mistral-ai', 'Midjourney': 'midjourney', 'ElevenLabs': 'elevenlabs', 'Suno': 'suno', 'Pika': 'pika',
  'Black Forest Labs': 'black-forest-labs', 'DeepL': 'deepl', 'Liquid AI': 'liquid-ai', 'EleutherAI': 'eleutherai',
  'Stanford': 'stanford',
  'Oxford': 'oxford',
  'Cambridge': 'cambridge',
  'H Company': 'h-company.png',
  'Thinking Machines Lab': 'thinking-machines-lab.png',
  'Runway': 'runway.png',
  'Luma AI': 'luma-ai',
  'Ideogram': 'ideogram',
  'Synthesia': 'synthesia.png',
  'Stability AI': 'stability-ai.png',
  'Kyutai': 'kyutai.png',
  'Prime Intellect': 'prime-intellect.png',
  'Humans&': 'humans.png',
  'Standard Intelligence': 'standard-intelligence',
  'ELLIS': 'ellis',
  'Berkeley': 'berkeley',
  'NYU': 'nyu',
  'Carnegie Mellon': 'carnegie-mellon.png',
  'Princeton': 'princeton.png',
  'Max Planck Tübingen': 'max-planck.png'
};

function logoEmpresa(empresa) {
  const f = LOGOS[empresa];
  if (!f) return el('span', 'logo-hueco'); // hueco para que el texto quede alineado
  const img = el('img', 'logo-empresa');
  img.src = `assets/logos/${f.includes('.') ? f : f + '.svg'}`;
  img.alt = '';
  img.width = 16;
  img.height = 16;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

const orden = { campo: 'nivel', dir: 1, porDefecto: true };
const filtros = { q: '', sel: { empresa: new Set(), pais: new Set(), tipo: new Set(), nivel: new Set(), area: new Set() } };
const dom = {};
let personas = [];
let porId = new Map();
let visibles = [];
let pintadas = 0;
let temporizador = null;
let observador = null;
let fichaActual = null;
let focoPrevio = null;

const formato = new Intl.NumberFormat('en-US');
const colador = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const fechaLarga = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

function normalizar(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* Miniaturas ligeras: se pide a la propia CDN una versión pequeña de la misma imagen */
function miniatura(url, grande) {
  try {
    const u = new URL(url);
    if (u.hostname === 'www.datocms-assets.com') {
      const t = grande ? 240 : 80;
      return `${url.split('?')[0]}?w=${t}&h=${t}&fit=crop`;
    }
    const m = u.pathname.match(/^\/wikipedia\/commons\/([0-9a-f]\/[0-9a-f]{2})\/(.+\.(?:jpe?g|png|gif))$/i);
    if (u.hostname === 'upload.wikimedia.org' && m) {
      return `${u.origin}/wikipedia/commons/thumb/${m[1]}/${m[2]}/${grande ? 250 : 120}px-${m[2]}`;
    }
  } catch (e) { /* URL no válida: se usa tal cual */ }
  return url;
}

function el(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto != null) n.textContent = texto;
  return n;
}

function crearFoto(p, clase, grande, ancho) {
  const img = el('img', clase);
  img.src = p.foto_url ? miniatura(p.foto_url, grande) : AVATAR;
  img.alt = p.foto_url ? `Photo of ${p.nombre}` : '';
  img.width = ancho;
  img.height = ancho;
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('error', () => {
    if (img.src.endsWith(AVATAR)) return;
    // Si falla la miniatura se prueba con la imagen original; si también falla, avatar
    if (p.foto_url && img.src !== p.foto_url) img.src = p.foto_url;
    else { img.src = AVATAR; img.alt = ''; }
  });
  return img;
}

function listaEnlaces(p) {
  return [
    ['linkedin', p.linkedin_url, 'LinkedIn'],
    ['web', p.web_personal, 'Personal website'],
    ['fuente', p.fuente_url && p.fuente_url !== p.linkedin_url ? p.fuente_url : '', 'Source']
  ].filter(e => e[1]);
}

/* ----- Estado en la URL ----- */

function leerURL() {
  const params = new URLSearchParams(location.search);
  filtros.q = params.get('q') || '';
  for (const f of FILTROS) {
    const crudo = params.get(f.param);
    filtros.sel[f.clave] = new Set(crudo ? crudo.split(',').filter(Boolean) : []);
  }
  const CAMPOS_ORDEN = { name: 'nombre', title: 'cargo_literal', company: 'empresa', area: 'area', level: 'nivel' };
  const o = CAMPOS_ORDEN[params.get('sort')];
  if (o) {
    orden.campo = o;
    orden.dir = params.get('dir') === 'desc' ? -1 : 1;
    orden.porDefecto = false;
  }
}

function escribirURL() {
  const params = new URLSearchParams();
  if (filtros.q.trim()) params.set('q', filtros.q.trim());
  for (const f of FILTROS) {
    const sel = filtros.sel[f.clave];
    if (sel.size) params.set(f.param, [...sel].join(','));
  }
  if (!orden.porDefecto) {
    params.set('sort', { nombre: 'name', cargo_literal: 'title', empresa: 'company', area: 'area', nivel: 'level' }[orden.campo]);
    if (orden.dir === -1) params.set('dir', 'desc');
  }
  const qs = params.toString();
  history.replaceState(null, '', (qs ? `?${qs}` : location.pathname) + location.hash);
}

function hayFiltros() {
  return filtros.q.trim() !== '' || FILTROS.some(f => filtros.sel[f.clave].size > 0);
}

function totalSeleccionados() {
  return FILTROS.reduce((n, f) => n + filtros.sel[f.clave].size, 0);
}

/* ----- Filtrado y orden ----- */

function valorOrden(p, campo) {
  return campo === 'nivel' ? Number(p.nivel) : p[campo];
}

function cmp(a, b, campo) {
  const x = valorOrden(a, campo);
  const y = valorOrden(b, campo);
  return campo === 'nivel' ? x - y : colador.compare(x, y);
}

function comparar(a, b) {
  if (!orden.porDefecto) {
    const c = orden.campo;
    const vacioA = !a[c];
    const vacioB = !b[c];
    // Los vacíos van siempre al final, sea cual sea el sentido
    if (vacioA !== vacioB) return vacioA ? 1 : -1;
    const r = cmp(a, b, c) * orden.dir;
    if (r !== 0) return r;
  }
  // Orden por defecto: nivel, luego los destacados (curados a mano, de más a menos conocido), luego empresa y nombre
  const da = a.destacado || 9999;
  const db = b.destacado || 9999;
  return cmp(a, b, 'nivel') || (orden.porDefecto ? da - db : 0) || cmp(a, b, 'empresa') || cmp(a, b, 'nombre');
}

function aplicar() {
  const q = normalizar(filtros.q).trim().split(/\s+/).filter(Boolean);
  visibles = personas.filter(p => {
    for (const f of FILTROS) {
      const s = filtros.sel[f.clave];
      if (s.size && !s.has(f.valor(p))) return false;
    }
    if (q.length && !q.every(t => p._busqueda.includes(t))) return false;
    return true;
  });
  visibles.sort(comparar);
  pintadas = 0;
  dom.cuerpo.replaceChildren();
  pintarMas();
  actualizarInterfaz();
  // Al filtrar, si el usuario ha bajado, vuelve al inicio de la tabla (no al principio de la página)
  const limite = dom.hero ? dom.hero.offsetTop + dom.hero.offsetHeight - dom.cabecera.offsetHeight : 0;
  if (window.scrollY > limite) window.scrollTo(0, Math.max(limite, 0));
}

/* ----- Filas ----- */

function crearFila(p) {
  const tr = el('tr');
  tr.tabIndex = 0;
  tr.dataset.id = p.id;
  tr.setAttribute('aria-label', `Open profile of ${p.nombre}`);

  const tdFoto = el('td', 'col-foto');
  const img = crearFoto(p, 'foto', false, 40);
  img.loading = 'lazy';
  tdFoto.append(img);

  const tdNivel = el('td', 'celda-nivel');
  tdNivel.append(el('span', `etiqueta-nivel nivel-${p.nivel}`, `Level ${p.nivel}`));

  const tdEnlaces = el('td', 'celda-enlaces');
  const caja = el('div', 'enlaces');
  for (const [tipo, url, nombre] of listaEnlaces(p)) {
    const a = el('a', 'enlace');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = nombre;
    a.setAttribute('aria-label', `${nombre}: ${p.nombre}`);
    a.innerHTML = ICONOS[tipo];
    caja.append(a);
  }
  tdEnlaces.append(caja);

  const tdEmpresa = el('td', 'empresa');
  const celdaEmpresa = el('span', 'empresa-celda');
  const logo = logoEmpresa(p.empresa);
  if (logo) celdaEmpresa.append(logo);
  celdaEmpresa.append(el('span', null, p.empresa));
  tdEmpresa.append(celdaEmpresa);

  tr.append(tdFoto, el('td', 'nombre', p.nombre), el('td', 'cargo', p.cargo_literal || '—'),
    tdEmpresa, el('td', 'area', p.area || '—'), tdNivel, tdEnlaces);
  return tr;
}

function pintarMas() {
  if (pintadas >= visibles.length) return;
  const frag = document.createDocumentFragment();
  const fin = Math.min(pintadas + POR_PAGINA, visibles.length);
  for (let i = pintadas; i < fin; i++) frag.append(crearFila(visibles[i]));
  dom.cuerpo.append(frag);
  pintadas = fin;
  // Re-observar el centinela: si sigue a la vista (pantallas altas) se vuelve a disparar y carga otras 50
  if (observador && pintadas < visibles.length) {
    observador.unobserve(dom.centinela);
    observador.observe(dom.centinela);
  }
}

/* ----- Interfaz ----- */

function actualizarInterfaz() {
  const n = visibles.length;
  dom.contador.textContent = `${formato.format(n)} ${n === 1 ? 'person' : 'people'}`;
  const filtrado = hayFiltros();
  dom.limpiar.hidden = !filtrado;
  dom.limpiarMovil.hidden = !filtrado;
  dom.vacio.hidden = n !== 0;
  dom.tabla.hidden = n === 0;
  for (const th of dom.tabla.querySelectorAll('th[data-orden]')) {
    if (th.dataset.orden === orden.campo) th.setAttribute('aria-sort', orden.dir === 1 ? 'ascending' : 'descending');
    else th.removeAttribute('aria-sort');
  }
  for (const d of dom.desplegables) {
    const total = filtros.sel[d.clave].size;
    d.raiz.classList.toggle('activo', total > 0);
    d.num.hidden = total === 0;
    d.num.textContent = String(total);
  }
  for (const inp of document.querySelectorAll('input[data-filtro]')) inp.checked = filtros.sel[inp.dataset.filtro].has(inp.value);
  const sel = totalSeleccionados();
  dom.abrirFiltros.classList.toggle('activo', sel > 0);
  dom.insignia.hidden = sel === 0;
  dom.insignia.textContent = String(sel);
  dom.verResultados.textContent = n === 1 ? 'Show 1 person' : `Show ${formato.format(n)} people`;
  dom.buscador.value = filtros.q;
  escribirURL();
}

function limpiarFiltros() {
  filtros.q = '';
  for (const f of FILTROS) filtros.sel[f.clave].clear();
  aplicar();
}

function datosFiltro(f) {
  const cuentas = new Map();
  for (const p of personas) {
    const v = f.valor(p);
    cuentas.set(v, (cuentas.get(v) || 0) + 1);
  }
  const valores = [...cuentas.keys()];
  if (f.clave === 'nivel') valores.sort((a, b) => Number(a) - Number(b));
  else {
    valores.sort((a, b) => {
      if (a === SIN_AREA) return 1;
      if (b === SIN_AREA) return -1;
      return colador.compare(a, b);
    });
  }
  return { cuentas, valores };
}

function crearOpciones(f, datos) {
  const frag = document.createDocumentFragment();
  for (const v of datos.valores) {
    const label = el('label', 'opcion');
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.value = v;
    inp.dataset.filtro = f.clave;
    const texto = el('span', 'opcion-texto');
    const lg = f.clave === 'empresa' ? logoEmpresa(v) : null;
    if (lg) texto.append(lg);
    texto.append(document.createTextNode(f.etiqueta ? f.etiqueta(v) : v));
    label.append(inp, texto, el('span', 'opcion-cuenta', formato.format(datos.cuentas.get(v))));
    frag.append(label);
  }
  return frag;
}

function crearDesplegable(f, datos) {
  const raiz = el('div', 'desplegable');
  const boton = el('button', 'desplegable-boton');
  boton.type = 'button';
  boton.id = `boton-${f.clave}`;
  boton.setAttribute('aria-haspopup', 'true');
  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-controls', `panel-${f.clave}`);
  const num = el('span', 'desplegable-num');
  num.hidden = true;
  boton.append(el('span', null, f.titulo), num);

  const panel = el('div', 'desplegable-panel');
  panel.id = `panel-${f.clave}`;
  panel.hidden = true;
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', `Filter by ${f.titulo.toLowerCase()}`);
  panel.append(crearOpciones(f, datos));

  boton.addEventListener('click', e => {
    e.stopPropagation();
    const abrir = panel.hidden;
    cerrarDesplegables();
    panel.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
  });
  panel.addEventListener('click', e => e.stopPropagation());

  raiz.append(boton, panel);
  dom.selectores.append(raiz);
  return { clave: f.clave, raiz, boton, panel, num };
}

function crearGrupoMovil(f, datos) {
  const fs = el('fieldset', 'grupo-filtro');
  fs.append(el('legend', null, f.titulo), crearOpciones(f, datos));
  dom.cuerpoFiltros.append(fs);
}

function cerrarDesplegables() {
  for (const d of dom.desplegables) {
    d.panel.hidden = true;
    d.boton.setAttribute('aria-expanded', 'false');
  }
}

/* ----- Capas: ficha y filtros móviles ----- */

function elementosEnfocables(contenedor) {
  return [...contenedor.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')]
    .filter(n => !n.closest('[hidden]') && n.offsetParent !== null);
}

function atraparTab(e, contenedor) {
  if (e.key !== 'Tab') return;
  const lista = elementosEnfocables(contenedor);
  if (!lista.length) { e.preventDefault(); contenedor.focus(); return; }
  const primero = lista[0];
  const ultimo = lista[lista.length - 1];
  if (e.shiftKey && (document.activeElement === primero || document.activeElement === contenedor)) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
}

function mostrarCapa(capa, claseAbierta) {
  focoPrevio = document.activeElement;
  dom.fondo.classList.add('visible');
  capa.classList.add(claseAbierta);
  document.body.classList.add('bloqueado');
  capa.focus({ preventScroll: true });
}

function ocultarCapa(capa, claseAbierta) {
  capa.classList.remove(claseAbierta);
  const otra = dom.ficha.classList.contains('abierta') || dom.panelFiltros.classList.contains('abierto');
  if (!otra) {
    dom.fondo.classList.remove('visible');
    document.body.classList.remove('bloqueado');
  }
  const destino = focoPrevio && document.contains(focoPrevio) ? focoPrevio : dom.buscador;
  focoPrevio = null;
  destino.focus({ preventScroll: true });
}

function renderFicha(p) {
  const c = dom.fichaContenido;
  c.replaceChildren();

  const cab = el('div', 'ficha-cabecera');
  const foto = crearFoto(p, 'ficha-foto', true, 120);
  const nombre = el('h2', 'ficha-nombre', p.nombre);
  nombre.id = 'ficha-nombre';
  cab.append(foto, nombre);
  if (p.cargo_literal) cab.append(el('p', 'ficha-cargo', p.cargo_literal));
  const pe = el('p', 'ficha-empresa');
  const lgf = logoEmpresa(p.empresa);
  if (lgf) pe.append(lgf);
  pe.append(document.createTextNode(p.empresa));
  cab.append(pe);
  const et = el('div', 'ficha-etiquetas');
  et.append(el('span', `etiqueta-nivel nivel-${p.nivel}`, `Level ${p.nivel}`));
  if (p.area) et.append(el('span', 'etiqueta-area', p.area));
  cab.append(et);
  c.append(cab);

  if (p.contribucion_destacada) {
    const b = el('div');
    b.append(el('h3', 'ficha-bloque-titulo', 'Featured contribution'), el('p', 'ficha-contribucion', p.contribucion_destacada));
    c.append(b);
  }

  const enlaces = listaEnlaces(p).filter(e => e[0] !== 'fuente');
  if (enlaces.length) {
    const b = el('div', 'ficha-enlaces');
    for (const [tipo, url, nom] of enlaces) {
      const a = el('a', 'boton-enlace');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = ICONOS[tipo];
      a.append(document.createTextNode(nom));
      b.append(a);
    }
    c.append(b);
  }

  const pie = el('div', 'ficha-pie');
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(p.fecha_verificacion) ? fechaLarga.format(new Date(`${p.fecha_verificacion}T00:00:00Z`)) : '';
  const linea = el('p', null, fecha ? `Verified on ${fecha}` : 'No verification date');
  if (p.fuente_url) {
    linea.append(document.createTextNode(' · '));
    const a = el('a', null, 'Source');
    a.href = p.fuente_url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    linea.append(a);
  }
  pie.append(linea);
  if (p.foto_url && p.foto_fuente) {
    const f = el('p', 'foto-credito', 'Photo: ');
    const lic = p.licencia_foto || '';
    const oficial = /^No explicit license/.test(lic);
    if (p.foto_autor) f.append(document.createTextNode(`${p.foto_autor}, `));
    const a = el('a', null, !lic ? 'source' : oficial ? 'official organization website' : lic);
    a.href = p.foto_fuente;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    f.append(a);
    if (!oficial && /commons\.wikimedia/.test(p.foto_fuente)) f.append(document.createTextNode(' (Wikimedia Commons)'));
    pie.append(f);
  }
  const cfg = window.WRAI_CONFIG || {};
  if (cfg.email) {
    const cuerpo = `Person: ${p.nombre}\nOrganization: ${p.empresa}\nID: ${p.id}\n\nWhat should be corrected or removed:\n`;
    const enlace = el('p', 'enlace-retirada');
    const a = el('a', null, 'Request correction or removal');
    a.href = `mailto:${cfg.email}?subject=${encodeURIComponent(`Correction or removal: ${p.nombre}`)}&body=${encodeURIComponent(cuerpo)}`;
    enlace.append(a);
    pie.append(enlace);
  }
  c.append(pie);
}

function abrirFicha(id, desdeHash) {
  const p = porId.get(id);
  if (!p) return;
  const yaAbierta = dom.ficha.classList.contains('abierta');
  fichaActual = id;
  renderFicha(p);
  document.title = `${p.nombre} | The People Behind AI`;
  if (!desdeHash) history.pushState(null, '', `${location.pathname}${location.search}#person/${encodeURIComponent(id)}`);
  if (!yaAbierta) mostrarCapa(dom.ficha, 'abierta');
  dom.ficha.scrollTop = 0;
}

function cerrarFicha(desdeHash) {
  if (!dom.ficha.classList.contains('abierta')) return;
  fichaActual = null;
  document.title = 'The People Behind AI';
  if (!desdeHash && location.hash.startsWith('#person/')) history.replaceState(null, '', location.pathname + location.search);
  ocultarCapa(dom.ficha, 'abierta');
}

function abrirFiltrosMovil() {
  dom.abrirFiltros.setAttribute('aria-expanded', 'true');
  mostrarCapa(dom.panelFiltros, 'abierto');
}

function cerrarFiltrosMovil() {
  if (!dom.panelFiltros.classList.contains('abierto')) return;
  dom.abrirFiltros.setAttribute('aria-expanded', 'false');
  ocultarCapa(dom.panelFiltros, 'abierto');
}

function sincronizarHash() {
  const m = location.hash.match(/^#person\/(.+)$/);
  if (m) abrirFicha(decodeURIComponent(m[1]), true);
  else cerrarFicha(true);
}

/* ----- Arranque ----- */

function iniciarInterfaz() {
  for (const id of ['contador', 'buscador', 'selectores', 'limpiar', 'tabla', 'cuerpo', 'vacio', 'centinela', 'fondo', 'ficha', 'panel-filtros']) {
    dom[id.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = document.getElementById(id);
  }
  dom.limpiarVacio = document.getElementById('limpiar-vacio');
  dom.limpiarMovil = document.getElementById('limpiar-movil');
  dom.abrirFiltros = document.getElementById('abrir-filtros');
  dom.insignia = document.getElementById('insignia-filtros');
  dom.cuerpoFiltros = document.getElementById('panel-filtros-cuerpo');
  dom.verResultados = document.getElementById('ver-resultados');
  dom.hero = document.getElementById('hero');
  dom.cabecera = document.querySelector('.cabecera');
  dom.fichaContenido = document.getElementById('ficha-contenido');
  dom.panelFiltros = document.getElementById('panel-filtros');

  dom.desplegables = FILTROS.map(f => {
    const datos = datosFiltro(f);
    crearGrupoMovil(f, datos);
    return crearDesplegable(f, datos);
  });

  document.addEventListener('change', e => {
    const inp = e.target;
    if (!(inp instanceof HTMLInputElement) || !inp.dataset.filtro) return;
    const s = filtros.sel[inp.dataset.filtro];
    if (inp.checked) s.add(inp.value); else s.delete(inp.value);
    aplicar();
  });

  dom.buscador.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      filtros.q = dom.buscador.value;
      aplicar();
    }, 200);
  });
  dom.limpiar.addEventListener('click', limpiarFiltros);
  dom.limpiarVacio.addEventListener('click', limpiarFiltros);
  dom.limpiarMovil.addEventListener('click', limpiarFiltros);
  dom.abrirFiltros.addEventListener('click', abrirFiltrosMovil);
  document.getElementById('cerrar-filtros').addEventListener('click', cerrarFiltrosMovil);
  dom.verResultados.addEventListener('click', cerrarFiltrosMovil);
  document.getElementById('ficha-cerrar').addEventListener('click', () => cerrarFicha(false));
  dom.fondo.addEventListener('click', () => { cerrarFicha(false); cerrarFiltrosMovil(); });
  document.addEventListener('click', cerrarDesplegables);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (dom.ficha.classList.contains('abierta')) cerrarFicha(false);
      else if (dom.panelFiltros.classList.contains('abierto')) cerrarFiltrosMovil();
      else cerrarDesplegables();
    }
    if (dom.ficha.classList.contains('abierta')) atraparTab(e, dom.ficha);
    else if (dom.panelFiltros.classList.contains('abierto')) atraparTab(e, dom.panelFiltros);
  });

  // Fila: clic o Enter/Espacio abren la ficha (los enlaces de la fila siguen funcionando solos)
  dom.cuerpo.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    const tr = e.target.closest('tr');
    if (tr) abrirFicha(tr.dataset.id, false);
  });
  dom.cuerpo.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'TR') {
      e.preventDefault();
      abrirFicha(e.target.dataset.id, false);
    }
  });

  for (const th of dom.tabla.querySelectorAll('th[data-orden]')) {
    th.querySelector('button').addEventListener('click', () => {
      const campo = th.dataset.orden;
      if (!orden.porDefecto && orden.campo === campo) orden.dir = -orden.dir;
      else { orden.campo = campo; orden.dir = 1; }
      orden.porDefecto = false;
      aplicar();
    });
  }

  observador = new IntersectionObserver(entradas => {
    if (entradas.some(e => e.isIntersecting)) pintarMas();
  }, { rootMargin: '400px' });
  observador.observe(dom.centinela);

  window.addEventListener('hashchange', sincronizarHash);
  window.addEventListener('popstate', sincronizarHash);
  const ajustarPlaceholder = () => { dom.buscador.placeholder = MOVIL.matches ? 'Search' : 'Search by name, company or title'; };
  ajustarPlaceholder();
  MOVIL.addEventListener('change', () => { cerrarFiltrosMovil(); cerrarDesplegables(); ajustarPlaceholder(); });
}

async function cargar() {
  const r = await fetch('data/personas.json');
  if (!r.ok) throw new Error(`Could not load personas.json (${r.status})`);
  personas = await r.json();
  for (const p of personas) {
    p._busqueda = normalizar(`${p.nombre} ${p.empresa} ${p.cargo_literal}`);
    porId.set(p.id, p);
  }
  const problemas = revisarDatos(personas);
  if (problemas.length) console.warn(`Data check: ${problemas.length} problems`, problemas.slice(0, 50));
  const heroTotal = document.getElementById('hero-total');
  if (heroTotal) heroTotal.textContent = formato.format(personas.length);
  leerURL();
  iniciarInterfaz();
  aplicar();
  sincronizarHash();
}

cargar().catch(e => {
  console.error(e);
  document.getElementById('contador').textContent = 'Could not load the data';
});
