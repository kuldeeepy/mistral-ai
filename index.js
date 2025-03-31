const express = require("express");
const axios = require("axios");
require("dotenv/config");

const app = express();
app.use(express.json());

const mistral = process.env.mistralUrl;
const chatwoot = process.env.chatwootUrl;
const botToken = process.env.chatwootBotToken;

async function sendToMistral(message) {
  try {
    const response = await axios.post(mistral, {
      model: "mistral:7b",
      prompt: message,
      stream: false,
    });
    return response.data.response;
  } catch (error) {
    console.error("Error sending to Mistral:", error);
    return "Sorry, I am facing issues right now.";
  }
}

async function sendToChatwoot(account, conversation, message) {
  try {
    const response = await axios.post(
      `${chatwoot}/api/v1/accounts/${account}/conversations/${conversation}/messages?api_access_token=${botToken}`,
      {
        message: { content: message },
      },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending to Chatwoot:", error);
    return null;
  }
}

app.post("/mistral", async (req, res) => {
  const { message_type, content, conversation, sender, account } = req.body;
  if (message_type === "incoming") {
    console.log(`Received: ${content} from ${sender.id}`);

    const botResponse = await sendToMistral(content);
    console.log(`Mistral Response: ${botResponse}`);

    const chatwootResponse = await sendToChatwoot(
      account.id,
      conversation.id,
      botResponse
    );

    return res.json(chatwootResponse || { error: "Chatwoot send failed" });
  }
  return res.status(400).json({ error: "Invalid message type" });
});

app.listen(8000, () => console.log("Server running on port 8000"));
