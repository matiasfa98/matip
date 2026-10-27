import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

const ASCII_BANNER = String.raw`
                                          
 ███╗   ███╗ █████╗ ████████╗██╗██████╗    |
 ████╗ ████║██╔══██╗╚══██╔══╝██║██╔══██╗   |  node: matip-01
 ██╔████╔██║███████║   ██║   ██║██████╔╝   |  status: sealed
 ██║╚██╔╝██║██╔══██║   ██║   ██║██╔═══╝    |
 ██║ ╚═╝ ██║██║  ██║   ██║   ██║██║        |  uptime: forever
 ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝        |  trust: zero
                                          |
                                          |  auth: cryptographic
     ░▒▓█  S E C U R E   S H E L L  v 1 . 0  █▓▒░  |  access: master
                                          |
     ──────────────────────────────       |  Node 20 · Express 5
                                          |
     root@matip · 0x4D41544950               |  MongoDB Atlas · 512MB
                                          |  Cloudinary · 25GB free
                                          |  JWT · bcrypt · TLS 1.3
                                          |  sha256:f3a9c2e7d81b4f60
                                          
`;

const BOOT_LINES = [
  { text: 'matip-vault kernel 6.1.0-master booting (x86_64)', cls: 'dim', delay: 90 },
  { text: '[    0.000000] Initializing cryptographic subsystem...', cls: 'dim', delay: 80 },
  { text: '[    0.000412] Loading entropy pool from /dev/urandom ... done', cls: 'dim', delay: 70 },
  { text: '[    0.001204] AES-NI instruction set detected', cls: 'dim', delay: 60 },
  { text: '[    0.002156] ChaCha20-Poly1305 self-test ... passed', cls: 'ok', delay: 70 },
  { text: '[    0.003210] SHA-256 / SHA-512 hashing engines online', cls: 'dim', delay: 60 },
  { text: '[    0.004105] Mounting /dev/secure (dm-crypt, LUKS2)', cls: 'dim', delay: 90 },
  { text: '[    0.005890] Key derivation: Argon2id, 128 MiB, 4 iters', cls: 'dim', delay: 80 },
  { text: '[    0.007123] Unlocking block device...', cls: 'dim', delay: 220 },
  { text: '[    0.009234] Volume unlocked', cls: 'ok', delay: 100 },
  { text: '[    0.011002] Starting udev daemon...', cls: 'dim', delay: 100 },
  { text: '[    0.012780] Loading module: vfat, ext4, xfs', cls: 'dim', delay: 70 },
  { text: '[    0.014201] Loading module: nf_conntrack', cls: 'dim', delay: 60 },
  { text: '[    0.015340] Configuring loopback interface lo', cls: 'dim', delay: 80 },
  { text: '[    0.016780] Bringing up eth0... link is up', cls: 'dim', delay: 150 },
  { text: '[    0.018920] DHCP request sent → 192.168.42.7/24', cls: 'dim', delay: 120 },
  { text: '[    0.020145] Default route via 192.168.42.1', cls: 'dim', delay: 70 },
  { text: '[    0.021560] Firewall: nftables ruleset loaded (412 rules)', cls: 'dim', delay: 90 },
  { text: '[    0.023780] Starting auditd ... active', cls: 'ok', delay: 80 },
  { text: '[    0.025102] Loading SELinux policy ... enforcing', cls: 'dim', delay: 90 },
  { text: '[    0.027440] AppArmor profiles: 47 loaded', cls: 'dim', delay: 70 },
  { text: '[    0.028904] Starting sshd ... listening on :22', cls: 'dim', delay: 80 },
  { text: '[    0.030120] Public key accepted: ED25519 SHA256:8f3a...', cls: 'ok', delay: 90 },
  { text: '[    0.032440] Spawning matip-core daemon (pid 1420)', cls: 'dim', delay: 80 },
  { text: '[    0.034120] matip-core: connecting to mongodb://cluster0.ork86wb', cls: 'dim', delay: 120 },
  { text: '[    0.036890] matip-core: mongo connection established', cls: 'ok', delay: 90 },
  { text: '[    0.038220] matip-core: cloudinary API handshake ... ok', cls: 'ok', delay: 100 },
  { text: '[    0.040120] matip-core: jwt signer initialized', cls: 'dim', delay: 70 },
  { text: '[    0.042010] matip-core: rate limiter active (8/15m)', cls: 'dim', delay: 70 },
  { text: '[    0.044320] matip-core: file watchers online', cls: 'dim', delay: 70 },
  { text: '[    0.046550] matip-core: listening on 0.0.0.0:3001', cls: 'ok', delay: 100 },
  { text: '[    0.048910] Starting nginx ingress controller...', cls: 'dim', delay: 100 },
  { text: '[    0.051120] TLS certificates valid (expires 2027-04-12)', cls: 'dim', delay: 90 },
  { text: '[    0.053440] HSTS enabled, CSP strict', cls: 'dim', delay: 70 },
  { text: '[    0.055890] Starting Redis cache layer (port 6379)', cls: 'dim', delay: 90 },
  { text: '[    0.057120] Starting fail2ban ... active', cls: 'ok', delay: 70 },
  { text: '[    0.059440] Starting cron scheduler ... loaded 6 jobs', cls: 'dim', delay: 80 },
  { text: '[    0.061780] Generating session fingerprint ...', cls: 'dim', delay: 150 },
  { text: '[    0.063210] Fingerprint: 0x4D41544950 :: verified', cls: 'ok', delay: 100 },
  { text: '[    0.065102] Running pre-flight diagnostics ...', cls: 'dim', delay: 90 },
  { text: '[    0.067120] disk usage: 12% of 100 GB', cls: 'dim', delay: 60 },
  { text: '[    0.068940] memory: 312 MiB used, 1.7 GiB free', cls: 'dim', delay: 60 },
  { text: '[    0.070780] cpu load: 0.04 0.03 0.01', cls: 'dim', delay: 60 },
  { text: '[    0.072010] network: 4 active connections', cls: 'dim', delay: 60 },
  { text: '[    0.073840] entropy available: 3861 bits', cls: 'dim', delay: 60 },
  { text: '[    0.075520] All systems nominal.', cls: 'ok', delay: 100 },
  { text: '', cls: '', delay: 150 },
  { text: 'Welcome to MATIP secure shell v1.0.0', cls: 'hint', delay: 200 },
  { text: 'Type "help" for a list of commands. "unlock" to begin.', cls: 'hint', delay: 150 },
  { text: '', cls: '', delay: 80 },
];

