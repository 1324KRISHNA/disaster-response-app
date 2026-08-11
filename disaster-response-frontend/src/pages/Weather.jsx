import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { CloudRain, Wind, Thermometer, Droplets, Sun, CloudLightning, Cloud, CloudSun, Search, Activity, MapPin } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import LocationName from '../components/LocationName';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Map WMO weather codes to our UI
const getWeatherInfo = (code) => {
  if (code === 0) return { label: 'Clear Sky', icon: <Sun size={80} color="var(--accent-amber)" /> };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: <CloudSun size={80} color="var(--text-secondary)" /> };
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: <Cloud size={80} color="var(--text-secondary)" /> };
  if (code >= 51 && code <= 67) return { label: 'Rain', icon: <CloudRain size={80} color="var(--accent-blue)" /> };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: <Cloud size={80} color="#fff" /> };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: <CloudRain size={80} color="var(--accent-blue)" /> };
  if (code >= 95) return { label: 'Thunderstorms', icon: <CloudLightning size={80} color="var(--accent-red)" /> };
  return { label: 'Unknown', icon: <Cloud size={80} color="var(--text-secondary)" /> };
};

export default function Weather() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bengaluru
  
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`);
        const data = await res.json();
        setWeatherData(data);
      } catch (err) {
        console.error("Failed to fetch weather data", err);
      }
    };
    fetchWeather();
  }, [location]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data && data.length > 0) {
        setLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try again in a few moments.");
    }
    setIsSearching(false);
  };

  const chartData = {
    labels: weatherData?.daily?.time ? weatherData.daily.time.map(t => new Date(t).toLocaleDateString('en-US', { weekday: 'short' })) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        fill: true,
        label: 'Precipitation Probability (%)',
        data: weatherData?.daily?.precipitation_probability_max || [0,0,0,0,0,0,0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
      },
      {
        fill: true,
        label: 'Max Temperature (°C)',
        data: weatherData?.daily?.temperature_2m_max || [0,0,0,0,0,0,0],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'var(--text-secondary)' } },
      title: { display: false },
    },
    scales: {
      x: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    }
  };

  const wInfo = weatherData ? getWeatherInfo(weatherData.current.weather_code) : getWeatherInfo(-1);

  return (
    <Layout title="Weather Data">
      <div style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto 24px auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            <MapPin size={24} color="var(--accent-blue)" />
            <LocationName lat={location.lat} lng={location.lng} />
          </div>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <Search size={16} color="var(--text-secondary)" />
            </button>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a city..."
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px', outline: 'none', width: '250px' }}
            />
            {isSearching && <Activity size={14} color="var(--accent-blue)" style={{ animation: 'spin 2s linear infinite' }} />}
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* Main Weather Card */}
          <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ marginBottom: '16px' }}>{wInfo.icon}</div>
            <h1 style={{ fontSize: '48px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {weatherData ? `${Math.round(weatherData.current.temperature_2m)}°C` : '--'}
            </h1>
            <p style={{ fontSize: '20px', color: 'var(--text-primary)', margin: '8px 0 8px 0', fontWeight: '600' }}>
              {wInfo.label}
            </p>
            {weatherData?.current?.weather_code >= 95 && (
              <p style={{ fontSize: '14px', color: 'var(--accent-red)', textAlign: 'center', margin: 0, fontWeight: 'bold' }}>
                Severe weather warning in effect. High probability of incidents.
              </p>
            )}
          </div>

          {/* Mini Metrics */}
          <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
                <Droplets size={32} color="var(--accent-blue)" />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Humidity</p>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '28px', fontWeight: '600' }}>
                  {weatherData ? `${weatherData.current.relative_humidity_2m}%` : '--'}
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px' }}>
                <Wind size={32} color="var(--accent-green)" />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Wind Speed</p>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '28px', fontWeight: '600' }}>
                  {weatherData ? `${weatherData.current.wind_speed_10m} km/h` : '--'}
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px' }}>
                <Thermometer size={32} color="var(--accent-amber)" />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pressure</p>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '28px', fontWeight: '600' }}>
                  {weatherData ? `${Math.round(weatherData.current.surface_pressure)} hPa` : '--'}
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px' }}>
                <Sun size={32} color="var(--accent-red)" />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Max UV Index</p>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '28px', fontWeight: '600' }}>
                  {weatherData && weatherData.daily.uv_index_max.length > 0 ? weatherData.daily.uv_index_max[0] : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast Chart */}
          <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-primary)' }}>7-Day Forecast Trends</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
