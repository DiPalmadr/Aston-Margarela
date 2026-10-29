// netlify/functions/notificar-pedido.js
// Generado automáticamente por el Landing Builder (tabla de precios y
// configuración de envío, distancia y número de pedido incluidas).
// IMPORTANTE: configura TELEGRAM_TOKEN y TELEGRAM_CHAT_ID como variables de
// entorno en Netlify (Site configuration -> Environment variables).
// Nunca escribas el token directamente aquí.

const PRECIOS = {
  "Pza-astYMar-fam": { nombre: "Aston & Margarela — Pizza familiar", precio: 24.99 },
  "Pza-astYMar-med": { nombre: "Aston & Margarela — Pizza Mediana", precio: 18.5 },
  "pza-itamia-fam": { nombre: "Italia Mia — Pizza familiar", precio: 15.99 },
  "pza-itamia-med": { nombre: "Italia Mia — Pizza Mediana", precio: 11.5 },
  "pza-itamia-peq": { nombre: "Italia Mia — Pizza personal", precio: 6.99 },
  "Pza-Mar-fam": { nombre: "Margherita — Pizza familiar", precio: 14.99 },
  "Pza-Mar-med": { nombre: "Margherita — Pizza Mediana", precio: 10.5 },
  "Pza-Mar-peq": { nombre: "Margherita — Pizza personal", precio: 6.99 },
  "Pza-bur-fam": { nombre: "Burrata e Crudo — Pizza familiar", precio: 16.99 },
  "Pza-bur-med": { nombre: "Burrata e Crudo — Pizza Mediana", precio: 12.5 },
  "Pza-bur-peq": { nombre: "Burrata e Crudo — Pizza personal", precio: 8.99 },
  "SKU-BUWNQP2": { nombre: "Prosciutto al Tartufo — Pizza familiar", precio: 17.99 },
  "SKU-K2NBEEO": { nombre: "Prosciutto al Tartufo — Pizza Mediana", precio: 13.5 },
  "SKU-K2NR1BG": { nombre: "Prosciutto al Tartufo — Pizza personal", precio: 8.99 },
  "SKU-DPGOYPA": { nombre: "Prosciutto arrosto e funghi — Pizza familiar", precio: 15.99 },
  "SKU-K2N7PIJ": { nombre: "Prosciutto arrosto e funghi — Pizza Mediana", precio: 11.5 },
  "SKU-K2NGZYY": { nombre: "Prosciutto arrosto e funghi — Pizza personal", precio: 7.99 },
  "SKU-HTOGCXL": { nombre: "Diavola — Pizza familiar", precio: 14.99 },
  "SKU-K2NJDTL": { nombre: "Diavola — Pizza Mediana", precio: 10.5 },
  "SKU-K2NXYP4": { nombre: "Diavola — Pizza personal", precio: 6.99 },
  "SKU-LA2LMS1": { nombre: "Fior Di Latte", precio: 3.99 },
  "SKU-O77MGDC": { nombre: "Crema Di Grana Padano al Tartufo", precio: 4.5 },
  "SKU-P6PRRMH": { nombre: "Láminas de Grana Padano", precio: 2.99 },
  "SKU-REWL8KZ": { nombre: "Mozzarella", precio: 1.99 },
  "SKU-X4RUYGR": { nombre: "Pizza Familiar de 4 ingredientes + botella de vino", precio: 28.99 },
  "SKU-Z64XNOP": { nombre: "Pizza Familiar de 2 ingredientes + botella de vino", precio: 25.99 },
  "SKU-7DY81TE": { nombre: "Tablita de jamón crudo con albahaca", precio: 13.5 },
  "SKU-8FQYFL2": { nombre: "Palitos de mozzarella (6 unidades) con salsa pomodoro", precio: 2.99 },
  "SKU-9RPX08U": { nombre: "Rosetta con queso (6 unidades)", precio: 3.75 },
  "SKU-AUDHY86": { nombre: "Setas de hongos con aceitunas negras", precio: 7 },
  "SKU-SMUPWHE": { nombre: "Tinto de verano ", precio: 5.99 },
  "SKU-VOOV92K": { nombre: "Tinto de verano con naranja", precio: 5.99 },
  "SKU-RBZLNWS": { nombre: "Gaseosa de naranja con fruta", precio: 1.99 },
  "SKU-X7NU1BD": { nombre: "Tinto de verano con frutas", precio: 5.99 },
  "SKU-YUE79QN": { nombre: "Calimocho", precio: 4.99 },
  "SKU-0WX3JL0": { nombre: "Vino tinto", precio: 4.99 },
  "SKU-2FY6HKN": { nombre: "Gaseosa negra con o sin limón", precio: 1.99 },
  "SKU-4WQROV3": { nombre: "Agua con o sin limón", precio: 1.99 }
};

