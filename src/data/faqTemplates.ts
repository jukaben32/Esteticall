// Static library shown in the "FAQ Templates" panel of the Knowledge page —
// a pre-written 40-question library across 9 medspa/aesthetic-clinic topics.
// `key` is persisted on the created knowledge_documents row (as `catalog_key`)
// so we can tell "already added" apart from a coincidentally-similar custom
// question.

export type FaqCategoryId =
  | 'appointments'
  | 'facial_treatments'
  | 'body_treatments'
  | 'injectables'
  | 'laser_hair_removal'
  | 'hours_location'
  | 'packages_memberships'
  | 'safety_contraindications'
  | 'payments_policies'

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
  { id: 'appointments', label: 'Citas' },
  { id: 'facial_treatments', label: 'Tratamientos faciales' },
  { id: 'body_treatments', label: 'Tratamientos corporales' },
  { id: 'injectables', label: 'Toxina botulínica y rellenos' },
  { id: 'laser_hair_removal', label: 'Depilación láser' },
  { id: 'hours_location', label: 'Horario y ubicación' },
  { id: 'packages_memberships', label: 'Paquetes y membresías' },
  { id: 'safety_contraindications', label: 'Seguridad y contraindicaciones' },
  { id: 'payments_policies', label: 'Pagos y políticas' },
]

