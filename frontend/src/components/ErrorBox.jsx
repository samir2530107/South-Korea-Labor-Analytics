function ErrorBox({ message, onRetry }) {
  return (
    <section className="error-message" role="alert">
      <span className="eyebrow">DATA CONNECTION</span>
      <strong>We couldn’t load this data</strong>
      <p>{message}</p>
      <p className="error-hint">
        Check that the API and MySQL database are running, then try again.
      </p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </section>
  );
}

export default ErrorBox;
