import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapWrapper from './components/MapWrapper';
import SensorModal from './components/SensorModal';
import AddControl from './components/AddControl';
import { Sensor, CaseReport, LayerVisibility, SensorStatus, MapStats, Cluster, RiskZone, AddMode, Weather, CaseType, SensorReading } from './types';
import { INITIAL_SENSORS, INITIAL_CASES, CLUSTERS, RISK_ZONES } from './lib/data';
import type { LatLng } from 'leaflet';

// IMPORTANT: Replace with your actual OpenWeatherMap API key
const WEATHER_API_KEY = (import.meta as any).env?.VITE_WEATHER_API_KEY || '257d26b5e367d7b7c54b3ac16f836821';

// --- AddSensorModal Component ---
interface AddSensorModalProps {
  onClose: () => void;
  onSave: (data: { installationDate: string, file: File | null }) => void;
}

const AddSensorModal: React.FC<AddSensorModalProps> = ({ onClose, onSave }) => {
  const [installationDate, setInstallationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSave = useCallback(() => {
    if (!installationDate) {
      alert('Please select an installation date.');
      return;
    }
    onSave({ installationDate, file });
  }, [onSave, installationDate, file]);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1001]"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 text-white rounded-xl shadow-2xl w-full max-w-lg p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold">Add New Sensor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-6">
            <div>
              <label htmlFor="installationDate" className="block text-sm font-medium text-gray-300 mb-2">
                Installation Date
              </label>
              <input
                type="date"
                id="installationDate"
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-300 mb-2">
                Upload Sensor Readings (CSV)
              </label>
              <p className="text-xs text-gray-400 mb-2">Optional. Format: date,waterQuality,bacteriaCount</p>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-semibold transition-colors"
            >
              Add Sensor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>(INITIAL_SENSORS);
  const [cases, setCases] = useState<CaseReport[]>(INITIAL_CASES);
  const [clusters] = useState<Cluster[]>(CLUSTERS);
  const [riskZones] = useState<RiskZone[]>(RISK_ZONES);

  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    sensors: true,
    cases: true,
    contaminatedZones: true,
    inRiskZones: true,
  });

  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [weather, setWeather] = useState<Weather | null>(null);

  const [isAddSensorModalOpen, setIsAddSensorModalOpen] = useState(false);
  const [pendingSensorLocation, setPendingSensorLocation] = useState<LatLng | null>(null);

  const stats: MapStats = useMemo(() => {
    const activeSensors = sensors.filter(s => s.status !== SensorStatus.Inactive).length;
    return {
      activeSensors,
      reportedCases: cases.length,
      contaminatedClusters: clusters.length,
      totalRiskZoneArea: riskZones.reduce((acc, zone) => acc + (Math.PI * Math.pow(zone.radius, 2) / 1000000), 0).toFixed(2),
    };
  }, [sensors, cases, clusters, riskZones]);

  const handleAddItem = useCallback((latlng: LatLng) => {
    if (!addMode) return;

    if (addMode === 'sensor') {
      setPendingSensorLocation(latlng);
      setIsAddSensorModalOpen(true);
    } else {
      const isConfirmed = addMode === 'confirmed';
      const newCase: CaseReport = {
        id: `case-${cases.length + 1}`,
        position: [latlng.lat, latlng.lng],
        type: isConfirmed ? CaseType.Confirmed : CaseType.SelfReported,
        name: `Patient ${cases.length + 1}`,
        age: Math.floor(Math.random() * 60) + 10,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        symptoms: isConfirmed ? ['High Fever', 'Dehydration'] : ['Fever', 'Headache'],
        disease: isConfirmed
          ? (Math.random() > 0.5 ? 'Cholera' : 'Typhoid')
          : 'Suspected: Gastroenteritis',
      };
      setCases(prev => [...prev, newCase]);
    }

    setAddMode(null);
  }, [addMode, cases.length]);

  const handleAddSensor = useCallback(async ({ installationDate, file }: { installationDate: string, file: File | null }) => {
    if (!pendingSensorLocation) return;

    let newReadings: SensorReading[] = [];

    if (file) {
      try {
        const text = await file.text();
        newReadings = text.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .slice(1) // Skip header row
          .map(line => {
            const [date, waterQuality, bacteriaCount] = line.split(',');
            if (date && waterQuality && bacteriaCount) {
              return {
                date,
                waterQuality: parseInt(waterQuality, 10),
                bacteriaCount: parseInt(bacteriaCount, 10),
              };
            }
            return null;
          }).filter((r): r is SensorReading => r !== null);
      } catch (error) {
        console.error("Error parsing CSV:", error);
      }
    }
    
    if (newReadings.length === 0) {
      // Create a "flat line" of data if no CSV is provided or if parsing fails
      const today = new Date();
      today.setHours(0,0,0,0);
      const startDate = new Date(installationDate);
      startDate.setHours(0,0,0,0);

      if (startDate > today) {
        const day = String(startDate.getDate()).padStart(2, '0');
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const year = startDate.getFullYear();
        newReadings = [{ date: `${day}-${month}-${year}`, waterQuality: 50, bacteriaCount: 20 }];
      } else {
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        newReadings = Array.from({ length: diffDays }, (_, i) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const day = String(currentDate.getDate()).padStart(2, '0');
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const year = currentDate.getFullYear();
          return { date: `${day}-${month}-${year}`, waterQuality: 50, bacteriaCount: 20 };
        });
      }
    }

    const newSensor: Sensor = {
      id: `sensor-${sensors.length + 1}`,
      position: [pendingSensorLocation.lat, pendingSensorLocation.lng],
      status: SensorStatus.Active,
      readings: newReadings,
    };

    setSensors(prev => [...prev, newSensor]);
    setIsAddSensorModalOpen(false);
    setPendingSensorLocation(null);
  }, [pendingSensorLocation, sensors.length]);


  const handleCloseAddSensorModal = useCallback(() => {
    setIsAddSensorModalOpen(false);
    setPendingSensorLocation(null);
  }, []);

  const handleSensorClick = useCallback((sensor: Sensor) => {
    setSelectedSensor(sensor);
  }, []);
  
  const handleDeleteSensor = useCallback((sensorId: string) => {
    setSensors(prev => prev.filter(s => s.id !== sensorId));
    setSelectedSensor(null); // Close the modal after deletion
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedSensor(null);
  }, []);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
      setWeather({ location: "Pune", temp: 28, description: "Weather API Key needed", icon: "50d" });
      console.warn("OpenWeatherMap API key not configured.");
      return;
    }
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();
      setWeather({
        location: data.name,
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      });
    } catch (error) {
      console.error("Weather fetch error:", error);
      setWeather(null);
    }
  }, []);
  
  const debouncedFetchWeather = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (lat: number, lon: number) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fetchWeather(lat, lon);
        }, 800);
    };
  }, [fetchWeather]);

  const handleMapMove = useCallback((center: LatLng) => {
    debouncedFetchWeather(center.lat, center.lng);
  }, [debouncedFetchWeather]);
  
  return (
    <div className="flex h-screen font-sans bg-gray-900 text-gray-100">
      <Sidebar
        stats={stats}
        layerVisibility={layerVisibility}
        onLayerVisibilityChange={setLayerVisibility}
        weather={weather}
      />
      <main className={`flex-1 relative ${addMode ? 'cursor-crosshair' : ''}`}>
        <MapWrapper
          sensors={sensors}
          cases={cases}
          clusters={clusters}
          riskZones={riskZones}
          layerVisibility={layerVisibility}
          addMode={addMode}
          onAddItem={handleAddItem}
          onSensorClick={handleSensorClick}
          onMapMove={handleMapMove}
        />
        <AddControl addMode={addMode} setAddMode={setAddMode} />
      </main>
      {selectedSensor && (
        <SensorModal 
          sensor={selectedSensor} 
          onClose={handleCloseModal}
          onDelete={handleDeleteSensor} 
        />
      )}
      {isAddSensorModalOpen && (
        <AddSensorModal 
          onClose={handleCloseAddSensorModal} 
          onSave={handleAddSensor} 
        />
      )}
    </div>
  );
};

export default App;
