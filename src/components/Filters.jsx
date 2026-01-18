
import React from 'react';
import { Filter, Calendar } from 'lucide-react';

const Filters = ({ states, selectedState, onStateChange, timeRange, onTimeRangeChange }) => {
    const ranges = ['7D', '1M', '3M', '6M', 'All'];

    return (
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', justifyContent: 'space-between' }}>
            {/* State Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Filter size={20} color="var(--accent-primary)" />
                <label htmlFor="state-select" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Sort by State:</label>
                <select
                    id="state-select"
                    value={selectedState}
                    onChange={(e) => onStateChange(e.target.value)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        padding: '0.4rem 1rem',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    <option value="All">All States</option>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
            </div>

            {/* Time Range Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {ranges.map(range => (
                    <button
                        key={range}
                        onClick={() => onTimeRangeChange(range)}
                        style={{
                            background: timeRange === range ? 'var(--accent-primary)' : 'transparent',
                            color: timeRange === range ? 'white' : 'var(--text-secondary)',
                            border: timeRange === range ? 'none' : '1px solid var(--glass-border)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            fontWeight: 500
                        }}
                    >
                        {range}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Filters;
