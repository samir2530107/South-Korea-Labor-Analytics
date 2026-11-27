function Select({ label, value, onChange, options = [] }) {
  const hasOptions = options.length > 0;

  return (
    <label className="select-field">
      <span>{label}</span>
      <select
        value={value ?? ''}
        disabled={!hasOptions}
        onChange={event => onChange(event.target.value)}
      >
        {hasOptions
          ? options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : <option value="">No options available</option>}
      </select>
    </label>
  );
}

export default Select;
