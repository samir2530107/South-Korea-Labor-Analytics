import { NavLink } from 'react-router-dom';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: '▦' },
  { name: 'Regional Employment', path: '/regional', icon: '⌖' },
  { name: 'Gender Analysis', path: '/gender', icon: '◉' },
  { name: 'Unemployment', path: '/unemployment', icon: '↗' },
  { name: 'Industry Analysis', path: '/industry', icon: '▤' }
];

const dataItems = [
  { name: 'View Tables', path: '/tables', icon: '☰' },
  { name: 'About Project', path: '/about', icon: 'ⓘ' }
];

function MenuLinks({ items }) {
  return items.map(item => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
    >
      <span className="nav-icon">{item.icon}</span>
      {item.name}
    </NavLink>
  ));
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">SK</div>
        <div>
          <h2>Labor Analytics</h2>
          <span>South Korea</span>
        </div>
      </div>

      <p className="menu-label">ANALYTICS</p>
      <nav className="sidebar-nav">
        <MenuLinks items={menuItems} />
      </nav>

      <p className="menu-label spaced">DATABASE</p>
      <nav className="sidebar-nav">
        <MenuLinks items={dataItems} />
      </nav>

      <div className="sidebar-footer">
        <p>SDG 8</p>
        <span>Decent Work and Economic Growth</span>
      </div>
    </aside>
  );
}

export default Sidebar;
