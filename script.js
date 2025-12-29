const WEBHOOK_URL = "https://n8nwebhook.n8ntechost.shop/webhook/Orion"; 

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'pt-BR';
recognition.continuous = true; // Mantém o microfone aberto para escuta contínua
recognition.interimResults = false; // Processa apenas quando a frase termina

// REINICIALIZAÇÃO AUTOMÁTICA: Se o navegador desligar o mic, ele religa sozinho
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
    utter.rate = 0.9; // Velocidade levemente reduzida para soar mais natural
    
    // Pausamos o reconhecimento enquanto o Orion fala para evitar eco
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
        console.log("Dados recebidos do n8n:", data); // Log crucial para diagnóstico

        // 1. PROCESSAR RESPOSTA DE VOZ E CHAT
        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="jarvis-txt">ORION: ${data.resposta}</p>`;
            falar(data.resposta);
            
            // Auto-scroll do chat
            const chatContainer = document.getElementById('chat');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // 2. EXECUÇÃO DE APLICATIVOS OU SITES (Gatilho de URL)
        if (data.url) {
            console.log("Orion executando ação externa:", data.url);
            
            // Pequeno atraso para a voz do Orion começar antes do app abrir
            setTimeout(() => {
                // window.location.assign é melhor para disparar protocolos de apps (spotify:, whatsapp:)
                window.location.assign(data.url);
            }, 800);
        }

    } catch (e) {
        console.error("Erro na comunicação com o n8n:", e);
    }
}

recognition.onresult = (event) => {
    // Captura o último resultado da lista de transcrição
    const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    
    if (comando) {
        document.getElementById('chat').innerHTML += `<p class="user-txt">> ${comando}</p>`;
        enviarComando(comando);
    }
};

function ativar() {
console.log("Tentando iniciar microfone...");
    try {
        recognition.start();
        document.getElementById('status').innerText = "Ouvindo...";
    } catch (e) {
        console.error("Erro ao ligar microfone:", e); // SE O MIC NÃO LIGAR, O ERRO APARECE AQUI
    }
}

    try {
        recognition.start();
        document.title = "ORION - ONLINE";
        document.getElementById('status').innerText = "Status: Escuta Ativa";
        document.getElementById('orb').classList.add('pulse');
        
        // Feedback visual inicial
        console.log("Sistemas Orion iniciados.");
    } catch (e) {
        console.log("O sistema de voz já está operando.");
    }
