import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, Info, ArrowRight, Calendar } from 'lucide-react';

const RecommendationEngine = ({ recommendation }) => {
    if (!recommendation) return null;

    const { action, confidence, reason, type, yoyAnalysis } = recommendation;

    const getColors = () => {
        switch (type) {
            case 'positive': return { bg: 'rgba(52, 211, 153, 0.1)', border: 'rgb(52, 211, 153)', text: 'rgb(52, 211, 153)' };
            case 'negative': return { bg: 'rgba(248, 113, 113, 0.1)', border: 'rgb(248, 113, 113)', text: 'rgb(248, 113, 113)' };
            default: return { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgb(251, 191, 36)', text: 'rgb(251, 191, 36)' };
        }
    };

    const colors = getColors();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel"
            style={{
                padding: '1.5rem',
                borderLeft: `4px solid ${colors.border}`,
                background: `linear-gradient(to right, ${colors.bg}, transparent)`
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                        AI Recommendation
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {action}
                        </h2>
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '99px',
                            background: colors.border,
                            color: '#000',
                            fontWeight: 600
                        }}>
                            {confidence} Confidence
                        </span>
                    </div>
                </div>
                {type === 'positive' ? <TrendingDown size={32} color={colors.text} /> : <TrendingUp size={32} color={colors.text} />}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5' }}>
                {reason}
            </p>

            {/* Year over Year Analysis Section */}
            {recommendation.yoy && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Calendar size={14} color="#94a3b8" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px' }}>
                            YEAR-OVER-YEAR CONTEXT
                        </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{recommendation.yoy.prevYear} (Same Month)</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', marginTop: '2px' }}>
                                ₹{recommendation.yoy.prevPrice.toFixed(0)}
                            </div>
                        </div>
                        <ArrowRight size={16} color="#64748b" />
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>YoY Change</span>
                            <div style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                marginTop: '2px',
                                color: recommendation.yoy.change > 0 ? '#f87171' : '#34d399'
                            }}>
                                {recommendation.yoy.change > 0 ? '+' : ''}{recommendation.yoy.change.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {recommendation.prediction && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <TrendingUp size={14} color={recommendation.prediction.direction === 'UP' ? '#f87171' : '#34d399'} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px' }}>
                            AI FORECAST: {recommendation.prediction.nextMonthName.toUpperCase()}
                        </span>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>
                                Price Likely to {recommendation.prediction.direction === 'UP' ? 'RISE 📈' : 'FALL 📉'}
                            </span>
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: recommendation.prediction.probability > 75 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                color: recommendation.prediction.probability > 75 ? '#34d399' : '#fbbf24'
                            }}>
                                {recommendation.prediction.probability.toFixed(0)}% Probability
                            </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                            Based on last {recommendation.prediction.sampleSize} years, prices historically {recommendation.prediction.direction === 'UP' ? 'increased' : 'decreased'} in {recommendation.prediction.nextMonthName} by an average of
                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}> {Math.abs(recommendation.prediction.avgChange).toFixed(1)}%</span>.
                        </p>
                    </div>
                </div>
            )}

        </motion.div>
    );
};

export default RecommendationEngine;
