const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN =
  "EAAQmVsZCBgI4BO77sVs1wAuXZAGyoMArO7QxrGEFCdQHIA1jVwovpruCmSDvvyseES88anuDNWskzWGzqTvhzZBEo8w4dU4mye4cZCNt7YCEsDnsw9JwnB0ZBBw308sb68GZB4CpbE93QADJeHsMJBdELSJPTZAcmZAMLzFoDxvVBej5ECn1xcOw3xSCVcvlho0asgZDZD";

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "verify_me_kasam";
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry[0];
  const event = entry.messaging[0];
  const senderId = event.sender.id;
  const message = event.message?.text;

  if (message) {
    const response = await getBotReply(message);
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: senderId },
        message: { text: response },
      }
    );
  }

  res.sendStatus(200);
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
  // Simple NLP from HuggingFace
  const res = await axios.post(
    "https://api-inference.huggingface.co/models/mrm8488/t5-base-finetuned-question-generation-ap",
    { inputs: msg },
    { headers: { Authorization: "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" } }
  );
  return (
    res.data[0]?.generated_text ||
    "माफ गर्नुहोस्, म बुझिनँ। कृपया फेरि सोध्नुहोस्।"
  );
}

app.listen(3000, () => console.log("Bot is live on port 3000"));
