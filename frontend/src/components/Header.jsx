import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getHealth } from '../services/api';

const pageTitles = {
  '/': 'Dashboard',
  '/regional': 'Regional Employment',
  '/gender': 'Gender Analysis',
  '/unemployment': 'Unemployment Analysis',
  '/industry': 'Industry Analysis',
  '/tables': 'Database Tables',
  '/about': 'About the Project'
};

function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Labor Analytics';
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;

    const check = () => {
      getHealth()
        .then(() => active && setStatus('online'))
        .catch(error => {
          if (!active) return;
          setStatus(error.message.toLowerCase().includes('backend') ? 'offline' : 'nodb');
        });
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const labels = {
    checking: 'Checking connection…',
    online: 'Live data connected',
    nodb: 'Database unavailable',
    offline: 'API unavailable'
  };

  return (
    <header className="header">
      <div className="header-title">
        <span className="header-kicker">SOUTH KOREA LABOR ANALYTICS</span>
        <h1>{title}</h1>
      </div>
      <div className={`header-tag status-${status}`} role="status" title={labels[status]}>
        <span className="status-dot" aria-hidden="true" />
        {labels[status]}
      </div>
    </header>
  );
}

export default Header;
