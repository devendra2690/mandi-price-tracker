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
        const [isExpanded, setIsExpanded] = React.useState(false);
        let colors = {};
        let Icon = Minus;
        let explanation = "";

        const seasonalAvg = seasonalityData.monthlyAverages.reduce((acc, m) => acc + (m.count > 0 ? m.avgPrice : 0), 0) / seasonalityData.monthlyAverages.filter(m => m.count > 0).length;
        const diffFromAvg = ((month.avgPrice - seasonalAvg) / seasonalAvg) * 100;

        switch (type) {
            case 'best':
                colors = { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' };
                Icon = TrendingDown;
                explanation = `Historically the best time to buy. Prices are ${Math.abs(diffFromAvg).toFixed(0)}% lower than the yearly average.`;
                break;
            case 'avoid':
                colors = { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.3)' };
                Icon = TrendingUp;
                explanation = `Prices typically peak in ${month.month}, averaging ${diffFromAvg.toFixed(0)}% higher than normal.`;
                break;
            default:
                colors = { bg: 'rgba(255, 255, 255, 0.05)', text: '#94a3b8', border: 'rgba(255, 255, 255, 0.1)' };
                Icon = Minus;
                explanation = `Prices in ${month.month} are stable and close to the yearly average.`;
                break;
        }

        const isCurrent = month.month === currentMonthName;

        return (
            <div style={{ marginBottom: '0.5rem' }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        background: colors.bg,
                        border: `1px solid ${isCurrent ? '#fbbf24' : colors.border}`,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = type === 'best' ? 'rgba(52, 211, 153, 0.25)' : type === 'avoid' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = colors.bg}
                >
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: `1px solid ${colors.text}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: colors.text
                        }}>
                            {isExpanded ? '-' : '+'}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e2e8f0' }}>{month.month}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>₹{month.avgPrice.toFixed(0)}</div>
                    </div>
                </div>

                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 6px 6px', border: `1px solid ${colors.border}`, borderTop: 'none', marginLeft: '4px', marginRight: '4px' }}
                    >
                        <div style={{ padding: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.4' }}>
                                {explanation}
                            </p>

                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                                Historical Evidence
                            </div>
                            <div style={{ display: 'grid', gap: '4px' }}>
                                {month.history && month.history.map(h => (
                                    <div key={h.year} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{h.year}</span>
                                        <span style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 500 }}>₹{h.price.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
                {/* Desktop: 3 columns, Mobile: 1 column */}
                <style>{`
                    .timing-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1.5rem;
                        align-items: start;
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
