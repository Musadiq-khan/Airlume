import pickle
import numpy as np

print("="*60)
print("PICKLE FILE INSPECTOR")
print("="*60)

# Inspect indoor model
print("\n📦 INDOOR MODEL:")
print("-"*60)
try:
    indoor = pickle.load(open('C:/Users/Rahil hassan/Downloads/aqi_model_indoor.pkl', 'rb'))
    print(f"Type: {type(indoor)}")
    
    if isinstance(indoor, dict):
        print(f"✓ It's a dictionary with {len(indoor)} keys")
        print(f"\nKeys: {list(indoor.keys())}")
        
        print("\n📋 Dictionary contents:")
        for key, value in indoor.items():
            print(f"  '{key}': {type(value)}")
            if hasattr(value, 'predict'):
                print(f"    ✓ This has a predict() method - IT'S THE MODEL!")
                if hasattr(value, 'n_features_in_'):
                    print(f"    Expected features: {value.n_features_in_}")
                
                # Test prediction
                try:
                    test_input = np.array([[25.0, 60.0, 35.0, 400.0, 35.0, 0.0, 1500.0]])
                    result = value.predict(test_input)
                    print(f"    ✓ Test prediction works: {result[0]}")
                except Exception as e:
                    print(f"    ✗ Test prediction failed: {e}")
    else:
        print(f"✓ It's directly a model: {type(indoor)}")
        if hasattr(indoor, 'predict'):
            print("  ✓ Has predict() method")
            if hasattr(indoor, 'n_features_in_'):
                print(f"  Expected features: {indoor.n_features_in_}")
                
except Exception as e:
    print(f"✗ Error: {e}")

# Inspect outdoor model
print("\n📦 OUTDOOR MODEL:")
print("-"*60)
try:
    outdoor = pickle.load(open('C:/Users/Rahil hassan/Downloads/aqi_model_outdoor.pkl', 'rb'))
    print(f"Type: {type(outdoor)}")
    
    if isinstance(outdoor, dict):
        print(f"✓ It's a dictionary with {len(outdoor)} keys")
        print(f"\nKeys: {list(outdoor.keys())}")
        
        print("\n📋 Dictionary contents:")
        for key, value in outdoor.items():
            print(f"  '{key}': {type(value)}")
            if hasattr(value, 'predict'):
                print(f"    ✓ This has a predict() method - IT'S THE MODEL!")
                if hasattr(value, 'n_features_in_'):
                    print(f"    Expected features: {value.n_features_in_}")
    else:
        print(f"✓ It's directly a model: {type(outdoor)}")
        if hasattr(outdoor, 'predict'):
            print("  ✓ Has predict() method")
            
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "="*60)
print("INSPECTION COMPLETE")
print("="*60)
print("\n💡 Next steps:")
print("1. Look for the key that has 'predict()' method")
print("2. Update app.py to extract model using that key")
print("3. Or re-save your models correctly (see below)")
print("="*60)