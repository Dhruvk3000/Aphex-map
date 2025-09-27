import { Sensor, CaseReport, SensorStatus, CaseType, Cluster, RiskZone, Facility, FacilityType, Waterway } from '../types';

const generateReadings = (valueOffset: number, countOffset: number) => {
  return Array.from({ length: 10 }, (_, i) => {
    const startDate = new Date(2025, 8, 8); // September 8, 2025 (month is 0-indexed)
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    return {
      date: formattedDate,
      waterQuality: valueOffset - i,
      bacteriaCount: countOffset + i * 2,
    };
  });
}

// SIMULATED SENSOR DATA (CENTERED ON GUWAHATI, ASSAM, INDIA)
export const INITIAL_SENSORS: Sensor[] = [
  {
    id: 'sensor-1',
    position: [26.145, 91.736],
    status: SensorStatus.Active,
    readings: generateReadings(85, 10),
  },
  {
    id: 'sensor-2',
    position: [26.148, 91.742],
    status: SensorStatus.Contaminated,
    readings: Array.from({ length: 10 }, (_, i) => {
        const startDate = new Date(2025, 8, 8);
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        return {
          date: `${day}-${month}-${year}`,
          waterQuality: 40 - i * 2,
          bacteriaCount: 150 + i * 10,
        };
    }),
  },
  {
    id: 'sensor-3',
    position: [26.140, 91.728],
    status: SensorStatus.Inactive,
    readings: Array.from({ length: 10 }, () => {
        const startDate = new Date(2025, 8, 8);
        const day = String(startDate.getDate()).padStart(2, '0');
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const year = startDate.getFullYear();
        return {
          date: `${day}-${month}-${year}`,
          waterQuality: 90,
          bacteriaCount: 5,
        };
    }),
  },
];

// SIMULATED CASE REPORTS (CLUSTERED AROUND GUWAHATI)
export const INITIAL_CASES: CaseReport[] = [
  // Cluster 1 (Confirmed)
  { id: 'case-c1', position: [26.146, 91.739], type: CaseType.Confirmed, name: 'Rohan Sharma', age: 34, gender: 'Male', symptoms: ['Severe Diarrhea', 'Vomiting', 'Dehydration'], disease: 'Cholera' },
  { id: 'case-c2', position: [26.147, 91.741], type: CaseType.Confirmed, name: 'Priya Patel', age: 28, gender: 'Female', symptoms: ['High Fever', 'Stomach Pain', 'Headache'], disease: 'Typhoid' },
  { id: 'case-c3', position: [26.145, 91.742], type: CaseType.Confirmed, name: 'Amit Singh', age: 45, gender: 'Male', symptoms: ['Severe Diarrhea', 'Leg Cramps'], disease: 'Cholera' },
  { id: 'case-c4', position: [26.148, 91.740], type: CaseType.Confirmed, name: 'Sunita Devi', age: 52, gender: 'Female', symptoms: ['High Fever', 'Weakness', 'Rash'], disease: 'Typhoid' },

  // Cluster 1 (Self-Reported)
  { id: 'case-s1', position: [26.149, 91.744], type: CaseType.SelfReported, name: 'User 101', age: 22, gender: 'Female', symptoms: ['Fever', 'Nausea'], disease: 'Suspected: Gastroenteritis' },
  { id: 'case-s2', position: [26.150, 91.743], type: CaseType.SelfReported, name: 'User 102', age: 31, gender: 'Male', symptoms: ['Stomach Cramps', 'Headache'], disease: 'Suspected: Food Poisoning' },
  { id: 'case-s3', position: [26.144, 91.745], type: CaseType.SelfReported, name: 'User 103', age: 19, gender: 'Male', symptoms: ['Fever', 'Diarrhea'], disease: 'Suspected: Gastroenteritis' },

  // Spread out cases
  { id: 'case-o1', position: [26.17, 91.78], type: CaseType.SelfReported, name: 'User 201', age: 40, gender: 'Female', symptoms: ['Mild Fever', 'Cough'], disease: 'Suspected: Viral Infection' },
  { id: 'case-o2', position: [26.12, 91.70], type: CaseType.Confirmed, name: 'Vikram Kumar', age: 60, gender: 'Male', symptoms: ['High Fever', 'Chills', 'Muscle Pain'], disease: 'Typhoid' },
];

// SIMULATED DBSCAN CLUSTERING RESULT
// In a real application, this would be calculated by a backend service.
export const CLUSTERS: Cluster[] = [
  {
    id: 'cluster-1',
    center: [26.147, 91.741], // Center of the main outbreak (Guwahati)
    radius: 700, // in meters
  },
];

// SIMULATED IN-RISK ZONE CALCULATION
// Based on proximity to clusters and environmental factors (dummy logic).
export const RISK_ZONES: RiskZone[] = [
  {
    id: 'riskzone-1',
    center: [26.147, 91.741],
    radius: 2000,
  },
];

// HEALTH FACILITIES (Hospitals and Clinics)
export const HEALTH_FACILITIES: Facility[] = [
  { id: 'fac-1', type: FacilityType.Hospital, name: 'Gauhati Medical College & Hospital', position: [26.1544, 91.7706] },
  { id: 'fac-2', type: FacilityType.Hospital, name: 'Down Town Hospital', position: [26.1310, 91.8016] },
  { id: 'fac-3', type: FacilityType.Clinic, name: 'GNRC Sixmile Clinic', position: [26.1358, 91.8083] },
  { id: 'fac-4', type: FacilityType.Clinic, name: 'MMC Hospital OPD Clinic', position: [26.1790, 91.7490] },
];

// WATERWAYS (simplified polyline for the Brahmaputra River near Guwahati)
export const WATERWAYS: Waterway[] = [
  {
    id: 'river-brahmaputra-guwahati-1',
    name: 'Brahmaputra River',
    path: [
      [26.2100, 91.6000],
      [26.2050, 91.6500],
      [26.2000, 91.7000],
      [26.1950, 91.7200],
      [26.1900, 91.7400],
      [26.1850, 91.7600],
      [26.1800, 91.7800],
      [26.1780, 91.8000],
      [26.1750, 91.8200],
      [26.1720, 91.8400],
    ],
  },
];
