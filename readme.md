# 🤖 Groq AI Copilot para Acode

Um plugin **não oficial** que adiciona **autocompletar com IA** ao Acode no Android, utilizando a **Groq Cloud (Llama 3)** com o **Termux** como ponte de comunicação.

> ⚠️ **Aviso**
>  
> Este **não é um plugin oficial do Acode**.  
> Ele foi criado do zero e deve ser **importado manualmente** no aplicativo.

---

## 🎥 Autocomplete em ação

![Autocomplete com IA no Acode](https://raw.githubusercontent.com/Dev-Benicio/Groq-Acode-Plugin/main/assets/autocomplete.gif)

---

## ✨ Funcionalidades
- Autocompletar inteligente com IA
- Atalho rápido: `Ctrl + Y`
- Suporte a múltiplas linguagens (Java, Python, JavaScript, etc.)
- Ultra rápido (Groq LPU)
- Uso de **API gratuita** da Groq Cloud
- Totalmente configurável via interface do plugin

---


![Autocomplete com IA no Acode](https://raw.githubusercontent.com/Dev-Benicio/Groq-Acode-Plugin/main/assets/autocomplete-import.gif)

---

## 🧩 Requisitos
- 📱 Android
- ✍️ **Acode Editor**
- 🖥️ **Termux**
- 🧠 Conta na **Groq Cloud** com API Key

---

## 🚀 Instalação Rápida

> 📄 Para o passo a passo completo, consulte o arquivo **[INSTALL.md](INSTALL.md)**

### Resumo
1. Configure o servidor no **Termux**
2. Execute `python groq_server.py`
3. Importe o plugin no **Acode**
4. Configure a URL (`http://127.0.0.1:5000`) e a linguagem

---

## ⌨️ Atalhos
- **Ctrl + Y** → Acionar Autocomplete com IA

---

## ❗ Problemas Comuns

### Autocomplete não funciona
- Verifique se o **servidor está rodando no Termux**
- Confirme a URL configurada (`http://127.0.0.1:5000`)
- Confira se a **API Key da Groq** está válida

---

## 📺 Canal do Criador
- 🎥 **YouTube**: [B3nicio Tutorial](https://youtube.com/@b3nio?si=g-w6pPmUz1j9bO1r)

---

## 📄 Licença
Este projeto é distribuído sob a licença **MIT**.