# Airlume
Airlume — AI-Powered Air Quality Prediction & Alert System

Airlume is an end-to-end IoT + Machine Learning project that monitors real-time air pollution and predicts the next hour’s air quality using a lightweight ML model. Designed for Smart City and sustainability use-cases, it combines sensor hardware, cloud data pipelines, and an interactive web dashboard.

1) Features:

Real-time Monitoring: ESP32/Arduino + MQ135, PM2.5, and DHT11 sensors

AI Prediction: Scikit-learn model forecasting next-hour AQI

Cloud Sync: Firebase/Flask backend for sensor data upload

Dashboard: React/Flask UI with live charts & health indicators

Alerts: Optional push notifications when air quality becomes “Poor”

Designed for Sustainability: Useful for smart homes, campuses, and city AQI tracking

2) Tech Stack

Hardware: ESP32 / Arduino, MQ135, DHT11 (or any AQI sensors)

Backend: Python, Flask, Firebase

ML: Scikit-learn (Linear Regression / Random Forest)

Frontend: React.js + Chart.js

Protocols: HTTP / Wi-Fi
