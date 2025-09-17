import { Sensor, CaseReport, SensorStatus, CaseType, Cluster, RiskZone } from '../types';

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

// SIMULATED SENSOR DATA (CENTERED ON PUNE, INDIA)
export const INITIAL_SENSORS: Sensor[] = [
  {
    id: 'sensor-1',
    position: [18.52, 73.85],
    status: SensorStatus.Active,
    readings: generateReadings(85, 10),
  },
  {
    id: 'sensor-2',
    position: [18.525, 73.86],
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
    position: [18.515, 73.84],
    status: SensorStatus.Inactive,
    readings: Array.from({ length: 10 }, (_, i) => {
        const startDate = new Date(2025, 8, 8);
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        return {
          date: `${day}-${month}-${year}`,
          waterQuality: 90,
          bacteriaCount: 5,
        };
    }),
  },
];

// SIMULATED CASE REPORTS (CLUSTERED AROUND PUNE)
export const INITIAL_CASES: CaseReport[] = [
  // Cluster 1 (Confirmed)
  { id: 'case-c1', position: [18.522, 73.855], type: CaseType.Confirmed, name: 'Rohan Sharma', age: 34, gender: 'Male', symptoms: ['Severe Diarrhea', 'Vomiting', 'Dehydration'], disease: 'Cholera' },
  { id: 'case-c2', position: [18.523, 73.857], type: CaseType.Confirmed, name: 'Priya Patel', age: 28, gender: 'Female', symptoms: ['High Fever', 'Stomach Pain', 'Headache'], disease: 'Typhoid' },
  { id: 'case-c3', position: [18.521, 73.858], type: CaseType.Confirmed, name: 'Amit Singh', age: 45, gender: 'Male', symptoms: ['Severe Diarrhea', 'Leg Cramps'], disease: 'Cholera' },
  { id: 'case-c4', position: [18.524, 73.856], type: CaseType.Confirmed, name: 'Sunita Devi', age: 52, gender: 'Female', symptoms: ['High Fever', 'Weakness', 'Rash'], disease: 'Typhoid' },

  // Cluster 1 (Self-Reported)
  { id: 'case-s1', position: [18.525, 73.860], type: CaseType.SelfReported, name: 'User 101', age: 22, gender: 'Female', symptoms: ['Fever', 'Nausea'], disease: 'Suspected: Gastroenteritis' },
  { id: 'case-s2', position: [18.526, 73.859], type: CaseType.SelfReported, name: 'User 102', age: 31, gender: 'Male', symptoms: ['Stomach Cramps', 'Headache'], disease: 'Suspected: Food Poisoning' },
  { id: 'case-s3', position: [18.520, 73.861], type: CaseType.SelfReported, name: 'User 103', age: 19, gender: 'Male', symptoms: ['Fever', 'Diarrhea'], disease: 'Suspected: Gastroenteritis' },
  
  // Spread out cases
  { id: 'case-o1', position: [18.54, 73.88], type: CaseType.SelfReported, name: 'User 201', age: 40, gender: 'Female', symptoms: ['Mild Fever', 'Cough'], disease: 'Suspected: Viral Infection' },
  { id: 'case-o2', position: [18.50, 73.83], type: CaseType.Confirmed, name: 'Vikram Kumar', age: 60, gender: 'Male', symptoms: ['High Fever', 'Chills', 'Muscle Pain'], disease: 'Typhoid' },
];

// SIMULATED DBSCAN CLUSTERING RESULT
// In a real application, this would be calculated by a backend service.
export const CLUSTERS: Cluster[] = [
  {
    id: 'cluster-1',
    center: [18.523, 73.857], // Center of the main outbreak
    radius: 700, // in meters
  },
];

// SIMULATED IN-RISK ZONE CALCULATION
// Based on proximity to clusters and environmental factors (dummy logic).
export const RISK_ZONES: RiskZone[] = [
  {
    id: 'riskzone-1',
    center: [18.523, 73.857], // Same center as the cluster
    radius: 2000, // Larger radius, in meters
  },
];