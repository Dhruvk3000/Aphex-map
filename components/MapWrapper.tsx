import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, useMapEvents, Pane, Polyline } from 'react-leaflet';
import type { LeafletMouseEvent, LatLng } from 'leaflet';
import L from 'leaflet';
import { Sensor, CaseReport, Cluster, RiskZone, LayerVisibility, SensorStatus, CaseType, AddMode, Facility, FacilityType, Waterway } from '../types';

const createSensorIcon = (status: SensorStatus): L.DivIcon => {
  const color = {
    [SensorStatus.Active]: '#2563eb',
    [SensorStatus.Inactive]: '#6b7280',
    [SensorStatus.Contaminated]: '#dc2626',
  }[status];

  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="${color}">
      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
    </svg>`;

  return L.divIcon({
    html,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
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
  facilities: Facility[];
  waterways: Waterway[];
}

const MapEventsHandler: React.FC<{
  addMode: AddMode;
  onAddItem: (latlng: LatLng) => void;
  onMapMove: (center: LatLng) => void;
  onZoomChange: (zoom: number) => void;
}> = ({ addMode, onAddItem, onMapMove, onZoomChange }) => {
  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      if (addMode) onAddItem(e.latlng);
    },
    moveend() {
      onMapMove(map.getCenter());
    },
    load() {
      onMapMove(map.getCenter());
      onZoomChange(map.getZoom());
    },
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });
  return null;
};

interface AggregatedGroup {
  id: string;
  type: CaseType;
  center: [number, number];
  items: CaseReport[];
}

const getPrecisionForZoom = (zoom: number): number => {
  if (zoom >= 16) return 4; // no clustering only when very zoomed-in
  if (zoom >= 14) return 3; // start clustering a bit sooner
  if (zoom >= 12) return 2;
  if (zoom >= 10) return 1;
  return 0;
};

const roundCoord = (value: number, precision: number) =>
  Number(value.toFixed(precision));

const clusterCases = (cases: CaseReport[], zoom: number): AggregatedGroup[] => {
  const precision = getPrecisionForZoom(zoom);
  // At high zoom, do not cluster: each case is its own group
  if (precision >= 4) {
    return cases.map((c) => ({
      id: `${c.id}`,
      type: c.type,
      center: c.position,
      items: [c],
    }));
  }

  const map = new Map<string, AggregatedGroup>();
  for (const c of cases) {
    const [lat, lng] = c.position;
    const key = `${c.type}:${roundCoord(lat, precision)}:${roundCoord(lng, precision)}`;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(c);
      // Update center as simple average for stability
      const n = existing.items.length;
      const avgLat = (existing.center[0] * (n - 1) + lat) / n;
      const avgLng = (existing.center[1] * (n - 1) + lng) / n;
      existing.center = [avgLat, avgLng];
    } else {
      map.set(key, {
        id: key,
        type: c.type,
        center: [lat, lng],
        items: [c],
      });
    }
  }
  return Array.from(map.values());
};

const nextIndex = (idx: number, len: number) => (idx + 1) % len;
const prevIndex = (idx: number, len: number) => (idx - 1 + len) % len;

const AggregatedPopup: React.FC<{ group: AggregatedGroup }> = ({ group }) => {
  const [index, setIndex] = useState(0);
  const current = group.items[index];
  const total = group.items.length;

  return (
    <div className="w-56 text-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-base">{group.type} Cases</h3>
        {total > 1 && (
          <span className="text-xs text-gray-500">{index + 1} / {total}</span>
        )}
      </div>
      <div className="space-y-1">
        <p><strong>ID:</strong> {current.id}</p>
        <p><strong>Name:</strong> {current.name}</p>
        <p><strong>Age/Gender:</strong> {current.age}, {current.gender}</p>
        <p><strong>Diagnosis:</strong> <span className="font-semibold">{current.disease}</span></p>
        <p><strong>Symptoms:</strong> {current.symptoms.join(', ')}</p>
      </div>
      {total > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => prevIndex(i, total)); }}
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            title="Previous"
          >
            ◀
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => nextIndex(i, total)); }}
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            title="Next"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

const createFacilityIcon = (type: FacilityType): L.DivIcon => {
  const color = type === FacilityType.Hospital ? '#ef4444' : '#3b82f6';
  const glyph = type === FacilityType.Hospital ? '+' : '✚';
  const html = `
    <div style="background:${color};color:#fff;width:24px;height:24px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${glyph}</div>
  `;
  return L.divIcon({ html, className: 'bg-transparent border-0', iconSize: [24, 24], iconAnchor: [12, 12] });
};

const toRad = (v: number) => (v * Math.PI) / 180;
const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const buildHighlightedSegments = (waterways: Waterway[], clusters: Cluster[]) => {
  const segments: { id: string; path: [number, number][] }[] = [];
  for (const w of waterways) {
    if (w.path.length < 2) continue;
    const cum: number[] = [0];
    for (let i = 1; i < w.path.length; i++) cum[i] = cum[i - 1] + haversine(w.path[i - 1], w.path[i]);
    const windows: [number, number][] = [];
    for (const c of clusters) {
      for (let i = 0; i < w.path.length; i++) {
        const d = haversine(w.path[i], c.center);
        if (d <= c.radius) {
          const centerS = cum[i];
          const ext = Math.max(500, c.radius); // extend upstream/downstream by >=500m or cluster radius
          windows.push([centerS - ext, centerS + ext]);
        }
      }
    }
    // Merge windows
    windows.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const win of windows) {
      if (!merged.length || win[0] > merged[merged.length - 1][1]) merged.push([...win]);
      else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], win[1]);
    }
    if (!merged.length) continue;
    // Build mask
    const mask = new Array(w.path.length).fill(false);
    for (let i = 0; i < w.path.length; i++) {
      const s = cum[i];
      for (const [a, b] of merged) {
        if (s >= a && s <= b) { mask[i] = true; break; }
      }
    }
    // Extract contiguous segments
    let start: number | null = null;
    for (let i = 0; i < w.path.length; i++) {
      if (mask[i] && start === null) start = i;
      const endOfMask = i === w.path.length - 1 || !mask[i + 1];
      if (start !== null && endOfMask) {
        const end = i;
        if (end - start + 1 >= 2) {
          segments.push({ id: `${w.id}-${start}-${end}`, path: w.path.slice(start, end + 1) as [number, number][] });
        }
        start = null;
      }
    }
  }
  return segments;
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
  facilities,
  waterways,
}) => {
  const mapCenter: [number, number] = [18.5204, 73.8567];
  const [zoom, setZoom] = useState(13);

  const groupedCases = useMemo(() => clusterCases(cases, zoom), [cases, zoom]);
  const highlighted = useMemo(() => buildHighlightedSegments(waterways, clusters), [waterways, clusters]);

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
      <Pane name="facilityPane" style={{ zIndex: 650 }} />
      <Pane name="waterPane" style={{ zIndex: 440 }} />

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

      {/* Health Facilities Layer */}
      {layerVisibility.healthFacilities && facilities.map(f => (
        <Marker key={f.id} position={f.position} icon={createFacilityIcon(f.type)} pane="facilityPane">
          <Popup>
            <div className="w-48 text-gray-800">
              <h3 className="font-bold text-base mb-1">{f.name}</h3>
              <p className="text-sm text-gray-600">{f.type}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Contaminated Water Layer (highlight river segments) */}
      {layerVisibility.contaminatedWater && highlighted.map(seg => (
        <Polyline
          key={seg.id}
          positions={seg.path}
          pane="waterPane"
          pathOptions={{ color: '#06b6d4', weight: 5, opacity: 0.9 }}
        />
      ))}

      {/* Case Report Layer with aggregation */}
      {layerVisibility.cases && groupedCases.map(group => {
        const isSingle = group.items.length === 1;
        const colorStroke = group.type === CaseType.Confirmed ? '#b91c1c' : '#f59e0b';
        const colorFill = group.type === CaseType.Confirmed ? '#ef4444' : '#facc15';
        const radius = isSingle ? 6 : Math.min(20, 6 + Math.sqrt(group.items.length) * 2);
        return (
          <CircleMarker
            key={group.id}
            center={group.center}
            pane="casePane"
            radius={radius}
            pathOptions={{
              color: colorStroke,
              fillColor: colorFill,
              fillOpacity: 0.85,
              weight: 1,
            }}
          >
            <Popup>
              {isSingle ? (
                <div className="w-48 text-gray-800">
                  <h3 className="font-bold text-base mb-1">Case: {group.items[0].id}</h3>
                  <p><strong>Name:</strong> {group.items[0].name}</p>
                  <p><strong>Age:</strong> {group.items[0].age}, <strong>Gender:</strong> {group.items[0].gender}</p>
                  <p><strong>Status:</strong> {group.items[0].type}</p>
                  <p><strong>Diagnosis:</strong> <span className="font-semibold">{group.items[0].disease}</span></p>
                  <p className="mt-1"><strong>Symptoms:</strong> {group.items[0].symptoms.join(', ')}</p>
                </div>
              ) : (
                <AggregatedPopup group={group} />
              )}
            </Popup>
          </CircleMarker>
        );
      })}

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
            interactive: !addMode,
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
            interactive: !addMode,
          }}
        >
          <Popup>In-Risk Zone</Popup>
        </Circle>
      ))}

      <MapEventsHandler addMode={addMode} onAddItem={onAddItem} onMapMove={onMapMove} onZoomChange={setZoom} />
    </MapContainer>
  );
};

export default MapWrapper;
