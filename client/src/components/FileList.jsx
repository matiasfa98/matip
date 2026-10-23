import FileRow from './FileRow.jsx';
import EmptyState from './EmptyState.jsx';

export default function FileList({ files, loading, search, onStar, onShare, onDownload, onDelete, onPreview }) {
  if (!loading && files.length === 0) {
    return <EmptyState searchActive={!!search} />;
  }
  return (
    <section className="file-list">
      {files.map((f, i) => (
        <FileRow
          key={f._id || f.id}
          file={f}
          index={i}
          onStar={onStar}
          onShare={onShare}
          onDownload={onDownload}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </section>
  );
}