import React from 'react';

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: 'online' | 'offline' | 'warning';
  type: 'temperature' | 'humidity';
}

const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon,
  status,
  type
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'online': return 'Stable';
      case 'warning': return 'Warning';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`sensor-card ${type}`}>
      <div className="card-header">
        <div className={`card-icon ${type}`}>
          {icon}
        </div>
        <div className="card-title">
          <h3>{title}</h3>
          <p>Current reading</p>
        </div>
      </div>
      
      <div className="card-value">
        <span className="value">{value.toFixed(1)}</span>
        <span className="unit">{unit}</span>
      </div>
      
      <div className="card-status">
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor() }}
        />
        <span style={{ color: getStatusColor() }}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default SensorCard;