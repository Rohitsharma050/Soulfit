/**
 * Consultation Types & Default Weekly Availability Seeds
 */
export async function seedConsultationData(client) {
  console.log('[SEED] Seeding consultation types and availability rules...');

  // 1. Seed Consultation Types
  const consultationTypes = [
    {
      slug: 'yoga-wellness',
      name: 'Restorative Yoga Therapy & Physical Alignment',
      description: 'Personalized 1-on-1 restorative yoga guidance focusing on rest, calm, physical vitality, and management of conditions including PCOD, diabetes, and hypertension, as well as prenatal/postnatal care.',
      duration_minutes: 60,
      buffer_minutes: 15,
      price_display: 'Complimentary Initial Sanctuary Session',
      display_order: 1,
      is_active: true,
    },
    {
      slug: 'vastu-architecture',
      name: 'Vastu & Five Elements Spatial Assessment',
      description: 'Comprehensive analysis of home or workspace directional geometry, subtle energy pathways, and five-element harmonization.',
      duration_minutes: 60,
      buffer_minutes: 15,
      price_display: 'Complimentary Sanctuary Guidance',
      display_order: 2,
      is_active: true,
    },
    {
      slug: 'astrology-cosmic',
      name: 'Cosmic Blueprint & Astrology Consultation',
      description: 'Natal chart decoding, planetary timing insights, and cosmic life cycle alignment for career, health, and personal evolution.',
      duration_minutes: 45,
      buffer_minutes: 15,
      price_display: 'Complimentary Sanctuary Guidance',
      display_order: 3,
      is_active: true,
    },
    {
      slug: 'corporate-wellbeing',
      name: 'Corporate Wellbeing Strategy Session',
      description: 'Tailored consultation for organizations seeking sustainable team vitality, ergonomics, mental clarity, and executive stress mitigation.',
      duration_minutes: 45,
      buffer_minutes: 15,
      price_display: 'Tailored Executive Program',
      display_order: 4,
      is_active: true,
    },
    {
      slug: 'food-medicine',
      name: 'Holistic Nutrition & Food as Medicine',
      description: 'Nutritional harmony assessment, seasonal eating practices, and cellular nourishment rooted in ancient restorative wisdom.',
      duration_minutes: 45,
      buffer_minutes: 15,
      price_display: 'Cellular Vitality Guidance',
      display_order: 5,
      is_active: true,
    },
  ];

  for (const type of consultationTypes) {
    await client.query(
      `
      INSERT INTO consultation_types (
        slug, name, description, duration_minutes, buffer_minutes, price_display, display_order, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        duration_minutes = EXCLUDED.duration_minutes,
        buffer_minutes = EXCLUDED.buffer_minutes,
        price_display = EXCLUDED.price_display,
        display_order = EXCLUDED.display_order,
        is_active = EXCLUDED.is_active;
    `,
      [
        type.slug,
        type.name,
        type.description,
        type.duration_minutes,
        type.buffer_minutes,
        type.price_display,
        type.display_order,
        type.is_active,
      ]
    );
  }

  // 2. Seed Weekly Availability Rules (Monday to Saturday: 09:00 to 18:00 with lunch break 13:00-14:00)
  // Check if rules exist to avoid duplicate inserts
  const existingRules = await client.query('SELECT COUNT(*) FROM availability_rules;');
  if (parseInt(existingRules.rows[0].count, 10) === 0) {
    const rules = [
      { day: 1, start: '09:00:00', end: '18:00:00', bStart: '13:00:00', bEnd: '14:00:00', active: true }, // Monday
      { day: 2, start: '09:00:00', end: '18:00:00', bStart: '13:00:00', bEnd: '14:00:00', active: true }, // Tuesday
      { day: 3, start: '09:00:00', end: '18:00:00', bStart: '13:00:00', bEnd: '14:00:00', active: true }, // Wednesday
      { day: 4, start: '09:00:00', end: '18:00:00', bStart: '13:00:00', bEnd: '14:00:00', active: true }, // Thursday
      { day: 5, start: '09:00:00', end: '18:00:00', bStart: '13:00:00', bEnd: '14:00:00', active: true }, // Friday
      { day: 6, start: '09:00:00', end: '17:00:00', bStart: '13:00:00', bEnd: '14:00:00', active: true }, // Saturday
      { day: 0, start: '09:00:00', end: '17:00:00', bStart: null, bEnd: null, active: false },             // Sunday (Closed)
    ];

    for (const rule of rules) {
      await client.query(
        `
        INSERT INTO availability_rules (
          consultation_type_id, day_of_week, start_time, end_time, break_start, break_end, is_active
        )
        VALUES (NULL, $1, $2, $3, $4, $5, $6);
      `,
        [rule.day, rule.start, rule.end, rule.bStart, rule.bEnd, rule.active]
      );
    }
  }

  console.log('[SEED] Consultation types and availability rules seeded successfully ✓');
}

export default seedConsultationData;
