import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import RegionalEmployment from './pages/RegionalEmployment';
import GenderAnalysis from './pages/GenderAnalysis';
import Unemployment from './pages/Unemployment';
import IndustryAnalysis from './pages/IndustryAnalysis';
import ViewTables from './pages/ViewTables';
import About from './pages/About';

import './App.css';

function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-area">
        <Header />

        <div className="page-wrapper">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/regional" element={<RegionalEmployment />} />
          <Route path="/gender" element={<GenderAnalysis />} />
          <Route path="/unemployment" element={<Unemployment />} />
          <Route path="/industry" element={<IndustryAnalysis />} />
          <Route path="/tables" element={<ViewTables />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
