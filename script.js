// 1. CONFIGURAÇÃO DE ACESSO AO BACKEND (N8N)
const WEBHOOK_URL = "https://n8nwebhook.n8ntechost.shop/webhook/Orion"; 

// 2. CONFIGURAÇÃO DO MOTOR DE RECONHECIMENTO DE VOZ
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'pt-BR';
recognition.continuous = true; // Mantém o Orion sempre ouvindo
recognition.interimResults = false; // Só processa quando você termina a frase

// 3. SISTEMA DE AUTO-RECARREGAMENTO DO MICROFONE
recognition.onend = () => {
    console.log("Orion: Reiniciando escuta automática...");
    try {
        recognition.start();
    } catch (e) {
        console.log("Reconhecimento já está ativo ou aguardando.");
    }
};

// 4. MOTOR DE SÍNTESE DE VOZ (ORION FALANDO)
function falar(texto) {
    window.speechSynthesis.cancel(); // Para qualquer fala anterior
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    utter.rate = 0.9; // Velocidade da fala
    
    // Desliga o microfone enquanto fala para não ouvir a própria voz
    utter.onstart = () => recognition.stop();
    utter.onend = () => {
        try { recognition.start(); } catch (e) {}
    };
    
    window.speechSynthesis.speak(utter);
}

// 5. ENVIO DE DADOS PARA O N8N E EXECUÇÃO DE AÇÕES
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

        // 5.1 - Processa a Resposta de Voz no Chat
        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="jarvis-txt">ORION: ${data.resposta}</p>`;
            falar(data.resposta);
            
            // Faz o chat rolar sozinho para baixo
            const chatContainer = document.getElementById('chat');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // 5.2 - GATILHO DE ABERTURA DE APLICATIVOS (WhatsApp, etc)
        if (data.url) {
            console.log("Orion: Disparando redirecionamento para app:", data.url);
            
            // Método 'Replace' força o navegador a tratar o link como prioridade de sistema
            window.location.replace(data.url);

            // Backup: Se o replace falhar, tenta o clique simulado após 1 segundo
            setTimeout(() => {
                const linkApp = document.createElement('a');
                linkApp.href = data.url;
                document.body.appendChild(linkApp);
                linkApp.click();
                document.body.removeChild(linkApp);
            }, 1000);
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

// 7. BOTÃO DE ATIVAÇÃO INICIAL (GATILHO DE SEGURANÇA)
function ativar() {
    console.log("Tentando iniciar microfone...");
    try {
        recognition.start();
        document.title = "ORION - ONLINE";
        document.getElementById('status').innerText = "Escuta Ativa";
        document.getElementById('orb').classList.add('pulse'); // Ativa animação visual
        console.log("Sistemas Orion iniciados.");
    } catch (e) {
        console.error("Erro ao ligar microfone ou já ativo:", e);
    }
}