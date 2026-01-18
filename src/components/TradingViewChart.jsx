
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';

const TradingViewChart = ({ data, title, dataKey, color, label, onCrosshairMove }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    // Initial Chart Creation
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#94a3b8',
                fontFamily: "'Outfit', sans-serif",
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
        });

        chartRef.current = chart;

        // Series
        const series = chart.addAreaSeries({
            lineColor: color,
            topColor: color.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            bottomColor: color.replace('rgb', 'rgba').replace(')', ', 0.0)'),
            lineWidth: 2,
        });

        // Data
        if (data && data.length > 0) {
            const uniqueMap = new Map();
            data.forEach(item => {
                uniqueMap.set(item.date, item[dataKey]);
            });
            const formattedData = Array.from(uniqueMap.entries())
                .map(([time, value]) => ({ time, value }))
                .sort((a, b) => new Date(a.time) - new Date(b.time));
            series.setData(formattedData);
            chart.timeScale().fitContent();
        }

        // Crosshair
        chart.subscribeCrosshairMove((param) => {
            if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
                if (onCrosshairMove) onCrosshairMove(null);
            } else {
                if (onCrosshairMove) onCrosshairMove(param.time);
            }
        });

        // ResizeObserver
        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                chart.applyOptions({ width, height });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
        };

        // Re-create chart only if data config changes
    }, [data, dataKey, color]);

    return (
        <div
            className="glass-panel"
            style={{
                position: 'relative',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{title}</h3>
                    <span style={{ fontSize: '0.8rem', color: color, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                        {label} (₹)
                    </span>
                </div>
            </div>

            <div
                ref={chartContainerRef}
                style={{
                    width: '100%',
                    height: '300px'
                }}
            />
        </div>
    );
};

export default TradingViewChart;
