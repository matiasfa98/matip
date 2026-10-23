import { IconSun, IconMoon, BrandMark } from './Icons.jsx';

export default function LoginScreen({
  theme, onToggleTheme,
  username, password,
  setUsername, setPassword,
  loginError, loggingIn, onSubmit,
}) {
  return (
    <div className="login-screen">
      <div className="login-glow" />
      <form className="login-card" onSubmit={onSubmit}>
        <button type="button" className="theme-toggle floating" onClick={onToggleTheme}>
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <div className="brand-stack">
          <div className="brand-mark-lg"><BrandMark size={40} strokeWidth={5} /></div>
          <h1>Matip</h1>
          <p className="tagline">Your private vault.</p>
        </div>
        <div className="field">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {loginError && <div className="error">{loginError}</div>}
        <button type="submit" className="primary" disabled={loggingIn}>
          {loggingIn ? 'Unlocking…' : 'Unlock vault'}
        </button>
        <p className="footnote">Single-user access. Only you.</p>
      </form>
    </div>
  );
}