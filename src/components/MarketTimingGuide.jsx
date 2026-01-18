import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const MarketTimingGuide = ({ seasonalityData }) => {
    if (!seasonalityData || !seasonalityData.monthlyAverages) return null;

    // Filter valid months and sort by price
    const sortedMonths = [...seasonalityData.monthlyAverages]
        .filter(m => m.count > 0)
        .sort((a, b) => a.avgPrice - b.avgPrice);

    if (sortedMonths.length < 3) return null;

    // Categorize
    // Best: Lowest 3 prices
    const bestMonths = sortedMonths.slice(0, 3);
    // Avoid: Highest 3 prices
    const avoidMonths = sortedMonths.slice(-3).reverse(); // Showing highest first
    // Neutral: The rest
    const neutralMonths = sortedMonths.slice(3, -3).sort((a, b) => {
        // Sort neutral by calendar order for easier reading? Or price?
        // Let's sort by calendar order
        const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    const MonthPill = ({ month, price, type }) => {
        let colors = {};
        let Icon = Minus;

        switch (type) {
            case 'best':
                colors = { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' };
                Icon = TrendingDown;
                break;
            case 'avoid':
                colors = { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.3)' };
                Icon = TrendingUp;
                break;
            default:
                colors = { bg: 'rgba(255, 255, 255, 0.05)', text: '#94a3b8', border: 'rgba(255, 255, 255, 0.1)' };
                Icon = Minus;
                break;
        }

        const isCurrent = month.month === currentMonthName;

        return (
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                background: colors.bg,
                border: `1px solid ${isCurrent ? '#fbbf24' : colors.border}`,
                marginBottom: '0.5rem',
                position: 'relative'
            }}>
                {isCurrent && (
                    <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '10px',
                        fontSize: '0.6rem',
                        background: '#fbbf24',
                        color: '#000',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700
                    }}>
                        NOW
                    </div>
                )}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e2e8f0' }}>{month.month}</span>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>₹{month.avgPrice.toFixed(0)}</div>
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel"
            style={{ padding: '1.5rem', marginTop: '2rem' }}
        >
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
                Annual Market Timing Guide
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                {/* Desktop: 3 columns, Mobile: 1 column */}
                <style>{`
                    .timing-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1.5rem;
                    }
                    @media (max-width: 768px) {
                        .timing-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>

                <div className="timing-grid">
                    {/* Best Time */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '4px', background: 'rgba(52, 211, 153, 0.2)', borderRadius: '50%' }}>
                                <TrendingDown size={14} color="#34d399" />
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#34d399' }}>Best Time to Buy</span>
                        </div>
                        {bestMonths.map((m, i) => <MonthPill key={i} month={m} type="best" />)}
                    </div>

                    {/* Avoid */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '4px', background: 'rgba(248, 113, 113, 0.2)', borderRadius: '50%' }}>
                                <TrendingUp size={14} color="#f87171" />
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f87171' }}>Avoid / High Prices</span>
                        </div>
                        {avoidMonths.map((m, i) => <MonthPill key={i} month={m} type="avoid" />)}
                    </div>

                    {/* Neutral */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '4px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '50%' }}>
                                <Minus size={14} color="#94a3b8" />
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>Standard Market Rates</span>
                        </div>
                        {neutralMonths.length > 0 ? (
                            neutralMonths.map((m, i) => <MonthPill key={i} month={m} type="neutral" />)
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>No standard months identified.</p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MarketTimingGuide;
