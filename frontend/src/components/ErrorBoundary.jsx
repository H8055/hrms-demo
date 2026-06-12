import React from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI error boundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-center column">
          <h1>Something went wrong</h1>
          <p>{this.state.errorMessage}</p>
          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <Link className="secondary-button" to="/">
              Back to dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
