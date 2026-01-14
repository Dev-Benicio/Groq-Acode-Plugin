

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

```
# Atualizar os pacotes
pkg update && pkg upgrade -y

#Instalar dependências necessárias
pkg install python rust binutils -y

# Atualizar o pip (recomendado)
pip install --upgrade pip

# Instalar bibliotecas Python
pip install flask groq flask-cors

```

---

3️⃣ Criar o Servidor Python

Como o Termux é um ambiente protegido, vamos criar o script diretamente nele.

1. No terminal, crie o arquivo:
nano groq_server.py

2. Copie o código abaixo e cole dentro do terminal (Pressione e segure na tela -> Paste):

```
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

# --- SUAS CONFIGURAÇÕES ---
# Lembre-se de manter as aspas na chave!
API_KEY = "ADICIONE_SUA_CHAVE_AQUI!!" 

app = Flask(__name__)
CORS(app)

client = Groq(api_key=API_KEY)

@app.route('/completar', methods=['POST'])
def completar():
    data = request.json
    codigo_antes = data.get('prefix', '')
    codigo_depois = data.get('suffix', '')
    linguagem = data.get('language', 'java')
    
    print(f"--- Processando pedido para {linguagem} ---")

    # Prompt OTIMIZADO para evitar textos extras
    system_prompt = f"""
    You are a code completion AI for {linguagem}.
    Output ONLY the code to complete the current cursor position.
    DO NOT use markdown blocks (```).
    DO NOT explain.
    """

    user_prompt = f"""
    Context:
    {codigo_antes[-1500:]} <CURSOR> {codigo_depois[:1000]}
    
    Fill the <CURSOR> spot.
    """

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            # MODELO ATUALIZADO (O antigo foi desligado)
            model="llama-3.3-70b-versatile", 
            temperature=0.1,
            max_tokens=128,
            stop=["\n\n", "```"] 
        )
        
        sugestao = completion.choices[0].message.content
        # Remove crases de markdown se a IA teimar em colocar
        sugestao = sugestao.replace("```java", "").replace("```", "")
        
        return jsonify({"suggestion": sugestao})

    except Exception as e:
        print(f"ERRO API: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

```

3. Salve o arquivo pressionando `Ctrl + O`, depois `Enter`, e saia com `Ctrl + X`.

4. Agora edite para colocar sua chave real (se não fez antes):
nano groq_server.py


---


4️⃣ Executar o Servidor

Inicie o servidor com:

python groq_server.py

Por padrão, o servidor roda em:

http://127.0.0.1:5000

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

http://127.0.0.1:5000



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