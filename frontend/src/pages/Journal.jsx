import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import { journalConfig } from '../config/journalConfig';
import { articleService } from '../services/api';
import { Clock, Search, ArrowRight } from 'lucide-react';

const categories = ['ALL', 'SOULFIT RESTORATION', 'VASTU PRINCIPLES', 'FOOD AS MEDICINE'];

export default function Journal() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState(journalConfig);
  const [loading, setLoading] = useState(true);
  const [isLiveFromDb, setIsLiveFromDb] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchFilteredArticles() {
      setLoading(true);
      const params = {};
      if (activeCategory !== 'ALL') {
        params.category = activeCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await articleService.getAll(params);
      if (isMounted) {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            category: a.category || 'HOLISTIC LIVING',
            author: a.author_name || 'Soulfit Guidance',
            readingTime: `${a.reading_time || 5} min read`,
            excerpt: a.excerpt,
            coverImage: a.cover_image,
          }));
          setArticles(normalized);
          setIsLiveFromDb(true);
        } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
          setArticles([]);
          setIsLiveFromDb(true);
        } else {
          // Client-side fallback filter
          const filtered = journalConfig.filter((article) => {
            const matchesCat = activeCategory === 'ALL' || article.category === activeCategory;
            const matchesQuery = !searchQuery.trim() || 
              article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesQuery;
          });
          setArticles(filtered);
          setIsLiveFromDb(false);
        }
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchFilteredArticles();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeCategory, searchQuery]);

  return (
    <div className="py-16 md:py-24 space-y-16 bg-sand">
      <Container size="wide">
        {/* Header */}
        <SectionHeading
          overline="Knowledge Sanctuary"
          title="Reflections on Rest, Calm &amp;"
          titleAccent="Conscious Vitality"
          description="Explore perspectives on restorative yoga, spatial alignment, biological rhythms, and the art of taking time for yourself."
          className="mb-12"
        />

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto mb-12">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeCategory === cat
                    ? 'bg-forest text-sand-light shadow-sm'
                    : 'bg-sand-50 text-forest/75 border border-forest/15 hover:bg-forest/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-forest/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-sand-50 border border-forest/15 text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>

        {/* Database Status Indicator */}
        {isLiveFromDb && (
          <div className="text-center -mt-6 mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Connected to PostgreSQL Knowledge Archive
            </span>
          </div>
        )}

        {/* Articles Grid / Loading Skeleton / Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-sand-50 rounded-2xl border border-forest/10 p-6 animate-pulse space-y-4">
                <div className="aspect-[16/10] bg-forest/5 rounded-xl" />
                <div className="h-6 bg-forest/10 rounded w-3/4" />
                <div className="h-4 bg-forest/5 rounded w-full" />
                <div className="h-4 bg-forest/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.id || article.slug}
                className="group bg-sand-50 rounded-2xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-normal flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-slow group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-bold bg-sand-50/95 backdrop-blur-sm text-forest border border-forest/20 shadow-sm">
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl text-forest font-normal leading-snug mb-3 group-hover:text-forest-light transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-forest/75 font-light leading-relaxed mb-6 line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-forest/10 flex items-center justify-between text-xs text-forest/70">
                    <div className="flex items-center gap-2">
                      <span className="font-serif italic text-forest font-medium">{article.author}</span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {article.readingTime}
                      </span>
                    </div>

                    <Link
                      to="/#consultation"
                      className="font-bold text-forest group-hover:underline inline-flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sand-50 rounded-2xl border border-forest/15 max-w-md mx-auto space-y-3">
            <h4 className="font-serif text-2xl text-forest">No Reflections Found</h4>
            <p className="text-xs text-forest/70">Try adjusting your search terms or category selection.</p>
            <button
              type="button"
              onClick={() => { setActiveCategory('ALL'); setSearchQuery(''); }}
              className="text-xs uppercase tracking-widest text-forest font-bold underline pt-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}
