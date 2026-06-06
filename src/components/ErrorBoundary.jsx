import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

const MESSAGES = {
  en: {
    title: 'An error occurred',
    defaultMsg: 'Something went wrong. Please reload the page.',
    btn: 'Try Again'
  },
  ka: {
    title: 'დაფიქსირდა შეცდომა',
    defaultMsg: 'რაღაც არასწორად წავიდა. გთხოვთ გადატვირთოთ გვერდი.',
    btn: 'თავიდან ცდა'
  }
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const lang = localStorage.getItem('editflow_crm_lang') || 'en';
      const strings = MESSAGES[lang] || MESSAGES.en;

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', gap: '1rem', padding: '2rem', textAlign: 'center',
          background: 'var(--bg-dark)', color: 'var(--text-primary)'
        }}>
          <AlertTriangle size={48} color="var(--danger)" />
          <h2>{strings.title}</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
            {this.state.error?.message || strings.defaultMsg}
          </p>
          <button className="btn btn-primary" onClick={this.handleReset} style={{ marginTop: '1rem' }}>
            <RefreshCcw size={16} /> {strings.btn}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}