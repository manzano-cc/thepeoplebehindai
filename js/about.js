'use strict';

(function () {
  const cfg = window.WRAI_CONFIG || {};
  const fechaLarga = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
  const formato = new Intl.NumberFormat('en-US');

  for (const contacto of document.querySelectorAll('.js-contacto')) {
    if (!cfg.email) break;
    contacto.href = `mailto:${cfg.email}?subject=${encodeURIComponent('The People Behind AI: correction or removal')}`;
    contacto.textContent = cfg.email;
  }

  for (const plazo of document.querySelectorAll('.js-plazo')) {
    if (cfg.plazoRespuesta) plazo.textContent = cfg.plazoRespuesta;
  }

  const ultima = document.getElementById('ultima-actualizacion');
  if (ultima && /^\d{4}-\d{2}-\d{2}$/.test(cfg.ultimaActualizacion || '')) {
    ultima.textContent = fechaLarga.format(new Date(`${cfg.ultimaActualizacion}T00:00:00Z`));
  }

  const total = document.getElementById('total-personas');
  if (total) {
    fetch('data/personas.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(d => { total.textContent = formato.format(d.length); })
      .catch(() => { /* se queda el texto genérico */ });
  }
})();

(function () {
  const cab = document.querySelector('.cabecera');
  if (!cab) return;
  const act = () => cab.classList.toggle('con-fondo', window.scrollY > 8);
  window.addEventListener('scroll', act, { passive: true });
  act();
})();
