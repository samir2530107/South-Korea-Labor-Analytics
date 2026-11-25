import { Component } from 'react';

// Stops a rendering bug from turning the whole page white.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('UI error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-message" role="alert">
          <strong>This page could not be displayed.</strong>
          <p>{this.state.error.message}</p>
          <button type="button" className="btn" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
