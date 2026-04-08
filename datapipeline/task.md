Summary of the Dataflow: 
1) ESP32 Firmware (C++): Read sensors → → Pack into Hex bytes → → Send via LoRa. 
2) RPi Ingestion Script (Python): Listen to LoRa → → Unpack Hex → → Identify Node ID. 
3) Processing Pipeline (Python): Apply Kalman Filter → → Calculate WQI → → Check for Anomaly Fingerprints. 
4) Database (SQLite/PostgreSQL): Store Node_ID, Timestamp, Raw_Values, Filtered_Values, and WQI_Score. 
5) FastAPI Backend (Python): Create /get_data and /get_alerts endpoints.
6) Frontend (Streamlit/React): Call the API → → Display graphs (Plotly) → → Show node locations on a map (Leaflet).