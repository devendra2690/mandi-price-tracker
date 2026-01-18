
import React, { useState, useEffect, useMemo } from 'react';
import Filters from './Filters';
import TradingViewChart from './TradingViewChart';
import RecommendationEngine from './RecommendationEngine';
import SeasonalityChart from './SeasonalityChart';
import HistoricalTrendChart from './HistoricalTrendChart';
import { getUniqueStates, analyzeMarket, filterByTimeRange, analyzeSeasonality } from '../utils/analytics';
import { RefreshCcw } from 'lucide-react';
import ExportControls from './ExportControls';
import MarketTimingGuide from './MarketTimingGuide';



const Dashboard = ({ data, onReset }) => {
    const [selectedState, setSelectedState] = useState('All');
    const [timeRange, setTimeRange] = useState('All');
    const [historyMode, setHistoryMode] = useState('Month');
    const dashboardRef = React.useRef(null);
    const snapshotRef = React.useRef(null);


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

    // Ref for scrolling
    const chartRef = React.useRef(null);

    const handleSnapshotClick = (date) => {
        handleCrosshairMove(date);
        if (chartRef.current) {
            chartRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // key statistics
    const stats = useMemo(() => {
        if (!finalData.length) return null;

        let totalOverallAvg = 0;

        // 1. Group data by Month-Year to find true Monthly Averages
        const monthlyStats = new Map(); // Key: "YYYY-MM" -> { totalAvg: 0, count: 0, min: Inf, max: -Inf, rawDate: Date }

        for (const item of finalData) {
            totalOverallAvg += item.avgPrice;

            if (!item.date) continue;
            const d = new Date(item.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;

            if (!monthlyStats.has(key)) {
                monthlyStats.set(key, {
                    totalAvg: 0,
                    count: 0,
                    min: Infinity,
                    max: -Infinity,
                    rawDate: d // Keep one date for reference
                });
            }

            const monthEntry = monthlyStats.get(key);
            monthEntry.totalAvg += item.avgPrice;
            monthEntry.count += 1;
            monthEntry.min = Math.min(monthEntry.min, item.minPrice);
            monthEntry.max = Math.max(monthEntry.max, item.maxPrice);
        }

        const avg = (totalOverallAvg / finalData.length).toFixed(0);

        // 2. Find Peak and Lowest Months from the aggregated data
        let peakMonth = null;
        let lowestMonth = null;
        let highestMonthlyAvg = -Infinity;
        let lowestMonthlyAvg = Infinity;

        for (const [key, stats] of monthlyStats.entries()) {
            const monthlyAvg = stats.totalAvg / stats.count;

            if (monthlyAvg > highestMonthlyAvg) {
                highestMonthlyAvg = monthlyAvg;
                peakMonth = { ...stats, avg: monthlyAvg };
            }

            if (monthlyAvg < lowestMonthlyAvg) {
                lowestMonthlyAvg = monthlyAvg;
                lowestMonth = { ...stats, avg: monthlyAvg };
            }
        }

        // Helper to format date
        const formatDate = (dateObj) => {
            if (!dateObj) return '';
            return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };

        return {
            min: lowestMonth ? lowestMonth.min : 0,
            minAvg: lowestMonth ? lowestMonth.avg : 0,
            minDate: lowestMonth ? formatDate(lowestMonth.rawDate) : '',
            minRawDate: lowestMonth ? lowestMonth.rawDate : null,
            max: peakMonth ? peakMonth.max : 0,
            maxAvg: peakMonth ? peakMonth.avg : 0,
            maxDate: peakMonth ? formatDate(peakMonth.rawDate) : '',
            maxRawDate: peakMonth ? peakMonth.rawDate : null,
            avg
        };
    }, [finalData]);

    return (
        <div ref={dashboardRef} className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)', gap: '2rem', padding: '1rem' }}>


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
                    <ExportControls snapshotRef={snapshotRef} dashboardRef={dashboardRef} />

                </div>

                <RecommendationEngine recommendation={recommendation} />


                {/* Quick Stats Card */}
                {stats && (
                    <div ref={snapshotRef} className="glass-panel">

                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
                            Market Snapshot ({timeRange})
                        </h4>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Peak Month</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.8 }}>View Chart →</span>
                                        <span
                                            onClick={() => handleSnapshotClick(stats.maxRawDate)}
                                            title={`Click to view details for ${stats.maxDate}`}
                                            style={{
                                                fontSize: '0.75rem',
                                                color: '#fff',
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                transition: 'all 0.2s',
                                                fontWeight: 500
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                        >
                                            {stats.maxDate}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--danger)' }}>₹{stats.maxAvg.toFixed(0)}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Max: ₹{stats.max}</p>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Average Price this month</p>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Lowest Month</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.8 }}>View Chart →</span>
                                        <span
                                            onClick={() => handleSnapshotClick(stats.minRawDate)}
                                            title={`Click to view details for ${stats.minDate}`}
                                            style={{
                                                fontSize: '0.75rem',
                                                color: '#fff',
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                transition: 'all 0.2s',
                                                fontWeight: 500
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                        >
                                            {stats.minDate}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>₹{stats.minAvg.toFixed(0)}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min: ₹{stats.min}</p>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Average Price this month</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Seasonality Chart */}
                <SeasonalityChart seasonalityData={seasonalityData} />

            </div>

            {/* Full Width: Market Timing Guide */}
            <div style={{ gridColumn: '1 / -1' }}>
                <MarketTimingGuide seasonalityData={seasonalityData} />
            </div>

            {/* Bottom Row: Full Width Historical Deep Dive */}
            <div ref={chartRef} style={{ gridColumn: '1 / -1' }}>

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
