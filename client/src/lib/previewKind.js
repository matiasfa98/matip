// Classifies a file into a preview strategy:
//   'image'  → <img>
//   'video'  → <video>
//   'pdf'    → <iframe>
//   'text'   → fetch content, show in <pre>
//   'audio'  → <audio>  (bonus, small addition)
//   'none'   → download only
//
// Binary program files are explicitly excluded from 'text'.

const TEXT_EXTS = new Set([
  // plain text
  'txt', 'md', 'markdown', 'log', 'rtf',
  // data
  'json', 'yaml', 'yml', 'xml', 'toml', 'ini', 'conf', 'env',
  'csv', 'tsv',
  // code
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift',
  'c', 'cpp', 'h', 'hpp', 'cs', 'php',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
  'sql', 'graphql', 'gql',
  'vue', 'svelte',
  'dockerfile', 'makefile', 'gitignore', 'gitattributes',
  'lock',
]);

const BINARY_EXTS = new Set([
  // programs / binaries — never preview
  'exe', 'dll', 'so', 'dylib', 'bin', 'out', 'app',
  'apk', 'appx', 'msi', 'deb', 'rpm', 'pkg', 'dmg',
  'iso', 'img',
  // archives (already covered by archive icon, but be explicit)
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst',
  // office docs (not text — they're zip-container XML)
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  // media that isn't natively previewable via <video>/<audio>
  'mkv', 'avi', 'flv', 'wmv', 'mov',
  // images that aren't universally supported
  'tiff', 'tif', 'psd', 'ai', 'eps', 'raw', 'heic',
]);

// Max bytes to fetch for a text preview — prevents a 400 MB log file from
// blowing up the browser. 1 MB is plenty for code and snippets.
export const MAX_TEXT_BYTES = 1_000_000;

function extOf(name = '') {
  const base = name.split('/').pop().split('\\').pop();
  if (!base.includes('.')) return base.toLowerCase(); // e.g. "Dockerfile"
  return base.split('.').pop().toLowerCase();
}

export function classifyFile(file) {
  const name = file.originalName || '';
  const ext = extOf(name);
  const type = file.resourceType;

  if (type === 'image') {
    if (['tiff', 'tif', 'psd', 'heic', 'raw'].includes(ext)) return 'none';
    return 'image';
  }
  if (type === 'video') {
    if (['mkv', 'avi', 'flv', 'wmv'].includes(ext)) return 'none';
    return 'video';
  }
  if (type === 'audio') return 'audio';

  if (ext === 'pdf') return 'pdf';

  if (BINARY_EXTS.has(ext)) return 'none';

  if (TEXT_EXTS.has(ext)) return 'text';

  // Unknown extension: if resource type says "raw" and content-type is textual,
  // we let the runtime decide (the modal will attempt a text fetch and fall back).
  if (type === 'raw') return 'text'; // try it, fall back to 'none' on failure

  return 'none';
}

// Rough language hint for the syntax highlighter (Prism / highlight.js compatible)
export function languageOf(name = '') {
  const ext = extOf(name);
  const map = {
    js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'tsx',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
    java: 'java', kt: 'kotlin', swift: 'swift',
    c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp',
    php: 'php',
    html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup',
    css: 'css', scss: 'scss', sass: 'sass', less: 'less',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    md: 'markdown', markdown: 'markdown',
    sh: 'bash', bash: 'bash', zsh: 'bash', ps1: 'powershell',
    sql: 'sql',
    go: 'go', rs: 'rust',
  };
  return map[ext] || 'plain';
}