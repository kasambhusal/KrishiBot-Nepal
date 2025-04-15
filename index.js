const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

async function getAgricultureReply(userText) {
  // example for testing only
  return `You asked: ${userText}. I’ll get back to you soon.`;
}

// NEW version with AI logic
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;

        // Process message with AI (translate, etc.)
        const aiReply = await getBotReply(userMessage);

        // Send response
        callSendAPI(sender_psid, aiReply);
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

async function getBotReply(msg) {
  if (msg.toLowerCase().includes("weather")) {
    return await getWeather("Kapilvastu"); // Update to dynamic
  }

  return await askAI(msg);
}

async function getWeather(location) {
  const res = await axios.get(
    `https://api.open-meteo.com/v1/forecast?latitude=27.55&longitude=83.05&current_weather=true`
  );
  return `आजको मौसम ${location} मा: ${res.data.current_weather.temperature}°C, ${res.data.current_weather.weathercode}`;
}

async function askAI(msg) {
  const res = await axios.post(
    "https://api-inference.huggingface.co/models/google/flan-t5-base",
    { inputs: msg },
    { headers: { Authorization: `Bearer ${process.env.HUGGING_FACE}` } }
  );
  return (
    res.data[0]?.generated_text ||
    "माफ गर्नुहोस्, म बुझिनँ। कृपया फेरि सोध्नुहोस्।"
  );
}

app.listen(3000, () => console.log("Bot is live on port 3000"));
