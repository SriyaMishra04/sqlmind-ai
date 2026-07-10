'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartSuggestion {
  type: 'bar' | 'line' | 'area' | 'pie' | 'scatter';
  x_axis: string;
  y_axis: string;
  title: string;
}

interface AutoChartProps {
  data: any[];
  suggestion: ChartSuggestion;
}

const COLORS = [
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
];

export default function AutoChart({ data, suggestion }: AutoChartProps) {
  if (!data || data.length === 0 || !suggestion) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm italic font-medium">
        No chart data available or invalid suggestion.
      </div>
    );
  }

  const { type, x_axis, y_axis, title } = suggestion;

  const formattedData = data.map((item) => {
    const numericVal = parseFloat(item[y_axis]);
    return {
      ...item,
      [x_axis]: item[x_axis] !== null && item[x_axis] !== undefined ? String(item[x_axis]) : '',
      [y_axis]: isNaN(numericVal) ? item[y_axis] : numericVal,
    };
  });

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey={x_axis}
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '8px',
                color: '#1E293B',
                fontSize: '11px',
                fontWeight: 650,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
            <Line
              type="monotone"
              dataKey={y_axis}
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ r: 4, stroke: '#4F46E5', strokeWidth: 1, fill: '#FFFFFF' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey={x_axis}
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '8px',
                color: '#1E293B',
                fontSize: '11px',
                fontWeight: 650,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
            />
            <Area
              type="monotone"
              dataKey={y_axis}
              stroke="#4F46E5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#areaColor)"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey={x_axis}
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '8px',
                color: '#1E293B',
                fontSize: '11px',
                fontWeight: 650,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
            />
            <Bar dataKey={y_axis} fill="#4F46E5" radius={[4, 4, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#4F46E5"
              dataKey={y_axis}
              nameKey={x_axis}
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '8px',
                color: '#1E293B',
                fontSize: '11px',
                fontWeight: 650,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey={x_axis}
              name={x_axis}
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              dataKey={y_axis}
              name={y_axis}
              stroke="#94A3B8"
              fontSize={10}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '8px',
                color: '#1E293B',
                fontSize: '11px',
                fontWeight: 650,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
            />
            <Scatter name={title} data={formattedData} fill="#4F46E5" />
          </ScatterChart>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm italic font-medium">
            Unsupported chart: {type}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">{title}</h4>
      <div className="w-full flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
