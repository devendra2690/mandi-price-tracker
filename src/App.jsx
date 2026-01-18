
import React, { useState } from 'react';
import { LayoutDashboard, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

function App() {
  // Load initial data from localStorage
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('mandiData');
      if (saved) {
        return JSON.parse(saved, (key, value) => {
          // Reviver to restore Date objects
          if (key === 'date' || key === 'rawDate') return new Date(value);
          return value;
        });
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    return null;
  });

  const handleDataLoaded = (parsedData) => {
    setData(parsedData);
    try {
      localStorage.setItem('mandiData', JSON.stringify(parsedData));
    } catch (e) {
      console.error("Failed to save data. File might be too large.", e);
      alert("Note: Data is too large to save for next visit, but works for now.");
    }
  };

  const handleReset = () => {
    setData(null);
    localStorage.removeItem('mandiData');
  }

  return (
    <div className="app-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: 'var(--accent-primary)',
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LayoutDashboard size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Commodity Tracker</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Market Intelligence & Price Analytics</p>
        </div>
      </header>

      <main>
        {!data ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', marginTop: '10vh' }}>
            <h2 style={{ marginBottom: '1rem' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Upload your Mandi price data to generate analytics.</p>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Dashboard data={data} onReset={handleReset} />
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
