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

        # Try local Ollama first
        ollama_url = os.environ.get("OOLAMA_API_URL", "http://localhost:11434/api/generate")
        bot_reply = None
        
        try:
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