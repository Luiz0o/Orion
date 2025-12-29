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

// 4. MOTOR DE SÍNTESE DE VOZ COM PROMESSA E DELAY DE SEGURANÇA
function falar(texto) {
    return new Promise((resolve) => {
        window.speechSynthesis.cancel(); 
        const utter = new SpeechSynthesisUtterance(texto);
        utter.lang = 'pt-BR';
        utter.rate = 0.9; 
        
        utter.onstart = () => recognition.stop();

        // QUANDO O NAVEGADOR PROCESSA O FIM DA FALA
        utter.onend = () => {
            console.log("Orion: Fala processada. Aguardando finalização do áudio...");
            // Delay de 1000ms (1 segundo) para garantir que o som terminou no alto-falante
            setTimeout(() => {
                try { recognition.start(); } catch (e) {}
                resolve(); // Libera o código para abrir o app
            }, 1000); 
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

        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="jarvis-txt">ORION: ${data.resposta}</p>`;
            
            // AGUARDA A FALA + O DELAY DE SEGURANÇA
            await falar(data.resposta); 
            
            // 5.2 - GATILHO DE ABERTURA NATIVA (Sem abrir nova aba)
            if (data.url) {
                console.log("Orion: Disparando comando nativo:", data.url);
                
                // Criamos um iframe invisível para disparar o protocolo
                // Isso evita que o navegador tente carregar uma página branca
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = data.url;
                document.body.appendChild(iframe);
                
                // Removemos o iframe logo após o disparo
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 500);
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