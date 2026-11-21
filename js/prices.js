/* Precios de referencia (PC 2). Se pueden cambiar desde la página (vista "Precios") o editando este archivo.
   - Amazon: precio de amazon.com mostrado en pesos colombianos con entrega a Colombia (noviembre 2026).
     Se guarda como US$ = pesos / TRM, y la página lo vuelve a convertir a pesos con la TRM.
     Los valores marcados como estimados en el informe no aparecieron en Amazon.
   - Local: precio en pesos colombianos (Tauret Computadores y Falabella; algunos son estimados). null = sin dato. */
window.PRICES_DEFAULT = {
  tienda: 'Tauret / Falabella',
  trm: 3309.55,     // pesos por dólar (TRM)
  recargo: 0,         // % de recargo de importación (los precios de Amazon ya vienen en pesos con entrega a Colombia)
  amazonUSD: {
    cpu: [180.36, 268.47, 558.72],
    gpu: [518.28, 860.36, 8082.67],
    ram: [259.14, 508.94, 1036.58],
    almacenamiento: [72.24, 323.96, 715.2],
    placa: [82.92, 88.1, 237.38],
    fuente: [51.82, 51.82, 248.77],
    refrigeracion: [18.55, 32.26, 72.45]
  },
  localCOP: {
    cpu: [1050000, 1420000, 2470000],
    gpu: [2150000, 3619000, 34000000],
    ram: [919000, 2599000, 4999000],
    almacenamiento: [299900, 1494900, null],
    placa: [439000, 399000, 1218000],
    fuente: [199000, 389000, 599000],
    refrigeracion: [125000, 250000, 515000]
  }
};
