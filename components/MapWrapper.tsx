import React from 'react';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, useMapEvents, Pane } from 'react-leaflet';
import type { LeafletMouseEvent, LatLng } from 'leaflet';
import L from 'leaflet';
import { Sensor, CaseReport, Cluster, RiskZone, LayerVisibility, SensorStatus, CaseType, AddMode } from '../types';
import type { Map } from 'leaflet';

const createSensorIcon = (status: SensorStatus): L.DivIcon => {
    const color = {
        [SensorStatus.Active]: '#2563eb', // blue-600
        [SensorStatus.Inactive]: '#6b7280', // gray-500
        [SensorStatus.Contaminated]: '#dc2626', // red-600
    }[status];

    const html = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="${color}">
      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
    </svg>`;
  
    return L.divIcon({
      html: html,
      className: 'bg-transparent border-0',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
};

interface MapWrapperProps {
  sensors: Sensor[];
  cases: CaseReport[];
  clusters: Cluster[];
  riskZones: RiskZone[];
  layerVisibility: LayerVisibility;
  addMode: AddMode;
  onAddItem: (latlng: LatLng) => void;
  onSensorClick: (sensor: Sensor) => void;
  onMapMove: (center: LatLng) => void;
}

const MapEventsHandler: React.FC<{ 
  addMode: AddMode;
  onAddItem: (latlng: LatLng) => void;
  onMapMove: (center: LatLng) => void;
}> = ({ addMode, onAddItem, onMapMove }) => {
  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      if (addMode) {
        onAddItem(e.latlng);
      }
    },
    moveend() {
      onMapMove(map.getCenter());
    },
    load() {
      onMapMove(map.getCenter());
    },
  });
  return null;
};

const MapWrapper: React.FC<MapWrapperProps> = ({
  sensors,
  cases,
  clusters,
  riskZones,
  layerVisibility,
  addMode,
  onAddItem,
  onSensorClick,
  onMapMove,
}) => {
  const mapCenter: [number, number] = [18.5204, 73.8567];

  return (
    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* Define custom panes for layering */}
      <Pane name="riskZonePane" style={{ zIndex: 450 }} />
      <Pane name="contaminatedZonePane" style={{ zIndex: 460 }} />
      <Pane name="casePane" style={{ zIndex: 470 }} />
      {/* Sensor markers will use the default markerPane (zIndex: 600) */}

      {/* Sensor Layer */}
      {layerVisibility.sensors && sensors.map(sensor => (
        <Marker
          key={sensor.id}
          position={sensor.position}
          icon={createSensorIcon(sensor.status)}
          eventHandlers={{
            click: () => onSensorClick(sensor),
          }}
        />
      ))}

      {/* Case Report Layer */}
      {layerVisibility.cases && cases.map(report => (
        <CircleMarker
          key={report.id}
          center={report.position}
          pane="casePane"
          radius={6}
          pathOptions={{
            color: report.type === CaseType.Confirmed ? '#b91c1c' : '#f59e0b', // red-800 or amber-500
            fillColor: report.type === CaseType.Confirmed ? '#ef4444' : '#facc15', // red-500 or yellow-400
            fillOpacity: 0.8,
            weight: 1,
          }}
        >
          <Popup>
            <div className="w-48 text-gray-800">
                <h3 className="font-bold text-base mb-1">Case: {report.id}</h3>
                <p><strong>Name:</strong> {report.name}</p>
                <p><strong>Age:</strong> {report.age}, <strong>Gender:</strong> {report.gender}</p>
                <p><strong>Status:</strong> {report.type}</p>
                <p><strong>Diagnosis:</strong> <span className="font-semibold">{report.disease}</span></p>
                <p className="mt-1"><strong>Symptoms:</strong> {report.symptoms.join(', ')}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Contaminated Zone Layer */}
      {layerVisibility.contaminatedZones && clusters.map(cluster => (
        <Circle
          key={`${cluster.id}-${addMode}`}
          center={cluster.center}
          radius={cluster.radius}
          pane="contaminatedZonePane"
          pathOptions={{ 
            color: '#dc2626', 
            fillColor: '#ef4444', 
            fillOpacity: 0.3, 
            weight: 2,
            // Disable interaction when in add mode to allow placing items inside the zone
            interactive: !addMode
          }}
        >
           <Popup>Contaminated Zone</Popup>
        </Circle>
      ))}

       {/* In-Risk Zone Layer */}
      {layerVisibility.inRiskZones && riskZones.map(zone => (
        <Circle
          key={`${zone.id}-${addMode}`}
          center={zone.center}
          radius={zone.radius}
          pane="riskZonePane"
          pathOptions={{ 
            color: '#f59e0b', 
            fillColor: '#facc15', 
            fillOpacity: 0.2, 
            weight: 2, 
            dashArray: '10, 5',
            // Disable interaction when in add mode
            interactive: !addMode
          }}
        >
            <Popup>In-Risk Zone</Popup>
        </Circle>
      ))}
      
      <MapEventsHandler addMode={addMode} onAddItem={onAddItem} onMapMove={onMapMove} />
    </MapContainer>
  );
};

export default MapWrapper;