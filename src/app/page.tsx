'use client';

import React, { useRef, useState, useEffect } from 'react';

import {
  PiAlignBottomBold,
  PiAngleBold,
  PiArrowArcLeft,
  PiArrowArcLeftBold,
  PiChartBar,
  PiChartBarBold,
  PiGear,
  PiHouse,
  PiLockBold,
  PiPath,
  PiPathBold,
  PiPercentBold,
  PiScan,
  PiScanBold,
  PiSecurityCamera,
  PiSecurityCameraBold,
  PiToggleLeft,
  PiToggleLeftBold,
  PiVectorThreeBold,
} from 'react-icons/pi';

import { Bar, getDatasetAtEvent } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

import { database } from '@/utils/firebaseConfig';
import { ref, onValue } from 'firebase/database';

import { GiChiliPepper, GiRobotGrab } from 'react-icons/gi';

import Speedometer from './components/Speedometer';
import { TbAccessPoint, TbObjectScan } from 'react-icons/tb';
import CardIconOverlay from './components/CardIconOverlay'; 

Chart.register(...registerables);

const DashboardLayout = () => {
  const [menu, setMenu] = useState('home');
  const [robotStatus, setRobotStatus] = useState({
    status: 'Loading...',
    sudut1: 0.0,
    sudut2: 0.0,
    sudut3: 0.0,
    ee_angle: 0.0,
    detected_object_cm: {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    },
    error: null,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [timeFilter, setTimeFilter] = useState('today');
  const chartRef = useRef<any>(null);

  const statusItems = [
    { id: 'OFFLINE', label: 'Offline', icon: <PiToggleLeft size={25} /> },
    { id: 'IDLE', label: 'Detect Object', icon: <PiSecurityCamera size={25} /> },
    { id: 'OBJECT_DETECTED', label: 'Object Detected', icon: <PiScan size={25} /> },
    { id: 'MOVING_TO_OBJECT', label: 'Moving to Object', icon: <PiPath size={25} /> },
    { id: 'GRABBING', label: 'Grabbing', icon: <GiRobotGrab size={25} /> },
    { id: 'RETURNING', label: 'Returning', icon: <PiArrowArcLeft size={25} /> },
  ];

  useEffect(() => {
    const robotStatusRef = ref(database, 'robot_status');
    let timeoutId:any = null;
    const OFFLINE_THRESHOLD = 3000;

    const handleData = (snapshot:any) => {
      const data = snapshot.val();
      if (data) {
        setRobotStatus({
          status: data.status || 'N/A',
          sudut1: data.sudut1 || 0.0,
          sudut2: data.sudut2 || 0.0,
          sudut3: data.sudut3 || 0.0,
          ee_angle: data.ee_angle || 0.0,
          detected_object_cm: data.detected_object_cm || { x: 0.0, y: 0.0, z: 0.0 },
          error: data.error || null,
        });
        setIsOnline(true);
        setLastUpdate(Date.now());
      } else {
        setIsOnline(false);
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        if (Date.now() - lastUpdate > OFFLINE_THRESHOLD) {
          setIsOnline(false);
        }
      }, OFFLINE_THRESHOLD + 1000);
    };

    const onError = (error:any) => {
      console.error("Firebase error:", error);
      setIsOnline(false);
    };

    const unsubscribe = onValue(robotStatusRef, handleData, onError);

    return () => {
      unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setRobotStatus(prevStatus => ({ ...prevStatus, status: 'OFFLINE' }));
    }
  }, [isOnline]);

  const onClick = (event:any) => {
    console.log(getDatasetAtEvent(chartRef.current, event));
  };

  const generateDummyData = () => {
    let labels:any = [];
    let data:any = [];

    if (timeFilter === 'today') {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50));
    } else if (timeFilter === 'this-month') {
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 200));
    } else if (timeFilter === 'this-year') {
      labels = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 1000));
    }

    return {
      labels,
      datasets: [
        {
          label: 'Chili Picked',
          data,
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const data = generateDummyData();

  const barChartOptions:any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },

    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="flex flex-row w-full h-screen">
      <div className="p-3 pt-10 flex-1">
        <h1 className='text-2xl font-bold text-indigo-500'>ChiRa</h1>
        <div className="mt-10 flex flex-col gap-5">
          {statusItems.map((item) => (
            <div
              key={item.id}
              className={`flex gap-2 items-center p-3 rounded-lg ${robotStatus.status === item.id
                ? `text-indigo-500 border-indigo-500 border `
                : 'text-slate-400'
                }`}
            >
              {item.icon}
              <span className="text-nowrap">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-10 bg-slate-100 w-full">
        <div className='flex justify-between items-center mb-10'>
          <div className='flex gap-10 items-stretch w-full'>
            {robotStatus.detected_object_cm && (
              <div className=" p-5 border rounded-xl border-slate-300 w-1/3 relative ">
                <CardIconOverlay icon={PiVectorThreeBold} />
                <h2 className=" text-center">Detected Object (cm)</h2>
                <div className='flex flex-col gap-3 mt-5'>
                  <p className='flex gap-2 w-full items-center'>X: <span className='p-2 py-1 bg-slate-200 rounded w-full'>{robotStatus.detected_object_cm.x?.toFixed(2)}</span></p>
                  <p className='flex gap-2 w-full items-center'>Y: <span className='p-2 py-1 bg-slate-200 rounded w-full'>{robotStatus.detected_object_cm.y?.toFixed(2)}</span></p>
                  <p className='flex gap-2 w-full items-center'>Z: <span className='p-2 py-1 bg-slate-200 rounded w-full'>{robotStatus.detected_object_cm.z?.toFixed(2)}</span></p>
                </div>
              </div>
            )}
            <div className={`w-full p-3 rounded-lg border-slate-300 border flex flex-wrap gap-5 justify-center items-center relative`}>
              <CardIconOverlay icon={PiAngleBold} />
              <h2 className="w-full text-center mb-2">Robot Arm Angles</h2>
              <Speedometer value={robotStatus.sudut1} label="Angle 1" maxValue={180} />
              <Speedometer value={robotStatus.sudut2} label="Angle 2" maxValue={180} />
              <Speedometer value={robotStatus.sudut3} label="Angle 3" maxValue={180} />
              <Speedometer value={robotStatus.ee_angle} label="Angle EE" maxValue={180} />
            </div>
            <div className='flex flex-col gap-10 w-1/2 '>
              <div className='border border-slate-300 p-3 h-full rounded-xl flex flex-col gap-2 items-center relative'>
                <CardIconOverlay icon={GiChiliPepper} />
                <h1 className=''>Total chili picked today</h1>
                <h1 className='text-2xl font-bold'>100</h1>
              </div>
              <div className='border border-slate-300 p-3 h-full rounded-xl flex flex-col gap-2 items-center relative'>
                <CardIconOverlay icon={PiPercentBold} />
                <h1>Percentage of successful picks</h1>
                <h1 className='text-2xl font-bold'>95%</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="timeFilter" className="mr-2">
            Select Time Period:
          </label>
          <div className='py-1 px-2 border rounded w-fit border-indigo-500'>
            <select
              id="timeFilter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className=" focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="this-month">This Month</option>
              <option value="this-year">This Year</option>
            </select>
          </div>
        </div>
        <div className='border w-full flex flex-col border-indigo-500 rounded-lg  gap-4 items-center justify-center p-2 relative'>
          <h1>Chili Picked Over Time</h1>
          <div className='h-[480px] w-full'> <Bar ref={chartRef} className='w-full' data={data} options={barChartOptions} onClick={onClick} /></div>
          <CardIconOverlay icon={PiAlignBottomBold} />
        </div>

      </div>
      {
        robotStatus.status === 'OFFLINE' &&
        <div className="fixed bottom-5 right-5 ">
          <div className="bg-white p-3 rounded-xl border border-red-500">
            <p className="text-red-500">Error: {robotStatus.error}</p>
          </div>
        </div>
      }
    </div>
  );
};

export default DashboardLayout;