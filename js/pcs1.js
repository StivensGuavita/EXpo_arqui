/* Datos del PC 1: Hotel (PYME del sector turístico, Villavicencio). La configuración original del compañero es el nivel
   "Recomendado" (ya es ajustada). No trajo precios: los de Amazon son estimados y los de la tienda local quedan vacíos. */
window.PC1 = {
  id: 1,
  brand: 'Estación de Oficina',
  company: 'Hotel · PYME del sector turístico',
  noteTotal: 'incluye chasis y monitor; sin licencias',
  limLabel: 'Trabajo que atiende cómodo',
  noThrottleWarn: true,
  lim: function (t) {
    var v = Math.min(t('ram').m[0], t('cpu').m[0]);
    return v <= 35 ? 'Tareas básicas de recepción' : v <= 70 ? 'Recepción, reservas y facturación' : 'Administración con varios programas a la vez';
  },
  monitor3d: { inch: 22, kind: 'hotel', logo: 'MSI' },
  extras: [
    { n: 'Chasis Micro ATX', model: 'Zalman CUBIX-G Micro ATX', usd: 46.63, cop: 189000 },
    { n: 'Monitor 22" Full HD', model: 'MSI PRO MP225 22 pulgadas Full HD', usd: 62.18, cop: 0 }
  ],
  prices: {
    tienda: 'Tauret / Falabella',
    trm: 3309.55,
    recargo: 0,
    amazonUSD: {
      cpu: [96.39, 133.72, 214.56],
      gpu: [0, 0, 99.55],
      ram: [57, 114.01, 163.85],
      almacenamiento: [41.45, 93.28, 130.13],
      placa: [61.16, 102.4, 61.16],
      fuente: [42.54, 37.31, 49.75],
      refrigeracion: [0, 0, 32.26]
    },
    localCOP: {
      cpu: [null, 644000, 799000],
      gpu: [null, null, null],
      ram: [null, 449900, 889000],
      almacenamiento: [189900, 299900, 549900],
      placa: [null, 525000, 339000],
      fuente: [null, 145000, 199000],
      refrigeracion: [null, null, 250000]
    }
  },
  labels3d: {
    noSata: true,
    t3: { gpu: [-1, -1, 0], refrigeracion: [0, 0, 1] },
    cpu: [['RYZEN 5', '5500GT', 'AM4'], ['RYZEN 5', '5600GT', 'AM4'], ['RYZEN 7', '5700G', 'AM4']],
    chipset: ['A320', 'A520', 'B550'],
    ram: [null, '16 GB DDR4-3200', '32 GB DDR4-3200'],
    nvme: [null, 'NVMe 500 GB · PCIe 3.0', 'NVMe 1 TB · PCIe 3.0'],
    gpu: [null, null, ['RX 6400', '4 GB GDDR6', 'RADEON ']],
    psu: [['400', '80 PLUS WHITE', '#8a8f94', '#b8bec3'], ['450', '80 PLUS BRONZE', '#a2682f', '#d28b4a'], ['650', '80 PLUS GOLD', '#c9a54a', '#e2c066']]
  },
  loads: [
    { t: 'Recepción y reservas', d: 'Sistema de gestión hotelera abierto todo el día, con varias pestañas.', to: ['cpu', 'ram'] },
    { t: 'Contabilidad y facturación electrónica', d: 'Hojas de cálculo, facturas y archivos del hotel.', to: ['almacenamiento', 'cpu'] },
    { t: 'Pantallas y navegación web', d: 'Plataformas de reservas, correo y videollamadas.', to: ['gpu', 'placa'] },
    { t: 'Encendido de 8 a 12 horas al día', d: 'Poco ruido, poco consumo y que no se apague a mitad de un registro.', to: ['fuente', 'refrigeracion'] }
  ],
  parts: [
    { id: 'cpu', n: 'Procesador (CPU)', short: 'CPU',
      role: 'Ejecuta las instrucciones de los programas y reparte el trabajo. Es el director de orquesta del computador.',
      why: 'Recepción, reservas y facturación son programas ligeros, pero se usan con muchas pestañas abiertas. Un procesador con gráficos integrados ahorra comprar una tarjeta de video y deja el equipo silencioso y eficiente.',
      tags: ['Ofimática', 'Reservas', 'Facturación electrónica', 'Gráficos integrados'],
      say: '“El Ryzen 5 5600GT tiene 6 núcleos y trae gráficos y disipador incluidos. Para recepción y facturación sobra, y no se paga nada que el hotel no use.”',
      metrics: ['Multihilo', 'Un solo hilo', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Ryzen 5 5500GT', lbl: '5500GT', price: 120, specs: ['6 núcleos · 12 hilos', 'Hasta 4,4 GHz', '65 W · gráficos Vega 7'], m: [40, 70, 75], verdict: 'Suficiente para ofimática y reservas. Un poco más lento si se abren muchas cosas a la vez.' },
        { model: 'Ryzen 5 5600GT', lbl: '5600GT', price: 140, specs: ['6 núcleos · 12 hilos', 'Hasta 4,6 GHz', '65 W · gráficos Vega 7 · disipador incluido'], m: [45, 78, 95], verdict: 'Equilibrio ideal para un hotel: fluido en recepción y facturación, con gráficos integrados.' },
        { model: 'Ryzen 7 5700G', lbl: '5700G', price: 200, specs: ['8 núcleos · 16 hilos', 'Hasta 4,6 GHz', '65 W · gráficos Vega 8'], m: [75, 80, 50], verdict: 'Más potencia de la que usa un puesto de oficina; se justificaría solo en administración con muchos programas.' }] },
    { id: 'gpu', n: 'Gráficos (GPU)', short: 'GPU',
      role: 'Dibuja la imagen que se ve en pantalla. Puede ir integrada en el procesador o en una tarjeta aparte con su propia memoria.',
      why: 'Un hotel no renderiza ni juega: solo necesita mostrar programas de oficina y videollamadas en uno o dos monitores. Los gráficos integrados cubren eso sin costo extra, sin ruido y con menos consumo.',
      tags: ['Gráficos integrados', 'Monitores', 'Ahorro', 'Sin ruido'],
      say: '“No compramos tarjeta de video: los gráficos integrados Vega del procesador alcanzan para ofimática y pantallas Full HD, y ahorran dinero y energía.”',
      metrics: ['Rendimiento gráfico', 'Pantallas que maneja', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Gráficos integrados Vega 7 · 1 monitor', lbl: 'Vega 7', price: 0, specs: ['Incluidos en el procesador', 'Hasta 1 monitor Full HD', 'Comparten la RAM'], m: [20, 40, 70], verdict: 'Alcanza para un monitor de oficina. Es la opción más simple y barata.' },
        { model: 'Gráficos integrados Vega 7 · 2 monitores', lbl: 'Vega 7', price: 0, specs: ['Incluidos en el procesador', 'Hasta 2 monitores Full HD', 'Comparten la RAM (mejor en doble canal)'], m: [22, 55, 95], verdict: 'Recepción y administración pueden usar dos pantallas sin pagar una tarjeta de video.' },
        { model: 'Radeon RX 6400 4 GB', lbl: 'RX 6400', price: 130, specs: ['4 GB GDDR6', 'Tarjeta dedicada básica', '53 W'], m: [60, 75, 25], verdict: 'Rinde más, pero un hotel no usa esa potencia: es dinero y consumo de más.' }] },
    { id: 'ram', n: 'Memoria RAM', short: 'RAM',
      role: 'Memoria de trabajo: guarda lo que el procesador está usando en este momento. Es rápida, pero se borra al apagar.',
      why: 'El sistema de reservas, el navegador con varias pestañas y la facturación electrónica abiertos a la vez ocupan memoria. Con gráficos integrados, además, la RAM también sirve de memoria de video, así que conviene doble canal.',
      tags: ['DDR4', 'Doble canal', 'Pestañas', 'Gráficos integrados'],
      say: '“16 GB en dos módulos de 8 GB: doble canal para que los gráficos integrados rindan mejor y espacio de sobra para el sistema de reservas y el navegador.”',
      metrics: ['Capacidad', 'Velocidad (DDR4)', 'Ajuste a la empresa'],
      tiers: [
        { model: '8 GB DDR4-3200', lbl: '8 GB', price: 35, specs: ['1 × 8 GB', 'DDR4-3200', 'Un solo canal: más lento'], m: [25, 78, 40], verdict: 'Se queda corto con varias pestañas y el sistema de reservas; en un solo canal los gráficos rinden peor.' },
        { model: '16 GB DDR4-3200 (2 × 8 GB) PNY Performance', lbl: '16 GB', price: 65, specs: ['2 × 8 GB · doble canal', 'DDR4-3200', 'Hasta 64 GB después'], m: [50, 80, 95], verdict: 'Alcanza para todas las tareas del hotel y aprovecha el doble canal.' },
        { model: '32 GB DDR4-3200 (2 × 16 GB)', lbl: '32 GB', price: 120, specs: ['2 × 16 GB · doble canal', 'DDR4-3200', 'Ocupa las 2 ranuras'], m: [100, 80, 35], verdict: 'Sobra para un puesto de oficina; solo para administración con muchos programas pesados.' }] },
    { id: 'almacenamiento', n: 'Almacenamiento', short: 'Almacenamiento',
      role: 'Guarda el sistema y los datos. Un SSD NVMe arranca y abre los programas en segundos.',
      why: 'El sistema de reservas y la facturación guardan datos de huéspedes que deben estar disponibles al instante, y los equipos se encienden y apagan a diario. Un SSD no tiene partes móviles y arranca en segundos; los respaldos van a la nube o a un servidor.',
      tags: ['SSD NVMe', 'Arranque rápido', 'Respaldo', 'Datos de huéspedes'],
      say: '“Un SSD NVMe de 500 GB arranca el equipo en segundos y no tiene partes móviles. Los datos importantes se respaldan en la nube, no en el mismo disco.”',
      metrics: ['Velocidad', 'Capacidad total', 'Ajuste a la empresa'],
      tiers: [
        { model: 'SSD NVMe 256 GB', lbl: '256 GB', price: 30, specs: ['NVMe PCIe 3.0', '≈ 2.500 MB/s', 'Poco margen'], m: [30, 20, 50], verdict: 'Alcanza para el sistema y los programas, pero se llena con facilidad.' },
        { model: 'SSD NVMe 500 GB', lbl: '500 GB', price: 45, specs: ['NVMe PCIe 3.0', '≈ 3.000 MB/s', 'Sobra para programas de oficina'], m: [45, 40, 95], verdict: 'Cabe el sistema, los programas y los documentos locales. Es la opción equilibrada.' },
        { model: 'SSD NVMe 1 TB', lbl: '1 TB', price: 80, specs: ['NVMe PCIe 3.0', '≈ 3.500 MB/s', 'Mucho espacio libre'], m: [55, 80, 45], verdict: 'Espacio que un puesto de recepción no va a llenar; se paga de más.' }] },
    { id: 'placa', n: 'Placa madre', short: 'Placa',
      role: 'Conecta todos los componentes y reparte datos y energía entre ellos. Define cuánto se puede ampliar el equipo.',
      why: 'Debe ser compatible con el procesador y la memoria elegidos y tener los puertos de un puesto de oficina: monitor, USB y red. Como el hotel crecerá de 5 a 10 equipos, la compra se repite, así que conviene una placa común y fácil de conseguir.',
      tags: ['Socket AM4', 'Micro ATX', 'DDR4', 'Compatibilidad'],
      say: '“La A520M es una placa Micro ATX económica y compatible con el Ryzen 5 5600GT. Hay que comprarla con la BIOS actualizada. Su límite es que la plataforma AM4 ya no se actualiza.”',
      metrics: ['Expansión', 'Conectividad', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Placa A320M (Micro ATX)', lbl: 'A320M', price: 55, specs: ['Socket AM4 · DDR4', 'Sin PCIe 4.0', 'Requiere actualizar la BIOS'], m: [30, 40, 45], verdict: 'Funciona, pero necesita actualizar la BIOS para los Ryzen 5000 y es una plataforma más vieja.' },
        { model: 'ASUS A520M-K (Micro ATX)', lbl: 'A520M-K', price: 70, specs: ['Socket AM4 · DDR4', '2 ranuras de RAM · 1 ranura M.2', 'Compatible con Ryzen 5000G'], m: [45, 55, 95], verdict: 'Económica y suficiente para un puesto de oficina. Verificar que traiga la BIOS compatible.' },
        { model: 'Placa B550M (Micro ATX)', lbl: 'B550M', price: 100, specs: ['Socket AM4 · DDR4', 'PCIe 4.0 · más ranuras M.2', 'Mejor alimentación del procesador'], m: [70, 80, 45], verdict: 'Ofrece ampliaciones que un puesto de recepción no necesita.' }] },
    { id: 'fuente', n: 'Fuente de poder', short: 'Fuente',
      role: 'Convierte la corriente de la pared en los voltajes que usa cada componente.',
      why: 'El equipo permanece encendido de 8 a 12 horas al día. Sin tarjeta de video, todo el sistema consume menos de 100 W, así que una fuente de 450 W de buena calidad trabaja holgada y eficiente. Lo importante es la certificación, no los vatios.',
      tags: ['Vatios', '80 PLUS', 'UPS', 'Consumo'],
      say: '“Todo el equipo consume menos de 100 W; una fuente de 450 W con certificación 80 PLUS Bronze sobra y protege los componentes con un costo bajo.”',
      metrics: ['Potencia disponible', 'Eficiencia', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Fuente 400 W · 80+ White', lbl: '400 W', price: 35, specs: ['400 W continuos', 'Eficiencia ≈ 80 %', 'Calidad básica'], m: [45, 55, 50], verdict: 'Alcanza, pero con menos eficiencia y menos protecciones.' },
        { model: 'Fuente 450 W · 80+ Bronze', lbl: '450 W', price: 45, specs: ['450 W continuos', 'Eficiencia ≈ 85 %', 'De buena calidad'], m: [60, 75, 95], verdict: 'Margen de sobra para este equipo, con buena eficiencia y protecciones.' },
        { model: 'Fuente 650 W · 80+ Gold', lbl: '650 W', price: 85, specs: ['650 W continuos', 'Eficiencia ≈ 90 %', 'Margen para una GPU'], m: [100, 90, 40], verdict: 'Pensada para una tarjeta de video; en un puesto de oficina sobra.' }] },
    { id: 'refrigeracion', n: 'Refrigeración', short: 'Refrigeración',
      role: 'Saca el calor del procesador para que mantenga su velocidad.',
      why: 'Un procesador de 65 W en tareas de oficina casi nunca se calienta. El Ryzen 5 5600GT incluye su propio disipador (Wraith Stealth), así que no hay que comprar nada. Solo hace falta limpiar el polvo con regularidad.',
      tags: ['Disipador incluido', 'TDP 65 W', 'Mantenimiento', 'Ruido'],
      say: '“El disipador de fábrica que trae el procesador es suficiente para un equipo de oficina. Comprar otro sería un gasto innecesario.”',
      metrics: ['Capacidad de enfriamiento', 'Silencio', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Disipador de fábrica (Wraith Stealth)', lbl: '', price: 0, specs: ['Incluido con el procesador', 'Hasta ≈ 65 W de calor', 'Silencioso en oficina'], m: [50, 60, 80], verdict: 'Suficiente para tareas de oficina; no cuesta nada extra.' },
        { model: 'Disipador de fábrica (Wraith Stealth)', lbl: '', price: 0, specs: ['Incluido con el procesador', 'Limpiar el polvo cada 3 meses', 'Sin piezas que fallen'], m: [50, 60, 95], verdict: 'La opción elegida: cubre el 5600GT y no agrega costo ni piezas.' },
        { model: 'Disipador de aire de torre doble', lbl: '', price: 45, specs: ['2 ventiladores · torre doble', 'Hasta ≈ 220 W de calor', 'Más silencioso'], m: [85, 85, 40], verdict: 'Mucho más de lo que necesita un procesador de 65 W.' }] }
  ]
};
