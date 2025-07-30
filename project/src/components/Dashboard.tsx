import React, { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, WifiOff, Thermometer, Droplets, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import SensorCard from './SensorCard';
import ChartSection from './ChartSection';
import ThreeScene from './ThreeScene';
import ParticleBackground from './ParticleBackground';
import { supabase } from '../utils/supabase';
import { exportToCSV } from '../utils/export';

interface SensorData {
  id: number;
  temperature: number;
  humidity: number;
  Timestamp: string;
}

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [timeRange, setTimeRange] = useState('1H');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSensorData = async () => {
    try {
      setError(null);
      const hoursMap = { '1H': 1, '6H': 6, '24H': 24, '7D': 168 };
      const hours = hoursMap[timeRange as keyof typeof hoursMap];
      
      const { data, error } = await supabase
        .from('Sensor_data')
        .select('*')
        .gte('Timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('Timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setSensorData(data);
        setCurrentData(data[data.length - 1]);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Error fetching sensor data:', err);
      setError('Failed to fetch sensor data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('Sensor_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Sensor_data'
        },
        (payload) => {
          const newData = payload.new as SensorData;
          setSensorData(prev => [...prev.slice(-999), newData]);
          setCurrentData(newData);
          setIsConnected(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchSensorData, refreshInterval * 1000);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRange]);

  useEffect(() => {
    startAutoRefresh();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, autoRefresh]);

  const getSensorStatus = () => {
    if (!currentData) return 'offline';
    const lastUpdate = new Date(currentData.Timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (diffMinutes > 5) return 'offline';
    if (currentData.temperature > 35 || currentData.humidity > 80) return 'warning';
    return 'online';
  };

  const handleExportCSV = () => {
    exportToCSV(sensorData, `sensor_data_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="dashboard">
      <ParticleBackground />
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <Activity className="logo-icon" />
            <div>
              <h1>ESP32 IoT Dashboard</h1>
              <p>Real-time sensor monitoring</p>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? (
              <>
                <Wifi className="status-icon" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="status-icon" />
                <span>Disconnected</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="controls-section">
        <div className="time-range-selector">
          <span>Time Range:</span>
          {['1H', '6H', '24H', '7D'].map((range) => (
            <button
              key={range}
              className={`range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="refresh-controls">
          <span>Refresh:</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="refresh-select"
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
          
          <button className="refresh-btn" onClick={fetchSensorData}>
            <RefreshCw className="btn-icon" />
            Refresh
          </button>
          
          <button className="export-btn" onClick={handleExportCSV}>
            <Download className="btn-icon" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <AlertTriangle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Sensor Cards */}
        <div className="sensor-cards">
          <SensorCard
            title="Temperature"
            value={currentData?.temperature || 0}
            unit="°C"
            icon={<Thermometer />}
            status={getSensorStatus()}
            type="temperature"
          />
          
          <SensorCard
            title="Humidity"
            value={currentData?.humidity || 0}
            unit="%"
            icon={<Droplets />}
            status={getSensorStatus()}
            type="humidity"
          />
        </div>

        {/* Chart Section */}
        <ChartSection data={sensorData} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Dashboard;