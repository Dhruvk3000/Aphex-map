import React from 'react';
import type { MapStats, LayerVisibility, Weather } from '../types';

interface SidebarProps {
  stats: MapStats;
  layerVisibility: LayerVisibility;
  onLayerVisibilityChange: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  weather: Weather | null;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: JSX.Element }> = ({ label, value, icon }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex items-center">
    <div className="p-3 mr-4 bg-gray-700 rounded-full">{icon}</div>
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  </div>
);

const LayerToggle: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between p-3 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700 transition-colors">
    <span className="text-gray-200">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className={`block w-10 h-6 rounded-full ${checked ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
    </div>
  </label>
);

const Sidebar: React.FC<SidebarProps> = ({ stats, layerVisibility, onLayerVisibilityChange, weather }) => {
  const toggleLayer = (layer: keyof LayerVisibility) => {
    onLayerVisibilityChange(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <aside className="w-96 bg-gray-900 p-6 flex flex-col space-y-8 overflow-y-auto border-r border-gray-700 shadow-lg">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Outbreak Monitor</h1>
        <p className="text-gray-400 mt-1">Real-time analysis dashboard</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Weather Alert</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          {weather ? (
             <div className="flex items-center">
                <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                    alt={weather.description} 
                    className="w-16 h-16 -ml-2 -mt-2"
                />
                <div className="ml-2">
                    <p className="text-3xl font-bold">{weather.temp}°C</p>
                    <p className="text-gray-300 capitalize">{weather.description}</p>
                    <p className="text-sm text-gray-400">{weather.location}</p>
                </div>
             </div>
          ) : (
            <p className="text-gray-400">Loading weather data...</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Statistics</h2>
        <div className="grid grid-cols-1 gap-4">
          <StatCard label="Active Sensors" value={stats.activeSensors} icon={<SensorIcon />} />
          <StatCard label="Reported Cases" value={stats.reportedCases} icon={<CaseIcon />} />
          <StatCard label="Contaminated Clusters" value={stats.contaminatedClusters} icon={<ClusterIcon />} />
          <StatCard label="Risk Zone Size (km²)" value={stats.totalRiskZoneArea} icon={<RiskZoneIcon />} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Map Layers</h2>
        <div className="space-y-3">
          <LayerToggle label="IoT Sensors" checked={layerVisibility.sensors} onChange={() => toggleLayer('sensors')} />
          <LayerToggle label="Reported Cases" checked={layerVisibility.cases} onChange={() => toggleLayer('cases')} />
          <LayerToggle label="Contaminated Zones" checked={layerVisibility.contaminatedZones} onChange={() => toggleLayer('contaminatedZones')} />
          <LayerToggle label="In-Risk Zones" checked={layerVisibility.inRiskZones} onChange={() => toggleLayer('inRiskZones')} />
          <LayerToggle label="Health Facilities" checked={layerVisibility.healthFacilities} onChange={() => toggleLayer('healthFacilities')} />
          <LayerToggle label="Contaminated Water" checked={layerVisibility.contaminatedWater} onChange={() => toggleLayer('contaminatedWater')} />
        </div>
      </div>
       <div className="mt-auto text-center text-gray-500 text-xs">
          <p>Use the '+' button on the map to add new items.</p>
        </div>
    </aside>
  );
};

// SVG Icons
const SensorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClusterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-5M3 4h5V9" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
  </svg>
);

const RiskZoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default Sidebar;
