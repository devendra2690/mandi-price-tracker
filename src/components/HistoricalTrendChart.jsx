
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const HistoricalTrendChart = ({ data, hoveredDate, mode, onModeChange }) => {
    const [lookahead, setLookahead] = React.useState(0);
    const [historyView, setHistoryView] = React.useState('timeline'); // 'timeline' | 'seasonal'

    // Helper: Generate a unique key for grouping (e.g., "2023-Q1")
    const getBucketKey = (date, mode) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth();

        switch (mode) {
            case 'Quarter':
                const q = Math.floor(month / 3) + 1;
                return `${year}-Q${q}`;
            case 'HalfYear':
                const h = month < 6 ? 1 : 2;
                return `${year}-H${h}`;
            case 'Year':
                return `${year}`;
            default: // Month
                return `${year}-${month}`;
        }
    };

    // Helper: Generate a display label (e.g., "Q1 '23")
    const getBucketLabel = (key, mode) => {
        const [year, part] = key.split('-');
        switch (mode) {
            case 'Quarter': return `${part} '${year.slice(2)}`;
            case 'HalfYear': return `${part} '${year.slice(2)}`;
            case 'Year': return year;
            default: // Month: e.g. "2023-9"
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return `${monthNames[parseInt(part)]} '${year.slice(2)}`;
        }
    }

    // 1. Process Data into Chronological Buckets
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Determine the target month index for 'Month' mode.
        // If hoveredDate is available, use its month. Otherwise, use the month of the first data point, or current month.
        const initialDate = hoveredDate ? new Date(hoveredDate) : ((data.length > 0 && data[0].rawDate) || new Date());
        const targetMonthIndex = initialDate.getMonth();

        // Helper to get average price for a specific Month/Year
        // We pre-process data into a Map for O(1) lookups to handle the "Lookahead" logic efficiently
        const priceMap = new Map(); // Key: "Year-Month", Value: { total, count, min, max }

        data.forEach(item => {
            if (!item.rawDate) return;
            const k = `${item.rawDate.getFullYear()}-${item.rawDate.getMonth()}`;
            if (!priceMap.has(k)) priceMap.set(k, { total: 0, count: 0, min: Infinity, max: -Infinity });
            const entry = priceMap.get(k);
            entry.total += item.avgPrice;
            entry.count += 1;
            entry.min = Math.min(entry.min, item.minPrice);
            entry.max = Math.max(entry.max, item.maxPrice);
        });

        const getStats = (year, monthIndex) => {
            // Handle Year Rollover (e.g. Dec -> Jan)
            let y = year;
            let m = monthIndex;
            while (m > 11) {
                m -= 12;
                y += 1;
            }
            const k = `${y}-${m}`;
            const stats = priceMap.get(k);
            return stats ? { ...stats, avg: stats.total / stats.count } : null;
        };

        // Standard Aggregation (Non-Month modes OR Month mode in 'timeline' view)
        if (mode !== 'Month' || historyView === 'timeline') {
            // ... Existing Bucket Logic (Preserved for Quarter/Half/Year/Timeline) ...
            const buckets = new Map();
            data.forEach(item => {
                if (!item.rawDate) return;
                const key = getBucketKey(item.rawDate, mode);
                if (!buckets.has(key)) {
                    buckets.set(key, { total: 0, count: 0, min: Infinity, max: -Infinity, sortKey: item.rawDate.getTime() });
                }
                const b = buckets.get(key);
                b.total += item.avgPrice;
                b.count += 1;
                b.min = Math.min(b.min, item.minPrice);
                b.max = Math.max(b.max, item.maxPrice);
            });
            const sortedKeys = Array.from(buckets.keys()).sort((a, b) => buckets.get(a).sortKey - buckets.get(b).sortKey);

            // Map to datasets
            const prices = sortedKeys.map(k => buckets.get(k).total / buckets.get(k).count);
            const minPrices = sortedKeys.map(k => buckets.get(k).min);
            const maxPrices = sortedKeys.map(k => buckets.get(k).max);

            let activeIndex = -1;
            if (hoveredDate && mode === 'Month' && historyView === 'timeline') {
                const activeKey = getBucketKey(hoveredDate, 'Month');
                activeIndex = sortedKeys.indexOf(activeKey);
            } else if (hoveredDate && mode !== 'Month') {
                const activeKey = getBucketKey(hoveredDate, mode);
                activeIndex = sortedKeys.indexOf(activeKey);
            }

            return {
                labels: sortedKeys.map(k => getBucketLabel(k, mode)),
                datasets: [{
                    label: 'Avg Price',
                    data: prices,
                    extraData: { min: minPrices, max: maxPrices },
                    backgroundColor: prices.map((_, i) => i === activeIndex ? 'rgba(251, 191, 36, 0.9)' : 'rgba(52, 211, 153, 0.6)'),
                    borderColor: prices.map((_, i) => i === activeIndex ? 'rgba(251, 191, 36, 1)' : 'rgba(52, 211, 153, 1)'),
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: prices.map((_, i) => i === activeIndex ? 'rgba(251, 191, 36, 1)' : 'rgba(52, 211, 153, 0.8)'),
                }]
            };
        }

        // Special Logic for Mode === 'Month' (supports Lookahead)
        // We identify all years present in the data
        const years = [...new Set(data.map(d => d.rawDate?.getFullYear()))].sort().filter(y => y);

        // Base month is the target month derived from hover or aggregation
        // Wait, for "Full History" view, we want ALL months chronologically? 
        // OR did we switch to "Seasonal Outlook" which groups by Year?
        // User said: "if i say show next months behaviour then shoeld show data for Feb 2022-2025... adjustent to that year"
        // This implies X-Axis = Years, and Grouped Bars = Months.
        // This differs from the "Full Chronological History" (Jan'21, Feb'21...) we just built.
        // It seems the user wants a DIFFERENT view or a toggle for this "Outlook".

        // Let's assume if Lookahead > 0, we switch to this "Yearly Grouped" view.
        // If Lookahead === 0, should we stick to the sequential view?
        // User request: "Check how Commodity behaved in historically same month" -> This implies grouping by Year is better for comparison.
        // Let's Pivot: For 'Month' mode, let's always use the "Yearly Alignment" if we want to compare "Jan vs Jan".
        // BUT, the previous step established "Full Chronological History" as the desired state for the "timeline".

        // Compromise: 
        // If Lookahead is active, we MUST align by Year to show the side-by-side comparison (Jan'22 + Feb'22 vs Jan'23 + Feb'23).

        // For 'Month' mode:
        // Identify unique years.
        // For each year, get data for [TargetMonth], [TargetMonth+1], [TargetMonth+2].

        const labels = years.map(y => y.toString());
        const datasets = [];

        // We need 1+lookahead datasets
        for (let i = 0; i <= lookahead; i++) {
            const mIndex = targetMonthIndex + i;
            // Handle name logic
            let mNameIndex = mIndex;
            while (mNameIndex > 11) mNameIndex -= 12;
            const mName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mNameIndex];

            const datasetData = years.map(year => {
                const stats = getStats(year, targetMonthIndex + i);
                return stats ? stats.avg : null;
            });

            const minData = years.map(year => {
                const stats = getStats(year, targetMonthIndex + i);
                return stats ? stats.min : null;
            });
            const maxData = years.map(year => {
                const stats = getStats(year, targetMonthIndex + i);
                return stats ? stats.max : null;
            });

            // Dynamic color generation for larger datasets
            const opacity = Math.max(0.3, 1 - (i * 0.1)); // Fade out slightly for future months? Or cycle colors?
            // Minimal palette cycle
            const colors = [
                '52, 211, 153', // Emerald (Base)
                '96, 165, 250', // Blue
                '167, 139, 250', // Purple
                '244, 114, 182', // Pink
                '251, 146, 60',  // Orange
                '250, 204, 21'   // Yellow
            ];
            const colorBase = colors[i % colors.length];

            datasets.push({
                label: mName,
                data: datasetData,
                extraData: { min: minData, max: maxData },
                backgroundColor: `rgba(${colorBase}, 0.7)`,
                borderColor: `rgba(${colorBase}, 1)`,
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.8,
                categoryPercentage: 0.9
            });
        }

        return {
            labels,
            datasets
        };

    }, [data, mode, hoveredDate, lookahead, historyView]);

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#e2e8f0',
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (context) => {
                        const avg = context.raw;
                        const idx = context.dataIndex;
                        const extra = context.dataset.extraData;

                        if (extra) {
                            return [
                                `Avg: ₹${avg.toFixed(0)}`,
                                `Max: ₹${extra.max[idx]}`,
                                `Min: ₹${extra.min[idx]}`
                            ];
                        }
                        return `Avg: ₹${avg.toFixed(0)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }
            }
        },
        maintainAspectRatio: false,
    };

    if (!chartData || chartData.labels.length === 0) {
        return (
            <motion.div
                className="glass-panel"
                style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--text-secondary)' }}
            >
                No historical data
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel"
            style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px', margin: 0 }}>
                    Historical Analysis ({mode}ly View)
                </h4>

                {/* Mode Controls */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                </div>

                {/* Mode Controls */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* View Toggle (Timeline vs Seasonal) - Only for Month Mode */}
                    {mode === 'Month' && (
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
                            <button
                                onClick={() => setHistoryView('timeline')}
                                style={{
                                    background: historyView === 'timeline' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: historyView === 'timeline' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Timeline
                            </button>
                            <button
                                onClick={() => setHistoryView('seasonal')}
                                style={{
                                    background: historyView === 'seasonal' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: historyView === 'seasonal' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Seasonal
                            </button>
                        </div>
                    )}

                    {/* Lookahead Controls (Only for Month mode + Seasonal View) */}
                    {mode === 'Month' && historyView === 'seasonal' && (
                        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
                            {[
                                { label: '1M', value: 0 },
                                { label: '3M', value: 2 },
                                { label: '6M', value: 5 },
                                { label: '12M', value: 11 }
                            ].map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => setLookahead(opt.value)}
                                    style={{
                                        background: lookahead === opt.value ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
                                        color: lookahead === opt.value ? 'rgb(52, 211, 153)' : 'var(--text-secondary)',
                                        border: 'none',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: lookahead === opt.value ? 600 : 400
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                        {['Month', 'Quarter', 'HalfYear', 'Year'].map(m => (
                            <button
                                key={m}
                                onClick={() => onModeChange(m)}
                                style={{
                                    background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: mode === m ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {m === 'HalfYear' ? '6M' : m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
                <Bar data={chartData} options={options} />
            </div>
        </motion.div>
    );
};

export default HistoricalTrendChart;
