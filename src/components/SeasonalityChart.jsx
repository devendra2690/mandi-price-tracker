
import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const SeasonalityChart = ({ seasonalityData }) => {
    if (!seasonalityData) return null;

    const { monthlyAverages, bestMonth, worstMonth } = seasonalityData;

    const labels = monthlyAverages.map(d => d.month.substring(0, 3)); // Jan, Feb...

    // Highlight best month with Green, Worst with Red, others default
    const backgroundColors = monthlyAverages.map(d => {
        if (d.month === bestMonth.month) return 'rgba(52, 211, 153, 0.8)'; // Green
        if (d.month === worstMonth.month) return 'rgba(248, 113, 113, 0.8)'; // Red
        return 'rgba(56, 189, 248, 0.2)'; // Blue default
    });

    const borderColors = monthlyAverages.map(d => {
        if (d.month === bestMonth.month) return 'rgb(52, 211, 153)';
        if (d.month === worstMonth.month) return 'rgb(248, 113, 113)';
        return 'rgba(56, 189, 248, 0.5)';
    });

    const data = {
        labels,
        datasets: [
            {
                label: 'Avg Monthly Price',
                data: monthlyAverages.map(d => d.avgPrice),
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                callbacks: {
                    label: (context) => `Avg Price: ₹${context.parsed.y.toFixed(0)}`,
                    title: (context) => {
                        const monthInfo = monthlyAverages[context[0].dataIndex];
                        if (monthInfo.month === bestMonth.month) return `${monthInfo.month} (Best Time to Buy)`;
                        if (monthInfo.month === worstMonth.month) return `${monthInfo.month} (Most Expensive)`;
                        return monthInfo.month;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding: '1.5rem', marginTop: '2rem' }}
        >
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Seasonal Price Analysis</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Based on historical data,
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}> {bestMonth.month} </span>
                    is typically the cheapest month to buy.
                </p>
            </div>
            <div style={{ height: '250px' }}>
                <Bar options={options} data={data} />
            </div>
        </motion.div>
    );
};

export default SeasonalityChart;
