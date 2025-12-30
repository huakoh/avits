import React from 'react';
import ReactECharts from 'echarts-for-react';

interface TemperatureGaugeProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
}

const TemperatureGauge: React.FC<TemperatureGaugeProps> = ({ 
  value, 
  min = 0, 
  max = 10,
  size = 200,
}) => {
  const getColor = () => {
    if (value < 2 || value > 8) return '#ff4d4f';
    if (value < 2.5 || value > 7.5) return '#faad14';
    return '#52c41a';
  };

  const isSmall = size < 150;

  const option = {
    series: [
      {
        type: 'gauge',
        min,
        max,
        splitNumber: 10,
        radius: '90%',
        axisLine: {
          lineStyle: {
            width: isSmall ? 12 : 20,
            color: [
              [0.2, '#ff4d4f'],
              [0.25, '#faad14'],
              [0.75, '#52c41a'],
              [0.8, '#faad14'],
              [1, '#ff4d4f'],
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: getColor(),
          },
          width: isSmall ? 3 : 5,
        },
        axisTick: {
          distance: isSmall ? -12 : -20,
          length: isSmall ? 4 : 8,
          lineStyle: {
            color: '#fff',
            width: isSmall ? 1 : 2,
          },
        },
        splitLine: {
          distance: isSmall ? -15 : -25,
          length: isSmall ? 12 : 20,
          lineStyle: {
            color: '#fff',
            width: isSmall ? 2 : 3,
          },
        },
        axisLabel: {
          show: !isSmall,
          color: 'inherit',
          distance: 30,
          fontSize: 12,
          formatter: '{value}°C',
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}°C',
          color: getColor(),
          fontSize: isSmall ? 16 : 24,
          fontWeight: 'bold',
          offsetCenter: [0, isSmall ? '60%' : '70%'],
        },
        data: [
          {
            value: value,
            name: isSmall ? '' : '当前温度',
          },
        ],
        title: {
          show: !isSmall,
          offsetCenter: [0, '90%'],
          fontSize: 14,
          color: '#666',
        },
      },
    ],
  };

  return (
    <ReactECharts 
      option={option} 
      style={{ height: size, width: size }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default TemperatureGauge;
