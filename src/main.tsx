import React, { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#721c24', background: '#f8d7da', border: '1px solid #f5c6cb', margin: '40px', borderRadius: '8px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: '900' }}>عذراً، حدث خطأ غير متوقع!</h1>
          <p>يرجى إعادة المحاولة أو تصفير بيانات التطبيق.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: '15px', borderRadius: '4px', textAlign: 'left', margin: '20px 0' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#721c24', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              إعادة التحميل
            </button>
            <button 
              onClick={() => { localStorage.clear(); window.location.href='/login'; }}
              style={{ padding: '10px 20px', background: '#fff', color: '#721c24', border: '1px solid #721c24', borderRadius: '4px', cursor: 'pointer' }}
            >
              مسح الذاكرة المؤقتة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
