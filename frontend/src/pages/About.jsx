function About() {
  return (
    <div className="page-content">
      <div className="welcome-section">
        <h2>About the Project</h2>
        <p>South Korea Labor Market Analysis</p>
      </div>

      <div className="information-card">
        <h3>Project objective</h3>
        <p>
          This project analyzes employment conditions and labor market trends in South Korea.
        </p>

        <h3>Data coverage</h3>
        <ul>
          <li>Regional employment statistics: 2000–2025</li>
          <li>Industry wages and working hours: 2020–2025</li>
          <li>Seven major cities</li>
          <li>Male, female, and total gender categories</li>
        </ul>

        <h3>Database tables</h3>
        <ul>
          <li>Lookup tables: REGION, GENDER, YEAR, INDUSTRY, ESTABLISHMENT SIZE</li>
          <li>Fact tables: REGIONAL LABOR STATS, INDUSTRY LABOR STATS</li>
        </ul>

        <h3>Development technologies</h3>
        <ul>
          <li>React and Vite</li>
          <li>Node.js and Express.js</li>
          <li>MySQL</li>
          <li>Chart.js</li>
        </ul>

        <h3>United Nations Sustainable Development Goal</h3>
        <p>SDG 8 — Decent Work and Economic Growth.</p>
      </div>
    </div>
  );
}

export default About;
