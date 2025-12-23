require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

// --- 🔑 AAPKI ASLI KEY (Fixed) ---
const FAST2SMS_KEY = "UyoJcxes9sv85BnWjJGttr8GdnAz5YlnBYPss7W1j1iZI4VfysShJeJ3vqCe";

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    apiKey: { type: String, unique: true },
    balance: { type: Number, default: 100 },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- FRONTEND UI ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Super Bomber</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            body { margin: 0; padding: 0; height: 100vh; font-family: sans-serif; background: linear-gradient(180deg, #FFD700 0%, #00FF7F 40%, #00BFFF 70%, #FF69B4 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
            .container { text-align: center; width: 90%; max-width: 400px; position: relative; height: 90vh; display: flex; flex-direction: column; justify-content: center; }
            input { width: 100%; padding: 15px; border-radius: 30px; border: none; background: linear-gradient(90deg, #2196F3, #4FC3F7); color: white; font-size: 18px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); outline: none; margin-bottom: 20px; }
            input::placeholder { color: rgba(255,255,255,0.8); }
            .btn-main { width: 60%; padding: 12px; border-radius: 10px; border: none; background: #2979FF; color: white; font-size: 22px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin: 0 auto; transition: 0.2s; }
            .btn-main:active { transform: scale(0.95); }
            .status { margin-top: 20px; color: white; font-weight: bold; text-shadow: 1px 1px 2px black; min-height: 20px; }
            .bottom-nav { position: absolute; bottom: 20px; width: 100%; display: flex; justify-content: space-around; align-items: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3); }
            .icon-btn { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; cursor: pointer; transition: 0.3s; border: 3px solid transparent; box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
            .mix { background: #E53935; } .sms { background: #2196F3; } .call { background: #43A047; } .wapp { background: #25D366; } 
            .selected { transform: scale(1.2); border: 3px solid white; box-shadow: 0 0 15px white; }
            .label { font-size: 12px; font-weight: bold; margin-top: 5px; text-shadow: 1px 1px 1px black; }
            .icon-wrapper { display: flex; flex-direction: column; align-items: center; }
            .setup-hidden { position: absolute; top: 10px; right: 10px; opacity: 0.3; transform: scale(0.5); }
        </style>
    </head>
    <body>
        <div class="setup-hidden"><button onclick="registerUser()">⚙️</button><input type="hidden" id="myApiKey"></div>
        <div class="container">
            <input type="number" id="targetPhone" placeholder="Enter Mobile Number">
            <button id="startBtn" class="btn-main" onclick="toggleBlast()">START</button>
            <div class="status" id="statusText">Select Mode & Start</div>
            <div class="bottom-nav">
                <div class="icon-wrapper" onclick="selectMode('MIX')"><div class="icon-btn mix selected" id="btn-MIX">⚡</div><div class="label">Mix</div></div>
                <div class="icon-wrapper" onclick="selectMode('SMS')"><div class="icon-btn sms" id="btn-SMS"><i class="fas fa-comment"></i></div><div class="label">SMS</div></div>
                <div class="icon-wrapper" onclick="selectMode('CALL')"><div class="icon-btn call" id="btn-CALL"><i class="fas fa-phone"></i></div><div class="label">Call</div></div>
                <div class="icon-wrapper" onclick="selectMode('WHATSAPP')"><div class="icon-btn wapp" id="btn-WHATSAPP"><i class="fab fa-whatsapp"></i></div><div class="label">WhatsApp</div></div>
            </div>
        </div>
        <script>
            let currentMode = 'MIX'; let isRunning = false; let intervalId = null; let count = 0;
            window.onload = function() { const savedKey = localStorage.getItem('savedApiKey'); if(savedKey) document.getElementById('myApiKey').value = savedKey; else registerUser(); }
            async function registerUser() { const name = "User" + Math.floor(Math.random()*1000); const email = name + "@test.com"; const res = await fetch('/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name, email }) }); const data = await res.json(); if(data.apiKey) { localStorage.setItem('savedApiKey', data.apiKey); document.getElementById('myApiKey').value = data.apiKey; } }
            function selectMode(mode) { currentMode = mode; document.querySelectorAll('.icon-btn').forEach(el => el.classList.remove('selected')); document.getElementById('btn-' + mode).classList.add('selected'); document.getElementById('statusText').innerText = mode + " Mode Selected"; }
            function toggleBlast() {
                const btn = document.getElementById('startBtn'); const phone = document.getElementById('targetPhone').value;
                if(!isRunning) {
                    if(!phone || phone.length < 10) return alert("Enter Valid Number");
                    isRunning = true; btn.innerText = "STOP"; btn.style.background = "#FF3D00"; document.getElementById('statusText').innerText = "🚀 Blasting " + currentMode + "...";
                    sendRequest(); intervalId = setInterval(sendRequest, 300); 
                } else {
                    isRunning = false; clearInterval(intervalId); intervalId = null;
                    btn.innerText = "START"; btn.style.background = "#2979FF"; document.getElementById('statusText').innerText = "🛑 Stopped. Total Sent: " + count; count = 0;
                }
            }
            async function sendRequest() {
                if(!isRunning) return;
                const phone = document.getElementById('targetPhone').value; const apiKey = document.getElementById('myApiKey').value; const randomOTP = Math.floor(1000 + Math.random() * 9000); const message = "Your Code is " + randomOTP;
                try { fetch('/api/send', { method: 'POST', headers: {'Content-Type': 'application/json', 'x-api-key': apiKey}, body: JSON.stringify({ to: phone, message: message, type: currentMode }) }).then(res => res.json()).then(data => { if(data.success) { count++; if(isRunning) document.getElementById('statusText').innerText = "🔥 Sent: " + count; } }); } catch (err) { console.log("Error"); }
            }
        </script>
    </body>
    </html>
    `);
});

// --- BACKEND LOGIC ---
app.post('/register', async (req, res) => {
    try {
        const { name, email } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.json({ success: true, apiKey: existing.apiKey });
        const newKey = "sk_live_" + uuidv4().replace(/-/g, '');
        await User.create({ name, email, apiKey: newKey });
        res.json({ success: true, apiKey: newKey });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/send', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const { to, message, type } = req.body;
        const user = await User.findOne({ apiKey });
        if (!user || user.balance < 1) return res.status(402).json({ error: "Low Balance" });

        let success = false;
        if (type === 'SMS' || type === 'MIX') {
            const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_KEY}&message=${encodeURIComponent(message)}&language=english&route=q&numbers=${to}`;
            fetch(url).catch(e => console.log(e)); success = true;
        }
        if (type === 'CALL' || type === 'MIX') {
            const otpOnly = message.replace(/\D/g, '');
            const url = `https://www.fast2sms.com/dev/voice?authorization=${FAST2SMS_KEY}&note=${otpOnly}&route=otp&numbers=${to}`;
            fetch(url).catch(e => console.log(e)); success = true;
        }
        if (success) { user.balance -= (type === 'MIX') ? 2 : 1; await user.save(); res.json({ success: true }); } 
        else { res.json({ success: false }); }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
