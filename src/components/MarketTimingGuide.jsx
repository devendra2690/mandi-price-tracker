import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const MarketTimingGuide = ({ seasonalityData }) => {
    if (!seasonalityData || !seasonalityData.monthlyAverages) return null;

    // Calculate Global Seasonal Average (Average of monthly averages)
    const validMonthsCount = seasonalityData.monthlyAverages.filter(m => m.count > 0).length;
    const seasonalAvg = seasonalityData.monthlyAverages.reduce((acc, m) => acc + (m.count > 0 ? m.avgPrice : 0), 0) / (validMonthsCount || 1);

    // Filter valid months and sort by price
    const sortedMonths = [...seasonalityData.monthlyAverages]
        .filter(m => m.count > 0)
        .sort((a, b) => a.avgPrice - b.avgPrice);

    if (sortedMonths.length < 3) return null;

    // Categorize
    const bestMonths = sortedMonths.slice(0, 3);
    const avoidMonths = sortedMonths.slice(-3).reverse();

    // Calculate Price Targets
    const idealPrice = bestMonths.reduce((acc, m) => acc + m.avgPrice, 0) / bestMonths.length;
    const avoidPriceThreshold = avoidMonths.reduce((acc, m) => acc + m.avgPrice, 0) / avoidMonths.length;


    // Neutral: The rest
    const neutralMonths = sortedMonths.slice(3, -3).sort((a, b) => {
        // Sort neutral by calendar order
        const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    const MonthPill = ({ month, price, type }) => {
        const [isExpanded, setIsExpanded] = React.useState(false);
        let colors = {};
        let Icon = Minus;
        let explanation = "";

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
                                {month.history && month.history.map(h => {
                                    // Highlight exceptions:
                                    // Green if significantly below global seasonal average
                                    // Red if significantly above global seasonal average
                                    // Helps user see "good years" even in "bad months"
                                    const isCheap = h.price < seasonalAvg * 0.9;
                                    const isExpensive = h.price > seasonalAvg * 1.1;

                                    let priceColor = '#e2e8f0';
                                    if (isCheap) priceColor = '#34d399';
                                    if (isExpensive) priceColor = '#f87171';

                                    return (
                                        <div key={h.year} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{h.year}</span>
                                            <span style={{ color: priceColor, fontSize: '0.8rem', fontWeight: 500 }}>
                                                ₹{h.price.toFixed(0)}
                                            </span>
                                        </div>
                                    );
                                })}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    Annual Market Timing Guide
                </h4>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="group">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Avg: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>₹{seasonalAvg.toFixed(0)}</span>
                    </span>
                    <div style={{
                        cursor: 'help',
                        padding: '4px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #94a3b8', color: '#94a3b8', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>i</div>
                    </div>

                    {/* Tooltip */}
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '8px',
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        width: '280px',
                        zIndex: 50,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'opacity 0.2s',
                        pointerEvents: 'none'
                    }}
                        className="info-tooltip"
                    >
                        <style>{`
                            .group:hover .info-tooltip {
                                opacity: 1 !important;
                                visibility: visible !important;
                                pointer-events: auto !important;
                            }
                        `}</style>
                        <h5 style={{ color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Understanding the Data</h5>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            <strong>Annual Average (₹{seasonalAvg.toFixed(0)}):</strong> Calculated by taking the average of all 12 monthly averages.
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }}></div>
                                <span>Green: Price is &lt;90% of Annual Avg</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171' }}></div>
                                <span>Red: Price is &gt;110% of Annual Avg</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                                <span>White: Typical / Average Price</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Price Strategy Banner */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '1rem'
            }}>
                {/* Buy Target */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <TrendingDown size={18} color="#34d399" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Buy Price</div>
                        <div style={{ fontSize: '1.2rem', color: '#e2e8f0', fontWeight: 700 }}>~₹{idealPrice.toFixed(0)} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#34d399' }}>or less</span></div>
                    </div>
                </div>

                {/* Avoid Target */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <TrendingUp size={18} color="#f87171" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usually Expensive</div>
                        <div style={{ fontSize: '1.2rem', color: '#e2e8f0', fontWeight: 700 }}>&gt; ₹{avoidPriceThreshold.toFixed(0)}</div>
                    </div>
                </div>
            </div>

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
