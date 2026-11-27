function About() {
  return (
    <div className="page-content">
      <section className="welcome-section">
        <div className="welcome-copy">
          <span className="eyebrow">ABOUT THIS PROJECT</span>
          <h2>Understand the numbers behind work</h2>
          <p>
            A practical, read-only explorer for regional employment, unemployment,
            gender and industry statistics in South Korea.
          </p>
        </div>
      </section>

      <div className="two-column about-grid">
        <section className="information-card">
          <span className="eyebrow">PURPOSE</span>
          <h3>What you can explore</h3>
          <p>
            Compare labor-market indicators across major cities, follow changes over time,
            and inspect wage and working-hour statistics by industry and establishment size.
          </p>
          <ul>
            <li>Regional employment and unemployment trends</li>
            <li>Male and female comparisons</li>
            <li>Wages, hours worked and days worked by industry</li>
            <li>Searchable database tables in a read-only view</li>
          </ul>
        </section>

        <section className="information-card">
          <span className="eyebrow">DATA QUALITY</span>
          <h3>How Total values are checked</h3>
          <p>
            Regional totals are compared with the Male + Female population counts. When a
            material mismatch is found, the analytics view reconciles counts from those
            components and recalculates related rates. The original database is never edited.
          </p>
          <p>
            The readable regional table shows the reconciled analytics values. Choose
            <strong> Raw IDs </strong> to inspect the source database values as stored.
          </p>
        </section>

        <section className="information-card">
          <span className="eyebrow">METHOD</span>
          <h3>Interpreting the charts</h3>
          <ul>
            <li>Rates are shown as percentages; population values are in thousand persons.</li>
            <li>Industry wages are Won per worker per month; work hours and days are monthly averages per worker.</li>
            <li>City and industry averages are unweighted unless a chart says otherwise.</li>
            <li>Blank values mean the source contains no measurement.</li>
          </ul>
        </section>

        <section className="information-card">
          <span className="eyebrow">TECHNOLOGY</span>
          <h3>Built for transparent exploration</h3>
          <p>React, Vite, Chart.js, Node.js, Express and MySQL.</p>
          <div className="sdg-callout">
            <strong>UN Sustainable Development Goal 8</strong>
            <span>Decent work and economic growth</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
