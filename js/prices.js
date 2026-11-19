/* Precios de referencia. Se pueden cambiar desde la página (vista "Precios") o editando este archivo.
   - Amazon: precio de referencia en USD (amazon.com). La página lo convierte a pesos con la TRM
     y le suma el recargo de importación (envío, IVA y trámite del courier).
   - Local: precio en pesos colombianos de la tienda de tu ciudad. Está vacío (null) a propósito:
     se llena escribiendo en la vista "Precios" y queda guardado en este navegador.
   Los valores de Amazon son estimados que hay que verificar con el botón "Buscar en Amazon". */
window.PRICES_DEFAULT = {
  tienda: 'Tienda local',
  trm: 4100,        // pesos por dólar (cámbiala por la TRM del día)
  recargo: 30,      // % de recargo de importación sobre el precio en dólares
  amazonUSD: {
    cpu:            [230, 330, 550],
    gpu:            [300, 430, 2300],
    ram:            [90, 170, 340],
    almacenamiento: [50, 160, 380],
    placa:          [100, 180, 450],
    fuente:         [60, 110, 220],
    refrigeracion:  [30, 45, 140]
  },
  localCOP: {
    cpu:            [null, null, null],
    gpu:            [null, null, null],
    ram:            [null, null, null],
    almacenamiento: [null, null, null],
    placa:          [null, null, null],
    fuente:         [null, null, null],
    refrigeracion:  [null, null, null]
  }
};
