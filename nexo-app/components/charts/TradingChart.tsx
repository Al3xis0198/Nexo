/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';

interface TradingChartProps {
  data: any[];
  height?: number;
  onTimeframeChange?: (tf: Timeframe) => void;
  currentTimeframe?: Timeframe;
}

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '1m',  label: '1M'  },
  { id: '5m',  label: '5M'  },
  { id: '15m', label: '15M' },
  { id: '1H',  label: '1H'  },
  { id: '4H',  label: '4H'  },
  { id: '1D',  label: '1D'  },
];

export default function TradingChart({
  data,
  height = 420,
  onTimeframeChange,
  currentTimeframe = '1H',
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef          = useRef<IChartApi | null>(null);
  const candleRef         = useRef<any>(null);
  const volumeRef         = useRef<any>(null);
  const [activeCandle, setActiveCandle] = useState<any>(null);

  // ── Build chart once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#13161A' },
        textColor: '#848E9C',
        fontFamily: "'Inter', 'Roboto', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(43,49,57,0.4)' },
        horzLines: { color: 'rgba(43,49,57,0.4)' },
      },
      width:  chartContainerRef.current.clientWidth,
      height: height - 48, // leave room for timeframe bar
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(43,49,57,0.6)',
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(43,49,57,0.6)',
        scaleMargins: { top: 0.08, bottom: 0.26 },
      },
      crosshair: {
        mode: 1,
        vertLine: { width: 1, color: 'rgba(240,185,11,0.4)', style: 1, labelBackgroundColor: '#F0B90B' },
        horzLine: { width: 1, color: 'rgba(240,185,11,0.4)', style: 1, labelBackgroundColor: '#F0B90B' },
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candles = chart.addSeries(CandlestickSeries, {
      upColor:      '#0ECB81',
      downColor:    '#F6465D',
      borderVisible: false,
      wickUpColor:  '#0ECB81',
      wickDownColor:'#F6465D',
    });
    candleRef.current = candles;

    // Volume histogram (second pane via overlay at the bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color:     '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeRef.current = volumeSeries;

    // Crosshair data tooltip
    chart.subscribeCrosshairMove((param) => {
      if (param.point && param.seriesData.size > 0) {
        const candleData = param.seriesData.get(candles);
        if (candleData) setActiveCandle(candleData);
      } else {
        setActiveCandle(null);
      }
    });

    if (data.length > 0) {
      candles.setData(data);
      const volumeData = data.map((d: any) => ({
        time:  d.time,
        value: d.volume ?? Math.abs(d.close - d.open) * 1000 + Math.random() * 5000,
        color: d.close >= d.open ? 'rgba(14,203,129,0.35)' : 'rgba(246,70,93,0.35)',
      }));
      volumeSeries.setData(volumeData);
      chart.timeScale().fitContent();
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // ── Update data when it changes ───────────────────────────────────────────
  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || data.length === 0) return;
    try {
      candleRef.current.setData(data);
      const volumeData = data.map((d: any) => ({
        time:  d.time,
        value: d.volume ?? Math.abs(d.close - d.open) * 1000 + Math.random() * 5000,
        color: d.close >= d.open ? 'rgba(14,203,129,0.35)' : 'rgba(246,70,93,0.35)',
      }));
      volumeRef.current.setData(volumeData);
      chartRef.current?.timeScale().fitContent();
    } catch {
      // Ignore stale update errors
    }
  }, [data]);

  // ── Last visible candle for inline display ────────────────────────────────
  const lastCandle = data[data.length - 1];
  const displayCandle = activeCandle ?? lastCandle;
  const isUp = displayCandle ? displayCandle.close >= displayCandle.open : true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#13161A', borderRadius: 12, overflow: 'hidden' }}>
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(43,49,57,0.6)', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        {/* Timeframes */}
        <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: 3 }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange?.(tf.id)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s',
                background: currentTimeframe === tf.id ? '#F0B90B' : 'transparent',
                color:      currentTimeframe === tf.id ? '#000' : '#848E9C',
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* OHLC tooltip */}
        {displayCandle && (
          <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem', fontFamily: 'monospace', flexWrap: 'wrap' }}>
            {[
              { label: 'O', value: displayCandle.open?.toFixed(2) },
              { label: 'H', value: displayCandle.high?.toFixed(2) },
              { label: 'L', value: displayCandle.low?.toFixed(2) },
              { label: 'C', value: displayCandle.close?.toFixed(2) },
            ].map(({ label, value }) => (
              <span key={label} style={{ color: '#848E9C' }}>
                <span style={{ color: '#5E6673' }}>{label} </span>
                <span style={{ color: isUp ? '#0ECB81' : '#F6465D', fontWeight: 700 }}>{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Chart ── */}
      <div ref={chartContainerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