// Config. de envío (igual a la que tienes en el panel del Landing Builder).
// Si cambias el valor del envío o el mínimo para envío gratis ahí, vuelve a
// generar esta carpeta para que quede sincronizado.
const ENVIO = {
  "enabled": false,
  "amount": 0,
  "freeEnabled": false,
  "freeMin": 0
};

// Distancia y costo ESTIMADO (línea recta entre tu restaurante y la
// ubicación que compartió el cliente). Es solo una referencia: el costo
// real puede ser menor o mayor.
const RESTAURANTE = {
  "enabled": false,
  "lat": -0.305967,
  "lng": -78.470289,
  "costoPorKm": 3
};

// Si es true, cada pedido recibe un número consecutivo guardado en Netlify
// Blobs (requiere el archivo package.json que viene en esta carpeta).
const SECUENCIAL = true;

// Primer número de pedido. Si ya hay pedidos con un número mayor, el contador
// sigue desde el último (nunca repite ni retrocede).
const PEDIDO_INICIAL = 17500;

function calcularEnvio(subtotal) {
  if (!ENVIO.enabled) return 0;
  if (ENVIO.freeEnabled && subtotal >= ENVIO.freeMin) return 0;
  return ENVIO.amount;
}

// Limpia texto que viene del navegador (quita saltos/caracteres raros y acorta).
function limpiar(t, max) {
  const s = String(t == null ? '' : t);
  let out = '';
  for (let i = 0; i < s.length && out.length < max; i++) {
    const c = s.charCodeAt(i);
    out += (c < 32 || c === 127) ? ' ' : s.charAt(i);
  }
  return out.trim();
}

