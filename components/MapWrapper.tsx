import React, { useEffect, useMemo, useState } from 'react';
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
  const glyph = '+';
  const html = `
    <div style="background:${color};color:#fff;width:24px;height:24px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${glyph}</div>
  `;
  return L.divIcon({ html, className: 'bg-transparent border-0', iconSize: [24, 24], iconAnchor: [12, 12] });
};

const toRad = (v: number) => (v * Math.PI) / 180;
const metersPerDegLat = 111320;
const metersPerDegLng = (latDeg: number) => 111320 * Math.cos(toRad(latDeg));

const distPointToSegmentMeters = (p: [number, number], a: [number, number], b: [number, number]) => {
  const lat0 = (a[0] + b[0]) / 2;
  const kx = metersPerDegLng(lat0);
  const ky = metersPerDegLat;
  const ax = a[1] * kx, ay = a[0] * ky;
  const bx = b[1] * kx, by = b[0] * ky;
  const px = p[1] * kx, py = p[0] * ky;
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const segLen2 = vx * vx + vy * vy;
  const t = segLen2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / segLen2));
  const cx = ax + t * vx, cy = ay + t * vy;
  const dx = px - cx, dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const segLen = Math.sqrt(segLen2);
  return { dist, t, segLen };
};

const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const bboxFromCircles = (centers: [number, number][], radii: number[]) => {
  if (!centers.length) return [18.45, 73.75, 18.60, 73.95] as [number, number, number, number];
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (let i = 0; i < centers.length; i++) {
    const [lat, lng] = centers[i];
    const r = radii[i];
    const dLat = r / metersPerDegLat;
    const dLng = r / metersPerDegLng(lat);
    minLat = Math.min(minLat, lat - dLat);
    maxLat = Math.max(maxLat, lat + dLat);
    minLng = Math.min(minLng, lng - dLng);
    maxLng = Math.max(maxLng, lng + dLng);
  }
  const pad = 0.02;
  return [minLat - pad, minLng - pad, maxLat + pad, maxLng + pad] as [number, number, number, number];
};

type WaterGeom = { id: string; path: [number, number][]; isPolygon: boolean };

const insideAnyCircle = (p: [number, number], circles: { center: [number, number]; radius: number }[]) =>
  circles.some(c => haversine(p, c.center) <= c.radius);

