# دليل رفع FastAPI Backend على الاستضافة

## الخيار 1: Railway (الأسهل والأسرع) 🚂

### الخطوات:

1. **سجل في Railway:**
   - اذهب إلى [railway.app](https://railway.app)
   - سجل بـ GitHub

2. **أنشئ مشروع جديد:**
   - اضغط "New Project"
   - اختر "Deploy from GitHub repo"
   - اختر repository الخاص بك

3. **حدد المجلد الصحيح:**
   - في Settings → Root Directory: اكتب `fastapi_service`

4. **أضف النماذج:**
   - أنشئ مجلد `models` في `fastapi_service`
   - انسخ ملفات `.pkl` إليه
   - أو ارفعها عبر Railway CLI

5. **اضغط Deploy!**

---

## الخيار 2: Render (مجاني) 🎨

### الخطوات:

1. **سجل في Render:**
   - اذهب إلى [render.com](https://render.com)
   - سجل بـ GitHub

2. **أنشئ Web Service:**
   - اضغط "New" → "Web Service"
   - اربط repository

3. **الإعدادات:**
   - **Root Directory:** `fastapi_service`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **ارفع النماذج:**
   - انقل ملفات `.pkl` إلى `fastapi_service/models/`

---

## تحديث مسارات النماذج للإنتاج

غيّر في `main.py`:
```python
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
```

---

## بعد الرفع

1. **احصل على الـ URL:**
   - مثال: `https://your-app.railway.app`

2. **حدث الـ Frontend:**
   - أنشئ ملف `.env` في React:
   ```
   VITE_ML_API_BASE_URL=https://your-app.railway.app
   ```

3. **أعد بناء الـ Frontend:**
   ```bash
   npm run build
   ```

---

## هيكل الملفات للرفع:

```
fastapi_service/
├── main.py
├── requirements.txt
├── Procfile
├── runtime.txt
├── models/
│   ├── classical_logistic_regression_FULL.pkl
│   └── quantum_qsvc_FULL.pkl
```
