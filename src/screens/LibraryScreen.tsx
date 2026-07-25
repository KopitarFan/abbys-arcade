import { Check, Download, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CatalogItem, Platform } from '../api';
import { GameIcon } from '../components/GameIcon';
import { InputBadges } from '../components/InputBadges';

type Filter = 'all' | Platform;

export function LibraryScreen({ items, onInstall }: { items: CatalogItem[]; onInstall: (item: CatalogItem) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => items.filter((item) => (filter === 'all' || item.platform === filter) && item.title.toLowerCase().includes(query.toLowerCase())), [filter, items, query]);

  return (
    <section className="screen-content" aria-labelledby="library-title">
      <div className="title-row">
        <div><div className="eyebrow"><ShieldCheck aria-hidden="true" /> Grown-up approved</div><h1 id="library-title">Discover something magical</h1></div>
        <label className="search-box"><Search aria-hidden="true" /><span className="sr-only">Search games</span><input data-arcade-focus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games" /></label>
      </div>
      <div className="safety-banner"><ShieldCheck aria-hidden="true" /><span><strong>Everything here is ready for this device.</strong> No surprise purchases or unapproved downloads.</span></div>
      <div className="filter-row" aria-label="Filter by platform">
        {(['all', 'amiga', 'n64', 'dos', 'created'] as Filter[]).map((value) => (
          <button className={filter === value ? 'filter-chip is-active' : 'filter-chip'} data-arcade-focus key={value} onClick={() => setFilter(value)}>{value === 'created' ? 'Free creations' : value.toUpperCase()}</button>
        ))}
      </div>
      <div className="catalog-list" aria-live="polite">
        {visible.map((item) => (
          <article className="catalog-row" key={item.id}>
            <GameIcon game={item} />
            <div className="catalog-copy"><div className="catalog-title"><h2>{item.title}</h2><span>{item.ageLabel}</span></div><p>{item.description}</p><div className="catalog-meta"><span>{item.platform.toUpperCase()}</span><span>{item.sourceLabel}</span><InputBadges inputs={item.inputs} /></div></div>
            {item.installState === 'installed' ? (
              <span className="installed-label"><Check aria-hidden="true" /> Installed</span>
            ) : item.installState === 'installing' ? (
              <div className="install-progress" aria-label={`Installing ${item.title}`}><span>{item.installProgress ?? 0}%</span><progress value={item.installProgress ?? 0} max="100" /></div>
            ) : (
              <button className="secondary-button" data-arcade-focus onClick={() => onInstall(item)}><Download aria-hidden="true" /> Add</button>
            )}
          </article>
        ))}
        {!visible.length && <div className="empty-state"><h2>No games found</h2><p>Try a different word or platform.</p></div>}
      </div>
    </section>
  );
}
