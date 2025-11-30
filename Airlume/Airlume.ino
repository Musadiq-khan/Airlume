// ESP32 AQI logger with WiFi - Real-time Data Streaming
// Sends data to Flask backend every 15 seconds

#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_SSD1306.h>
#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================
// WiFi CONFIGURATION - UPDATE THESE!
// ============================================
const char* WIFI_SSID = "Redmi 12 5G";
const char* WIFI_PASSWORD = "Musadiqkhan@123";
const char* FLASK_SERVER = "http://10.64.166.130:5000/api/sensor-data";
// Replace 192.168.1.100 with your computer's IP address

// ============================================
// SENSOR CONFIG
// ============================================
#define DHTPIN 4
#define DHTTYPE DHT22

const int MQ_PIN  = 34;
const int GP_VO   = 35;
const int GP_LED  = 25;

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

const unsigned long SAMPLE_INTERVAL_MS = 15000UL;

// ADC parameters
const float ADC_REF_V = 3.3f;
const int   ADC_MAX   = 4095;

// CALIBRATION
const float CLEAN_AIR_OFFSET = 2.35f;
const float PM25_MULTIPLIER = 120.0f;

// Averaging
const int GP_SAMPLES = 8;

DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire);

unsigned long lastSample = 0;
bool wifiConnected = false;
int sendSuccessCount = 0;
int sendFailCount = 0;

// ============================================
// WiFi Functions
// ============================================
void connectWiFi() {
  Serial.println("\n========================================");
  Serial.println("🌐 Connecting to WiFi...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Server: ");
    Serial.println(FLASK_SERVER);
    Serial.println("========================================\n");
    
    // Show on OLED
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Connected!");
    display.print("IP: ");
    display.println(WiFi.localIP());
    display.display();
    delay(2000);
  } else {
    wifiConnected = false;
    Serial.println("\n✗ WiFi connection failed!");
    Serial.println("Continuing without WiFi...");
    Serial.println("========================================\n");
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Failed");
    display.println("Local mode");
    display.display();
    delay(2000);
  }
}

bool sendDataToServer(float temp, float hum, float pressure, float pm25, int aqi, int mqRaw) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi not connected, skipping upload");
    return false;
  }
  
  HTTPClient http;
  http.setTimeout(5000); // 5 second timeout
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["pressure"] = pressure;
  doc["pm25"] = pm25;
  doc["gas"] = mqRaw;
  doc["location"] = "indoor";
  doc["aqi_calculated"] = aqi; // Pre-calculated AQI from ESP32
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("📡 Sending to server...");
  Serial.println("   Payload: " + jsonString);
  
  http.begin(FLASK_SERVER);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("   ✓ Response (");
    Serial.print(httpCode);
    Serial.print("): ");
    Serial.println(response);
    http.end();
    
    if (httpCode == 200) {
      sendSuccessCount++;
      return true;
    }
  } else {
    Serial.print("   ✗ HTTP Error: ");
    Serial.println(http.errorToString(httpCode));
    sendFailCount++;
  }
  
  http.end();
  return false;
}

// ============================================
// GP2Y Reading with AVERAGING
// ============================================
float readGP2YAveraged() {
  float sum = 0;
  for(int i = 0; i < GP_SAMPLES; i++) {
    digitalWrite(GP_LED, LOW);
    delayMicroseconds(280);
    int raw = analogRead(GP_VO);
    delayMicroseconds(40);
    digitalWrite(GP_LED, HIGH);
    delayMicroseconds(9680);
    sum += raw;
  }
  return sum / GP_SAMPLES;
}

float adcToVoltage(float raw) {
  return raw * (ADC_REF_V / (float)ADC_MAX);
}

float gpToPM25ugm3(float volt) {
  float adjusted = volt - CLEAN_AIR_OFFSET;
  if (adjusted < 0) return 0;
  if (adjusted > 2.0f) adjusted = 2.0f;
  
  float pm25 = adjusted * PM25_MULTIPLIER;
  if (pm25 > 500) pm25 = 500;
  
  return pm25;
}

// ============================================
// AQI Calculator
// ============================================
int aqiFromPM25(float Cp) {
  const float bp_pm[] = {0, 12.0, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4};
  const int   bp_aqi[] = {0,  50,  100, 150, 200,   300,   400,   500};
  int n = 7;

  if (Cp <= bp_pm[0]) return bp_aqi[0];
  if (Cp >= bp_pm[7]) return bp_aqi[7];

  for (int i = 0; i < n; i++) {
    float Clow = bp_pm[i], Chigh = bp_pm[i+1];
    int Ilow = bp_aqi[i], Ihigh = bp_aqi[i+1];
    if (Cp >= Clow && Cp <= Chigh) {
      float AQI_f = ((Ihigh - Ilow) / (Chigh - Clow)) * (Cp - Clow) + Ilow;
      return (int)round(AQI_f);
    }
  }
  return -1;
}

void printHeaderIfNeeded() {
  static bool printed = false;
  if (!printed) {
    Serial.println("ts,temp_c,hum_pct,pressure_hpa,gp_volt_v,pm25_ugm3,aqi_pm25,mq_raw");
    printed = true;
  }
}

