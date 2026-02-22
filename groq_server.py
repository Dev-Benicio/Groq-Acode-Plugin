import os
import glob
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

# ─── SUAS CONFIGURAÇÕES ────────────────────────────────────────────────────────
API_KEY = "SUA_CHAVE_AQUI"  # ⚠️ Substitua pela sua chave Groq
# ──────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

client = Groq(api_key=API_KEY)


def ler_arquivo_seguro(caminho, max_chars=1000):
    """Lê um arquivo de texto com segurança. Retorna None se não existir."""
    try:
        with open(caminho, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read(max_chars)
    except Exception:
        return None


def encontrar_pasta_projeto(filepath: str):
    """
    Sobe na árvore de diretórios a partir do arquivo aberto, procurando
    a raiz do projeto nível por nível.

    Retorna uma tupla: (pasta_raiz, marcador_encontrado)
      - marcador_encontrado = True  → raiz real de projeto foi achada
      - marcador_encontrado = False → usou fallback (pasta do arquivo)

    Por que range(12)?
    Projetos Java/Spring têm estrutura muito profunda, ex:
      .../PROJETOS/App/src/main/java/com/empresa/App/Main.java
    São 8 níveis só de src até a raiz. range(12) garante cobertura
    sem hardcode e ainda para assim que encontra o marcador —
    se achar na 3ª tentativa, para na 3ª, não percorre os 12.
    """
    MARCADORES_DE_PROJETO = {
        # Java / Android / Maven / Gradle
        'build.gradle', 'build.gradle.kts', 'pom.xml',
        'settings.gradle', 'settings.gradle.kts', 'gradlew',
        'AndroidManifest.xml',
        # Python
        'requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile',
        # JavaScript / Node / TypeScript
        'package.json', 'tsconfig.json',
        # Controle de versão e genéricos
        '.git', 'README.md', 'readme.md', 'Makefile', 'CMakeLists.txt',
    }

    if not filepath:
        return '', False

    pasta_atual = os.path.dirname(filepath)
    pasta_fallback = pasta_atual  # pasta do arquivo, caso não ache marcador

    for _ in range(12):  # sobe até 12 níveis, para imediatamente ao encontrar
        if os.path.isdir(pasta_atual):
            conteudo = set(os.listdir(pasta_atual))
            if conteudo & MARCADORES_DE_PROJETO:
                return pasta_atual, True  # ✅ Raiz real encontrada

        pai = os.path.dirname(pasta_atual)
        if pai == pasta_atual:
            break  # chegou na raiz do sistema operacional, para
        pasta_atual = pai

    # ⚠️ Nenhum marcador encontrado — provavelmente arquivo avulso
    return pasta_fallback, False


def coletar_contexto_do_projeto(filepath: str, arquivo_atual: str, linguagem: str) -> str:
    """
    Detecta a raiz do projeto e coleta:
      - README (sempre, se existir)
      - Outros arquivos da mesma linguagem (SOMENTE se raiz real foi encontrada)

    A trava de segurança do glob (Risco 2):
    Se o arquivo aberto não fizer parte de um projeto real (ex: arquivo avulso
    em Downloads), apenas o README é lido — o glob nunca é executado.
    Isso evita varrer milhares de arquivos em pastas genéricas.

    Limites de tokens por requisição:
      - README:          até 1500 chars
      - Cada extra:      até 1000 chars  (máx. 3 arquivos)
      - Total máximo:    ~4500 chars de contexto extra
    """
    partes = []

    pasta_projeto, projeto_real = encontrar_pasta_projeto(filepath)

    if not pasta_projeto:
        return ""

    status = "projeto real" if projeto_real else "arquivo avulso (sem marcador)"
    print(f"📁 Raiz: {pasta_projeto} [{status}]")

    # ─── 1. README (lê sempre, independente de ser projeto ou avulso) ─────────
    for nome_readme in ["README.md", "readme.md", "README.txt", "readme.txt"]:
        caminho_readme = os.path.join(pasta_projeto, nome_readme)
        conteudo = ler_arquivo_seguro(caminho_readme, max_chars=1500)
        if conteudo:
            partes.append(f"=== README ===\n{conteudo}")
            print(f"✅ README lido ({len(conteudo)} chars)")
            break

    # ─── 2. Outros arquivos (SOMENTE se raiz real de projeto foi confirmada) ──
    # TRAVA DE SEGURANÇA: se não achou marcador, pula o glob completamente.
    # Evita varrer Downloads, Documents ou qualquer pasta genérica.
    if not projeto_real:
        print("⚠️  Sem marcador de projeto — glob desativado (arquivo avulso).")
        return "\n\n".join(partes)

    extensoes = {
        "java": "*.java", "kotlin": "*.kt", "python": "*.py",
        "javascript": "*.js", "typescript": "*.ts", "cpp": "*.cpp",
        "c": "*.c", "csharp": "*.cs", "go": "*.go",
    }
    padrao = extensoes.get(linguagem.lower(), f"*.{linguagem.lower()}")

    todos = glob.glob(os.path.join(pasta_projeto, "**", padrao), recursive=True)

    # Exclui o arquivo que o usuário está editando agora
    outros = [p for p in todos if os.path.basename(p) != arquivo_atual]

    # Ordena pelos menores primeiro (menos tokens, mais rápido)
    outros.sort(key=lambda p: os.path.getsize(p))

    lidos = 0
    for caminho in outros:
        if lidos >= 3:
            break
        conteudo = ler_arquivo_seguro(caminho, max_chars=1000)
        if conteudo:
            nome_rel = os.path.relpath(caminho, pasta_projeto)
            partes.append(f"=== {nome_rel} ===\n{conteudo}")
            lidos += 1

    if lidos:
        print(f"✅ {lidos} arquivo(s) extra(s) lido(s)")

    return "\n\n".join(partes)


@app.route('/completar', methods=['POST'])
def completar():
    data = request.json
    codigo_antes = data.get('prefix', '')
    codigo_depois = data.get('suffix', '')
    linguagem     = data.get('language', 'java')
    nome_arquivo  = data.get('filename', '')
    filepath      = data.get('filepath', '')

    print(f"\n--- {nome_arquivo or '?'} ({linguagem}) ---")

    # Coleta contexto dinamicamente a partir do caminho real do arquivo
    contexto_projeto = ""
    if filepath:
        contexto_projeto = coletar_contexto_do_projeto(filepath, nome_arquivo, linguagem)
    else:
        print("⚠️  filepath não recebido — sem contexto extra.")

    # ─── System Prompt ────────────────────────────────────────────────────────
    system_prompt = f"""You are an elite code completion AI specialized in {linguagem}.

Your ONLY job: output the exact code that belongs at the <CURSOR> position.

STRICT RULES:
1. Output ONLY raw code. No markdown, no backticks, no explanations.
2. NEVER repeat code that already exists before the cursor.
3. Complete the current logical thought and stop. Do not invent unrelated new code.
4. If inside an expression (string, method call), complete only that expression.
5. Use the exact variable names, class names, and patterns from the existing code.
6. Use the project context to understand the purpose and generate smarter completions.
7. Output nothing if no completion is needed."""

    # ─── User Prompt ──────────────────────────────────────────────────────────
    bloco_contexto = ""
    if contexto_projeto:
        bloco_contexto = f"""
--- PROJECT CONTEXT ---
{contexto_projeto}
--- END OF CONTEXT ---
"""

    user_prompt = f"""{bloco_contexto}
--- FILE: {nome_arquivo} ---
Code Before Cursor:
{codigo_antes[-2000:]}
<CURSOR>
Code After Cursor:
{codigo_depois[:800]}

Complete the <CURSOR>. Output ONLY the completion."""

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.05,
            max_tokens=150,
            stop=["\n\n\n", "```", "---"]
        )

        sugestao = completion.choices[0].message.content or ""

        for tag in ["```java","```kotlin","```python","```javascript","```typescript","```"]:
            sugestao = sugestao.replace(tag, "")
        sugestao = sugestao.strip()

        # Proteção anti-repetição
        if sugestao and codigo_antes.rstrip().endswith(sugestao):
            print("🔁 Repetição detectada — descartando.")
            return jsonify({"suggestion": ""})

        print(f"✅ Sugestão: {repr(sugestao[:80])}{'...' if len(sugestao) > 80 else ''}")
        return jsonify({"suggestion": sugestao})

    except Exception as e:
        print(f"❌ ERRO API: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/ping', methods=['GET'])
def ping():
    """Testa se o servidor está no ar: curl http://localhost:5000/ping"""
    return jsonify({"status": "ok", "version": "2.3"})


if __name__ == '__main__':
    print("🚀 Groq Copilot Server v2.3 iniciando...")
    app.run(host='0.0.0.0', port=5000, debug=False)