// Distancia en línea recta (fórmula de Haversine), en km.
function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = function (d) { return d * Math.PI / 180; };
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Número de pedido consecutivo con Netlify Blobs.
// Cada número se "reserva" creando una llave nueva (n1, n2, n3...) que solo
// puede crearse UNA vez (onlyIfNew), así dos pedidos simultáneos nunca
// reciben el mismo número. La llave "ultimo" es solo una pista para empezar
// cerca (puede estar un poco atrasada; no afecta la exactitud).
async function siguienteNumeroPedido(event) {
  const blobs = require('@netlify/blobs');
  const opciones = { name: 'pedidos' };
  if (process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN) {
    // Opcional: credenciales manuales (solo si el modo automático no funciona)
    opciones.siteID = process.env.BLOBS_SITE_ID;
    opciones.token = process.env.BLOBS_TOKEN;
  } else {
    blobs.connectLambda(event);
  }
  const store = blobs.getStore(opciones);

  let n = PEDIDO_INICIAL;
  try {
    const pista = await store.get('ultimo');
    n = Math.max((parseInt(pista, 10) || 0) + 1, PEDIDO_INICIAL);
  } catch (e) { /* sin pista: se empieza desde el número inicial */ }

  for (let intento = 0; intento < 80; intento++) {
    const r = await store.set('n' + n, new Date().toISOString(), { onlyIfNew: true });
    if (r.modified) {
      try { await store.set('ultimo', String(n)); } catch (e) { /* solo es una pista */ }
      return n;
    }
    n++;
  }
  throw new Error('No se pudo reservar el número de pedido');
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }
  try {
    const data = JSON.parse(event.body || '{}');
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) return { statusCode: 400, body: 'Sin items' };

    let subtotal = 0;
    const desconocidos = [];
    const lineas = [];
    items.forEach(function (it) {
      const qty = Math.floor(Number(it.qty));
      if (!(qty > 0)) return;
      const producto = PRECIOS[it.sku];
      const detalle = limpiar(it.detalle, 300);
      if (!producto) { desconocidos.push(it.sku); lineas.push('• ⚠️ SKU desconocido: ' + limpiar(it.sku, 60) + ' x' + qty); }
      else {
        subtotal += producto.precio * qty;
        lineas.push('• ' + qty + 'x ' + producto.nombre + ' — $' + producto.precio.toFixed(2) + ' c/u');
      }
      if (detalle) lineas.push('    ↳ ' + detalle);
    });
    if (!lineas.length) return { statusCode: 400, body: 'Sin items válidos' };

    const envio = calcularEnvio(subtotal);
    const total = subtotal + envio;

    let numeroPedido = null;
    let falloContador = '';
    if (SECUENCIAL) {
      try { numeroPedido = await siguienteNumeroPedido(event); }
      catch (e) {
        console.error('No se pudo generar el número de pedido:', e);
        falloContador = limpiar((e && (e.name + ': ' + e.message)) || e, 200);
      }
    }

    let mensaje = '🔔 Nuevo pedido' + (numeroPedido ? ' #' + numeroPedido : '') + ' (verificación)\n\n' + lineas.join('\n');
    if (ENVIO.enabled) {
      mensaje += '\n\nSubtotal: $' + subtotal.toFixed(2);
      mensaje += '\nEnvío: ' + (envio === 0 ? 'Gratis' : '$' + envio.toFixed(2));
    }
    mensaje += '\n\nTotal real: $' + total.toFixed(2);

    const ex = (data.extras && typeof data.extras === 'object') ? data.extras : null;
    if (ex) {
      const bloque = [];
      if (ex.direccion) bloque.push('📍 Dirección escrita: ' + limpiar(ex.direccion, 300));
      if (ex.recibe) bloque.push('👤 Recibe: ' + limpiar(ex.recibe, 100));
      if (Array.isArray(ex.opciones) && ex.opciones.length) {
        bloque.push('🍽️ Preferencias: ' + ex.opciones.slice(0, 10).map(function (o) { return limpiar(o, 80); }).join(', '));
      }
      if (ex.notas) bloque.push('📝 Notas del cliente: ' + limpiar(ex.notas, 500));
      if (bloque.length) mensaje += '\n\n' + bloque.join('\n');
    }

    if (RESTAURANTE.enabled) {
      const g = data.geo;
      const geoValida = g && Number.isFinite(g.lat) && Number.isFinite(g.lng) && Math.abs(g.lat) <= 90 && Math.abs(g.lng) <= 180;
      if (geoValida) {
        const km = distanciaKm(RESTAURANTE.lat, RESTAURANTE.lng, g.lat, g.lng);
        mensaje += '\n\n📍 Distancia aprox. (línea recta): ' + km.toFixed(2) + ' km';
        if (RESTAURANTE.costoPorKm > 0) {
          mensaje += '\n💵 Costo de envío estimado: $' + (km * RESTAURANTE.costoPorKm).toFixed(2) + ' (puede ser menor o mayor al costo real)';
        }
        mensaje += '\n🗺️ https://maps.google.com/?q=' + g.lat + ',' + g.lng;
      } else {
        mensaje += '\n\n📍 El cliente no compartió su ubicación (sin distancia).';
      }
    }
    if (desconocidos.length) mensaje += '\n\n⚠️ Atención: hay códigos que no existen en la tabla de precios.';
    if (SECUENCIAL && !numeroPedido) mensaje += '\n\n⚠️ No se pudo asignar número de pedido. Motivo: ' + (falloContador || 'desconocido');
    if (mensaje.length > 4000) mensaje = mensaje.slice(0, 3990) + '…';

    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const resp = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: mensaje }),
    });
    if (!resp.ok) {
      console.error('Error de Telegram:', await resp.text());
      return { statusCode: 502, body: 'Error al enviar a Telegram' };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, orderNumber: numeroPedido }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error interno' };
  }
};
