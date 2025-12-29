const WEBHOOK_URL = "https://n8nwebhook.n8ntechost.shop/webhook/Orion"; 

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'pt-BR';
recognition.continuous = true; 
recognition.interimResults = false; 

// REINICIALIZAÇÃO AUTOMÁTICA
recognition.onend = () => {
    console.log("Orion: Reiniciando escuta automática...");
    try {
        recognition.start();
    } catch (e) {
        console.log("Reconhecimento já está ativo ou aguardando.");
    }
};

function falar(texto) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    utter.rate = 0.9; 
    
    utter.onstart = () => recognition.stop();
    utter.onend = () => {
        try { recognition.start(); } catch (e) {}
    };
    
    window.speechSynthesis.speak(utter);
}

async function enviarComando(texto) {
    try {
        console.log("Enviando para o n8n:", texto);
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comando: texto }) 
        });

        const data = await response.json();
        console.log("Dados recebidos do n8n:", data); 

        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="jarvis-txt">ORION: ${data.resposta}</p>`;
            falar(data.resposta);
            
            const chatContainer = document.getElementById('chat');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // EXECUÇÃO DE APLICATIVOS (Gatilho de Protocolo)
        if (data.url) {
            console.log("Orion disparando abertura de app:", data.url);
            const linkApp = document.createElement('a');
            linkApp.href = data.url;
            document.body.appendChild(linkApp);
            linkApp.click();
            document.body.removeChild(linkApp);
        }

    } catch (e) {
        console.error("Erro na comunicação com o n8n:", e);
    }
}

recognition.onresult = (event) => {
    const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    if (comando) {
        document.getElementById('chat').innerHTML += `<p class="user-txt">> ${comando}</p>`;
        enviarComando(comando);
    }
};

// FUNÇÃO ATIVAR ÚNICA E CORRIGIDA
function ativar() {
    console.log("Tentando iniciar microfone...");
    try {
        recognition.start();
        document.title = "ORION - ONLINE";
        document.getElementById('status').innerText = "Status: Escuta Ativa";
        document.getElementById('orb').classList.add('pulse');
        console.log("Sistemas Orion iniciados.");
    } catch (e) {
        console.error("Erro ao ligar microfone ou já ativo:", e);
    }
}