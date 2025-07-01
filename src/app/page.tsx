'use client';
import React, { useRef, useState, useEffect } from 'react';
import { PiAlignBottomBold, PiAngleBold, PiArrowArcLeft, PiChartBarBold, PiGear, PiHouse, PiLockBold, PiPath, PiPercentBold, PiScan, PiSecurityCamera, PiToggleLeft, PiVectorThreeBold, } from 'react-icons/pi';
import { Bar, getDatasetAtEvent } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { GiChiliPepper, GiRobotGrab } from 'react-icons/gi';
import Speedometer from './components/Speedometer';
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
  const [totalChiliPicked, setTotalChiliPicked] = useState(0);
  const [totalPickingAttempts, setTotalPickingAttempts] = useState(0);
  const [chiliChartData, setChiliChartData] = useState<{ label: string; value: number }[]>([]);
  const [hourlyChiliData, setHourlyChiliData] = useState<{ label: string; value: number }[]>([]);
  const [dailyChiliData, setDailyChiliData] = useState<{ label: string; value: number }[]>([]);
  const [monthlyChiliData, setMonthlyChiliData] = useState<{ label: string; value: number }[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFirebaseTimestamp, setLastFirebaseTimestamp] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState('today');
  const chartRef = useRef<any>(null);
  const statusItems = [
    { id: 'OFFLINE', label: 'Offline', icon: <PiToggleLeft size={25} /> },
    { id: 'IDLE', label: 'Detect Object', icon: <PiSecurityCamera size={25} /> },
    { id: 'OBJECT_DETECTED', label: 'Object Detected', icon: <PiScan size={25} /> },
    { id: 'MOVING_TO_OBJECT', label: 'Moving to Object', icon: <PiPath size={25} /> },
    { id: 'GRABBING', label: 'Grabbing', icon: <GiRobotGrab size={25} /> },
    { id: 'RETURNING', label: 'Returning', icon: <PiArrowArcLeft size={25} /> },
    { id: 'PICKED', label: 'Chili Picked!', icon: <GiChiliPepper size={25} /> },
  ];
  useEffect(() => {
    const robotStatusRef = ref(database, 'robot_status');
    const OFFLINE_THRESHOLD_MS = 5000;
    const handleRobotStatusData = (snapshot: any) => {
      const data = snapshot.val();
      if (data && data.timestamp) {
        setLastFirebaseTimestamp(data.timestamp);
        setRobotStatus(prevStatus => {
          const newDetectedObjectCm = {
            x: data.detected_object_cm?.x ?? prevStatus.detected_object_cm.x,
            y: data.detected_object_cm?.y ?? prevStatus.detected_object_cm.y,
            z: data.detected_object_cm?.z ?? prevStatus.detected_object_cm.z,
          };
          return {
            status: data.status ?? prevStatus.status,
            sudut1: data.sudut1 ?? prevStatus.sudut1,
            sudut2: data.sudut2 ?? prevStatus.sudut2,
            sudut3: data.sudut3 ?? prevStatus.sudut3,
            ee_angle: data.ee_angle ?? prevStatus.ee_angle,
            detected_object_cm: newDetectedObjectCm,
            error: data.error ?? null,
          };
        });
        setIsOnline(true);
        console.log("ROBOT STATUS DATA", data);
      } else {
        setIsOnline(false);
        setRobotStatus((prevStatus:any) => ({
          ...prevStatus,
          status: 'OFFLINE',
          error: 'No data or timestamp received from robot. Robot might be offline.',
        }));
      }
    };
    const onRobotStatusError = (error: any) => {
      console.error("Firebase error (robot_status):", error);
      setIsOnline(false);
      setRobotStatus(prevStatus => ({
        ...prevStatus,
        status: 'OFFLINE',
        error: error.message || 'Firebase connection error',
      }));
    };
    const unsubscribeRobotStatus = onValue(robotStatusRef, handleRobotStatusData, onRobotStatusError);
    const statisticsRef = ref(database, 'statistics');
    const handleStatisticsData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setTotalChiliPicked(data.chili_picked_count ?? 0);
        setTotalPickingAttempts(data.total_picking_attempts ?? 0);
        console.log("STATISTICS DATA", data);
      }
    };
    const onStatisticsError = (error: any) => {
      console.error("Firebase error (statistics):", error);
    };
    const unsubscribeStatistics = onValue(statisticsRef, handleStatisticsData, onStatisticsError);
    let unsubscribeHourlyData: (() => void) | undefined;
    let unsubscribeDailyData: (() => void) | undefined;
    let unsubscribeMonthlyData: (() => void) | undefined;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentDay = String(today.getDate()).padStart(2, '0');
    if (timeFilter === 'today') {
      const dateKeyHourly = `${currentYear}-${currentMonth}-${currentDay}`;
      const hourlyRef = ref(database, `hourly_chili_picks/${dateKeyHourly}`);
      unsubscribeHourlyData = onValue(hourlyRef, (snapshot) => {
        const data = snapshot.val();
        const newHourlyChiliData: { label: string; value: number }[] = [];
        for (let i = 0; i < 24; i++) {
          const hour = String(i).padStart(2, '0');
          newHourlyChiliData.push({ label: `${hour}:00`, value: (data && data[hour] && data[hour].count) ? data[hour].count : 0 });
        }
        setHourlyChiliData(newHourlyChiliData);
      }, (error) => {
        console.error("Firebase error (hourly_chili_picks):", error);
        setHourlyChiliData([]);
      });
      setDailyChiliData([]);
      setMonthlyChiliData([]);
    } else if (timeFilter === 'this-month') {
      const dateKeyDaily = `${currentYear}-${currentMonth}`;
      const dailyRef = ref(database, `daily_chili_picks/${dateKeyDaily}`);
      unsubscribeDailyData = onValue(dailyRef, (snapshot) => {
        const data = snapshot.val();
        const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
        const newDailyChiliData: { label: string; value: number }[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
          const day = String(i).padStart(2, '0');
          newDailyChiliData.push({ label: `${day}`, value: (data && data[day] && data[day].count) ? data[day].count : 0 });
        }
        setDailyChiliData(newDailyChiliData);
      }, (error) => {
        console.error("Firebase error (daily_chili_picks):", error);
        setDailyChiliData([]);
      });
      setHourlyChiliData([]);
      setMonthlyChiliData([]);
    } else if (timeFilter === 'this-year') {
      const yearKeyMonthly = `${currentYear}`;
      const monthlyRef = ref(database, `monthly_chili_picks/${yearKeyMonthly}`);
      unsubscribeMonthlyData = onValue(monthlyRef, (snapshot) => {
        const data = snapshot.val();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const newMonthlyChiliData: { label: string; value: number }[] = [];
        for (let i = 0; i < 12; i++) {
          const monthNum = String(i + 1).padStart(2, '0');
          newMonthlyChiliData.push({ label: monthNames[i], value: (data && data[monthNum] && data[monthNum].count) ? data[monthNum].count : 0 });
        }
        setMonthlyChiliData(newMonthlyChiliData);
      }, (error) => {
        console.error("Firebase error (monthly_chili_picks):", error);
        setMonthlyChiliData([]);
      });
      setHourlyChiliData([]);
      setDailyChiliData([]);
    }
    const checkOnlineStatusInterval = setInterval(() => {
      if (lastFirebaseTimestamp !== null) {
        const currentTimeMs = Date.now();
        const lastTimestampMs = lastFirebaseTimestamp * 1000;
        const timeDiff = currentTimeMs - lastTimestampMs;
        if (timeDiff > OFFLINE_THRESHOLD_MS) {
          setIsOnline(false);
          let displayTime: string;
          const totalSeconds = Math.floor(timeDiff / 1000);
          if (totalSeconds < 60) {
            displayTime = `${totalSeconds} seconds`;
          } else if (totalSeconds < 3600) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            displayTime = `${minutes} minutes ${seconds} seconds`;
          } else {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            displayTime = `${hours} hours ${minutes} minutes`;
          }
          setRobotStatus((prevStatus:any) => ({
            ...prevStatus,
            status: 'OFFLINE',
            error: `Robot connection timed out. Last updated ${displayTime} ago.`,
          }));
        } else {
          setIsOnline(true);
        }
      } else {
        setIsOnline(false);
        setRobotStatus((prevStatus:any) => ({
          ...prevStatus,
          status: 'OFFLINE',
          error: 'Waiting for initial data from robot or robot is offline.',
        }));
      }
    }, 1000);
    return () => {
      unsubscribeRobotStatus();
      unsubscribeStatistics();
      clearInterval(checkOnlineStatusInterval);
      if (unsubscribeHourlyData) {
        unsubscribeHourlyData();
      }
      if (unsubscribeDailyData) {
        unsubscribeDailyData();
      }
      if (unsubscribeMonthlyData) {
        unsubscribeMonthlyData();
      }
    };
  }, [lastFirebaseTimestamp, timeFilter]);
  useEffect(() => {
    if (!isOnline && robotStatus.status !== 'OFFLINE') {
      setRobotStatus(prevStatus => ({ ...prevStatus, status: 'OFFLINE' }));
    }
  }, [isOnline, robotStatus.status]);
  const pickingSuccessPercentage = totalPickingAttempts > 0
    ? ((totalChiliPicked / totalPickingAttempts) * 100).toFixed(2)
    : '0.00';
  const onClick = (event: any) => {
    console.log(getDatasetAtEvent(chartRef.current, event));
  };
  const generateChartData = () => {
    let labels: string[] = [];
    let dataValues: number[] = [];
    let xAxisLabel = 'Time Period';
    if (timeFilter === 'today') {
      labels = hourlyChiliData.map(dataPoint => dataPoint.label);
      dataValues = hourlyChiliData.map(dataPoint => dataPoint.value);
      xAxisLabel = 'Hour of Day';
    } else if (timeFilter === 'this-month') {
      labels = dailyChiliData.map(dataPoint => dataPoint.label);
      dataValues = dailyChiliData.map(dataPoint => dataPoint.value);
      xAxisLabel = 'Day of Month';
    } else if (timeFilter === 'this-year') {
      labels = monthlyChiliData.map(dataPoint => dataPoint.label);
      dataValues = monthlyChiliData.map(dataPoint => dataPoint.value);
      xAxisLabel = 'Month of Year';
    } else {
      labels = [{ label: 'Total', value: totalChiliPicked }].map(dataPoint => dataPoint.label);
      dataValues = [{ label: 'Total', value: totalChiliPicked }].map(dataPoint => dataPoint.value);
      xAxisLabel = 'Total';
    }
    return {
      labels,
      datasets: [
        {
          label: 'Chili Picked',
          data: dataValues,
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
      xAxisLabel,
    };
  };
  const chartDataResult = generateChartData();
  const chartData = {
    labels: chartDataResult.labels,
    datasets: chartDataResult.datasets,
  };
  const xAxisLabel = chartDataResult.xAxisLabel;
  const barChartOptions: any = {
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
        title: {
          display: true,
          text: 'Number of Chilies'
        }
      },
      x: {
        title: {
          display: true,
          text: xAxisLabel
        }
      }
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
              <Speedometer value={robotStatus.ee_angle} label="EE Angle" maxValue={180} />
            </div>
            <div className='flex flex-col gap-10 w-1/2 '>
              <div className='border border-slate-300 p-3 h-full rounded-xl flex flex-col gap-2 items-center relative'>
                <CardIconOverlay icon={GiChiliPepper} />
                <h1>Total Chilies Picked</h1>
                <h1 className='text-2xl font-bold'>{totalChiliPicked}</h1>
              </div>
              <div className='border border-slate-300 p-3 h-full rounded-xl flex flex-col gap-2 items-center relative'>
                <CardIconOverlay icon={PiChartBarBold} />
                <h1>Total Picking Attempts</h1>
                <h1 className='text-2xl font-bold'>{totalPickingAttempts}</h1>
              </div>
              <div className='border border-slate-300 p-3 h-full rounded-xl flex flex-col gap-2 items-center relative'>
                <CardIconOverlay icon={PiPercentBold} />
                <h1>Picking Success Rate</h1>
                <h1 className='text-2xl font-bold'>{pickingSuccessPercentage}%</h1>
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
        <div className='border w-full flex flex-col border-indigo-500 rounded-lg gap-4 items-center justify-center p-2 relative'>
          <h1>Chilies Picked Over Time</h1>
          <div className='h-[480px] w-full'> <Bar ref={chartRef} className='w-full' data={chartData} options={barChartOptions} onClick={onClick} /></div>
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