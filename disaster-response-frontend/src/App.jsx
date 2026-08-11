import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IncidentProvider } from './context/IncidentContext';
import { UserProvider } from './context/UserContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import MapFullScreen from './pages/MapFullScreen';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AlertBanner from './components/AlertBanner';
import AICopilot from './components/AICopilot';

import { APIProvider } from '@vis.gl/react-google-maps';

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  return (
    <APIProvider apiKey={apiKey} libraries={['visualization', 'routes']}>
      <UserProvider>
        <IncidentProvider>
          <AlertBanner />
          <AICopilot />
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/map" element={<MapFullScreen />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </IncidentProvider>
      </UserProvider>
    </APIProvider>
  );
}

export default App;
