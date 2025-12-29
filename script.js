const WEBHOOK_URL = "https://n8nwebhook.n8ntechost.shop/webhook/Orion"; 

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'pt-BR';
recognition.continuous = true; // Mantém o microfone aberto
recognition.interimResults = false; // Processa apenas frases completas

// O SEGREDO: Se o microfone desligar sozinho, ele religa imediatamente
recognition.onend = () => {
    recognition.start();
    console.log("Orion: Escuta reiniciada automaticamente.");
};

function falar(texto) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    
    // Pausamos o reconhecimento enquanto o Orion fala para ele não se ouvir
    utter.onstart = () => recognition.stop();
    utter.onend = () => recognition.start();
    
    window.speechSynthesis.speak(utter);
}

async function enviarComando(texto) {
    // Rola o chat automaticamente para baixo
    const chatContainer = document.getElementById('chat-container');
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comando: texto }) 
        });

        const data = await response.json();
        
        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="jarvis-txt">ORION: ${data.resposta}</p>`;
            falar(data.resposta);
        }
    } catch (e) {
        console.error("Erro na resposta:", e);
    }
    
    if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
}

recognition.onresult = (event) => {
    // Pega sempre o último resultado capturado
    const comando = event.results[event.results.length - 1][0].transcript.toLowerCase();
    
    document.getElementById('chat').innerHTML += `<p class="user-txt">> ${comando}</p>`;
    enviarComando(comando);
};

function ativar() {
    try {
        recognition.start();
        document.title = "ORION - ATIVO";
        document.getElementById('status').innerText = "Status: Escuta Contínua";
        document.getElementById('orb').classList.add('pulse');
    } catch (e) {
        console.log("Reconhecimento já estava ativo.");
    }
}