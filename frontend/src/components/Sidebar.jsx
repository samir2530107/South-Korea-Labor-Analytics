import { NavLink } from 'react-router-dom';

const analyticsItems = [
  { name: 'Dashboard', path: '/', icon: '⌂' },
  { name: 'Regional employment', path: '/regional', icon: '⌖' },
  { name: 'Gender analysis', path: '/gender', icon: '◉' },
  { name: 'Unemployment', path: '/unemployment', icon: '↗' },
  { name: 'Industry analysis', path: '/industry', icon: '▤' }
];

const dataItems = [
  { name: 'View tables', path: '/tables', icon: '☷' },
  { name: 'About project', path: '/about', icon: 'ⓘ' }
];

function MenuLinks({ items }) {
  return items.map(item => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
    >
      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
      <span>{item.name}</span>
    </NavLink>
  ));
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <NavLink to="/" className="sidebar-brand" aria-label="South Korea Labor Analytics home">
        <div className="brand-icon" aria-hidden="true">SK</div>
        <div>
          <h2>Labor Analytics</h2>
          <span>South Korea</span>
        </div>
      </NavLink>

      <p className="menu-label">ANALYTICS</p>
      <nav className="sidebar-nav" aria-label="Analytics">
        <MenuLinks items={analyticsItems} />
      </nav>

      <p className="menu-label spaced">DATA</p>
      <nav className="sidebar-nav" aria-label="Data and information">
        <MenuLinks items={dataItems} />
      </nav>

      <div className="sidebar-footer">
        <span className="sdg-badge">SDG 8</span>
        <p>Decent work</p>
        <span>Promoting inclusive and sustainable economic growth.</span>
      </div>
    </aside>
  );
}

export default Sidebar;
