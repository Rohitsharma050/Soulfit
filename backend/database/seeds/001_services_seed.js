/**
 * Idempotent Seed: 5 Core Wellness Pillars
 * Inserts or updates services based on unique slug.
 */
export async function seedServices(client) {
  console.log('[SEED] Seeding 5 core wellness pillars...');

  const services = [
    {
      slug: 'yoga-wellness',
      title: 'Gym & Yoga as a Way of Life',
      category: 'Physical Mastery & Restoration',
      short_description: 'Restorative yoga, somatic movement, and tailored fitness programs designed to relieve fatigue and manage lifetime health conditions.',
      description: 'Soulfit bridges the gap between fast-paced modern life and bodily recovery. With over a decade of deep practice, we guide individuals of all stages through restorative yoga, somatic awareness, weight balance, and condition management (PCOD, Diabetes, Hypertension).',
      image_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
      icon_name: 'Activity',
      offerings: JSON.stringify([
        'Restorative Yoga & Somatic Stress Release',
        'Lifetime Disorder Management (PCOD, Diabetes, Hypertension)',
        'Prenatal, Postnatal & Fertility Yoga',
        'Functional Strength & Flexibility for Everyday Life',
        'Women Safety Martial Arts & Grounded Self-Defense',
      ]),
      is_featured: true,
      is_active: true,
      display_order: 1,
    },
    {
      slug: 'vastu',
      title: 'Five Elements & Spatial Geometry',
      category: 'Spatial Geometry & Balance',
      short_description: 'Aligning living and working spaces with natural directional energies and the five elements to cultivate mental clarity and peaceful living.',
      description: 'Your physical environment directly conditions your subconscious mind. Through traditional Vastu principles and spatial geometry, we analyze elemental orientations to eliminate energetic friction without invasive destruction.',
      image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      icon_name: 'Compass',
      offerings: JSON.stringify([
        'Comprehensive Home & Apartment Spatial Analysis',
        'Elemental Zoning (Earth, Water, Fire, Air, Space)',
        'Northeast (Ishanya) Water & Clarity Restoration',
        'Office, Studio & Executive Workspace Calibration',
        'Non-Invasive Remedial Balancing & Geometry Harmonization',
      ]),
      is_featured: false,
      is_active: true,
      display_order: 2,
    },
    {
      slug: 'astrology',
      title: 'Cosmic Blueprint & Conscious Timing',
      category: 'Cosmic Wisdom & Transits',
      short_description: 'Unpack your planetary blueprint and transit cycles to navigate career, personal crossroads, and life transitions with conscious timing.',
      description: 'Astrology is not fatalistic prediction; it is cosmic meteorology. By studying planetary placements and energetic cycles, we help you understand your unique strengths, karmic rhythms, and optimal windows for decisive action.',
      image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      icon_name: 'Moon',
      offerings: JSON.stringify([
        'Natal Birth Chart & Elemental Temperament Reading',
        'Planetary Transits (Gochar) & Mahadasha Cycle Analysis',
        'Strategic Decision Timing for Career & Life Shifts',
        'Remedial Lifestyle & Meditative Cosmic Alignments',
      ]),
      is_featured: false,
      is_active: true,
      display_order: 3,
    },
    {
      slug: 'corporate-wellbeing',
      title: 'Holistic Wellness for Organizations',
      category: 'Organizational Harmony',
      short_description: 'Workplace restorative programs, stress reduction workshops, and executive wellness designed for sustainable team performance.',
      description: 'Burnout is not a personal failure; it is a structural imbalance. We design bespoke corporate wellness sessions that integrate restorative movement, mindful breathing between meetings, and ergonomic self-care.',
      image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      icon_name: 'Building2',
      offerings: JSON.stringify([
        'Signature "Breathe In" Breathwork & Calm Sessions',
        'Desk-Bound Restorative Yoga & Spine Alignment',
        'Corporate Nutrition & Sustained Energy Workshops',
        'Executive Stress Reduction & Somatic Regulation',
        'Workplace Self-Defense & Personal Safety Seminars',
      ]),
      is_featured: false,
      is_active: true,
      display_order: 4,
    },
    {
      slug: 'food-as-medicine',
      title: 'Systemic Nourishment & Bio-Fuel',
      category: 'Cellular Vitality & Bio-Fuel',
      short_description: 'Nutritional wisdom grounded in cellular health, anti-inflammatory whole foods, and Ayurvedic seasonal rhythms (Ritucharya).',
      description: 'Every meal is biochemical code communicated directly to your cells. We discard punitive dieting in favor of bio-available, seasonal nourishment that restores digestive fire (Agni), heals the gut, and dissolves inflammation.',
      image_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
      icon_name: 'Apple',
      offerings: JSON.stringify([
        'The "Input Returns To You" Nutritional Assessment',
        'Ritucharya (Seasonal & Circadian Eating Synchronization)',
        'Anti-Inflammatory Gut-Biome Restoration Protocols',
        'Mindful Food Preparation & Bio-Availability Practices',
      ]),
      is_featured: false,
      is_active: true,
      display_order: 5,
    },
  ];

  for (const s of services) {
    const query = `
      INSERT INTO services (slug, title, category, short_description, description, image_url, icon_name, offerings, is_featured, is_active, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        short_description = EXCLUDED.short_description,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        icon_name = EXCLUDED.icon_name,
        offerings = EXCLUDED.offerings,
        is_featured = EXCLUDED.is_featured,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await client.query(query, [
      s.slug,
      s.title,
      s.category,
      s.short_description,
      s.description,
      s.image_url,
      s.icon_name,
      s.offerings,
      s.is_featured,
      s.is_active,
      s.display_order,
    ]);
  }

  console.log('[SEED] 5 wellness pillars seeded successfully ✓');
}

export default seedServices;
