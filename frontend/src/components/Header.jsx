import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getHealth } from '../services/api';

const pageTitles = {
  '/': 'Dashboard',
  '/regional': 'Regional Employment',
  '/gender': 'Gender Analysis',
  '/unemployment': 'Unemployment Analysis',
  '/industry': 'Industry Analysis',
  '/tables': 'View Database Tables',
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
          setStatus(error.message.includes('backend') ? 'offline' : 'nodb');
        });
    };

    check();
    const id = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const labels = {
    checking: 'Checking...',
    online: 'Database connected',
    nodb: 'MySQL not connected',
    offline: 'Backend offline'
  };

  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>South Korea Labor Market Analysis</p>
      </div>

      <div className={`header-tag status-${status}`}>
        <span className="status-dot"></span>
        {labels[status]}
      </div>
    </header>
  );
}

export default Header;
