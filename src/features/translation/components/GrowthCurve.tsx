// Growth curve component used inside C3 PredictionPanel.
// Recharts is the only chart library permitted per §3.1.
// Computation lives in utils/growthCurve.ts per §5.9.

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import type { Prediction } from '../api/types'
import { deriveGrowthCurve } from '../utils/growthCurve'
import { formatDuration, formatLogIncrease } from '../utils/format'
import { strings } from '../data/strings'

type Props = {
  prediction: Prediction
}

// Hard-coded to the values from globals.css design tokens (Recharts can't read CSS vars).
const GROWTH_COLOR = '#8B6914'
const INACTIVATION_COLOR = '#2E6080'
const BORDER_COLOR = '#E4E4DF'
const BORDER_STRONG_COLOR = '#C8C8C2'
const TEXT_SUBTLE = '#8A8A82'
const TEXT_MUTED = '#5B5B55'

// Recharts custom tick renderer for small mono-style labels.
function MonoTick({
  x,
  y,
  payload,
  formatter,
}: {
  x?: number
  y?: number
  payload?: { value: number }
  formatter: (v: number) => string
}) {
  if (x === undefined || y === undefined || payload === undefined) return null
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="auto"
      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fill: TEXT_MUTED }}
    >
      {formatter(payload.value)}
    </text>
  )
}

function YTick({
  x,
  y,
  payload,
}: {
  x?: number
  y?: number
  payload?: { value: number }
}) {
  if (x === undefined || y === undefined || payload === undefined) return null
  const val = payload.value
  const label = val === 0 ? '0' : val > 0 ? `+${val}` : `${val}`
  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      dominantBaseline="middle"
      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fill: TEXT_MUTED }}
    >
      {label}
    </text>
  )
}

export function GrowthCurve({ prediction }: Props) {
  const isInactivation = prediction.total_log_increase < 0
  const curveColor = isInactivation ? INACTIVATION_COLOR : GROWTH_COLOR

  // §9.10: memoised because it produces 150+ points and is passed to Recharts.
  const curvePoints = useMemo(
    () => deriveGrowthCurve(prediction.step_predictions, prediction.total_log_increase),
    [prediction.step_predictions, prediction.total_log_increase],
  )

  const totalDuration = prediction.duration_minutes
  const finalLog = curvePoints[curvePoints.length - 1]?.logChange ?? 0

  // Y-axis domain: auto-fit with minimum range ±0.5.
  const minLog = Math.min(0, finalLog)
  const maxLog = Math.max(0, finalLog)
  const padding = Math.max(0.5, (maxLog - minLog) * 0.1)
  const yMin = Math.floor(minLog - padding)
  const yMax = Math.ceil(maxLog + padding)

  // Step boundaries (for multi-step scenarios).
  const stepBoundaries: number[] = []
  let tAcc = 0
  for (let i = 0; i < prediction.steps.length - 1; i++) {
    tAcc += prediction.steps[i]!.duration_minutes
    stepBoundaries.push(tAcc)
  }

  // X-axis ticks at step boundaries plus start and end.
  const xTicks = [0, ...stepBoundaries, totalDuration].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  )

  // Integer log₁₀ values for horizontal gridlines.
  const yGridValues: number[] = []
  for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) {
    yGridValues.push(v)
  }

  const xTickFormatter = (v: number) => {
    if (v === 0) return '0'
    if (v === totalDuration) return formatDuration(v)
    return formatDuration(v)
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart
          data={curvePoints}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          {/* Horizontal gridlines only, at integer log₁₀ values */}
          <CartesianGrid
            horizontal
            vertical={false}
            stroke={BORDER_COLOR}
            strokeOpacity={0.5}
          />

          <XAxis
            dataKey="t"
            type="number"
            domain={[0, totalDuration]}
            ticks={xTicks}
            tick={(props: Parameters<typeof MonoTick>[0]) => (
              <MonoTick {...props} formatter={xTickFormatter} />
            )}
            stroke={BORDER_STRONG_COLOR}
            tickLine={{ stroke: BORDER_STRONG_COLOR }}
            axisLine={{ stroke: BORDER_STRONG_COLOR }}
            interval={0}
          />

          <YAxis
            dataKey="logChange"
            type="number"
            domain={[yMin, yMax]}
            tick={(props: Parameters<typeof YTick>[0]) => <YTick {...props} />}
            stroke={BORDER_STRONG_COLOR}
            tickLine={{ stroke: BORDER_STRONG_COLOR }}
            axisLine={{ stroke: BORDER_STRONG_COLOR }}
            width={36}
          />

          {/* Step boundary reference lines for multi-step */}
          {stepBoundaries.map((t, i) => (
            <ReferenceLine
              key={t}
              x={t}
              stroke={BORDER_STRONG_COLOR}
              strokeDasharray="3 3"
              label={{
                value: `${i + 1} → ${i + 2}`,
                position: 'top',
                style: {
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  fill: TEXT_SUBTLE,
                },
              }}
            />
          ))}

          {/* The curve: piecewise area + line */}
          <Area
            type="linear"
            dataKey="logChange"
            stroke={curveColor}
            strokeWidth={2}
            fill={curveColor}
            fillOpacity={0.15}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Approximation caveat label (§7.10, §8.8) */}
      <p
        style={{
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '11px',
          color: TEXT_SUBTLE,
          textAlign: 'right',
          marginTop: '4px',
          lineHeight: 1.4,
        }}
      >
        {strings.c3.curveCaveat}
      </p>

      {/* Dev-only check: shows curve total in the browser so it's visually verifiable */}
      {import.meta.env.DEV && (
        <p
          style={{
            fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
            fontSize: '10px',
            color: TEXT_SUBTLE,
            textAlign: 'right',
            marginTop: '2px',
          }}
        >
          curve total: {formatLogIncrease(finalLog)} (backend:{' '}
          {formatLogIncrease(prediction.total_log_increase)})
        </p>
      )}
    </div>
  )
}
