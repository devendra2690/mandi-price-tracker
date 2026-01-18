
import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

const PriceChart = ({ data, title, dataKey, color, label }) => {
    const chartRef = React.useRef(null);

    if (!data || data.length === 0) return null;

    // Find Min and Max indices to highlight them
    const values = data.map(d => d[dataKey]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    // We want to highlight ALL occurrences of min/max or just the first? Let's do all.
    const minIndices = values.map((v, i) => v === minVal ? i : -1).filter(i => i !== -1);
    const maxIndices = values.map((v, i) => v === maxVal ? i : -1).filter(i => i !== -1);

    const dataCount = data.length;
    // Base styles
    const basePointRadius = dataCount > 50 ? 0 : 3;
    const hoverRadius = 6;
    const defaultBorderWidth = 2;

    // Generate dynamic point styles
    const pointRadii = values.map((v, i) => {
        if (minIndices.includes(i) || maxIndices.includes(i)) return 6; // Highlight
        return basePointRadius;
    });

    const pointBackgroundColors = values.map((v, i) => {
        if (minIndices.includes(i)) return 'var(--success)';
        if (maxIndices.includes(i)) return 'var(--danger)';
        return color;
    });

    const pointBorderColors = values.map((v, i) => {
        if (minIndices.includes(i) || maxIndices.includes(i)) return '#fff';
        return color;
    });

    const labels = data.map(d => d.date);

    const chartData = {
        labels,
        datasets: [
            {
                label: label,
                data: values,
                borderColor: color,
                // Gradient Fill
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    if (!ctx) return 'rgba(0,0,0,0)';
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.5)'));
                    gradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0.0)'));
                    return gradient;
                },
                tension: 0.3,
                pointRadius: pointRadii,
                pointBackgroundColor: pointBackgroundColors,
                pointBorderColor: pointBorderColors,
                pointBorderWidth: 2,
                pointHoverRadius: hoverRadius,
                borderWidth: defaultBorderWidth,
                fill: true
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                intersect: false,
                mode: 'index',
                callbacks: {
                    label: (context) => {
                        let label = `Price: ₹${context.parsed.y}`;
                        if (maxIndices.includes(context.dataIndex)) label += ' (High)';
                        if (minIndices.includes(context.dataIndex)) label += ' (Low)';
                        return label;
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                },
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'x',
                },
                limits: {
                    x: { min: 'original', max: 'original' }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#94a3b8',
                    font: { family: 'Outfit', size: 10 },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 10
                }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } },
                beginAtZero: false
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        elements: {
            point: { hitRadius: 10 }
        }
    };

    const handleResetZoom = () => {
        if (chartRef.current) {
            chartRef.current.resetZoom();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass-panel"
            style={{ height: '350px', width: '100%', position: 'relative', padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}
        >
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: color, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                        {label} (₹)
                    </span>
                    <button
                        onClick={handleResetZoom}
                        title="Reset Zoom"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.7 }}
                    >
                        <RotateCcw size={14} color="var(--text-secondary)" />
                    </button>
                </div>
            </div>
            <div style={{ height: '240px' }}>
                <Line ref={chartRef} options={options} data={chartData} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '5px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                    Scroll to Zoom • Drag to Pan
                </span>
            </div>
        </motion.div>
    );
};

export default PriceChart;
