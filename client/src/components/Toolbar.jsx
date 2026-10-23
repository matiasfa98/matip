import { IconSearch, IconRefresh } from './Icons.jsx';

export default function Toolbar({ search, setSearch, sort, setSort, onRefresh, loading }) {
  return (
    <div className="toolbar">
      <h2>In your vault</h2>
      <div className="toolbar-actions">
        <div className="search-box">
          <IconSearch />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')} title="Clear">×</button>
          )}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="sort-select">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
          <option value="size">Largest</option>
        </select>
        <button className="ghost sm" onClick={onRefresh} disabled={loading}>
          <IconRefresh /><span>{loading ? 'Syncing…' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}