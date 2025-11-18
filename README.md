
# MindEase-AI
MindEase-AI is an Emotion Aware Well-Being Companion 



## Installation

1. Cloning the git repository using HTTPS

```bash
  git clone https://github.com/pmkastu25/MindEase-AI.git
  cd MindEase-AI
```

2. Installing required packages in frontend

```bash
  cd frontend/
  npm install
```
    
3. Installing required packages in Backend

```bash
  cd ..
  cd backend/
  npm install
```

4. Creating a virtual enviornment for ml_service

```bash
  cd ..
  cd ml_service/

  py -3.10 -m venv venv
  source venv/Scripts/activate
```

5. Installing required packages using requirements.txt in virtual enviornment

```bash
  pip install -r requirements.txt
```


## Run the Service
 
1. Frontend

```bash
  cd MindEase-AI/frontend
  npm run dev
```

2. Backend

```bash
  cd MindEase-AI/backend
  npm start
```

3. ML Service

```bash
  cd MindEase-AI/ml_service/apps
  python app.py
```
