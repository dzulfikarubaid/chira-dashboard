'use client';

import React, { useRef, useState, useEffect } from 'react';

import {

  PiArrowArcLeft,

  PiArrowArcLeftBold,

  PiGear,

  PiHouse,

  PiLockBold,

  PiPath,

  PiPathBold,

  PiScan,

  PiScanBold,

  PiSecurityCamera,

  PiSecurityCameraBold,

  PiToggleLeft,

  PiToggleLeftBold,

} from 'react-icons/pi';

import { Bar, getDatasetAtEvent } from 'react-chartjs-2';

import { Chart, registerables } from 'chart.js';

import { database } from '@/utils/firebaseConfig'; // Sesuaikan path jika perlu

import { ref, onValue } from 'firebase/database';

import { GiRobotGrab } from 'react-icons/gi';



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

    let timeoutId: NodeJS.Timeout | null = null;

    const OFFLINE_THRESHOLD = 3000;



    const handleData = (snapshot: any) => {

      const data = snapshot.val();

      if (data) {

        setRobotStatus({

          status: data.status || 'N/A',

          sudut1: data.sudut1 || 0.0,

          sudut2: data.sudut2 || 0.0,

          sudut3: data.sudut3 || 0.0,

          ee_angle: data.ee_angle || 0.0,

          detected_object_cm: data.detected_object_cm || null,

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

      }, OFFLINE_THRESHOLD + 1000); // Sedikit tambahan waktu

    };



    const onError = (error: any) => {

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



  const onClick = (event: any) => {

    console.log(getDatasetAtEvent(chartRef.current, event));

  };



  const generateDummyData = () => {

    let labels: string[] = [];

    let data: number[] = [];



    if (timeFilter === 'today') {

      // Hourly data for today (24 hours)

      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

      data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50)); // Random chili count (0-50)

    } else if (timeFilter === 'this-month') {

      // Daily data for this month (assume 30 days)

      labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);

      data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 200)); // Random chili count (0-200)

    } else if (timeFilter === 'this-year') {

      // Monthly data for this year (12 months)

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

      data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 1000)); // Random chili count (0-1000)

    }



    return {

      labels,

      datasets: [

        {

          label: 'Chili Picked',

          data,

          backgroundColor: 'rgba(99, 102, 241, 0.6)', // Indigo color

          borderColor: 'rgba(99, 102, 241, 1)',

          borderWidth: 1,

        },

      ],

    };

  };



  const data = generateDummyData();






  return (

    <div className="flex flex-row w-full h-screen">


      <div className="p-3 pt-10 flex-1">

        <h1 className='text-2xl font-bold text-indigo-500'>ChiRa</h1>

        <div className="mt-10 flex flex-col gap-5">

          {statusItems.map((item) => (

            <div

              key={item.id}

              className={`flex gap-2 items-center p-3 rounded-lg ${robotStatus.status === item.id

                ? `text-indigo-500 outline-indigo-500 outline `

                : 'text-slate-400'

                }`}

            >

              {item.icon}

              <span className="text-nowrap">{item.label}</span>

            </div>

          ))}


        </div>

      </div>



      {/* Statistik */}

      <div className="p-10 bg-slate-100 w-full">

        <div className='flex justify-between items-center mb-8'>

          <div className='flex gap-10 '>

            <div className={`mt-5 p-3 rounded-lg outline-slate-300 outline `}>


              <p><strong>Sudut 1:</strong> {robotStatus.sudut1?.toFixed(2)}</p>

              <p><strong>Sudut 2:</strong> {robotStatus.sudut2?.toFixed(2)}</p>

              <p><strong>Sudut 3:</strong> {robotStatus.sudut3?.toFixed(2)}</p>

              <p><strong>EE Angle:</strong> {robotStatus.ee_angle?.toFixed(2)}</p>

              {robotStatus.detected_object_cm && (

                <div className="mt-3">

                  <strong>Detected Object (cm):</strong>

                  <p>X: {robotStatus.detected_object_cm.x?.toFixed(2)}</p>

                  <p>Y: {robotStatus.detected_object_cm.y?.toFixed(2)}</p>

                  <p>Z: {robotStatus.detected_object_cm.z?.toFixed(2)}</p>

                </div>

              )}


            </div>

            <div className='bg-indigo-500 p-3 rounded text-white'>

              <h1>Total chili picked today</h1>

              <h1 className='text-2xl font-bold'>100</h1>

            </div>

            <div className='bg-indigo-500 p-3 rounded text-white'>

              <h1>Percentage of successful picks</h1>

              <h1 className='text-2xl font-bold'>95%</h1>

            </div>

            <div className='bg-indigo-500 p-3 rounded text-white'>

              <h1>Average time per pick</h1>

              <h1 className='text-2xl font-bold'>10s</h1>

            </div>

          </div>

        </div>

        <div className="mb-4">

          <label htmlFor="timeFilter" className="mr-2">

            Select Time Period:

          </label>

          <select

            id="timeFilter"

            value={timeFilter}

            onChange={(e) => setTimeFilter(e.target.value)}

            className="p-1 border border-indigo-500 rounded"

          >

            <option value="today">Today</option>

            <option value="this-month">This Month</option>

            <option value="this-year">This Year</option>

          </select>

        </div>

        <div className='outline outline-indigo-500 rounded-lg'>

          <Bar ref={chartRef} data={data} onClick={onClick} />

        </div>

      </div>

      {

        robotStatus.status == 'OFFLINE' &&

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