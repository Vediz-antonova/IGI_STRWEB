const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.post('/petcare', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ success: false, message: 'Сообщение обязательно' });
    }

    try {
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "deepseek-ai/DeepSeek-V3.2:novita",
                messages: [
                    { role: "system", content: "Ты — эксперт по уходу за питомцами." },
                    { role: "user", content: message }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // DeepSeek возвращает в стиле OpenAI
        const reply = response.data?.choices?.[0]?.message?.content || "Нет ответа";

        res.json({ success: true, reply, model: "deepseek-ai/DeepSeek-V3.2:novita" });
    } catch (error) {
        console.error("Ошибка Hugging Face:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Ошибка Hugging Face API", model: "deepseek-ai/DeepSeek-V3.2:novita" });
    }
});

module.exports = router;