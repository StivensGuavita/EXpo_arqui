/* Datos del PC 3: Llanero Games Studio S.A.S (empresa ficticia, Villavicencio, Meta).
   El nivel "Extremo" conserva la configuración original investigada por el compañero (con sus precios reales de
   Falabella y Amazon). El nivel "Recomendado" es la versión ajustada para no excederse. Los precios de Amazon de
   las piezas que no investigó son estimados (verificar) y los de la tienda local quedan vacíos para completarlos. */
window.PC3 = {
  id: 3,
  brand: 'Estación de Desarrollo',
  company: 'Llanero Games Studio S.A.S',
  noteTotal: 'incluye chasis y monitor; sin licencias',
  monitor3d: { inch: 27, kind: 'game', logo: 'UltraGear' },
  limLabel: 'Juegos que mueve cómodo',
  lim: function (t) {
    var v = Math.min(t('ram').m[0], t('gpu').m[0]);
    return v <= 35 ? 'Prototipos y juegos pequeños' : v <= 70 ? 'Juegos medianos' : 'Juegos grandes y escenas pesadas';
  },
  extras: [{ n: 'Chasis ATX con flujo de aire', model: 'Torre ATX con flujo de aire y radiador de 360 mm (Corsair Frame 5000D RS o equivalente)', usd: 195.92, cop: 410000 },
    { n: 'Monitor 27" QHD 200 Hz', model: 'LG UltraGear 27G610A 27 pulgadas 2560 × 1440 IPS, 200 Hz', usd: 169.99, cop: 999900 }],
  prices: {
    tienda: 'Tauret / Falabella',
    trm: 3309.55,
    recargo: 0,
    amazonUSD: {
      cpu: [268.47, 343.11, 558.72],
      gpu: [860.36, 1477.02, 2325.03],
      ram: [508.94, 1443.49, 2073.16],
      almacenamiento: [130.13, 428.1, 611.58],
      placa: [88.1, 238.36, 237.38],
      fuente: [51.82, 57, 148.22],
      refrigeracion: [18.55, 32.26, 69.32]
    },
    localCOP: {
      cpu: [1420000, 1652000, 2470000],
      gpu: [3619000, 6299000, 9780000],
      ram: [2599000, 4999000, 9998000],
      almacenamiento: [549900, 2087000, 3599000],
      placa: [399000, 1229000, 1218000],
      fuente: [389000, 425000, 719000],
      refrigeracion: [125000, 250000, 515000]
    }
  },
  labels3d: {
    noSata: true,
    cpu: [['RYZEN 7', '9700X'], ['RYZEN 9', '9900X'], ['RYZEN 9', '9950X']],
    chipset: ['B650', 'X870', 'X870E'],
    ram: [null, '64 GB DDR5-5600', '128 GB DDR5-5600'],
    nvme: [null, 'Samsung 990 PRO 2 TB', 'NVMe 4 TB · PCIe 5.0'],
    gpu: [['5060 Ti', '16 GB GDDR7'], ['5070 Ti', '16 GB GDDR7'], ['5080', '16 GB GDDR7']],
    psu: [['750', '80 PLUS GOLD'], ['850', '80 PLUS GOLD'], ['1300', '80 PLUS GOLD']]
  },
  loads: [
    { t: 'Compilar código y shaders', d: 'Miles de archivos de C++ y de shaders cada vez que se cambia algo.', to: ['cpu', 'ram'] },
    { t: 'Mover Unreal y Unity', d: 'Editor abierto con niveles grandes, texturas y materiales.', to: ['gpu', 'ram'] },
    { t: 'Renderizar en 3D y probar el juego', d: 'Ray tracing, iluminación horneada y pruebas del juego en tiempo real.', to: ['gpu', 'cpu'] },
    { t: 'Builds y trabajo de muchas horas', d: 'Empaquetar el juego, guardar versiones y no apagarse a media tarea.', to: ['almacenamiento', 'refrigeracion', 'fuente'] }
  ],
  parts: [
    { id: 'cpu', n: 'Procesador (CPU)', short: 'CPU',
      role: 'Ejecuta las instrucciones de los programas y reparte el trabajo. Es el director de orquesta del computador.',
      why: 'Compilar código C++ y miles de shaders se reparte entre todos los núcleos: más núcleos son menos minutos de espera en cada compilación. Unreal y Unity también usan varios hilos al hornear luces y empaquetar el juego.',
      tags: ['C++', 'Shaders', 'Unreal Engine', 'Unity', 'Compilación'],
      say: '“Un procesador de 12 núcleos compila casi tan rápido como uno de 16, consume menos y cuesta menos. El de 16 núcleos queda como opción si el estudio compila todo el día.”',
      metrics: ['Multihilo', 'Un solo hilo', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Ryzen 7 9700X', lbl: '9700X', price: 330, specs: ['8 núcleos · 16 hilos', 'Hasta 5,5 GHz', '65 W de consumo'], m: [54, 97, 60], verdict: 'Muy bueno para probar el juego, pero las compilaciones largas tardan más.' },
        { model: 'Ryzen 9 9900X', lbl: '9900X', price: 400, specs: ['12 núcleos · 24 hilos', 'Hasta 5,6 GHz', '120 W de consumo'], m: [77, 98, 95], verdict: 'Equilibrio para desarrollo: compila rápido y no exige refrigeración líquida.' },
        { model: 'Ryzen 9 9950X', lbl: '9950X', price: 500, specs: ['16 núcleos · 32 hilos', 'Hasta 5,7 GHz · 80 MB de caché', '170 W de consumo'], m: [100, 100, 60], verdict: 'El más veloz compilando, pero pide refrigeración líquida y consume 170 W. Es la opción original del grupo.' }] },
    { id: 'gpu', n: 'Tarjeta gráfica (GPU)', short: 'GPU',
      role: 'Miles de núcleos pequeños que calculan en paralelo y dibujan la imagen. Tiene su propia memoria, la VRAM.',
      why: 'Unreal y Unity dibujan la escena en tiempo real, y la GPU también hornea iluminación y renderiza en 3D. La VRAM limita qué tan pesadas pueden ser las texturas y los niveles que se prueban sin que el editor falle.',
      tags: ['Ray tracing', 'CUDA', 'VRAM', 'Lumen y Nanite', 'Pruebas del juego'],
      say: '“Con 16 GB de VRAM, la 5070 Ti mueve el editor y prueba el juego con ray tracing. La 5080 es algo más rápida, pero cuesta bastante más.”',
      metrics: ['Cómputo (CUDA)', 'Memoria de video (VRAM)', 'Ajuste a la empresa'],
      tiers: [
        { model: 'GeForce RTX 5060 Ti 16 GB', lbl: '5060 Ti', price: 710, specs: ['16 GB GDDR7', '4.608 núcleos CUDA', '180 W'], m: [30, 50, 60], verdict: 'Mueve el editor y compila bien, pero se queda corta para ray tracing y renders pesados.' },
        { model: 'GeForce RTX 5070 Ti 16 GB', lbl: '5070 Ti', price: 1240, specs: ['16 GB GDDR7', '8.960 núcleos CUDA', '300 W'], m: [62, 50, 95], verdict: 'Punto dulce: 16 GB para el editor y ray tracing sin pagar el precio de la gama alta.' },
        { model: 'GeForce RTX 5080 16 GB', lbl: '5080', price: 1657, specs: ['16 GB GDDR7', '10.752 núcleos CUDA', '360 W'], m: [78, 50, 65], verdict: 'Más veloz, pero con la misma VRAM de 16 GB: la diferencia está en la velocidad, no en la memoria. Es la opción original del grupo.' }] },
    { id: 'ram', n: 'Memoria RAM', short: 'RAM',
      role: 'Memoria de trabajo: guarda lo que el procesador está usando en este momento. Es rápida, pero se borra al apagar.',
      why: 'Unreal Engine, el compilador y las herramientas 3D abiertos a la vez ocupan mucha memoria. Si no alcanza, el equipo usa el disco y el editor se traba al cargar niveles.',
      tags: ['DDR5', 'Doble canal', 'Unreal', 'Compilación'],
      say: '“64 GB permiten tener el editor, el compilador y un programa 3D abiertos sin que el equipo se ponga lento, y la placa deja ranuras para llegar a 128 GB.”',
      metrics: ['Capacidad', 'Velocidad (DDR5)', 'Ajuste a la empresa'],
      tiers: [
        { model: '32 GB DDR5-6000', lbl: '32 GB', price: 500, specs: ['2 × 16 GB', 'DDR5-6000', '2 ranuras libres para ampliar'], m: [50, 92, 55], verdict: 'Sirve para empezar, pero con proyectos grandes de Unreal queda justa.' },
        { model: '64 GB DDR5-5600 Corsair Vengeance', lbl: '64 GB', price: 989, specs: ['2 × 32 GB · doble canal', 'DDR5-5600', '2 ranuras libres para ampliar'], m: [75, 88, 95], verdict: 'Cómodo para Unreal, compilador y herramientas 3D a la vez. Pesa en el costo por la escasez actual de memoria.' },
        { model: '128 GB DDR5-5600', lbl: '128 GB', price: 1950, specs: ['4 × 32 GB', 'DDR5-5600', 'Ocupa las 4 ranuras'], m: [100, 85, 40], verdict: 'Sobra para un puesto de desarrollo; solo para escenas enormes o varias copias del editor.' }] },
    { id: 'almacenamiento', n: 'Almacenamiento', short: 'Almacenamiento',
      role: 'Guarda el sistema, los programas y los proyectos del juego. Un SSD NVMe carga todo en segundos.',
      why: 'Los proyectos de Unreal pesan decenas de GB y cada compilación o empaquetado lee y escribe miles de archivos. Un NVMe rápido acorta cargas y builds; el respaldo vive en el NAS, la nube y Git, no en el mismo disco.',
      tags: ['NVMe PCIe 4.0', 'Builds', 'Git', 'NAS', 'Respaldo'],
      say: '“Un NVMe de 2 TB aloja el sistema, el motor y los proyectos. El respaldo va aparte, en NAS y Git, porque un solo disco no es una copia de seguridad.”',
      metrics: ['Velocidad', 'Capacidad total', 'Ajuste a la empresa'],
      tiers: [
        { model: 'SSD NVMe 1 TB', lbl: '1 TB', price: 195, specs: ['NVMe PCIe 4.0', '≈ 7.000 MB/s', 'Justo para el motor y un proyecto'], m: [60, 25, 50], verdict: 'Alcanza para el motor y un proyecto; se llena rápido con varios juegos y builds.' },
        { model: 'Samsung 990 PRO 2 TB NVMe', lbl: '2 TB', price: 390, specs: ['NVMe PCIe 4.0 x4', 'Hasta 7.450 MB/s', '1.200 TBW de durabilidad'], m: [90, 55, 95], verdict: 'Espacio y velocidad para el motor, los proyectos y las builds, con buena durabilidad para escribir todo el día.' },
        { model: 'SSD NVMe 4 TB PCIe 5.0', lbl: '4 TB', price: 780, specs: ['NVMe PCIe 5.0', '≈ 12.000 MB/s', 'Más espacio y velocidad'], m: [100, 100, 45], verdict: 'Más espacio, pero el compilador casi no aprovecha la velocidad extra: el cuello está en CPU y GPU.' }] },
    { id: 'placa', n: 'Placa madre', short: 'Placa',
      role: 'Conecta todos los componentes y reparte datos y energía entre ellos. Define cuánto se puede ampliar el equipo.',
      why: 'Debe aguantar el procesador y la memoria que se compran hoy y dejar ranuras para crecer: más discos M.2, hasta 128 GB de RAM y red rápida para subir builds. Una buena placa evita cambiar el equipo en dos años.',
      tags: ['Socket AM5', 'PCIe 5.0', 'M.2', 'Wi-Fi 7', 'Ampliación'],
      say: '“La MSI X870 acepta los próximos Ryzen, tiene tres ranuras M.2 y Wi-Fi 7. No acelera el equipo, pero evita comprar otro computador.”',
      metrics: ['Expansión', 'Conectividad', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Placa B650 (ATX)', lbl: 'B650', price: 180, specs: ['Socket AM5 · DDR5', 'PCIe 4.0 (algunas 5.0)', 'Varias M.2 y red 2,5 GbE'], m: [70, 65, 70], verdict: 'Cumple con un procesador de 12 núcleos y deja crecer, sin las ventajas del chipset más nuevo.' },
        { model: 'MSI PRO X870-P WiFi (ATX)', lbl: 'X870-P', price: 203, specs: ['Socket AM5 · DDR5', 'PCIe 5.0 · 3 ranuras M.2', 'Wi-Fi 7 y Bluetooth 5.4'], m: [88, 88, 95], verdict: 'Soporta futuros Ryzen y deja espacio para más discos y memoria: buen punto entre costo y vida útil.' },
        { model: 'Placa X870E (ATX)', lbl: 'X870E', price: 450, specs: ['Socket AM5 · DDR5', 'PCIe 5.0 en GPU y discos', 'USB4 y Wi-Fi 7'], m: [100, 100, 40], verdict: 'Sobra para este trabajo: paga funciones de overclock y USB4 que un puesto de desarrollo no usa.' }] },
    { id: 'fuente', n: 'Fuente de poder', short: 'Fuente',
      role: 'Convierte la corriente de la pared en los voltajes que usa cada componente.',
      why: 'Compilar y renderizar mantiene CPU y GPU al máximo durante horas. La fuente se dimensiona según la GPU y deja margen para no trabajar al límite; una falla aquí apaga el equipo y puede dañar piezas.',
      tags: ['Vatios', '80+ Gold', 'ATX 3.x', 'UPS'],
      say: '“Con este procesador y esta GPU el equipo consume cerca de 600 W al máximo: una fuente de 850 W trabaja cómoda y eficiente. 1300 W solo se justificaría con una RTX 5090.”',
      metrics: ['Potencia disponible', 'Eficiencia', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Fuente 750 W · 80+ Gold', lbl: '750 W', price: 110, specs: ['750 W continuos', 'ATX 3.x · 80+ Gold', 'Poco margen para cambiar la GPU'], m: [70, 85, 60], verdict: 'Alcanza para CPU y GPU medias, pero deja poco margen si luego se sube la GPU.' },
        { model: 'Fuente 850 W · 80+ Gold', lbl: '850 W', price: 140, specs: ['850 W continuos', 'ATX 3.1 · 80+ Gold', 'Margen para la GPU recomendada'], m: [85, 88, 95], verdict: 'Trabaja cómoda a plena carga y deja margen sin pagar de más.' },
        { model: 'Fuente 1300 W · 80+ Gold', lbl: '1300 W', price: 280, specs: ['1300 W continuos', 'ATX 3.0 · PCIe 5.0 · modular', 'Garantía de 10 años'], m: [100, 88, 35], verdict: 'Solo se justifica para pasar a una RTX 5090; con esta GPU sobra casi la mitad. Es la opción original del grupo.' }] },
    { id: 'refrigeracion', n: 'Refrigeración', short: 'Refrigeración',
      role: 'Saca el calor del procesador para que mantenga su velocidad.',
      why: 'El procesador pasa horas al 100 % al compilar y hornear luces. Si se calienta, baja su frecuencia (throttling) y el trabajo tarda más sin avisar. Además, el Ryzen 9 9950X no trae disipador en la caja.',
      tags: ['Throttling', 'TDP', 'Refrigeración líquida', 'Ruido'],
      say: '“Con un procesador de 12 núcleos y 120 W alcanza un buen disipador de aire. Si se sube al de 16 núcleos y 170 W, hace falta refrigeración líquida de 360 mm.”',
      metrics: ['Capacidad de enfriamiento', 'Silencio', 'Ajuste a la empresa'],
      tiers: [
        { model: 'Disipador de aire sencillo', lbl: '', price: 30, specs: ['1 ventilador de 120 mm', 'Hasta ≈ 120 W de calor', 'Más ruido a carga alta'], m: [40, 50, 50], verdict: 'Mantiene una CPU de 65 W, pero con ruido al sostener el 100 % por horas.' },
        { model: 'Disipador de aire de torre doble', lbl: '', price: 45, specs: ['2 ventiladores · torre doble', 'Hasta ≈ 220 W de calor', 'Sin bombas ni fugas'], m: [70, 80, 95], verdict: 'Silencioso y sin throttling en procesos largos con una CPU de 120 W.' },
        { model: 'Refrigeración líquida AIO 360 mm', lbl: '', price: 153, specs: ['3 ventiladores · radiador 360 mm', 'Más de 250 W de calor', 'Bomba y líquido: más piezas'], m: [100, 65, 50], verdict: 'Necesaria para el 9950X de 170 W. Con una CPU de 65–120 W es más de lo necesario. Es la opción original del grupo.' }] }
  ]
};
