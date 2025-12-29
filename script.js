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

// 4. MOTOR DE SÍNTESE DE VOZ COM PROMESSA (SINCRONIZAÇÃO)
// Esta função agora devolve uma "Promessa" que só é resolvida quando a fala termina
function falar(texto) {
    return new Promise((resolve) => {
        window.speechSynthesis.cancel(); 
        const utter = new SpeechSynthesisUtterance(texto);
        utter.lang = 'pt-BR';
        utter.rate = 0.9; 
        
        // Pausa o microfone para o Orion não se ouvir
        utter.onstart = () => recognition.stop();

        // QUANDO A FALA TERMINA: Resolve a promessa e religa o microfone
        utter.onend = () => {
            console.log("Orion: Terminou de falar.");
            try { recognition.start(); } catch (e) {}
            resolve(); // Libera o "await" na função enviarComando
        };
        
        window.speechSynthesis.speak(utter);
    });
}

// 5. ENVIO DE DADOS E EXECUÇÃO SEQUENCIAL
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

        // 5.1 - Processa a Resposta de Voz no Chat e no Áudio
        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="jarvis-txt">ORION: ${data.resposta}</p>`;
            
            // AGUARDA O ORION TERMINAR DE FALAR (BLOQUEIO DE LINHA)
            await falar(data.resposta); 
            
            // 5.2 - GATILHO DE ABERTURA: Só executa após o "await falar" ser concluído
            if (data.url) {
                console.log("Orion: Iniciando salto para app após fala completa:", data.url);
                window.location.assign(data.url);
                
                // Backup de clique simulado para Android
                const linkForçado = document.createElement('a');
                linkForçado.href = data.url;
                linkForçado.rel = "external"; 
                document.body.appendChild(linkForçado);
                linkForçado.click();
                document.body.removeChild(linkForçado);
            }
            
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