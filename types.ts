export enum SensorStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Contaminated = 'Contaminated',
}

export enum CaseType {
  Confirmed = 'Confirmed',
  SelfReported = 'Self-Reported',
}

export interface SensorReading {
  date: string;
  waterQuality: number; // Index 0-100
  bacteriaCount: number; // per 100ml
}

export interface Sensor {
  id: string;
  position: [number, number]; // [lat, lng]
  status: SensorStatus;
  readings: SensorReading[];
}

export interface CaseReport {
  id: string;
  position: [number, number]; // [lat, lng]
  type: CaseType;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  symptoms: string[];
  disease: string;
}

export interface LayerVisibility {
  sensors: boolean;
  cases: boolean;
  contaminatedZones: boolean;
  inRiskZones: boolean;
  healthFacilities: boolean;
  contaminatedWater: boolean;
}

export interface MapStats {
  activeSensors: number;
  reportedCases: number;
  contaminatedClusters: number;
  totalRiskZoneArea: string; // in km²
}

export interface Cluster {
  id: string;
  center: [number, number]; // [lat, lng]
  radius: number; // in meters
}

export interface RiskZone {
  id: string;
  center: [number, number]; // [lat, lng]
  radius: number; // in meters
}

export type AddMode = 'sensor' | 'confirmed' | 'reported' | null;

export enum FacilityType {
  Hospital = 'Hospital',
  Clinic = 'Clinic',
}

export interface Facility {
  id: string;
  type: FacilityType;
  name: string;
  position: [number, number];
}

export interface Waterway {
  id: string;
  name: string;
  path: [number, number][]; // ordered polyline of the river/stream
}

export interface Weather {
  location: string;
  temp: number;
  description: string;
  icon: string;
}