export const FAQ_TEMPLATES: FaqTemplate[] = [
  // Citas (6)
  {
    key: 'appointments-schedule',
    categoryId: 'appointments',
    question: '¿Cómo agendo una cita?',
    answer:
      'Puedes agendar directamente por teléfono, por nuestro chat o pidiéndole a nuestro agente de IA que te reserve un horario. Solo necesitamos el tratamiento que te interesa y tu disponibilidad.',
  },
  {
    key: 'appointments-cancellation',
    categoryId: 'appointments',
    question: '¿Cuál es su política de cancelación de citas?',
    answer:
      'Puedes cancelar o reprogramar sin costo con al menos 24 horas de anticipación. Te lo agradecemos para poder ofrecer ese horario a otro paciente.',
  },
  {
    key: 'appointments-duration',
    categoryId: 'appointments',
    question: '¿Cuánto dura normalmente una cita?',
    answer:
      'Depende del tratamiento — desde 20 minutos para una sesión de láser hasta 90 minutos para tratamientos combinados. Te confirmamos la duración exacta al agendar.',
  },
  {
    key: 'appointments-first-visit',
    categoryId: 'appointments',
    question: '¿Qué debo esperar en mi primera cita?',
    answer:
      'Comenzamos con una valoración inicial donde revisamos tus objetivos, antecedentes de salud relevantes y te recomendamos el tratamiento adecuado antes de proceder.',
  },
  {
    key: 'appointments-reminders',
    categoryId: 'appointments',
    question: '¿Me envían recordatorio de mi cita?',
    answer:
      'Sí, enviamos un recordatorio automático por WhatsApp o correo antes de tu cita para que no se te olvide.',
  },
  {
    key: 'appointments-late-arrival',
    categoryId: 'appointments',
    question: '¿Qué pasa si llego tarde a mi cita?',
    answer:
      'Intentamos acomodarte, pero una tardanza puede reducir el tiempo disponible para tu tratamiento o requerir reprogramar, según la agenda del día.',
  },

  // Tratamientos faciales (5)
  {
    key: 'facial-hydrafacial',
    categoryId: 'facial_treatments',
    question: '¿Qué es un HydraFacial y qué beneficios tiene?',
    answer:
      'Es un tratamiento de limpieza, exfoliación e hidratación profunda en una sola sesión, ideal para revitalizar la piel sin tiempo de recuperación.',
  },
  {
    key: 'facial-frequency',
    categoryId: 'facial_treatments',
    question: '¿Cada cuánto debo hacerme un facial?',
    answer:
      'Recomendamos un facial de mantenimiento cada 4 a 6 semanas, aunque esto varía según tu tipo de piel y objetivos — te lo confirmamos en tu valoración.',
  },
  {
    key: 'facial-downtime',
    categoryId: 'facial_treatments',
    question: '¿Los faciales médicos tienen tiempo de recuperación?',
    answer:
      'La mayoría no requiere tiempo de recuperación y puedes retomar tus actividades normales de inmediato. Tratamientos más intensos como el peeling profundo sí pueden causar enrojecimiento temporal.',
  },
  {
    key: 'facial-acne',
    categoryId: 'facial_treatments',
    question: '¿Tienen tratamientos para el acné?',
    answer:
      'Sí, ofrecemos limpieza profunda, microneedling y terapia de luz LED, entre otros, diseñados para mejorar el acné activo y sus cicatrices.',
  },
  {
    key: 'facial-results',
    categoryId: 'facial_treatments',
    question: '¿Cuándo veré resultados de un tratamiento facial?',
    answer:
      'Algunos tratamientos muestran mejoras inmediatas (como el HydraFacial), mientras que otros como el microneedling requieren varias sesiones para ver el resultado completo.',
  },

  // Tratamientos corporales (5)
  {
    key: 'body-criolipolisis',
    categoryId: 'body_treatments',
    question: '¿Cómo funciona la criolipólisis?',
    answer:
      'Utiliza frío controlado para eliminar células de grasa localizada de forma no invasiva. Los resultados suelen notarse entre 4 y 12 semanas después de la sesión.',
  },
  {
    key: 'body-sessions-needed',
    categoryId: 'body_treatments',
    question: '¿Cuántas sesiones necesito para ver resultados corporales?',
    answer:
      'Depende del tratamiento y tu objetivo — algunos pacientes ven cambios desde la primera sesión, aunque generalmente recomendamos un plan de varias sesiones para resultados óptimos.',
  },
  {
    key: 'body-not-weight-loss',
    categoryId: 'body_treatments',
    question: '¿Los tratamientos corporales sirven para bajar de peso?',
    answer:
      'No — están diseñados para reducir grasa localizada o reafirmar la piel, no como método de pérdida de peso general. Te explicamos qué esperar de forma realista antes de empezar.',
  },
  {
    key: 'body-post-care',
    categoryId: 'body_treatments',
    question: '¿Qué cuidados debo tener después de un tratamiento corporal?',
    answer:
      'En general recomendamos hidratación abundante, evitar exposición solar directa en la zona tratada y seguir las indicaciones específicas que te damos al finalizar la sesión.',
  },
  {
    key: 'body-combine-treatments',
    categoryId: 'body_treatments',
    question: '¿Puedo combinar varios tratamientos corporales?',
    answer:
      'Sí, muchos pacientes combinan tratamientos (por ejemplo, radiofrecuencia con presoterapia) para potenciar resultados. Te armamos un plan personalizado en tu consulta.',
  },

  // Toxina botulínica y rellenos (5)
  {
    key: 'injectables-how-long',
    categoryId: 'injectables',
    question: '¿Cuánto dura el efecto de la toxina botulínica?',
    answer:
      'El efecto suele durar entre 3 y 4 meses, después de los cuales el músculo recupera su movimiento gradual y es momento de una nueva sesión si deseas mantener el resultado.',
  },
  {
    key: 'injectables-pain',
    categoryId: 'injectables',
    question: '¿Duele la aplicación de toxina botulínica o rellenos?',
    answer:
      'La mayoría de los pacientes describe una molestia leve, similar a un pellizco. Usamos agujas muy finas y, si lo prefieres, podemos aplicar anestésico tópico antes del procedimiento.',
  },
  {
    key: 'injectables-when-results',
    categoryId: 'injectables',
    question: '¿Cuándo veré los resultados de la toxina botulínica?',
    answer:
      'El efecto comienza a notarse entre 3 y 7 días después de la aplicación, con el resultado completo visible alrededor de las 2 semanas.',
  },
  {
    key: 'injectables-filler-duration',
    categoryId: 'injectables',
    question: '¿Cuánto duran los rellenos de ácido hialurónico?',
    answer:
      'Generalmente entre 6 y 18 meses, dependiendo de la zona tratada, el producto usado y el metabolismo de cada paciente.',
  },
  {
    key: 'injectables-who-applies',
    categoryId: 'injectables',
    question: '¿Quién aplica la toxina botulínica y los rellenos?',
    answer:
      'Todos nuestros procedimientos inyectables son realizados por personal médico calificado y con experiencia en medicina estética.',
  },

  // Depilación láser (4)
  {
    key: 'laser-sessions-needed',
    categoryId: 'laser_hair_removal',
    question: '¿Cuántas sesiones de depilación láser necesito?',
    answer:
      'En promedio recomendamos entre 6 y 8 sesiones, espaciadas según el ciclo de crecimiento del vello, para obtener una reducción duradera.',
  },
  {
    key: 'laser-pre-care',
    categoryId: 'laser_hair_removal',
    question: '¿Cómo debo prepararme antes de una sesión de láser?',
    answer:
      'Evita la exposición solar directa, no te depiles con cera o pinza (rasurar sí está bien) y llega con la piel limpia, sin cremas ni maquillaje en la zona a tratar.',
  },
  {
    key: 'laser-skin-tones',
    categoryId: 'laser_hair_removal',
    question: '¿La depilación láser funciona en todos los tonos de piel?',
    answer:
      'Contamos con tecnología apta para distintos fototipos de piel. En tu valoración evaluamos tu tono de piel y color de vello para confirmar que el tratamiento es adecuado para ti.',
  },
  {
    key: 'laser-permanent',
    categoryId: 'laser_hair_removal',
    question: '¿La depilación láser es permanente?',
    answer:
      'Produce una reducción duradera y significativa del vello, aunque algunos pacientes requieren sesiones de mantenimiento ocasionales según su ciclo hormonal y tipo de vello.',
  },

  // Horario y ubicación (4)
  {
    key: 'hours-clinic-hours',
    categoryId: 'hours_location',
    question: '¿Cuál es el horario de la clínica?',
    answer: 'Atendemos de lunes a viernes de 9:00 a.m. a 7:00 p.m., y sábados de 9:00 a.m. a 2:00 p.m.',
  },
  {
    key: 'hours-location-parking',
    categoryId: 'hours_location',
    question: '¿Dónde están ubicados y hay estacionamiento disponible?',
    answer:
      'Estamos ubicados en el centro de la ciudad, con estacionamiento disponible para pacientes. Visita nuestro sitio web para la dirección completa y cómo llegar.',
  },
  {
    key: 'hours-weekend-appointments',
    categoryId: 'hours_location',
    question: '¿Atienden los fines de semana?',
    answer: 'Sí, tenemos disponibilidad los sábados y, en casos puntuales, también domingos con cita previa.',
  },
  {
    key: 'hours-parking-accessibility',
    categoryId: 'hours_location',
    question: '¿La clínica es accesible para personas con movilidad reducida?',
    answer: 'Sí, nuestras instalaciones cuentan con acceso adaptado. Avísanos si necesitas alguna facilidad adicional.',
  },

  // Paquetes y membresías (4)
  {
    key: 'packages-what-are',
    categoryId: 'packages_memberships',
    question: '¿Qué incluyen los paquetes de sesiones?',
    answer:
      'Un paquete agrupa varias sesiones del mismo tratamiento (por ejemplo, 6 sesiones de láser) a un precio preferencial frente a pagarlas una por una.',
  },
  {
    key: 'packages-expiration',
    categoryId: 'packages_memberships',
    question: '¿Los paquetes tienen fecha de vencimiento?',
    answer:
      'Sí, cada paquete tiene una vigencia (generalmente entre 6 y 12 meses) para usar todas sus sesiones. Te la confirmamos al momento de la compra.',
  },
  {
    key: 'packages-transferable',
    categoryId: 'packages_memberships',
    question: '¿Puedo transferir mi paquete a otra persona?',
    answer:
      'Depende del tipo de paquete — contáctanos con tu caso específico y te confirmamos si es transferible.',
  },
  {
    key: 'packages-remaining-sessions',
    categoryId: 'packages_memberships',
    question: '¿Cómo sé cuántas sesiones me quedan de mi paquete?',
    answer:
      'Puedes preguntarnos en cualquier momento por teléfono, WhatsApp o en tu portal de paciente, donde verás tus sesiones usadas y restantes.',
  },

  // Seguridad y contraindicaciones (4)
  {
    key: 'safety-pregnancy',
    categoryId: 'safety_contraindications',
    question: '¿Puedo hacerme tratamientos estéticos si estoy embarazada o lactando?',
    answer:
      'La mayoría de los tratamientos inyectables, láser y algunos corporales no se recomiendan durante el embarazo o la lactancia. Siempre preguntamos antes de agendar tratamientos sensibles y te orientamos sobre alternativas seguras.',
  },
  {
    key: 'safety-allergies',
    categoryId: 'safety_contraindications',
    question: '¿Qué pasa si tengo alergias o tomo medicamentos?',
    answer:
      'Es importante que nos informes cualquier alergia o medicamento que tomes antes de tu tratamiento, ya que algunos pueden requerir ajustes o contraindicar ciertos procedimientos.',
  },
  {
    key: 'safety-side-effects',
    categoryId: 'safety_contraindications',
    question: '¿Cuáles son los efectos secundarios más comunes?',
    answer:
      'Varían según el tratamiento — enrojecimiento leve, sensibilidad temporal o hinchazón son los más comunes y suelen resolverse en horas o pocos días. Te explicamos los riesgos específicos de tu tratamiento antes de proceder.',
  },
  {
    key: 'safety-medical-consultation',
    categoryId: 'safety_contraindications',
    question: '¿Necesito consulta médica antes de un tratamiento invasivo?',
    answer:
      'Sí, tratamientos como toxina botulínica, rellenos o hilos tensores requieren una valoración médica previa para confirmar que eres candidato adecuado.',
  },

  // Pagos y políticas (3)
  {
    key: 'payments-methods',
    categoryId: 'payments_policies',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito/débito, transferencia bancaria y efectivo. Algunos tratamientos también admiten pago en línea al agendar.',
  },
  {
    key: 'payments-no-show',
    categoryId: 'payments_policies',
    question: '¿Qué pasa si no asisto a mi cita sin avisar?',
    answer:
      'Una inasistencia sin aviso puede generar un cargo o afectar la disponibilidad para reagendar. Te pedimos avisar con al menos 24 horas de anticipación si necesitas cancelar.',
  },
  {
    key: 'payments-refunds',
    categoryId: 'payments_policies',
    question: '¿Puedo pedir reembolso de un paquete no utilizado?',
    answer:
      'Evaluamos cada caso de forma individual según las sesiones ya utilizadas y el tiempo transcurrido desde la compra. Contáctanos y te damos una respuesta clara.',
  },
]
