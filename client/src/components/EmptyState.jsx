import { IconFile } from './Icons.jsx';

export default function EmptyState({ searchActive }) {
  return (
    <div className="empty">
      <div className="empty-icon"><IconFile /></div>
      <p>{searchActive ? 'No matches' : 'Nothing here yet.'}</p>
      <span>
        {searchActive
          ? 'Try a different search.'
          : 'The vault opens the moment you seal something.'}
      </span>
    </div>
  );
}