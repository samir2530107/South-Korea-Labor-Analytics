function Loader({ text = 'Loading data...' }) {
  return (
    <div className="loader" role="status">
      <span className="spinner" />
      <span>{text}</span>
    </div>
  );
}

export default Loader;
