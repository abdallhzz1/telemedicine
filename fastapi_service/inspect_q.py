import joblib
import numpy as np

try:
    model = joblib.load('models/quantum_qsvc_FULL.pkl')
    print("Model loaded successfully")
    
    if hasattr(model, 'feature_names_in_'):
        print("Features in model:", model.feature_names_in_)
        print("Count:", len(model.feature_names_in_))
    elif hasattr(model, 'named_steps') and 'preprocessor' in model.named_steps:
        # If it's a pipeline
        preprocessor = model.named_steps['preprocessor']
        if hasattr(preprocessor, 'get_feature_names_out'):
             # This might require some input to get names out, or we can look at the transformers
             print("Preprocessor found. Transformers:")
             for name, trans, cols in preprocessor.transformers_:
                 print(f"  {name}: {cols}")
    else:
        print("Could not find feature names directly.")
        # Try to see what it expects by passing dummy data
        try:
            dummy = np.zeros((1, 29))
            model.predict(dummy)
        except Exception as e:
            print("Prediction error with 29 features:", str(e))
except Exception as e:
    print("Error:", str(e))
