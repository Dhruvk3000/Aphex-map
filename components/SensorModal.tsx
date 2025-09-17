import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sensor, SensorStatus } from '../types';

interface SensorModalProps {
  sensor: Sensor;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const SensorModal: React.FC<SensorModalProps> = ({ sensor, onClose, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(sensor.id);
  };

  const isDefaultData = sensor.readings.every(r => r.waterQuality === 50 && r.bacteriaCount === 20);
  const isInactive = sensor.status === SensorStatus.Inactive;
  const useDottedLine = isDefaultData || isInactive;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1100] transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 text-white rounded-xl shadow-2xl w-full max-w-3xl p-8 transform transition-all relative"
        onClick={(e) => e.stopPropagation()} // stops background close
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{sensor.id}</h2>
            <p className={`text-lg font-semibold ${
              sensor.status === SensorStatus.Active ? 'text-green-400' :
              sensor.status === SensorStatus.Inactive ? 'text-gray-400' : 'text-red-400'
            }`}>
              {sensor.status}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Delete */}
            <button
              onClick={handleDelete}
              title="Delete Sensor"
              className="p-2 text-gray-400 hover:text-white bg-red-800 hover:bg-red-700 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart */}
        <h3 className="text-xl font-semibold mb-4 text-gray-300">Historical Sensor Readings</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={sensor.readings} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis dataKey="date" stroke="#a0aec0" />
              <YAxis yAxisId="left" stroke={useDottedLine ? '#9ca3af' : '#81e6d9'} />
              <YAxis yAxisId="right" orientation="right" stroke={useDottedLine ? '#9ca3af' : '#f6ad55'} />
              <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }} labelStyle={{ color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Line yAxisId="left" type="monotone" dataKey="waterQuality" stroke={useDottedLine ? '#9ca3af' : '#81e6d9'} strokeDasharray={useDottedLine ? "5 5" : ""} strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="bacteriaCount" stroke={useDottedLine ? '#9ca3af' : '#f6ad55'} strokeDasharray={useDottedLine ? "5 5" : ""} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {showConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-xl">
            <div className="bg-gray-900 text-white rounded-lg p-6 w-full max-w-sm shadow-xl">
              <h4 className="text-lg font-semibold mb-2">Delete Sensor</h4>
              <p className="text-sm text-gray-300 mb-4">Are you sure you want to delete <span className="font-semibold">{sensor.id}</span>? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorModal;
