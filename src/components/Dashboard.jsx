
import React, { useState, useEffect, useMemo } from 'react';
import Filters from './Filters';
import TradingViewChart from './TradingViewChart';
import RecommendationEngine from './RecommendationEngine';
import SeasonalityChart from './SeasonalityChart';
import HistoricalTrendChart from './HistoricalTrendChart';
import { getUniqueStates, analyzeMarket, filterByTimeRange, analyzeSeasonality } from '../utils/analytics';
import { RefreshCcw } from 'lucide-react';

const Dashboard = ({ data, onReset }) => {
    const [selectedState, setSelectedState] = useState('All');
    const [timeRange, setTimeRange] = useState('All');
    const [historyMode, setHistoryMode] = useState('Month');

    const states = useMemo(() => getUniqueStates(data), [data]);

    // 1. Filter by State
    const stateFilteredData = useMemo(() => {
        if (selectedState === 'All') return data;
        return data.filter(item => item.state === selectedState);
    }, [data, selectedState]);

    // 2. Filter by Time Range
    const finalData = useMemo(() => {
        return filterByTimeRange(stateFilteredData, timeRange);
    }, [stateFilteredData, timeRange]);

    // 3. Seasonality is calculated on the State filtered data (historical context needs long range, so ignore time filter)
    const seasonalityData = useMemo(() => analyzeSeasonality(stateFilteredData), [stateFilteredData]);

    // 4. Interactive Historical Analysis
    const [hoveredDate, setHoveredDate] = useState(null);

    const activeDataPoint = useMemo(() => {
        if (!hoveredDate) return finalData[finalData.length - 1]; // Default to latest

        // Find the specific entry in finalData that matches hoveredDate
        // hoveredDate from lightweight-charts is 'YYYY-MM-DD' string usually
        return finalData.find(d => d.date === hoveredDate) || finalData[finalData.length - 1];
    }, [finalData, hoveredDate]);

    const recommendation = useMemo(() => analyzeMarket(finalData, seasonalityData, activeDataPoint), [finalData, seasonalityData, activeDataPoint]);

    // Handler to pass to charts
    const handleCrosshairMove = (time) => {
        setHoveredDate(time);
    };

    // key statistics
    const stats = useMemo(() => {
        if (!finalData.length) return null;

        // Find items with absolute min and max prices
        let minItem = finalData[0];
        let maxItem = finalData[0];
        let totalAvg = 0;

        for (const item of finalData) {
            if (item.minPrice < minItem.minPrice) minItem = item;
            if (item.maxPrice > maxItem.maxPrice) maxItem = item;
            totalAvg += item.avgPrice;
        }

        const avg = (totalAvg / finalData.length).toFixed(0);

        // Helper to format date
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };

        return {
            min: minItem.minPrice,
            minDate: formatDate(minItem.date),
            max: maxItem.maxPrice,
            maxDate: formatDate(maxItem.date),
            avg
        };
    }, [finalData]);

    return (
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)', gap: '2rem' }}>

            {/* Left Column: Charts & Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Filters
                        states={states}
                        selectedState={selectedState}
                        onStateChange={setSelectedState}
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                    />
                </div>

                {/* Stacked Charts for Separated View */}
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <TradingViewChart
                        data={finalData}
                        title="Maximum Price Trends"
                        dataKey="maxPrice"
                        color="rgb(248, 113, 113)"
                        label="Max Price"
                        onCrosshairMove={handleCrosshairMove}
                    />
                    <TradingViewChart
                        data={finalData}
                        title="Average Price Trends"
                        dataKey="avgPrice"
                        color="rgb(251, 191, 36)"
                        label="Avg Price"
                        onCrosshairMove={handleCrosshairMove}
                    />
                    <TradingViewChart
                        data={finalData}
                        title="Minimum Price Trends"
                        dataKey="minPrice"
                        color="rgb(52, 211, 153)"
                        label="Min Price"
                        onCrosshairMove={handleCrosshairMove}
                    />
                </div>
            </div>

            {/* Right Column: Insights & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onReset}
                        className="btn"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                        <RefreshCcw size={14} /> Upload New File
                    </button>
                </div>

                <RecommendationEngine recommendation={recommendation} />

                {/* Quick Stats Card */}
                {stats && (
                    <div className="glass-panel">
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
                            Market Snapshot ({timeRange})
                        </h4>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Highest Price</p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {stats.maxDate}
                                    </span>
                                </div>
                                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--danger)' }}>₹{stats.max}</p>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Lowest Price</p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {stats.minDate}
                                    </span>
                                </div>
                                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>₹{stats.min}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Seasonality Chart */}
                <SeasonalityChart seasonalityData={seasonalityData} />

            </div>

            {/* Bottom Row: Full Width Historical Deep Dive */}
            <div style={{ gridColumn: '1 / -1' }}>
                <HistoricalTrendChart
                    data={stateFilteredData}
                    hoveredDate={hoveredDate}
                    mode={historyMode}
                    onModeChange={setHistoryMode}
                />
            </div>

            {/* Mobile fix */}
            <style>{`
        @media (max-width: 1024px) {
            .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
