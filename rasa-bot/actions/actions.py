from rasa_sdk import Action
from rasa_sdk.executor import CollectingDispatcher
import requests
import os

class ActionLLMResponse(Action):
    def name(self):
        return "action_llm_response"

    def run(self, dispatcher, tracker, domain):
        user_message = tracker.latest_message.get("text", "")
        
        if not user_message:
            dispatcher.utter_message(text="I'm here for you 💙")
            return []

        prompt = f"""You are MindEase AI, a compassionate CBT-based mental health companion.
Respond with empathy, support, and gentle cognitive behavioral guidance.

User: {user_message}
Assistant:"""

        # Try Groq API first if API key is provided
        groq_api_key = os.environ.get("GROQ_API_KEY")
        bot_reply = None
        
        if groq_api_key:
            try:
                print("Invoking Groq API from Rasa action server...")
                url = "https://api.groq.com/openai/v1/chat/completions"
                response = requests.post(
                    url,
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are MindEase AI, a compassionate CBT-based mental health companion. Respond with empathy, support, and gentle cognitive behavioral guidance."
                            },
                            {
                                "role": "user",
                                "content": user_message
                            }
                        ],
                        "temperature": 0.7
                    },
                    headers={
                        "Authorization": f"Bearer {groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=10
                )
                response.raise_for_status()
                data = response.json()
                bot_reply = data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                print(f"Groq API request failed: {e}")
                bot_reply = None

        # Try Gemini API second if Gemini key is provided and Groq failed/not set
        if not bot_reply:
            gemini_api_key = os.environ.get("GEMINI_API_KEY")
            if gemini_api_key:
                try:
                    print("Invoking Gemini API from Rasa action server...")
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
                    response = requests.post(
                        url,
                        json={
                            "contents": [
                                {
                                    "parts": [
                                        {
                                            "text": prompt
                                        }
                                    ]
                                }
                            ]
                        },
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    response.raise_for_status()
                    data = response.json()
                    bot_reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                except Exception as e:
                    print(f"Gemini API request failed: {e}")
                    bot_reply = None

        # Fallback to local Ollama if Groq/Gemini are not set or failed
        if not bot_reply:
            ollama_url = os.environ.get("OOLAMA_API_URL", "http://localhost:11434/api/generate")
            try:
                print("Invoking local Ollama from Rasa action server...")
                response = requests.post(
                    ollama_url,
                    json={
                        "model": "llama3",
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=15
                )
                response.raise_for_status()
                bot_reply = response.json().get("response", "").strip()
            except Exception as e:
                print(f"Ollama request failed: {e}")
                bot_reply = None

        if not bot_reply:
            bot_reply = "I'm here for you 💙\n\nWhile I process that thought, remember: you're not alone in this."

        dispatcher.utter_message(text=bot_reply)
        return []