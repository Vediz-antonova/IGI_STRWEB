import React, { useState } from 'react';
import styles from './PetCareChat.module.css';

function PetCareChat() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);

    const askPetCare = async () => {
        if (!question.trim()) return;
        setLoading(true);
        setAnswer('');

        try {
            const res = await fetch('http://localhost:5000/api/chat/petcare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: question })
            });
            const data = await res.json();
            if (data.success) {
                setAnswer(data.reply);
            } else {
                setAnswer('Ошибка: ' + data.message);
            }
        } catch (err) {
            setAnswer('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.chatBox}>
            <h2>Чат‑консультант по уходу за питомцами 🐶🐱</h2>
            <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Задайте вопрос о кормлении, гигиене, здоровье..."
            />
            <button onClick={askPetCare} disabled={loading}>
                {loading ? 'Отправка...' : 'Спросить'}
            </button>
            {answer && <div className={styles.answer}>{answer}</div>}
        </div>
    );
}

export default PetCareChat;