

---

🛠️ Instalação – Groq AI Copilot para Acode

Este guia explica passo a passo como instalar e configurar o Groq AI Copilot para Acode, utilizando o Termux como servidor local da IA.


---

📋 Requisitos

Android

Acode Editor

Termux

Conta na Groq Cloud com API Key



---

1️⃣ Instalar o Termux

Recomenda-se instalar o Termux pela F-Droid, pois a versão da Play Store está desatualizada:

Link Para [**Download**](https://f-droid.org/packages/com.termux/)

---

2️⃣ Preparar o Ambiente no Termux

Abra o Termux e execute os comandos abaixo.

---

3️⃣ Baixar e Configurar o Servidor Python

Como o Termux é um ambiente protegido, vamos baixar o servidor diretamente do repositório oficial.

1. No terminal do Termux, execute o comando abaixo para baixar o arquivo:
`wget https://raw.githubusercontent.com/Dev-Benicio/Groq-Acode-Plugin/refs/heads/main/groq_server.py -O groq_server.py`

2. Agora, edite o arquivo para colocar a sua API Key da Groq:
nano groq_server.py

3. Encontre a linha `API_KEY = "SUA_CHAVE_AQUI"` e cole a sua chave entre as aspas.

4. Salve o arquivo pressionando `Ctrl + O`, depois `Enter`, e saia com `Ctrl + X`.

---


3. Salve o arquivo pressionando `Ctrl + O`, depois `Enter`, e saia com `Ctrl + X`.

4. Agora edite para colocar sua chave real (se não fez antes):
nano groq_server.py


---


4️⃣ Executar o Servidor

Inicie o servidor com:

python groq_server.py

Por padrão, o servidor roda em:

`http://127.0.0.1:5000`

⚠️ O Termux deve permanecer aberto enquanto o Acode estiver utilizando o autocomplete.


---

5️⃣ Importar o Plugin no Acode

1. Abra o Acode


2. Vá em Plugins


3. Selecione Importar Plugin


4. Escolha o arquivo do plugin


---

6️⃣ Configurar o Plugin no Acode

1. Abra as configurações do plugin (⚙️)


2. Defina:

Linguagem do projeto

URL do servidor:

`http://127.0.0.1:5000`



3. Salve as configurações




---

⌨️ Uso

Dentro do editor do Acode:

Ctrl + Y

para acionar o autocomplete com IA.


---

❗ Solução de Problemas

Autocomplete não funciona

Verifique se o servidor está rodando no Termux

Confirme a URL configurada no plugin

Verifique se a API Key da Groq é válida


Erros ao instalar dependências

pip install --upgrade pip


---

✅ Conclusão

Após seguir todos os passos acima, o Groq AI Copilot para Acode estará pronto para uso com autocomplete inteligente diretamente no editor.


---
