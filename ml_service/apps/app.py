# import torch
# from flask import Flask, request, jsonify
# from transformers import BertTokenizer, BertForSequenceClassification
# import numpy as np

# app = Flask(__name__)

# MODEL_NAME = "pmkastu25/mindease-mental-health-bert"

# print(f"Loading BERT model: {MODEL_NAME}...")

# tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
# model = BertForSequenceClassification.from_pretrained(MODEL_NAME)
# model.eval()

# print("Model loaded successfully!")

# LABELS = {
#     0: "Anxiety",
#     1: "Bipolar",
#     2: "Depression",
#     3: "Normal",
#     4: "Personality disorder",
#     5: "Stress",
#     6: "Suicidal"
# }

# @app.route('/analyze-mood', methods=['POST'])
# def analyze_mood():
#     try:
#         data = request.get_json()

#         if not data or "text" not in data:
#             return jsonify({"error": "No 'text' field provided"}), 400

#         input_text = data["text"]

#         # TOKENIZATION
#         encoded_input = tokenizer(
#             input_text,
#             return_tensors='pt',
#             truncation=True,
#             padding=True,
#             max_length=128
#         )

#         # INFERENCE
#         with torch.no_grad():
#             output = model(**encoded_input)

#         logits = output.logits
#         probabilities = torch.softmax(logits, dim=-1).numpy()[0]

#         predicted_class_id = int(np.argmax(probabilities))
#         predicted_label = LABELS[predicted_class_id]
#         confidence_score = float(probabilities[predicted_class_id])

#         # Build response
#         response = {
#             "class_id": predicted_class_id,
#             "label": predicted_label,
#             "confidence": round(confidence_score, 4),
#             "all_scores": {
#                 LABELS[i]: round(float(prob), 4) for i, prob in enumerate(probabilities)
#             }
#         }

#         return jsonify(response)

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# if __name__ == '__main__':
#     print("Flask server running at http://localhost:5000/")
#     app.run(host='0.0.0.0', port=5000, debug=True)

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
from transformers import AutoTokenizer, AutoModelForSequenceClassification
# pyrefly: ignore [missing-import]
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "pmkastu25/mindease-mental-health-bert-v2"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

model.eval()

LABELS = {
    0: "Anxiety",
    1: "Bipolar",
    2: "Depression",
    3: "Normal",
    4: "Personality disorder",
    5: "Stress",
    6: "Suicidal"
}

MOOD_MAP = {
    "Anxiety": "anxious",
    "Stress": "anxious",
    "Depression": "sad",      # display mood (original behaviour)
    "Suicidal": "sad",        # display mood (original behaviour)
    "Normal": "happy",
    "Bipolar": "neutral",
    "Personality disorder": "neutral"
}
# NOTE: crisis detection does NOT rely on mood aliases above.
# crisis_middleware() checks predicted_label directly against CRISIS_LABELS,
# so is_crisis fires correctly even though mood shows as "sad".

# ── CRISIS MIDDLEWARE ─────────────────────────────────────
# These are the extreme labels from the 7-class ML model that
# require immediate crisis intervention in the frontend.
CRISIS_LABELS = {"Suicidal", "Depression"}

def crisis_middleware(predicted_label: str) -> dict:
    """
    Returns crisis metadata if the ML model predicts an extreme label.
    This runs BEFORE the response is returned so the frontend can
    immediately trigger the crisis modal regardless of mood alias.
    """
    is_crisis = predicted_label in CRISIS_LABELS
    return {
        "is_crisis": is_crisis,
        "crisis_label": predicted_label if is_crisis else None,
    }

SUGGESTIONS = {
    "happy": "Your positivity is radiant today — celebrate it and stay grounded.",
    "anxious": "Try deep breathing and grounding exercises.",
    "sad": "Be gentle with yourself today.",
    "calm": "This is a peaceful emotional state.",
    "neutral": "A balanced emotional state is okay.",
    "angry": "Take a pause and release tension.",
}

class AnalyzeRequest(BaseModel):
    text: str

@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "MindEase AI ML Service is running successfully"}

@app.post("/analyze")
async def analyze_journal(payload: AnalyzeRequest):
    try:
        text = payload.text

        if not text or not text.strip():
            return JSONResponse(
                status_code=400,
                content={"message": "No text provided"}
            )

        encoded_input = tokenizer(
            text,
            return_tensors='pt',
            truncation=True,
            padding=True,
            max_length=128
        )

        with torch.no_grad():
            output = model(**encoded_input)

        logits = output.logits

        probabilities = torch.softmax(logits, dim=-1).numpy()[0]

        predicted_class_id = int(np.argmax(probabilities))

        predicted_label = LABELS[predicted_class_id]

        confidence_score = float(probabilities[predicted_class_id])

        mood = MOOD_MAP.get(predicted_label, "neutral")

        # ── Run crisis middleware check
        crisis_info = crisis_middleware(predicted_label)

        response = {
            "analysis": {
                "mood": mood,
                "mental_state": predicted_label,
                "score": confidence_score,
                "suggestion": SUGGESTIONS.get(mood),
                "is_crisis": crisis_info["is_crisis"],
                "crisis_label": crisis_info["crisis_label"],
            },
            "entry": {
                "_id": str(np.random.randint(100000)),
                "text": text,
                "mood": mood,
                "score": confidence_score,
                "mental_state": predicted_label,
                "is_crisis": crisis_info["is_crisis"],
                "crisis_label": crisis_info["crisis_label"],
            },
            # Top-level crisis flag for easy frontend access
            "is_crisis": crisis_info["is_crisis"],
            "crisis_label": crisis_info["crisis_label"],
        }

        return response

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)