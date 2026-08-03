// Static library shown in the "FAQ Templates" panel of the Knowledge page —
// mirrors the reference product's pre-written 40-question library across 9
// real-estate topics. `key` is persisted on the created knowledge_documents
// row (as `catalog_key`) so we can tell "already added" apart from a
// coincidentally-similar custom question.

export type FaqCategoryId =
  | 'viewings'
  | 'buying'
  | 'selling'
  | 'renting'
  | 'hours_location'
  | 'investment'
  | 'new_construction'
  | 'market_pricing'
  | 'process_legal'

export type FaqCategory = {
  id: FaqCategoryId
  label: string
}

export type FaqTemplate = {
  key: string
  categoryId: FaqCategoryId
  question: string
  answer: string
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: 'viewings', label: 'Visitas a propiedades' },
  { id: 'buying', label: 'Compra' },
  { id: 'selling', label: 'Venta' },
  { id: 'renting', label: 'Alquiler' },
  { id: 'hours_location', label: 'Horario y ubicación' },
  { id: 'investment', label: 'Propiedades de inversión' },
  { id: 'new_construction', label: 'Construcción nueva' },
  { id: 'market_pricing', label: 'Mercado y precios' },
  { id: 'process_legal', label: 'Proceso y legal' },
]

export const FAQ_TEMPLATES: FaqTemplate[] = [
  // Visitas a propiedades (6)
  {
    key: 'viewings-schedule',
    categoryId: 'viewings',
    question: '¿Cómo agendo una visita a una propiedad?',
    answer:
      'Puedes agendar una visita directamente por teléfono, por nuestro chat o pidiéndole a nuestro agente de IA que te reserve un horario. Solo necesitamos la propiedad que te interesa y tu disponibilidad.',
  },
  {
    key: 'viewings-cancellation',
    categoryId: 'viewings',
    question: '¿Cuál es su política de cancelación para visitas?',
    answer:
      'Puedes cancelar o reprogramar sin costo con al menos 2 horas de anticipación. Te lo agradecemos para poder ofrecer ese horario a otro cliente interesado.',
  },
  {
    key: 'viewings-duration',
    categoryId: 'viewings',
    question: '¿Cuánto dura normalmente una visita a una propiedad?',
    answer:
      'La mayoría de las visitas duran entre 30 y 60 minutos, dependiendo del tamaño de la propiedad y de cuántas preguntas tengas. Con gusto extendemos el tiempo si lo necesitas.',
  },
  {
    key: 'viewings-multiple',
    categoryId: 'viewings',
    question: '¿Puedo agendar varias visitas en un mismo día?',
    answer:
      'Sí, muchos clientes visitan varias propiedades el mismo día para comparar. Organizamos el recorrido para que sea cómodo y eficiente en cuanto a tiempo y traslados.',
  },
  {
    key: 'viewings-virtual',
    categoryId: 'viewings',
    question: '¿Puedo hacer un recorrido virtual de la propiedad?',
    answer:
      'Sí, ofrecemos recorridos virtuales por videollamada para propiedades seleccionadas, ideal si no puedes visitar en persona o vives fuera de la ciudad.',
  },
  {
    key: 'viewings-guests',
    categoryId: 'viewings',
    question: '¿Puedo llevar a mi familia o pareja a la visita?',
    answer:
      'Por supuesto. Te recomendamos avisarnos con anticipación cuántas personas asistirán para coordinar mejor el horario y la logística de la visita.',
  },

  // Compra (6)
  {
    key: 'buying-getting-started',
    categoryId: 'buying',
    question: '¿Cómo empiezo el proceso de compra de una vivienda?',
    answer:
      'Comenzamos entendiendo tu presupuesto, la zona que te interesa y tus prioridades. A partir de ahí te mostramos propiedades que encajen y te acompañamos en cada paso hasta el cierre.',
  },
  {
    key: 'buying-extra-costs',
    categoryId: 'buying',
    question: '¿Qué costos adicionales debo presupuestar más allá del precio de compra?',
    answer:
      'Además del precio de la propiedad, generalmente hay que considerar gastos notariales, impuesto de transferencia, avalúo y, si aplica, comisión del banco. Te damos un estimado detallado antes de avanzar.',
  },
  {
    key: 'buying-pre-approval',
    categoryId: 'buying',
    question: '¿Necesito estar pre-aprobado antes de visitar propiedades?',
    answer:
      'No es obligatorio, pero sí muy recomendable. Tener una pre-aprobación te da claridad sobre tu presupuesto real y agiliza la oferta cuando encuentres la propiedad indicada.',
  },
  {
    key: 'buying-closing-time',
    categoryId: 'buying',
    question: '¿Cuánto tiempo toma cerrar la compra de una propiedad?',
    answer:
      'En promedio, entre 30 y 60 días desde que se acepta la oferta, dependiendo de si hay financiamiento bancario de por medio y de la rapidez en los trámites legales.',
  },
  {
    key: 'buying-offer-below-price',
    categoryId: 'buying',
    question: '¿Puedo hacer una oferta por debajo del precio de lista?',
    answer:
      'Sí, es común negociar. Te ayudamos a preparar una oferta competitiva basada en propiedades comparables recientes en la misma zona.',
  },
  {
    key: 'buying-required-documents',
    categoryId: 'buying',
    question: '¿Qué documentos necesito para hacer una oferta?',
    answer:
      'Normalmente pedimos una identificación válida, carta de pre-aprobación bancaria (si aplica financiamiento) y comprobante de fondos para el inicial. Te confirmamos la lista exacta según tu caso.',
  },

  // Venta (6)
  {
    key: 'selling-getting-started',
    categoryId: 'selling',
    question: '¿Cómo empiezo a vender mi propiedad con ustedes?',
    answer:
      'Empezamos con una visita para evaluar tu propiedad, te damos una recomendación de precio y preparamos el material de mercadeo (fotos, descripción y publicación) para listarla.',
  },
  {
    key: 'selling-price-determination',
    categoryId: 'selling',
    question: '¿Cómo determinan el precio de lista de mi propiedad?',
    answer:
      'Analizamos ventas recientes de propiedades comparables en tu zona, el estado y las características de tu propiedad, y las condiciones actuales del mercado para sugerir un precio competitivo.',
  },
  {
    key: 'selling-time-to-sell',
    categoryId: 'selling',
    question: '¿Cuánto tiempo tarda normalmente en venderse una propiedad?',
    answer:
      'Depende de la zona, el precio y la demanda del momento, pero en promedio nuestras propiedades bien posicionadas se venden entre 2 y 4 meses.',
  },
  {
    key: 'selling-commission',
    categoryId: 'selling',
    question: '¿Qué comisión cobran por la venta?',
    answer:
      'Nuestra comisión se conversa caso por caso según el tipo de propiedad y el servicio contratado. Te la confirmamos por escrito antes de firmar cualquier acuerdo.',
  },
  {
    key: 'selling-repairs-needed',
    categoryId: 'selling',
    question: '¿Necesito hacer reparaciones antes de listar mi propiedad?',
    answer:
      'No siempre es necesario, pero pequeñas mejoras (pintura, limpieza profunda, reparaciones menores) suelen aumentar el interés y el valor percibido. Te damos recomendaciones específicas tras la visita inicial.',
  },
  {
    key: 'selling-marketing',
    categoryId: 'selling',
    question: '¿Cómo promocionan mi propiedad para encontrar compradores?',
    answer:
      'Publicamos tu propiedad en nuestros portales, redes sociales y base de clientes interesados, con fotos profesionales y, cuando aplica, recorrido virtual.',
  },

  // Alquiler (5)
  {
    key: 'renting-requirements',
    categoryId: 'renting',
    question: '¿Qué necesito para alquilar una propiedad?',
    answer:
      'Generalmente pedimos identificación, comprobante de ingresos y referencias. Para algunos alquileres también solicitamos un fiador o depósito adicional.',
  },
  {
    key: 'renting-deposit',
    categoryId: 'renting',
    question: '¿Cuál es el depósito de garantía requerido?',
    answer:
      'El depósito suele equivaler a uno o dos meses de alquiler, según la propiedad. Te confirmamos el monto exacto antes de firmar el contrato.',
  },
  {
    key: 'renting-pets',
    categoryId: 'renting',
    question: '¿Aceptan mascotas en las propiedades en alquiler?',
    answer:
      'Depende de cada propiedad — algunas sí aceptan mascotas, otras no. Cuéntanos qué mascota tienes y te confirmamos cuáles opciones disponibles la permiten.',
  },
  {
    key: 'renting-minimum-term',
    categoryId: 'renting',
    question: '¿Cuál es la duración mínima del contrato de alquiler?',
    answer:
      'La mayoría de nuestros contratos son de 12 meses, aunque también tenemos algunas opciones de corto plazo. Te indicamos las condiciones de cada propiedad específica.',
  },
  {
    key: 'renting-included',
    categoryId: 'renting',
    question: '¿Qué está incluido en el precio del alquiler?',
    answer:
      'Varía según la propiedad — algunas incluyen mantenimiento de áreas comunes, agua o internet. Te damos el detalle exacto de qué incluye cada propiedad antes de que decidas.',
  },

  // Horario y ubicación (4)
  {
    key: 'hours-agency-hours',
    categoryId: 'hours_location',
    question: '¿Cuál es el horario de la agencia?',
    answer: 'Atendemos de lunes a viernes de 8:00 a.m. a 6:00 p.m., y sábados de 9:00 a.m. a 1:00 p.m.',
  },
  {
    key: 'hours-location-parking',
    categoryId: 'hours_location',
    question: '¿Dónde están ubicados y hay estacionamiento disponible?',
    answer:
      'Estamos ubicados en el centro de la ciudad, con estacionamiento gratuito para clientes. Visita nuestro sitio web para la dirección completa y cómo llegar.',
  },
  {
    key: 'hours-after-hours-meeting',
    categoryId: 'hours_location',
    question: '¿Puedo reunirme con un agente fuera de horario?',
    answer:
      'Sí, con cita previa podemos coordinar reuniones fuera del horario regular para adaptarnos a tu disponibilidad.',
  },
  {
    key: 'hours-weekend-showings',
    categoryId: 'hours_location',
    question: '¿Atienden los fines de semana para mostrar propiedades?',
    answer: 'Sí, hacemos visitas los sábados y, en casos puntuales, también los domingos con cita previa.',
  },

  // Propiedades de inversión (4)
  {
    key: 'investment-roi',
    categoryId: 'investment',
    question: '¿Qué retorno de inversión puedo esperar de una propiedad?',
    answer:
      'El retorno varía según la zona, el tipo de propiedad y si es alquiler tradicional o vacacional. Te compartimos datos de rentabilidad de propiedades comparables para que decidas con información real.',
  },
  {
    key: 'investment-rental-potential',
    categoryId: 'investment',
    question: '¿Ayudan a identificar propiedades con potencial de alquiler?',
    answer:
      'Sí, filtramos oportunidades según demanda de alquiler en la zona, plusvalía esperada y costos de mantenimiento para que evalúes el potencial real de cada propiedad.',
  },
  {
    key: 'investment-foreign-investors',
    categoryId: 'investment',
    question: '¿Trabajan con inversionistas extranjeros?',
    answer:
      'Sí, tenemos experiencia guiando a inversionistas extranjeros en todo el proceso, incluyendo documentación, transferencias internacionales y aspectos legales locales.',
  },
  {
    key: 'investment-maintenance-costs',
    categoryId: 'investment',
    question: '¿Qué gastos de mantenimiento debo considerar como inversionista?',
    answer:
      'Generalmente hay que presupuestar mantenimiento general, condominio (si aplica), seguro e impuestos anuales. Te damos un estimado detallado por propiedad.',
  },

  // Construcción nueva (3)
  {
    key: 'new-construction-availability',
    categoryId: 'new_construction',
    question: '¿Tienen proyectos de construcción nueva disponibles?',
    answer:
      'Sí, trabajamos con varios desarrolladores y tenemos proyectos en distintas etapas de construcción. Te mostramos las opciones disponibles según tu presupuesto y zona de interés.',
  },
  {
    key: 'new-construction-customization',
    categoryId: 'new_construction',
    question: '¿Puedo personalizar los acabados en una propiedad nueva?',
    answer:
      'Depende del proyecto y la etapa de construcción en que se encuentre. En varios de nuestros proyectos sí es posible elegir acabados dentro de un catálogo definido por el desarrollador.',
  },
  {
    key: 'new-construction-warranty',
    categoryId: 'new_construction',
    question: '¿Qué garantías ofrecen las propiedades de construcción nueva?',
    answer:
      'Las propiedades nuevas suelen incluir garantía de estructura y de instalaciones por parte del desarrollador. Te compartimos los términos exactos de cada proyecto antes de firmar.',
  },

  // Mercado y precios (3)
  {
    key: 'market-current-conditions',
    categoryId: 'market_pricing',
    question: '¿Cómo está el mercado inmobiliario actualmente?',
    answer:
      'El mercado varía por zona y tipo de propiedad. Con gusto te compartimos un análisis actualizado de la zona que te interesa para que tomes una decisión informada.',
  },
  {
    key: 'market-price-negotiable',
    categoryId: 'market_pricing',
    question: '¿Los precios de las propiedades suelen ser negociables?',
    answer:
      'En muchos casos sí hay margen de negociación, especialmente si la propiedad lleva tiempo en el mercado. Te ayudamos a preparar una oferta razonable basada en datos reales.',
  },
  {
    key: 'market-area-comparison',
    categoryId: 'market_pricing',
    question: '¿Cómo se comparan los precios en esta zona con otras similares?',
    answer:
      'Te compartimos un comparativo de precios por metro cuadrado entre distintas zonas para que entiendas dónde obtienes mejor valor según tus prioridades.',
  },

  // Proceso y legal (3)
  {
    key: 'process-legal-documents',
    categoryId: 'process_legal',
    question: '¿Qué documentos legales se necesitan para cerrar una compra?',
    answer:
      'Generalmente se requiere el contrato de compraventa, certificado de título, cédula o pasaporte, y documentación del financiamiento si aplica. Te acompañamos en cada trámite.',
  },
  {
    key: 'process-notary-registration',
    categoryId: 'process_legal',
    question: '¿Ustedes gestionan el proceso notarial y de registro?',
    answer:
      'Coordinamos con abogados y notarios de confianza para que el proceso de cierre y registro de la propiedad sea claro y sin contratiempos.',
  },
  {
    key: 'process-title-issues',
    categoryId: 'process_legal',
    question: '¿Qué pasa si surgen problemas legales con el título de la propiedad?',
    answer:
      'Antes de cualquier compra verificamos el estado legal del título. Si surge algún inconveniente, te lo comunicamos de inmediato y te asesoramos sobre las opciones antes de continuar.',
  },
]