const UNLOCK_STEPS = [
  { text: '> [auth] verifying master key against vault...', cls: 'dim', delay: 320 },
  { text: '> [auth] handshake with /dev/secure (ssh-ed25519)...', cls: 'dim', delay: 420 },
  { text: '> [crypto] decrypting session token (AES-256-GCM)...', cls: 'dim', delay: 380 },
  { text: '> [auth] constant-time comparison ...', cls: 'dim', delay: 260 },
  { text: '> [auth] generating 1h JWT ...', cls: 'dim', delay: 220 },
  { text: '[ OK ] ACCESS GRANTED', cls: 'ok', delay: 180 },
];

const DENIED_LINES = [
  { text: '[FAIL] permission denied', cls: 'error', delay: 250 },
  { text: 'trace: no valid key matches master', cls: 'dim', delay: 200 },
  { text: 'cooldown: 5 seconds before next attempt', cls: 'hint', delay: 200 },
  { text: '', cls: '', delay: 100 },
];

export default function MasterTerminal({ onSuccess, onClose }) {
  const [lines, setLines] = useState([]);
  const [stage, setStage] = useState('boot');
  const [input, setInput] = useState('');
  const [lockedUntil, setLockedUntil] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const append = useCallback((text, cls = '') => {
    setLines((prev) => [...prev, { text, cls }]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) {
        setLines(ASCII_BANNER.split('\n').map((line) => ({ text: line, cls: 'banner' })));
      }
      for (const l of BOOT_LINES) {
        await new Promise((r) => setTimeout(r, l.delay));
        if (cancelled) return;
        setLines((prev) => [...prev, { text: l.text, cls: l.cls }]);
      }
      if (!cancelled) setStage('shell');
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (stage === 'shell' || stage === 'passphrase') {
      inputRef.current?.focus();
    }
  }, [stage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stage === 'shell') {
      await handleShell();
    } else if (stage === 'passphrase') {
      await handlePassphrase();
    }
  };

  const handleShell = async () => {
    if (Date.now() < lockedUntil) {
      append('terminal is locked. wait.', 'error');
      setInput('');
      return;
    }

    const raw = input.trim();
    const cmd = raw.toLowerCase();
    append(`root@matip:~# ${raw}`, 'prompt');
    setInput('');

    if (raw) {
      setHistory((h) => [raw, ...h].slice(0, 100));
      setHistoryIdx(-1);
    }

    if (!cmd) return;

    if (cmd === 'unlock' || cmd === 'sudo unlock' || cmd === 'unlock --master' || cmd === 'auth') {
      append('', '');
      append('[auth] master passphrase required.', 'hint');
      append('[auth] enter passphrase below.', 'dim');
      setStage('passphrase');
      return;
    }

    if (cmd === 'exit' || cmd === 'quit' || cmd === 'logout') {
      onClose();
      return;
    }

    if (cmd === 'clear' || cmd === 'cls') {
      setLines([]);
      return;
    }

    if (cmd === 'help' || cmd === '?' || cmd === 'man') {
      append('', '');
      append('MATIP SECURE SHELL — available commands', 'hint');
      append('─────────────────────────────────────────', 'dim');
      append('  unlock                 begin master authentication', 'dim');
      append('  status                 show vault + session status', 'dim');
      append('  whoami                 display current user', 'dim');
      append('  uname -a               kernel information', 'dim');
      append('  uptime                 system uptime', 'dim');
      append('  date                   current timestamp', 'dim');
      append('  hostname               node name', 'dim');
      append('  id                     user id / groups', 'dim');
      append('  pwd                    print working directory', 'dim');
      append('  ls                     list directory', 'dim');
      append('  df -h                  disk usage', 'dim');
      append('  free -h                memory usage', 'dim');
      append('  ps aux                 process list', 'dim');
      append('  top                    (static snapshot)', 'dim');
      append('  netstat -tulpn         network listeners', 'dim');
      append('  ifconfig               network interfaces', 'dim');
      append('  ping <host>            ICMP probe', 'dim');
      append('  dig <domain>           DNS lookup', 'dim');
      append('  curl <url>             HTTP request', 'dim');
      append('  env                    environment variables', 'dim');
      append('  history                command history', 'dim');
      append('  sudo <cmd>             elevate (no-op here)', 'dim');
      append('  exit                   close shell', 'dim');
      return;
    }

    if (cmd === 'whoami') { append('root', 'dim'); return; }
    if (cmd === 'hostname') { append('matip-01', 'dim'); return; }
    if (cmd === 'pwd') { append('/root', 'dim'); return; }
    if (cmd === 'id') { append('uid=0(root) gid=0(root) groups=0(root),27(sudo)', 'dim'); return; }
    if (cmd === 'uptime') { append(' 02:47:13 up 412 days,  3:21,  1 user,  load average: 0.04, 0.03, 0.01', 'dim'); return; }
    if (cmd === 'date') { append(new Date().toString(), 'dim'); return; }
    if (cmd.startsWith('uname')) { append('Linux matip-01 6.1.0-master #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', 'dim'); return; }

    if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'ls -al') {
      append('total 4', 'dim');
      append('drwx------  4 root root 4096 Oct 26 02:47 .', 'dim');
      append('drwxr-xr-x 18 root root 4096 Oct 20 02:11 ..', 'dim');
      append('-rw-------  1 root root  512 Oct 26 02:47 .bash_history', 'dim');
      append('-rw-r--r--  1 root root 1024 Oct 26 02:47 .vault.key', 'dim');
      append('drwx------  2 root root 4096 Oct 26 02:47 /dev/secure', 'dim');
      return;
    }

    if (cmd.startsWith('df')) {
      append('Filesystem      Size  Used Avail Use% Mounted on', 'dim');
      append('/dev/sda1       100G   12G   88G  12% /', 'dim');
      append('tmpfs           1.8G     0  1.8G   0% /dev/shm', 'dim');
      append('/dev/mapper/sec 500G  240G  260G  48% /dev/secure', 'dim');
      return;
    }

    if (cmd.startsWith('free')) {
      append('              total        used        free      shared  buff/cache   available', 'dim');
      append('Mem:          1.9Gi       312Mi       1.2Gi        12Mi       420Mi       1.5Gi', 'dim');
      append('Swap:         2.0Gi          0B       2.0Gi', 'dim');
      return;
    }

    if (cmd.startsWith('ps')) {
      append('USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND', 'dim');
      append('root         1  0.0  0.1  16712  3416 ?        Ss   Oct20   0:03 /sbin/init', 'dim');
      append('root      1420  0.3  2.1 145612 43280 ?        Ssl  Oct20   2:11 matip-core', 'dim');
      append('root      1422  0.0  0.4  32104  8100 ?        S    Oct20   0:12 sshd', 'dim');
      append('root      1425  0.0  0.2  12104  4800 ?        Ss   Oct20   0:01 nginx', 'dim');
      append('root      1430  0.0  0.9  62210 18340 ?        Ssl  Oct20   0:40 mongod', 'dim');
      return;
    }

    if (cmd === 'top') {
      append('top - 02:47:13 up 412 days,  1 user,  load average: 0.04, 0.03, 0.01', 'dim');
      append('Tasks: 14 total, 1 running, 13 sleeping', 'dim');
      append('CPU:  0.2%us 0.1%sy 0.0%ni 99.6%id', 'dim');
      append('Mem:  312Mi used / 1.9Gi total', 'dim');
      return;
    }

    if (cmd.startsWith('netstat') || cmd === 'ss') {
      append('Proto Recv-Q Send-Q Local Address           Foreign Address         State', 'dim');
      append('tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN', 'dim');
      append('tcp        0      0 127.0.0.1:3001          0.0.0.0:*               LISTEN', 'dim');
      append('tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN', 'dim');
      append('tcp        0      0 127.0.0.1:6379          0.0.0.0:*               LISTEN', 'dim');
      return;
    }

    if (cmd.startsWith('ifconfig') || cmd === 'ip a') {
      append('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500', 'dim');
      append('        inet 192.168.42.7  netmask 255.255.255.0  broadcast 192.168.42.255', 'dim');
      append('        inet6 fe80::a1b2:c3d4:e5f6:7788  prefixlen 64  scopeid 0x20<link>', 'dim');
      append('lo:   flags=73<UP,LOOPBACK,RUNNING>  mtu 65536', 'dim');
      append('        inet 127.0.0.1  netmask 255.0.0.0', 'dim');
      return;
    }

    if (cmd.startsWith('ping')) {
      const host = cmd.split(/\s+/)[1] || 'localhost';
      append(`PING ${host} (127.0.0.1): 56 data bytes`, 'dim');
      for (let i = 0; i < 3; i++) {
        append(`64 bytes from 127.0.0.1: icmp_seq=${i} ttl=64 time=0.0${Math.floor(Math.random() * 9) + 1} ms`, 'dim');
      }
      append('', '');
      append('--- ping statistics ---', 'dim');
      append('3 packets transmitted, 3 received, 0% packet loss', 'ok');
      return;
    }

    if (cmd.startsWith('dig') || cmd.startsWith('nslookup')) {
      const domain = cmd.split(/\s+/)[1] || 'matip.dev';
      append(`; <<>> DiG 9.18 <<>> ${domain}`, 'dim');
      append(';; ANSWER SECTION:', 'dim');
      append(`${domain}.   300  IN  A  104.21.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`, 'dim');
      append('', '');
      append(';; SERVER: 1.1.1.1#53', 'dim');
      return;
    }

    if (cmd.startsWith('curl')) {
      const url = cmd.split(/\s+/)[1] || 'https://matip.dev';
      append(`* Trying ${url}...`, 'dim');
      append('* Connected.', 'dim');
      append('> GET / HTTP/2', 'dim');
      append('< HTTP/2 200', 'ok');
      append('', '');
      append('{"ok":true,"node":"matip-01"}', 'hint');
      return;
    }

    if (cmd === 'env') {
      append('NODE_ENV=production', 'dim');
      append('PORT=3001', 'dim');
      append('MONGODB_URI=***redacted***', 'dim');
      append('JWT_SECRET=***redacted***', 'dim');
      append('CLOUDINARY_CLOUD_NAME=oeeii8qc', 'dim');
      append('CLOUDINARY_API_KEY=***redacted***', 'dim');
      append('CLOUDINARY_API_SECRET=***redacted***', 'dim');
      append('PANEL_SECRET=***redacted***', 'dim');
      return;
    }

    if (cmd === 'history') {
      append('', '');
      history.forEach((h, i) => append(`  ${String(i + 1).padStart(3)}  ${h}`, 'dim'));
      if (!history.length) append('  (no history)', 'dim');
      return;
    }

    if (cmd.startsWith('sudo')) {
      append('root is already root. permission denied to feel important.', 'hint');
      return;
    }

    append(`bash: ${raw.split(/\s+/)[0]}: command not found`, 'error');
    append('type "help" for available commands.', 'dim');
  };

  const handlePassphrase = async () => {
    if (Date.now() < lockedUntil) {
      append('terminal is locked. wait.', 'error');
      setInput('');
      return;
    }

    const key = input;
    setInput('');
    append(`passphrase: ${'•'.repeat(Math.min(key.length, 40))}`, 'prompt');
    append('', '');
    setStage('verifying');

    const apiCall = api.post('/auth/master', { key });

    for (const step of UNLOCK_STEPS) {
      await new Promise((r) => setTimeout(r, step.delay));
      append(step.text, step.cls);
      if (step.cls === 'ok') break;
    }

    try {
      const { data } = await apiCall;
      if (!data.ok) throw new Error('denied');
      localStorage.setItem('matip_master_token', data.token);
      append('', '');
      append('[auth] session token acquired · expires in 1h', 'dim');
      append('[auth] redirecting to guest panel...', 'dim');
      append('', '');
      setStage('granted');
      await new Promise((r) => setTimeout(r, 1100));
      onSuccess(data.token);
    } catch {
      setLines((prev) => prev.filter((l) => l.cls !== 'ok'));
      append('', '');
      for (const d of DENIED_LINES) {
        await new Promise((r) => setTimeout(r, d.delay));
        append(d.text, d.cls);
      }
      setLockedUntil(Date.now() + 5000);
      setStage('shell');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (stage === 'shell' && history.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(next);
        setInput(history[next]);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.max(historyIdx - 1, -1);
        setHistoryIdx(next);
        setInput(next === -1 ? '' : history[next]);
        return;
      }
    }
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="terminal-overlay" onKeyDown={onKeyDown} tabIndex={-1}>
      <div className="terminal">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot-red" />
            <span className="dot-yellow" />
            <span className="dot-green" />
          </div>
          <span className="terminal-title">root@matip-01 — /dev/secure — bash</span>
        </div>

        <div className="terminal-body" ref={scrollRef}>
          {lines.map((l, i) => (
            <div key={i} className={`terminal-line ${l.cls || ''}`}>
              {l.text || '\u00A0'}
            </div>
          ))}

          {(stage === 'shell' || stage === 'passphrase') && (
            <form
              onSubmit={submit}
              action="javascript:void(0)"
              method="post"
              noValidate
              className="terminal-form"
            >
              <span className="terminal-prompt">
                {stage === 'passphrase' ? 'passphrase: ' : 'root@matip:~# '}
              </span>
              <input
                ref={inputRef}
                type={stage === 'passphrase' ? 'password' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="terminal-input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                name="terminal-input"
              />
              {stage === 'shell' && <span className="cursor-blink">█</span>}
            </form>
          )}

          {stage === 'verifying' && (
            <div className="terminal-line dim">
              <span className="cursor-blink">█</span>
            </div>
          )}

          {stage === 'granted' && (
            <div className="terminal-line ok granted-flash">█ ACCESS GRANTED — opening guest panel...</div>
          )}
        </div>

        <div className="terminal-footer">
          <span>Esc abort · "help" commands · ↑/↓ history · Ctrl+L clear · "unlock" auth</span>
        </div>
      </div>
    </div>
  );
}