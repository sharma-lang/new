interface SensorData {
  id: number;
  temperature: number;
  humidity: number;
  Timestamp: string;
}

export const exportToCSV = (data: SensorData[], filename: string) => {
  const headers = ['ID', 'Temperature (°C)', 'Humidity (%)', 'Timestamp'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.id,
      row.temperature.toFixed(2),
      row.humidity.toFixed(2),
      new Date(row.Timestamp).toLocaleString()
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};