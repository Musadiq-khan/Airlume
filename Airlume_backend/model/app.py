from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import traceback
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Global variable to store latest sensor data from ESP32
latest_sensor_data = {
    'timestamp': datetime.now().isoformat(),
    'temperature': 25.0,
    'humidity': 60.0,
    'pressure': 1013.25,
    'pm25': 35.0,
    'gas': 400.0,
    'aqi': 50,
    'aqi_calculated': 50,  # AQI from ESP32
    'location': 'indoor',
    'connected': False,
    'voltage': 0.0
}

# Load ML models
indoor_model = None
outdoor_model = None

try:
    indoor_data = pickle.load(open('C:/Users/Rahil hassan/Downloads/aqi_model_indoor.pkl', 'rb'))
    outdoor_data = pickle.load(open('C:/Users/Rahil hassan/Downloads/aqi_model_outdoor.pkl', 'rb'))
    
    print("Analyzing pickle files...")
    
    # Extract models from dict if needed
    if isinstance(indoor_data, dict):
        print(f"Indoor is a dict with keys: {list(indoor_data.keys())}")
        for key in ['model', 'best_estimator', 'estimator', 'trained_model', 'final_model']:
            if key in indoor_data and hasattr(indoor_data[key], 'predict'):
                indoor_model = indoor_data[key]
                print(f"✓ Found indoor model at key: '{key}'")
                break
    else:
        indoor_model = indoor_data
        
    if isinstance(outdoor_data, dict):
        print(f"Outdoor is a dict with keys: {list(outdoor_data.keys())}")
        for key in ['model', 'best_estimator', 'estimator', 'trained_model', 'final_model']:
            if key in outdoor_data and hasattr(outdoor_data[key], 'predict'):
                outdoor_model = outdoor_data[key]
                print(f"✓ Found outdoor model at key: '{key}'")
                break
    else:
        outdoor_model = outdoor_data
    
    if indoor_model and hasattr(indoor_model, 'predict'):
        print("✓ Indoor model ready!")
    if outdoor_model and hasattr(outdoor_model, 'predict'):
        print("✓ Outdoor model ready!")
            
except Exception as e:
    print(f"✗ Error loading models: {e}")