const makeSegmentsForLine = (
  path: [number, number][],
  circles: { center: [number, number]; radius: number }[],
  extraMeters: number
) => {
  if (path.length < 2) return [] as { id: string; path: [number, number][] }[];

  const intersectsAnyCircle = (a: [number, number], b: [number, number]) =>
    circles.some(c => {
      const { dist } = distPointToSegmentMeters(c.center, a, b);
      return dist <= c.radius + extraMeters;
    });

  const segs: { id: string; path: [number, number][] }[] = [];
  let cur: [number, number][] | null = null;

  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (intersectsAnyCircle(a, b)) {
      if (!cur) cur = [a];
      cur.push(b);
    } else if (cur) {
      segs.push({ id: `${i}-${segs.length}`, path: cur as [number, number][] });
      cur = null;
    }
  }
  if (cur) segs.push({ id: `${path.length}-${segs.length}`, path: cur as [number, number][] });
  return segs;
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

  const [waterGeoms, setWaterGeoms] = useState<WaterGeom[]>([]);
  const [waterLoaded, setWaterLoaded] = useState(false);

  useEffect(() => {
    const centers = [...clusters.map(c => c.center), ...riskZones.map(r => r.center)];
    const radii = [...clusters.map(c => c.radius), ...riskZones.map(r => r.radius)];
    const [s, w, n, e] = bboxFromCircles(centers, radii);
    const query = `
      [out:json][timeout:25];
      (
        way["waterway"~"river|stream|canal"](${s},${w},${n},${e});
        way["natural"="water"](${s},${w},${n},${e});
        relation["natural"="water"](${s},${w},${n},${e});
      );
      out geom;
    `;
    const url = 'https://overpass-api.de/api/interpreter';
    setWaterLoaded(false);
    fetch(url, { method: 'POST', body: query, headers: { 'Content-Type': 'text/plain' } })
      .then(r => r.json())
      .then(data => {
        const geoms: WaterGeom[] = [];
        if (data && data.elements) {
          for (const el of data.elements) {
            const geom = el.geometry as { lat: number; lon: number }[] | undefined;
            if (geom && geom.length >= 2) {
              const isPolygon = !!(el.tags && (el.tags.natural === 'water' || el.tags.water === 'lake'));
              geoms.push({ id: `${el.type}/${el.id}` , path: geom.map(g => [g.lat, g.lon] as [number, number]), isPolygon });
            }
          }
        }
        setWaterGeoms(geoms);
      })
      .catch(() => setWaterGeoms([]))
      .finally(() => setWaterLoaded(true));
  }, [clusters, riskZones]);

  const contaminatedSegments = useMemo(() => {
    const circles = [
      ...clusters.map(c => ({ center: c.center, radius: c.radius })),
      ...riskZones.map(r => ({ center: r.center, radius: r.radius })),
    ];
    const sources: { id: string; path: [number, number][]; isPolygon: boolean }[] = [
      ...waterGeoms.map(g => ({ id: g.id, path: g.path, isPolygon: g.isPolygon })),
      ...waterways.map(w => ({ id: w.id, path: w.path, isPolygon: false })),
    ];
    const segs: { id: string; path: [number, number][] }[] = [];
    let idx = 0;
    for (const g of sources) {
      if (g.isPolygon) {
        if (g.path.some(p => insideAnyCircle(p, circles))) segs.push({ id: `${g.id}-${idx++}`, path: g.path });
      } else {
        const partial = makeSegmentsForLine(g.path, circles, 200);
        for (const p of partial) segs.push({ id: `${g.id}-${idx++}`, path: p.path });
      }
    }
    return segs;
  }, [waterGeoms, waterways, clusters, riskZones]);

  const waterAdjacentRiskSegments = useMemo(() => {
    const circles = [
      ...clusters.map(c => ({ center: c.center, radius: c.radius })),
      ...riskZones.map(r => ({ center: r.center, radius: r.radius })),
    ];
    const buffer = 1700; // increased adjacent radius along water
    const sources: { id: string; path: [number, number][]; isPolygon: boolean }[] = [
      ...waterGeoms.map(g => ({ id: g.id, path: g.path, isPolygon: g.isPolygon })),
      ...waterways.map(w => ({ id: w.id, path: w.path, isPolygon: false })),
    ];
    const segs: { id: string; path: [number, number][] }[] = [];
    let idx = 0;
    for (const g of sources) {
      if (g.isPolygon) {
        if (g.path.some(p => insideAnyCircle(p, circles))) segs.push({ id: `${g.id}-${idx++}`, path: g.path });
      } else {
        const partial = makeSegmentsForLine(g.path, circles, buffer);
        for (const p of partial) segs.push({ id: `${g.id}-${idx++}`, path: p.path });
      }
    }
    return segs;
  }, [waterGeoms, waterways, clusters, riskZones]);

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
      <Pane name="waterRiskPane" style={{ zIndex: 438 }} />
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

      {/* Water-Adjacent Risk (surrounding areas of highlighted water) */}
      {layerVisibility.waterAdjacentRisk && waterAdjacentRiskSegments.map(seg => (
        <Polyline
          key={`${seg.id}-risk`}
          positions={seg.path}
          pane="waterRiskPane"
          pathOptions={{ color: '#8b5cf6', weight: 14, opacity: 0.35 }}
        />
      ))}

      {/* Contaminated Water Layer (highlight river segments) */}
      {layerVisibility.contaminatedWater && contaminatedSegments.map(seg => (
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
