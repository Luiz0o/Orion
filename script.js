const WEBHOOK_URL = "https://n8nwebhook.n8ntechost.shop/webhook/Orion"; 

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'pt-BR';
recognition.continuous = true;

function falar(texto) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    window.speechSynthesis.speak(utter);
}

async function enviarComando(texto) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            // Enviamos como texto simples para o navegador não bloquear o envio
            body: JSON.stringify({ comando: texto }) 
        });

        const data = await response.json();
        
        if (data.resposta) {
            document.getElementById('chat').innerHTML += `<p class="orion-txt">JARVIS: ${data.resposta}</p>`;
            falar(data.resposta);
        }
    } catch (e) {
        console.error("Erro na resposta:", e);
    }
}

recognition.onresult = (event) => {
    const comando = event.results[event.resultIndex][0].transcript.toLowerCase();
    document.getElementById('chat').innerHTML += `<p class="user-txt">> ${comando}</p>`;
    enviarComando(comando);
};

function ativar() {
    recognition.start();
    document.title = "ORION - OUVINDO";
}