# ========================================
# ESP32 ENDPOINT
# ========================================
@app.route('/api/sensor-data', methods=['POST'])
def receive_sensor_data():
    """
    Receive real-time data from ESP32 Air Quality Monitor
    Expected JSON:
    {
        "temperature": 25.5,
        "humidity": 60.2,
        "pressure": 1013.25,
        "pm25": 35.0,
        "gas": 400,
        "location": "indoor",
        "aqi_calculated": 42
    }
    """
    try:
        data = request.json
        print(f"\n{'='*60}")
        print(f"📡 ESP32 DATA RECEIVED:")
        print(f"   🌡️  Temperature: {data.get('temperature')}°C")
        print(f"   💧 Humidity: {data.get('humidity')}%")
        print(f"   🔘 Pressure: {data.get('pressure', 'N/A')} hPa")
        print(f"   🌫️  PM2.5: {data.get('pm25')} µg/m³")
        print(f"   💨 Gas: {data.get('gas')}")
        print(f"   📊 ESP32 AQI: {data.get('aqi_calculated', 'N/A')}")
        
        # Update global sensor data
        latest_sensor_data['timestamp'] = datetime.now().isoformat()
        latest_sensor_data['temperature'] = float(data.get('temperature', 25.0))
        latest_sensor_data['humidity'] = float(data.get('humidity', 60.0))
        latest_sensor_data['pressure'] = float(data.get('pressure', 1013.25))
        latest_sensor_data['pm25'] = float(data.get('pm25', 35.0))
        latest_sensor_data['gas'] = float(data.get('gas', 400.0))
        latest_sensor_data['location'] = data.get('location', 'indoor')
        latest_sensor_data['aqi_calculated'] = int(data.get('aqi_calculated', 50))
        latest_sensor_data['connected'] = True
        
        # Calculate AQI using ML model (if available)
        ml_aqi = None
        if indoor_model and outdoor_model:
            try:
                features = [
                    latest_sensor_data['temperature'],
                    latest_sensor_data['humidity'],
                    latest_sensor_data['pm25'],
                    latest_sensor_data['gas'],
                    latest_sensor_data['pm25'],  # rolling avg
                    0,  # pm25 change
                    latest_sensor_data['temperature'] * latest_sensor_data['humidity']
                ]
                
                model = indoor_model if latest_sensor_data['location'] == 'indoor' else outdoor_model
                ml_aqi = int(round(model.predict([features])[0]))
                print(f"   🤖 ML Model AQI: {ml_aqi}")
            except Exception as e:
                print(f"   ⚠ ML prediction failed: {e}")
        
        # Use ML AQI if available, otherwise use ESP32 calculation
        latest_sensor_data['aqi'] = ml_aqi if ml_aqi is not None else latest_sensor_data['aqi_calculated']
        
        print(f"   ✅ Final AQI: {latest_sensor_data['aqi']}")
        print(f"{'='*60}\n")
        
        return jsonify({
            'status': 'success',
            'message': 'Data received and processed',
            'aqi': latest_sensor_data['aqi'],
            'aqi_ml': ml_aqi,
            'aqi_esp32': latest_sensor_data['aqi_calculated'],
            'timestamp': latest_sensor_data['timestamp']
        })
        
    except Exception as e:
        print(f"✗ Error processing sensor data: {e}")
        print(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

# ========================================
# REACT ENDPOINT
# ========================================
@app.route('/api/live', methods=['GET'])
def get_live_data():
    """
    Send latest sensor data to React app
    React polls this endpoint every 2 seconds
    """
    # Calculate trend
    trend = 'stable'
    if latest_sensor_data['pm25'] > 50:
        trend = 'increasing'
    elif latest_sensor_data['pm25'] < 20:
        trend = 'decreasing'
    
    # AQI category
    aqi_value = latest_sensor_data['aqi']
    if aqi_value <= 50:
        category = 'Good'
        color = '#10b981'
    elif aqi_value <= 100:
        category = 'Moderate'
        color = '#f59e0b'
    elif aqi_value <= 150:
        category = 'Unhealthy for Sensitive Groups'
        color = '#ef4444'
    elif aqi_value <= 200:
        category = 'Unhealthy'
        color = '#dc2626'
    elif aqi_value <= 300:
        category = 'Very Unhealthy'
        color = '#991b1b'
    else:
        category = 'Hazardous'
        color = '#7f1d1d'
    
    return jsonify({
        'environment': {
            'aqi': latest_sensor_data['aqi'],
            'aqi_esp32': latest_sensor_data['aqi_calculated'],
            'category': category,
            'color': color,
            'temperature': latest_sensor_data['temperature'],
            'humidity': latest_sensor_data['humidity'],
            'pressure': latest_sensor_data['pressure'],
            'pm25': latest_sensor_data['pm25'],
            'gas': latest_sensor_data['gas'],
            'location': latest_sensor_data['location'],
            'trend': trend,
            'timestamp': latest_sensor_data['timestamp'],
            'connected': latest_sensor_data['connected']
        },
        'blockchain': {
            'lastBlock': '0x7a3f2b',
            'txCount': 1247,
            'networkStatus': 'healthy' if latest_sensor_data['connected'] else 'offline',
            'gasPrice': '0.05'
        }
    })

# ========================================
# PREDICTION ENDPOINT
# ========================================
@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Manual prediction endpoint for future predictions
    """
    try:
        if indoor_model is None or outdoor_model is None:
            return jsonify({
                'error': 'Models not loaded',
                'status': 'error'
            }), 500

        data = request.json
        required_fields = ['temp_c', 'hum_pct', 'pm25_ugm3', 'mq_raw']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing fields: {missing_fields}',
                'status': 'error'
            }), 400
        
        location = data.get('location', 'indoor')
        
        features = [
            float(data['temp_c']),
            float(data['hum_pct']),
            float(data['pm25_ugm3']),
            float(data['mq_raw']),
            float(data.get('rolling_avg_pm25', data['pm25_ugm3'])),
            float(data.get('pm25_change', 0)),
            float(data['temp_c']) * float(data['hum_pct'])
        ]
        
        model = indoor_model if location == 'indoor' else outdoor_model
        features_array = np.array([features])
        prediction = model.predict(features_array)[0]
        prediction_int = int(round(prediction))
        
        return jsonify({
            'predicted_aqi': prediction_int,
            'raw_prediction': float(prediction),
            'location': location,
            'status': 'success'
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

# ========================================
# HEALTH CHECK
# ========================================
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'Flask server running',
        'models_loaded': indoor_model is not None and outdoor_model is not None,
        'last_update': latest_sensor_data['timestamp'],
        'esp32_connected': latest_sensor_data['connected'],
        'current_aqi': latest_sensor_data['aqi']
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 AIRLUME Flask Server Starting...")
    print("="*60)
    print("📡 ESP32 endpoint: POST /api/sensor-data")
    print("🌐 React endpoint:  GET  /api/live")
    print("🤖 ML prediction:   POST /api/predict")
    print("💚 Health check:    GET  /api/health")
    print("="*60)
    print("⚠️  IMPORTANT: Update ESP32 code with your computer's IP")
    print("   Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)")
    print("="*60 + "\n")
    
    # Use 0.0.0.0 to accept connections from ESP32 on network
    app.run(debug=True, port=5000, host='0.0.0.0')