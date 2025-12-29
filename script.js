const WEBHOOK_URL = "https://n8nwebhook.n8ntechost.shop/webhook/Orion"; 

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'pt-BR';
recognition.continuous = true; 
recognition.interimResults = false; 

// Sincronização de IDs: Agora usa 'status-container' e 'chat-container'
window.addEventListener('focus', () => {
    setTimeout(() => {
        try {
            recognition.stop();
            recognition.start();
            document.getElementById('status-container').innerText = "STATUS: ESCUTA ATIVA";
            document.getElementById('status-container').style.color = "#00f2ff";
        } catch (e) {}
    }, 500);
});

recognition.onerror = (event) => {
    if (event.error === 'not-allowed') {
        const status = document.getElementById('status-container');
        status.innerText = "BLOQUEADO: Clique na Orbe";
        status.style.color = "#ff4444";
        document.getElementById('orb').classList.add('orb-blocked');
    }
};

function falar(texto) {
    return new Promise((resolve) => {
        window.speechSynthesis.cancel(); 
        const utter = new SpeechSynthesisUtterance(texto);
        utter.lang = 'pt-BR';
        utter.rate = 0.9; 
        utter.onstart = () => recognition.stop();
        utter.onend = () => {
            setTimeout(() => {
                try { recognition.start(); } catch (e) {}
                resolve(); 
            }, 1000); 
        };
        window.speechSynthesis.speak(utter);
    });
}

async function enviarComando(texto) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comando: texto }) 
        });
        const data = await response.json();
        const chat = document.getElementById('chat-container');

        if (data.resposta) {
            chat.innerHTML += `<p class="orion-txt">ORION: ${data.resposta}</p>`;
            await falar(data.resposta); 
            
            if (data.url) {
                const linkApp = document.createElement('a');
                linkApp.href = data.url;
                document.body.appendChild(linkApp);
                linkApp.click();
                setTimeout(() => document.body.removeChild(linkApp), 100);
            }
            chat.scrollTop = chat.scrollHeight;
        }
    } catch (e) { console.error("Erro n8n:", e); }
}

recognition.onresult = (event) => {
    const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    document.getElementById('chat-container').innerHTML += `<p class="user-txt">> ${comando}</p>`;
    enviarComando(comando);
};

function ativar() {
    const status = document.getElementById('status-container');
    const orb = document.getElementById('orb');
    
    try {
        recognition.stop();
        window.speechSynthesis.cancel();
    } catch (e) {}

    setTimeout(() => {
        try {
            recognition.start();
            orb.classList.remove('orb-blocked');
            orb.classList.add('pulse');
            status.innerText = "STATUS: ESCUTA ATIVA";
            status.style.color = "#00f2ff";
        } catch (e) {
            status.innerText = "ERRO: TENTE NOVAMENTE";
        }
    }, 300);
}