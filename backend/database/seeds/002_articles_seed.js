/**
 * Idempotent Seed: Knowledge Sanctuary Published Articles
 * Inserts or updates articles based on unique slug.
 */
export async function seedArticles(client) {
  console.log('[SEED] Seeding knowledge sanctuary articles...');

  const articles = [
    {
      slug: 'postural-alignment-vs-cardio',
      title: 'Why 20 Minutes of Postural Alignment Beats 2 Hours of Mindless Cardio',
      category: 'SOULFIT RESTORATION',
      author_name: 'Soulfit Guidance',
      reading_time: 5,
      excerpt: 'How structural spinal integrity and breath rhythm reprogram your nervous system out of perpetual fight-or-flight into sustainable restorative vitality.',
      content: `In the modern pursuit of fitness, intensity is often confused with efficacy. We watch busy professionals push through two hours of grueling cardio, running on caffeine and elevated cortisol, only to finish more exhausted, inflamed, and neurologically depleted than when they started.

At Soulfit, our practice reveals an entirely different truth: when your nervous system is trapped in chronic fight-or-flight, high-impact cardiovascular strain signals further danger to your adrenal glands.

Conversely, twenty minutes of deliberate, breath-synchronized somatic postural alignment accomplishes three critical biological resets:
1. Decompression of the vagal nerve along the cervical and thoracic spine.
2. Diaphragmatic down-regulation, lowering baseline resting heart rate and systemic inflammation.
3. Restoring the pelvic floor and spinal alignment so everyday movements feel effortless rather than fatiguing.

Lasting physical vitality is not forged in exhaustion. It is cultured in restoration.`,
      cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      published_at: new Date('2026-11-01T08:00:00Z'),
    },
    {
      slug: 'northeast-water-corner-vastu',
      title: 'The Northeast Water Corner: Why Clutter Here Clouded Your Focus',
      category: 'VASTU PRINCIPLES',
      author_name: 'Soulfit Guidance',
      reading_time: 7,
      excerpt: 'Discover how ancient Vastu texts mapped mental clarity directly to the water-dominated Ishanya quadrant, and how subtle spatial clearing resolves cognitive fog.',
      content: `In classical Vastu Shastra, the Northeast quadrant (Ishanya) is governed by the Water element and represents the crown of spatial consciousness. It is the direction through which subtle cosmic and solar magnetic currents enter a dwelling or office space.

When the Northeast is blocked by heavy metal cabinetry, accumulated clutter, dead storage, or stagnant waste, the energetic resonance of the space becomes dense and stagnant. Residents frequently report:
- Persistent brain fog that resists sleep and nutritional fixes.
- Difficulty making decisive career transitions.
- Disrupted sleep architecture and emotional heaviness.

By applying non-invasive Vastu harmonizing—clearing heavy clutter, introducing clean running water or reflective elements, and allowing unimpeded morning light—the spatial pressure on your subconscious mind lifts, allowing natural cognitive focus to return.`,
      cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      published_at: new Date('2026-10-20T08:00:00Z'),
    },
    {
      slug: 'gut-inflammation-mind-anxiety',
      title: 'Inflammation in the Gut Is Anxiety in the Mind',
      category: 'FOOD AS MEDICINE',
      author_name: 'Soulfit Guidance',
      reading_time: 6,
      excerpt: 'How repairing the enteric nervous system through targeted seed broths and seasonal Ritucharya restores serene emotional states without punitive dieting.',
      content: `The enteric nervous system—often called the 'second brain'—contains over 500 million neurons and produces more than 90 percent of the body's serotonin. When modern eating consists of hyper-processed foods, rapid meal ingestion between meetings, and inflammatory seed oils, the intestinal lining experiences micro-inflammation.

This cellular irritation communicates directly to the brain via the vagus nerve, manifesting as:
- Restless anxiety and racing thoughts without clear psychological triggers.
- Low threshold for frustration and afternoon fatigue crashes.
- Disrupted restorative REM sleep.

Through Food as Medicine and Ayurvedic seasonal eating (Ritucharya), we treat food as bio-fuel. By introducing warm cumin-fennel infusions, soothing whole grains, and restorative healthy fats, we soothe intestinal lining inflammation. When the gut achieves peace, the mind follows.`,
      cover_image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      published_at: new Date('2026-10-05T08:00:00Z'),
    },
  ];

  for (const a of articles) {
    const query = `
      INSERT INTO articles (slug, title, category, author_name, reading_time, excerpt, content, cover_image, status, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        author_name = EXCLUDED.author_name,
        reading_time = EXCLUDED.reading_time,
        excerpt = EXCLUDED.excerpt,
        content = EXCLUDED.content,
        cover_image = EXCLUDED.cover_image,
        status = EXCLUDED.status,
        published_at = EXCLUDED.published_at,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await client.query(query, [
      a.slug,
      a.title,
      a.category,
      a.author_name,
      a.reading_time,
      a.excerpt,
      a.content,
      a.cover_image,
      a.status,
      a.published_at,
    ]);
  }

  console.log('[SEED] Knowledge sanctuary articles seeded successfully ✓');
}

export default seedArticles;
