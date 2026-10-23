import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Caught by boundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 24, background: '#08090d',
          color: '#eef0f6', fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ maxWidth: 500, textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, marginBottom: 12 }}>Something went wrong</h1>
            <pre style={{
              background: '#111420', padding: 16, borderRadius: 10,
              textAlign: 'left', fontSize: 12, overflow: 'auto',
              border: '1px solid #212636', color: '#fca5b1',
            }}>{this.state.error.message}</pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16, padding: '10px 18px', borderRadius: 8,
                background: '#6366f1', color: '#fff', border: 'none',
                cursor: 'pointer', font: 'inherit', fontWeight: 600,
              }}
            >Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}