// ============================================
// OLED Display
// ============================================
void displayValues(float temp, float hum, float pressure, float pm25, int aqi, int mqRaw, bool dataSent) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.printf("T: %.1fC  H: %.1f%%\n", temp, hum);
  if (!isnan(pressure)) display.printf("P: %.0f hPa\n", pressure);
  else display.println("P: --");

  display.printf("PM2.5: %.1f ug/m3\n", pm25);

  display.printf("AQI: %d ", aqi);
  if(aqi <= 50) display.println("GOOD");
  else if(aqi <= 100) display.println("MOD");
  else if(aqi <= 150) display.println("UNHLTH");
  else display.println("BAD");

  display.printf("GAS: %d\n", mqRaw);
  
  // WiFi status indicator
  if (wifiConnected) {
    display.print("WiFi: ");
    if (dataSent) display.println("SENT");
    else display.println("OK");
    display.printf("S:%d F:%d\n", sendSuccessCount, sendFailCount);
  } else {
    display.println("WiFi: OFF");
  }

  display.display();
}

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(GP_LED, OUTPUT);
  digitalWrite(GP_LED, HIGH);

  dht.begin();
  Wire.begin(21, 22);

  if (!bmp.begin(0x76)) bmp.begin(0x77);

  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.println("AQI Node Ready");
  display.println("Calibrating...");
  display.display();

  analogReadResolution(12);

  // Quick baseline measurement
  delay(2000);
  float baseline = readGP2YAveraged();
  float baseVolt = adcToVoltage(baseline);

  Serial.println("=== CALIBRATION ===");
  Serial.printf("Baseline voltage: %.3fV\n", baseVolt);
  Serial.printf("Using offset: %.3fV\n", CLEAN_AIR_OFFSET);
  Serial.println("===================");

  display.clearDisplay();
  display.setCursor(0,0);
  display.printf("Baseline: %.2fV\n", baseVolt);
  display.println("Connecting WiFi...");
  display.display();

  // Connect to WiFi
  connectWiFi();
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  unsigned long now = millis();
  if (now - lastSample < SAMPLE_INTERVAL_MS) {
    delay(100);
    return;
  }
  lastSample = now;

  // --- Read Sensors ---
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  float pressure_hpa = NAN;
  if (bmp.sensorID() != 0) pressure_hpa = bmp.readPressure() / 100.0f;

  float gpRawAvg = readGP2YAveraged();
  float gpVolt = adcToVoltage(gpRawAvg);
  float pm25 = gpToPM25ugm3(gpVolt);
  int mqRaw = analogRead(MQ_PIN);
  int aqi = aqiFromPM25(pm25);

  // Validation
  bool valid = true;
  if(isnan(temp) || isnan(hum)) {
    Serial.println("WARNING: DHT22 read failed");
    valid = false;
  }
  if(gpVolt < 0.3 || gpVolt > 3.0) {
    Serial.println("WARNING: GP2Y voltage out of range");
    valid = false;
  }

  // ---------------- Human output ----------------
  Serial.println("--------- AIR QUALITY ---------");
  Serial.printf("TEMP: %.2f°C\n", temp);
  Serial.printf("HUM : %.2f%%\n", hum);
  if (!isnan(pressure_hpa)) Serial.printf("PRESS: %.2f hPa\n", pressure_hpa);
  else Serial.println("PRESS: --");
  Serial.printf("GP2Y VOLT: %.3fV (avg of %d)\n", gpVolt, GP_SAMPLES);
  Serial.printf("PM2.5: %.2f ug/m3\n", pm25);
  Serial.printf("AQI  : %d ", aqi);
  if(aqi <= 50) Serial.println("(Good)");
  else if(aqi <= 100) Serial.println("(Moderate)");
  else if(aqi <= 150) Serial.println("(Unhealthy for Sensitive)");
  else Serial.println("(Unhealthy)");
  Serial.printf("GAS  : %d\n", mqRaw);
  if(!valid) Serial.println("⚠ DATA QUALITY ISSUE");
  Serial.println("--------------------------------");

  // ---------------- Send to Server ----------------
  bool dataSent = false;
  if (valid) {
    dataSent = sendDataToServer(temp, hum, 
                                 isnan(pressure_hpa) ? 0.0 : pressure_hpa, 
                                 pm25, aqi, mqRaw);
  }

  // ---------------- CSV output ----------------
  printHeaderIfNeeded();
  unsigned long ms = millis();
  Serial.printf("uptime_ms_%lu,%.2f,%.2f,%.2f,%.3f,%.2f,%d,%d\n",
                ms, temp, hum,
                isnan(pressure_hpa) ? 0.0 : pressure_hpa,
                gpVolt, pm25, aqi, mqRaw);

  // ---------------- OLED update ----------------
  displayValues(temp, hum, pressure_hpa, pm25, aqi, mqRaw, dataSent);
  
  // Reconnect WiFi if disconnected
  if (wifiConnected && WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
}