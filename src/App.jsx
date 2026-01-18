
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

  const [storageWarning, setStorageWarning] = useState(false);

  const handleDataLoaded = (parsedData) => {
    setData(parsedData);
    setStorageWarning(false);
    try {
      localStorage.setItem('mandiData', JSON.stringify(parsedData));
    } catch (e) {
      console.warn("Data too large for localStorage, skipping persistence.");
      setStorageWarning(true);
    }
  };

  const handleReset = () => {
    setData(null);
    setStorageWarning(false);
    localStorage.removeItem('mandiData');
  }

  return (
    <div className="app-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        </div>

        {storageWarning && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              marginLeft: 'auto',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>⚠️ Large dataset detected. Data won't persist after refresh.</span>
          </motion.div>
        )}
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
