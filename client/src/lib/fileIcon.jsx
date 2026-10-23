const wrap = (children) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const ICONS = {
  image: wrap(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  video: wrap(
    <>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </>
  ),
  audio: wrap(
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  pdf: wrap(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>
  ),
  archive: wrap(
    <>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </>
  ),
  code: wrap(
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  ),
  doc: wrap(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </>
  ),
  sheet: wrap(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="12" y1="13" x2="12" y2="17" />
    </>
  ),
  generic: wrap(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
};

export function getFileIcon(name = '', resourceType = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();

  if (resourceType === 'image') return ICONS.image;
  if (resourceType === 'video') return ICONS.video;
  if (resourceType === 'audio') return ICONS.audio;

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return ICONS.image;
  if (['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'].includes(ext)) return ICONS.video;
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return ICONS.audio;
  if (ext === 'pdf') return ICONS.pdf;
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return ICONS.archive;
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'html', 'css', 'json', 'yml', 'yaml', 'sh', 'ps1'].includes(ext)) return ICONS.code;
  if (['doc', 'docx', 'txt', 'md', 'rtf', 'odt'].includes(ext)) return ICONS.doc;
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return ICONS.sheet;

  return ICONS.generic;
}

export function getFileKind(name = '', resourceType = '') {
  const ext = (name.split('.').pop() || '').toUpperCase();
  if (ext && ext.length <= 5) return ext;
  if (resourceType) return resourceType.slice(0, 3).toUpperCase();
  return 'FILE';
}