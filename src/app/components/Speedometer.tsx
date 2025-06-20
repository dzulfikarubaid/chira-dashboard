import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';


Chart.register(...registerables);

interface SpeedometerProps {
    value: number; 
    label: string; 
    maxValue?: number;
}

const Speedometer: React.FC<SpeedometerProps> = ({ value, label, maxValue = 180 }) => {
    const chartRef = useRef<any>(null);
    const chartInstanceRef = useRef<Chart | null>(null); 

    useEffect(() => {
        const chartCanvas = chartRef.current;

        const data = {
            datasets: [
                {
                    data: [value, maxValue - value],
                    backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(0, 0, 0, 0.1)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                },
            ],
        };

        const options = {
            cutout: '80%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    enabled: false,
                },
                legend: {
                    display: false,
                },
            },
        };

        if (chartCanvas) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy(); 
            }
            chartInstanceRef.current = new Chart(chartCanvas, {
                type: 'doughnut',
                data: data,
                options: options,
            });
        }


        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [value, maxValue]);

    return (
        <div className="relative h-40 w-40">
            <canvas ref={chartRef} /> 
            <div className="absolute inset-0 flex flex-col items-center pt-10 justify-center">
                <div className="text-center">
                    <span className="text-lg font-bold">{value.toFixed(2)}°</span>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

export default Speedometer;