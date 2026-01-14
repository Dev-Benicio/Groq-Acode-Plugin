// Definição das configurações iniciais
const defaultSettings = {
    serverUrl: "http://localhost:5000/completar",
    language: "java"
};

class GroqCopilot {
    
    constructor() {
        this.baseUrl = null;
        this.settings = defaultSettings;
    }

    async init($page, cacheFile, cacheFileUrl) {
        this.$page = $page;
        console.log("Groq Copilot: Inicializando...");
        
        // Registra o comando
        this.registerCommand();
        
        // Feedback visual
        window.toast("🔌 Groq AI Pronto (Ctrl+Y)", 3000);
    }

    // Essa função é chamada automaticamente pelo Acode quando mudam algo na engrenagem
    updateSettings(key, value) {
        this.settings[key] = value;
        console.log(`Configuração alterada: ${key} = ${value}`);
    }

    registerCommand() {
        // Garante que o editor existe
        if (!window.editorManager || !editorManager.editor) {
            setTimeout(() => this.registerCommand(), 1000);
            return;
        }

        editorManager.editor.commands.addCommand({
            name: "groq_autocomplete",
            bindKey: { win: "Ctrl-Y", mac: "Command-Y" },
            exec: this.runAutocomplete.bind(this)
        });
    }

    async runAutocomplete() {
        const myEditor = editorManager.editor;
        if (!myEditor) return;

        const cursorPos = myEditor.getCursorPosition();
        const fullText = myEditor.getValue();
        
        // Pega contexto
        const index = myEditor.session.doc.positionToIndex(cursorPos);
        const textBefore = fullText.substring(Math.max(0, index - 2000), index);
        const textAfter = fullText.substring(index, Math.min(fullText.length, index + 1000));
        
        // Pega a URL e Linguagem das configurações ATUAIS
        // Se o usuário não configurou nada, usa o padrão
        const url = this.settings.serverUrl || defaultSettings.serverUrl;
        const lang = this.settings.language || defaultSettings.language;

        window.toast(`🤖 Loading (${lang})...`, 2000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    prefix: textBefore,
                    suffix: textAfter,
                    language: lang
                })
            });

            if (!response.ok) throw new Error("Erro HTTP: " + response.status);

            const data = await response.json();
            
            if (data.suggestion) {
                myEditor.session.insert(cursorPos, data.suggestion);
                window.toast("✅ Success!", 2000);
            } else {
                window.toast("⚠️ Sem sugestão.", 2000);
            }

        } catch (error) {
            console.error(error);
            window.alert(`ERRO DE CONEXÃO:\nURL: ${url}\nErro: ${error}`);
        }
    }

    destroy() {
        // Limpeza se necessário
    }
}

if (window.acode) {
    const acodePlugin = new GroqCopilot();
    
    // AQUI ESTÁ A MÁGICA DA ENGRENAGEM E SEGURANÇA
    // O terceiro parâmetro é o objeto de configurações
    acode.setPluginInit(
        "com.oficial.acode.groq", // ID igual ao plugin.json
        (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
            acodePlugin.baseUrl = baseUrl;
            acodePlugin.init($page, cacheFile, cacheFileUrl);
        },
        {
            list: [
                {
                    key: 'serverUrl',
                    text: 'URL do Servidor',
                    value: defaultSettings.serverUrl,
                    prompt: 'Ex: http://localhost:5000/completar',
                    promptType: 'text'
                },
                {
                    key: 'language',
                    text: 'Linguagem Padrão',
                    value: defaultSettings.language,
                    prompt: 'Ex: java, python, js',
                    promptType: 'text'
                }
            ],
            cb: (key, value) => {
                // Callback (cb) chama nossa função de update
                acodePlugin.updateSettings(key, value);
            }
        }
    );

    acode.setPluginUnmount("com.oficial.acode.groq", () => {
        acodePlugin.destroy();
    });
}
