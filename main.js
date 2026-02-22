// Definição das configurações iniciais
const defaultSettings = {
    serverUrl: "http://localhost:5000/completar",
    language: "java"
};

class GroqCopilot {
    
    constructor() {
        this.baseUrl = null;
        this.settings = { ...defaultSettings };
    }

    async init($page, cacheFile, cacheFileUrl) {
        this.$page = $page;
        console.log("Groq Copilot v2.2: Inicializando...");
        this.registerCommand();
        window.toast("🔌 Groq AI Pronto (Ctrl+Y)", 3000);
    }

    // Chamada automaticamente pelo Acode quando o usuário muda algo na engrenagem ⚙️
    updateSettings(key, value) {
        this.settings[key] = value;
        console.log(`Configuração alterada: ${key} = ${value}`);
    }

    registerCommand() {
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

    // ─── Detecta linguagem pela extensão do arquivo aberto ────────────────────
    // Fallback para a linguagem configurada na engrenagem ⚙️
    detectLanguage(nomeArquivo) {
        try {
            const ext = (nomeArquivo || '').split('.').pop().toLowerCase();
            const map = {
                java: 'java', kt: 'kotlin', py: 'python',
                js: 'javascript', ts: 'typescript', cpp: 'cpp',
                c: 'c', cs: 'csharp', go: 'go', rb: 'ruby',
                php: 'php', swift: 'swift', rs: 'rust',
                html: 'html', css: 'css', xml: 'xml'
            };
            if (map[ext]) return map[ext];
        } catch (e) { /* silencioso */ }
        return this.settings.language || defaultSettings.language;
    }

    // ─── Extrai caminho completo e nome do arquivo via Acode ──────────────────
    // O Acode conhece o URI real do arquivo aberto. Usamos isso para mandar
    // o caminho exato ao servidor Python — sem hardcode de diretório nenhum.
    getFileContext() {
        try {
            const activeFile = editorManager.activeFile;
            if (!activeFile) return { filepath: '', filename: '' };

            const filename = activeFile.name || '';

            // URI típica: file:///storage/emulated/0/qualquer/pasta/Main.java
            // Ou pode ser um caminho direto dependendo da versão do Acode
            const rawUri = activeFile.uri || activeFile.location || '';
            const uri    = decodeURIComponent(rawUri);

            // Remove o prefixo "file://" se existir, deixando o caminho puro do Android
            // Ex: /storage/emulated/0/MeusProjetos/App/src/Main.java
            const filepath = uri.replace(/^file:\/\//, '');

            return { filepath, filename };
        } catch (e) {
            console.warn("Groq Copilot: não foi possível obter caminho do arquivo.", e);
            return { filepath: '', filename: '' };
        }
    }

    async runAutocomplete() {
        const myEditor = editorManager.editor;
        if (!myEditor) return;

        const cursorPos = myEditor.getCursorPosition();
        const fullText  = myEditor.getValue();
        
        const index      = myEditor.session.doc.positionToIndex(cursorPos);
        const textBefore = fullText.substring(Math.max(0, index - 2000), index);
        const textAfter  = fullText.substring(index, Math.min(fullText.length, index + 800));

        const url = this.settings.serverUrl || defaultSettings.serverUrl;

        // Contexto do arquivo aberto
        const { filepath, filename } = this.getFileContext();
        const lang = this.detectLanguage(filename);

        window.toast(`🤖 Loading (${lang})...`, 2000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prefix:   textBefore,
                    suffix:   textAfter,
                    language: lang,
                    filename: filename,  // ex: "NickManager.java"
                    filepath: filepath   // ex: "/storage/emulated/0/Dev/AppX/src/NickManager.java"
                    // O servidor deriva a pasta do projeto a partir desse caminho completo
                    // Funciona com QUALQUER estrutura de diretório, não só /PROJETOS/
                })
            });

            if (!response.ok) throw new Error("Erro HTTP: " + response.status);

            const data = await response.json();
            
            if (data.suggestion && data.suggestion.trim() !== '') {

                // Insere o código e move o cursor para o FINAL do texto inserido.
                // Isso evita que o próximo Ctrl+Y capture o texto recém-inserido
                // no prefix e a IA o repita.
                myEditor.session.insert(cursorPos, data.suggestion);

                const linhas    = data.suggestion.split('\n');
                const novaLinha = cursorPos.row + linhas.length - 1;
                const novaCol   = linhas.length === 1
                    ? cursorPos.column + data.suggestion.length
                    : linhas[linhas.length - 1].length;

                myEditor.moveCursorTo(novaLinha, novaCol);

                window.toast("✅ Success!", 2000);

            } else {
                window.toast("⚠️ Sem sugestão.", 2000);
            }

        } catch (error) {
            console.error(error);
            if (error.message.includes('fetch') || error.message.includes('Failed')) {
                window.toast("🔌 Servidor offline. Inicie o Termux!", 4000);
            } else {
                window.alert(`ERRO DE CONEXÃO:\nURL: ${url}\nErro: ${error}`);
            }
        }
    }

    destroy() {
        try {
            editorManager.editor.commands.removeCommand("groq_autocomplete");
        } catch (_) {}
    }
}

if (window.acode) {
    const acodePlugin = new GroqCopilot();
    
    acode.setPluginInit(
        "com.oficial.acode.groq",
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
                    text: 'Linguagem Padrão (fallback)',
                    value: defaultSettings.language,
                    prompt: 'Usado quando a extensão não é reconhecida. Ex: java, python, js',
                    promptType: 'text'
                }
            ],
            cb: (key, value) => {
                acodePlugin.updateSettings(key, value);
            }
        }
    );

    acode.setPluginUnmount("com.oficial.acode.groq", () => {
        acodePlugin.destroy();
    });
}
