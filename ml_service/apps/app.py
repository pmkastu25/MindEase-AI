import torch
from flask import Flask, request, jsonify
from transformers import BertTokenizer, BertForSequenceClassification
import numpy as np

app = Flask(__name__)

MODEL_NAME = "pmkastu25/mindease-mental-health-bert"

print(f"Loading BERT model: {MODEL_NAME}...")

tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
model = BertForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

print("Model loaded successfully!")

LABELS = {
    0: "Anxiety",
    1: "Bipolar",
    2: "Depression",
    3: "Normal",
    4: "Personality disorder",
    5: "Stress",
    6: "Suicidal"
}

@app.route('/analyze-mood', methods=['POST'])
def analyze_mood():
    try:
        data = request.get_json()

        if not data or "text" not in data:
            return jsonify({"error": "No 'text' field provided"}), 400

        input_text = data["text"]

        # TOKENIZATION
        encoded_input = tokenizer(
            input_text,
            return_tensors='pt',
            truncation=True,
            padding=True,
            max_length=128
        )

        # INFERENCE
        with torch.no_grad():
            output = model(**encoded_input)

        logits = output.logits
        probabilities = torch.softmax(logits, dim=-1).numpy()[0]

        predicted_class_id = int(np.argmax(probabilities))
        predicted_label = LABELS[predicted_class_id]
        confidence_score = float(probabilities[predicted_class_id])

        # Build response
        response = {
            "class_id": predicted_class_id,
            "label": predicted_label,
            "confidence": round(confidence_score, 4),
            "all_scores": {
                LABELS[i]: round(float(prob), 4) for i, prob in enumerate(probabilities)
            }
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("Flask server running at http://localhost:5000/")
    app.run(host='0.0.0.0', port=5000, debug=True)
