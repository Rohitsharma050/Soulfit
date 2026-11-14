import React, { useState, useEffect } from 'react';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import { journalConfig } from '../config/journalConfig';
import { articleService } from '../services/api';
import { Clock, Search, BookOpen, Loader2 } from 'lucide-react';

export default function Journal() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState(journalConfig);
  const [loading, setLoading] = useState(true);
  const [isLiveFromDb, setIsLiveFromDb] = useState(false);

  const categories = ['ALL', 'SOULFIT & MIND', 'VASTU PRINCIPLES', 'FOOD AS MEDICINE'];

  useEffect(() => {
    let isMounted = true;
    async function loadArticles() {
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
            author: a.author_name || 'Rashmi',
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
            const matchesSearch = !searchQuery.trim() ||
              article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
          });
          setArticles(filtered);
          setIsLiveFromDb(false);
        }
        setLoading(false);
      }
    }

    const timer = setTimeout(loadArticles, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeCategory, searchQuery]);

  return (
    <div className="py-16 md:py-24 space-y-16">
      <Container size="wide">
        <SectionHeading
          overline="Knowledge Sanctuary"
          title="Thoughts for a More"
          titleAccent="Conscious Life"
          description="Explore reflections on holistic wellness, ancient spatial wisdom, systemic nourishment, and the art of balanced living."
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
                    ? 'bg-forest text-sand-light'
                    : 'bg-sand-50 text-forest/75 border border-beige hover:bg-beige/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-olive absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-sand-50 border border-beige text-forest placeholder:text-olive/60 focus:outline-none focus:ring-2 focus:ring-terracotta"
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
              <div key={n} className="bg-sand-50 rounded-2xl border border-beige/60 p-6 animate-pulse space-y-4">
                <div className="aspect-[16/10] bg-beige/40 rounded-xl" />
                <div className="h-6 bg-beige/40 rounded w-3/4" />
                <div className="h-4 bg-beige/30 rounded w-full" />
                <div className="h-4 bg-beige/30 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.id || article.slug}
                className="group bg-sand-50 rounded-2xl border border-beige/80 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-normal flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-slow group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-semibold bg-sand-50/95 backdrop-blur-sm text-terracotta border border-beige shadow-sm">
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl text-forest font-normal leading-snug mb-3 group-hover:text-terracotta transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-forest/75 font-light leading-relaxed mb-6">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-beige/60 flex items-center justify-between text-xs text-olive">
                    <span className="font-serif italic text-forest">By {article.author}</span>
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {article.readingTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sand-50 rounded-2xl border border-beige max-w-md mx-auto">
            <BookOpen className="w-10 h-10 text-olive mx-auto mb-3 opacity-60" />
            <h4 className="font-serif text-xl text-forest font-medium">No Articles Found</h4>
            <p className="text-xs text-olive font-light mt-1 mb-4">
              Try adjusting your search terms or filter category.
            </p>
            <button
              onClick={() => { setActiveCategory('ALL'); setSearchQuery(''); }}
              className="text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}
