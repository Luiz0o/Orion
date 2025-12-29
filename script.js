// 1. CONFIGURAÇÃO DE ACESSO AO BACKEND (N8N)
const WEBHOOK_URL = "https://n8nwebhook.n8ntechost.shop/webhook/Orion"; 

// 2. CONFIGURAÇÃO DO MOTOR DE RECONHECIMENTO DE VOZ
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'pt-BR';
recognition.continuous = true; 
recognition.interimResults = false; 

// 3. SISTEMA DE AUTO-RECARREGAMENTO DO MICROFONE
recognition.onend = () => {
    console.log("Orion: Reiniciando escuta automática...");
    try {
        recognition.start();
    } catch (e) {
        console.log("Reconhecimento já está ativo ou aguardando.");
    }
};

// 4. MOTOR DE SÍNTESE DE VOZ E REDIRECIONAMENTO (SINCRONIZADO)
function falarESaltar(texto, url) {
    window.speechSynthesis.cancel(); // Para qualquer fala anterior
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    utter.rate = 0.9; 
    
    // Desliga o microfone enquanto fala para não ouvir a própria voz
    utter.onstart = () => recognition.stop();

    // EVENTO FINAL: Executa a ação APÓS terminar de falar
    utter.onend = () => {
        if (url) {
            console.log("Orion: Voz finalizada. Abrindo app:", url);
            
            // Método de salto otimizado para Android
            window.location.assign(url);
            
            // Backup de clique simulado
            const linkForçado = document.createElement('a');
            linkForçado.href = url;
            linkForçado.rel = "external"; 
            document.body.appendChild(linkForçado);
            linkForçado.click();
            document.body.removeChild(linkForçado);
        }
        
        // Religa o microfone após a ação ou fala
        try { recognition.start(); } catch (e) {}
    };
    
    window.speechSynthesis.speak(utter);
}

// 5. ENVIO DE DADOS PARA O N8N E PROCESSAMENTO
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

        // 5.1 - Processa a Resposta de Voz e o Chat
        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="jarvis-txt">ORION: ${data.resposta}</p>`;
            
            // Agora chamamos a função sincronizada passando o texto e a URL (se houver)
            falarESaltar(data.resposta, data.url);
            
            const chatContainer = document.getElementById('chat');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

    } catch (e) {
        console.error("Erro na comunicação com o n8n:", e);
    }
}

// 6. PROCESSAMENTO DO RESULTADO DA VOZ
recognition.onresult = (event) => {
    const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    if (comando) {
        document.getElementById('chat').innerHTML += `<p class="user-txt">> ${comando}</p>`;
        enviarComando(comando);
    }
};

// 7. BOTÃO DE ATIVAÇÃO INICIAL
function ativar() {
    console.log("Tentando iniciar microfone...");
    try {
        recognition.start();
        document.title = "ORION - ONLINE";
        document.getElementById('status').innerText = "Escuta Ativa";
        document.getElementById('orb').classList.add('pulse'); 
        console.log("Sistemas Orion iniciados.");
    } catch (e) {
        console.error("Erro ao ligar microfone ou já ativo:", e);
    }
}