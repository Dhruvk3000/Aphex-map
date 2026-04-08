#include <Arduino.h>
#include <Preferences.h>
#include <esp_adc_cal.h>
#include <SPI.h>
#include <LoRa.h> // Using Sandeep Mistry's LoRa library

/* ================= CONFIG ================= */
#define NODE_ID 0x01      // Numeric ID for byte-packing
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 26

#define PIN_TURB 32
#define PIN_PH   33
#define PIN_TDS  34
#define PIN_TEMP 35 // Added for PT1000

#define SEND_INTERVAL_MS 10000 // 10s for testing
#define ADC_SAMPLES 16
/* ========================================= */

const float RECON_TURB = 1.467f;
const float RECON_PH   = 1.673f;
const float RECON_TDS  = 1.0f;
const float RECON_TEMP = 1.0f;

float PH_OFFSET = 0.0f; 
float TDS_K = 500.0f;
float TURB_VMAX = 3.3f, TURB_VMIN = 0.5f, TURB_NTU_MAX = 1000.0f;

Preferences prefs;
esp_adc_cal_characteristics_t adc_chars;
unsigned long lastSend = 0;

/* ---------- ADC Helper ---------- */
float readVadc(int pin) {
  uint32_t sum = 0;
  for (int i = 0; i < ADC_SAMPLES; i++) {
    sum += esp_adc_cal_raw_to_voltage(analogRead(pin), &adc_chars);
    delayMicroseconds(100);
  }
  return (sum / (float)ADC_SAMPLES) / 1000.0f;
}

/* ---------- PT1000 Temperature Logic ---------- */
float readTemperature() {
  float v = readVadc(PIN_TEMP) * RECON_TEMP;
  // Simple linear approximation for PT1000 in a voltage divider
  // Adjust constants based on your specific resistor bridge
  float temp = (v - 0.5f) * 100.0f; 
  return temp;
}

/* ---------- WQI Sub-index logic ---------- */
float tdsSub(float ppm) { return constrain(100.0f - ppm / 10.0f, 0, 100); }
float phSub(float ph) {
  if (ph >= 6.5 && ph <= 8.5) return 100;
  return max(0.0f, 100.0f - abs(ph - 7.0f) * 25.0f);
}

void setup() {
  Serial.begin(115200);
  
  // 1. Initialize LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) { // Set to your region: 433E6, 868E6, or 915E6
    Serial.println("LoRa Error!");
    while (1);
  }
  LoRa.setSpreadingFactor(9); // The SF9 optimization we discussed
  
  // 2. ADC Setup
  analogSetWidth(ADC_WIDTH_BIT_12);
  esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, 1100, &adc_chars);

  // 3. Load Calibration
  prefs.begin("cal", false);
  PH_OFFSET = prefs.getFloat("ph_off", 0);
  TDS_K = prefs.getFloat("tds_k", 500);
  TURB_VMAX = prefs.getFloat("tvmax", 3.3f);
}

void loop() {
  if (millis() - lastSend < SEND_INTERVAL_MS) return;
  lastSend = millis();

  // Data Acquisition
  float ph = (3.5f * (readVadc(PIN_PH) * RECON_PH)) + PH_OFFSET;
  float tds = TDS_K * (readVadc(PIN_TDS) * RECON_TDS);
  float ntu = ((readVadc(PIN_TURB)*RECON_TURB) - TURB_VMAX) / (TURB_VMIN - TURB_VMAX) * TURB_NTU_MAX;
  float temp = readTemperature();
  uint8_t wqi = (uint8_t)(0.8 * tdsSub(tds) + 0.2 * phSub(ph));

  /* 
   * NOVELTY: PAYLOAD PACKING (Serialization)
   * Converting 4 floats and 1 int (20 bytes) into a 10-byte binary packet.
   * This reduces Time-on-Air (ToA) for the Research Paper results.
   */
  uint16_t p_ph   = (uint16_t)(ph * 100);    // 7.23 -> 723
  uint16_t p_tds  = (uint16_t)(tds);         // 450.5 -> 450
  uint16_t p_ntu  = (uint16_t)(ntu);         // 12.0 -> 12
  uint16_t p_temp = (uint16_t)((temp + 40) * 100); // -10.5 -> 2950 (offset for negative)

  byte packet[10];
  packet[0] = NODE_ID;
  packet[1] = lowByte(p_ph);   packet[2] = highByte(p_ph);
  packet[3] = lowByte(p_tds);  packet[4] = highByte(p_tds);
  packet[5] = lowByte(p_ntu);  packet[6] = highByte(p_ntu);
  packet[7] = lowByte(p_temp); packet[8] = highByte(p_temp);
  packet[9] = wqi;

  // Send via LoRa
  LoRa.beginPacket();
  LoRa.write(packet, 10);
  LoRa.endPacket();

  // Debug Serial
  Serial.printf("Sent: PH:%.2f TDS:%.1f WQI:%d\n", ph, tds, wqi);
}