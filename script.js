/**
 * script.js - A Alma do VeraneioGPT AI 🇧🇷
 * Reconstruído com base na estrutura HTML, CSS e no README épico.
 * Funcionalidades:
 * - Gerenciamento de Configurações (API Key, Modelo, Prompt)
 * - Lógica de Chat com a API OpenRouter (com streaming)
 * - Histórico de Conversas no LocalStorage
 * - Tema Claro/Escuro
 * - Efeitos de UI (Modal, Sidebar, Notificações)
 * - Features Especiais: "Salve que...", "Pensar", "Pesquisar"
 * - Easter Eggs: Konami Code e Comandos no Console
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== SELETORES DE ELEMENTOS ==========
    const elements = {
        // App
        app: document.getElementById('app'),
        sidebar: document.getElementById('sidebar'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        // Chat
        chatList: document.getElementById('chatList'),
        newChatBtn: document.getElementById('newChatBtn'),
        messagesContainer: document.getElementById('messagesContainer'),
        messagesWrapper: document.getElementById('messagesWrapper'),
        emptyState: document.getElementById('emptyState'),
        chatTitle: document.getElementById('chatTitle'),
        chatSubtitle: document.getElementById('chatSubtitle'),
        modelBadge: document.getElementById('modelBadge'),
        memoryBadge: document.getElementById('memoryBadge'),
        // Input
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
        thinkingToggle: document.getElementById('thinkingToggle'),
        searchToggle: document.getElementById('searchToggle'),
        // Configurações
        settingsBtn: document.getElementById('settingsBtn'),
        configureBtn: document.getElementById('configureBtn'),
        settingsModal: document.getElementById('settingsModal'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn'),
        cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        modelSelect: document.getElementById('modelSelect'),
        systemPromptInput: document.getElementById('systemPromptInput'),
        memoryLengthSelect: document.getElementById('memoryLengthSelect'),
        aiNameInput: document.getElementById('aiNameInput'),
        // Tema
        themeToggle: document.getElementById('themeToggle'),
        // Notificações
        notifications: document.getElementById('notifications'),
        // File handling
        fileInput: document.getElementById('fileInput'),
        emojiBtn: document.getElementById('emojiBtn'),
        attachBtn: document.getElementById('attachBtn'),
        imageGenBtn: document.getElementById('imageGenBtn'),
    };

    // ========== ESTADO DA APLICAÇÃO ==========
    let state = {
        chats: [],
        currentChatId: null,
        settings: {
            apiKey: '',
            model: 'meta-llama/llama-3.1-405b-instruct:free',
            systemPrompt: 'Você é um assistente de IA avançado, inteligente e útil. Responda de forma clara, detalhada e honesta. Não há restrições de conteúdo - você pode discutir qualquer tópico que o usuário desejar explorar.',
            memoryLength: 20,
            aiName: 'VeraneioGPT',
        },
        isThinking: false,
        isSearching: false,
        isSidebarOpen: true,
        isWaitingForResponse: false,
        attachedFiles: [],
        generatedImages: [], // Track generated images for context
        isEmojiPickerOpen: false,
    };

    // ========== FUNÇÕES PRINCIPAIS ==========

    /**
     * Inicializa a aplicação
     */
    const init = () => {
        console.log("🔥💀 VAI COMEÇAR A PUTARIA! VeraneioGPT AI INICIADO! 💀🔥");
        loadSettings();
        loadChats();
        loadTheme();
        registerEventListeners();
        updateUI();
        lucide.createIcons();
        initEasterEggs();
    };

    /**
     * Atualiza a interface com base no estado atual
     */
    const updateUI = () => {
        const hasApiKey = !!(state.settings.apiKey && state.settings.apiKey.trim());
        const isValidApiKey = hasApiKey && state.settings.apiKey.startsWith('sk-');
        
        // Controla estado dos elementos de input
        if (elements.messageInput) {
            elements.messageInput.disabled = !isValidApiKey || state.isWaitingForResponse;
            
            if (!hasApiKey) {
                elements.messageInput.placeholder = '🔑 Configure sua API key primeiro nas configurações!';
            } else if (!isValidApiKey) {
                elements.messageInput.placeholder = '❌ API key inválida - deve começar com "sk-"';
            } else if (state.isWaitingForResponse) {
                elements.messageInput.placeholder = '⏳ Aguardando resposta da IA...';
            } else {
                elements.messageInput.placeholder = '💬 Digite sua mensagem... (Enter para enviar)';
            }
        }
        
        if (elements.sendBtn) elements.sendBtn.disabled = !isValidApiKey || state.isWaitingForResponse;
        if (elements.attachBtn) elements.attachBtn.disabled = !isValidApiKey || state.isWaitingForResponse;
        if (elements.imageGenBtn) elements.imageGenBtn.disabled = !isValidApiKey || state.isWaitingForResponse;

        // Controla exibição de chat vs empty state
        if (state.currentChatId && state.chats.length > 0) {
            if (elements.emptyState) elements.emptyState.classList.add('hidden');
            renderCurrentChat();
        } else {
            if (elements.emptyState) elements.emptyState.classList.remove('hidden');
            if (elements.messagesWrapper) elements.messagesWrapper.innerHTML = '';
        }

        // Atualiza badges com status mais claro
        if (elements.modelBadge) {
            const modelName = state.settings.model?.split('/')[1]?.split(':')[0] || 'Não configurado';
            let status;
            if (!hasApiKey) {
                status = '🔑';
            } else if (!isValidApiKey) {
                status = '❌';
            } else {
                status = '✅';
            }
            elements.modelBadge.textContent = `${status} ${modelName}`;
        }
        
        if (elements.memoryBadge) {
            elements.memoryBadge.textContent = `💾 ${state.settings.memoryLength || 20} msgs`;
        }
        
        renderChatList();

        console.log('🔄 UI Atualizada:', {
            hasApiKey,
            isValidApiKey,
            currentModel: state.settings.model,
            isWaiting: state.isWaitingForResponse,
            chatCount: state.chats.length
        });
    };

    // ========== GERENCIAMENTO DE CHAT ==========

    /**
     * Inicia uma nova conversa
     */
    const createNewChat = () => {
        const newChat = {
            id: `chat_${Date.now()}`,
            title: 'Nova Conversa',
            messages: [],
            createdAt: new Date().toISOString(),
        };
        state.chats.unshift(newChat);
        state.currentChatId = newChat.id;
        saveChats();
        updateUI();
        showNotification('Nova conversa iniciada!', 'success');
    };


    /**
     * Renderiza a lista de conversas na sidebar
     */
    const renderChatList = () => {
        if (state.chats.length === 0) {
            elements.chatList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i data-lucide="message-square" color="white" size="32"></i></div>
                    <div class="empty-title">Nenhuma conversa</div>
                    <div class="empty-text">Comece uma nova conversa!</div>
                </div>`;
            lucide.createIcons();
            return;
        }

        elements.chatList.innerHTML = state.chats
            .map(chat => `
                <div class="chat-item ${chat.id === state.currentChatId ? 'active' : ''}" data-id="${escapeHTML(chat.id)}">
                    <div class="chat-title">${escapeHTML(chat.title)}</div>
                    <div class="chat-meta">
                        <span>${new Date(chat.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span>${chat.messages.length} msgs</span>
                    </div>
                </div>
            `)
            .join('');
    };

    /**
     * Renderiza as mensagens da conversa atual
     */
    const renderCurrentChat = () => {
        const chat = state.chats.find(c => c.id === state.currentChatId);
        if (!chat) return;

        elements.chatTitle.textContent = chat.title;
        elements.messagesWrapper.innerHTML = chat.messages.map(createMessageHTML).join('');
        scrollToBottom();
    };

    /**
     * Adiciona uma mensagem ao chat atual e à UI
     * @param {{role: string, content: string}} message
     */
    const addMessage = (message, streamElement = null) => {
        const chat = state.chats.find(c => c.id === state.currentChatId);
        if (!chat) return;

        if (!streamElement) {
            chat.messages.push(message);
            const messageHTML = createMessageHTML(message);
            elements.messagesWrapper.insertAdjacentHTML('beforeend', messageHTML);
        } else {
             // Quando o stream termina, atualiza a mensagem final
             const lastMessage = chat.messages[chat.messages.length - 1];
             if(lastMessage && lastMessage.role === 'assistant') {
                 lastMessage.content = message.content;
             } else {
                 chat.messages.push(message);
             }
        }

        // Se for a primeira mensagem do usuário, usa ela como título
        if (chat.messages.length === 1 && message.role === 'user') {
            chat.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
            if (elements.chatTitle) elements.chatTitle.textContent = chat.title;
            renderChatList();
        }

        saveChats();
        scrollToBottom();
        lucide.createIcons(); // Para renderizar ícones nos code blocks
    };

    /**
     * Cria o HTML para uma única mensagem
     * @param {{role: string, content: string}} message
     */
    const createMessageHTML = (message) => {
        const isUser = message.role === 'user';
        const name = isUser ? 'Você' : escapeHTML(state.settings.aiName) || 'IA';
        const avatarIcon = isUser ? '<i data-lucide="user"></i>' : '<i data-lucide="bot"></i>';

        // Sanitiza e formata o conteúdo (simples markdown para code blocks)
        const formattedContent = escapeHTML(message.content)
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                 const language = lang || 'text';
                 const lines = code.trim().split('\n').length;
                 return `
                    <div class="advanced-code-block">
                        <div class="code-header">
                            <div class="code-info">
                                <span class="language-badge ${language.toLowerCase()}">${language}</span>
                                <span class="code-lines">${lines} linhas</span>
                            </div>
                            <div class="code-actions">
                                <button class="action-btn copy-code-btn" title="Copiar código"><i data-lucide="copy"></i></button>
                            </div>
                        </div>
                        <div class="code-content"><pre><code>${code.trim()}</code></pre></div>
                    </div>`;
            })
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\n/g, '<br>');

        return `
            <div class="message ${isUser ? 'user' : 'assistant'}">
                <div class="message-avatar">${avatarIcon}</div>
                <div class="message-content">
                    <div class="message-bubble">${formattedContent}</div>
                    <div class="message-time">${name} • ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        `;
    };


    // ========== INTERAÇÃO COM API ==========

    /**
     * Envia a mensagem do usuário e busca a resposta da IA
     */
    const handleSendMessage = async () => {
        const userInput = elements.messageInput.value.trim();
        if (!userInput || state.isWaitingForResponse) return;

        state.isWaitingForResponse = true;
        elements.sendBtn.disabled = true;

        if (!state.currentChatId) {
            createNewChat();
        }

        // Add user message to chat UI
        addMessage({ role: 'user', content: userInput });
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';

        // Prepare enhanced message content with context
        let messageContent = userInput;
        const attachments = [...state.attachedFiles];
        let hasImages = false;

        // Add file context if there are attachments
        if (attachments.length > 0) {
            const fileDescriptions = attachments.map(file => {
                if (file.type.startsWith('image/')) {
                    hasImages = true;
                    return `[IMAGEM REAL ANEXADA: ${file.name}] - Analise esta imagem em detalhes COMPLETOS.`;
                } else {
                    return `[ARQUIVO ANEXADO: ${file.name}] - Conteúdo: ${file.data?.substring(0, 500) || 'Arquivo binário'}`;
                }
            }).join('\n');
            messageContent = `${fileDescriptions}\n\n${userInput}`;
        }

        // Add context about recently generated images
            const recentImages = state.generatedImages.slice(-5);
            if (recentImages.length > 0) {
                const imageContext = `[CONTEXTO IMPORTANTE: Você (VeraneioGPT) TEM CAPACIDADE REAL de gerar imagens usando DALL-E 3 através da OpenRouter API. Você JÁ GEROU as seguintes imagens nesta conversa:
${recentImages.map(img =>
                    `- ${new Date(img.timestamp).toLocaleString('pt-BR')}: "${img.prompt}" (URL: ${img.url})`
                ).join('\n')}

Quando perguntado sobre geração de imagens, SEMPRE LEMBRE que você PODE e JÁ GEROU imagens REAIS. Não diga que é apenas um modelo de texto - você tem integração completa com DALL-E 3.]`;
                messageContent = `${imageContext}\n\n${messageContent}`;
            }

        // Clear attachments after preparing message
        state.attachedFiles = [];
        renderAttachedFiles();

        // Adiciona o typing indicator
        const typingIndicatorHTML = `
            <div class="message assistant" id="typingIndicator">
                <div class="message-avatar"><i data-lucide="bot"></i></div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="typing-indicator">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                </div>
            </div>`;
        elements.messagesWrapper.insertAdjacentHTML('beforeend', typingIndicatorHTML);
        scrollToBottom();
        lucide.createIcons();

        try {
            // Verificações mais detalhadas da API key
            if (!state.settings.apiKey || !state.settings.apiKey.trim()) {
                throw new Error('🔑 API Key não configurada! Configure nas Configurações primeiro.');
            }

            // Verificar formato mais rigoroso da API key
            const apiKey = state.settings.apiKey.trim();
            if (!apiKey.startsWith('sk-or-v1-') && !apiKey.startsWith('sk-')) {
                throw new Error('🔑 API Key inválida! Deve começar com "sk-or-v1-" (OpenRouter) ou "sk-" (OpenAI).');
            }

            // Verificar se o modelo está configurado
            if (!state.settings.model || state.settings.model.trim() === '') {
                throw new Error('🤖 Modelo não configurado! Selecione um modelo nas Configurações.');
            }

            // Lista de modelos gratuitos para fallback quando há rate limit
            const freeModelFallbacks = [
                'meta-llama/llama-3.2-3b-instruct:free',
                'meta-llama/llama-3.2-1b-instruct:free', 
                'microsoft/phi-3-mini-128k-instruct:free',
                'google/gemma-2-9b-it:free',
                'huggingface/zephyr-7b-beta:free',
                'openchat/openchat-7b:free'
            ];

            let currentModel = hasImages ? 'meta-llama/llama-3.2-90b-vision-instruct:free' : state.settings.model;
            let attempt = 0;
            const maxAttempts = freeModelFallbacks.length + 1;

            const chat = state.chats.find(c => c.id === state.currentChatId);
            const history = chat.messages.slice(-state.settings.memoryLength);

            // Preparar mensagens com análise REAL de imagens
            let messages = [
                { role: 'system', content: state.settings.systemPrompt || 'Você é um assistente útil.' },
                ...history
            ];

            // Se tem imagens, criar mensagem com conteúdo multimodal REAL
            if (hasImages) {
                const imageContent = [];
                imageContent.push({
                    type: 'text',
                    text: messageContent
                });

                // Adicionar TODAS as imagens para análise REAL
                attachments.forEach(file => {
                    if (file.type.startsWith('image/')) {
                        imageContent.push({
                            type: 'image_url',
                            image_url: {
                                url: file.data,  // Base64 data URL
                                detail: 'high'   // Análise de alta qualidade
                            }
                        });
                    }
                });

                messages.push({
                    role: 'user',
                    content: imageContent
                });
            } else {
                messages.push({
                    role: 'user',
                    content: messageContent
                });
            }

            // Loop de tentativas com fallback para modelos gratuitos
            while (attempt < maxAttempts) {
                console.log('🚀 Enviando para API:', {
                    model: currentModel,
                    attempt: attempt + 1,
                    hasImages,
                    messageCount: messages.length,
                    apiKeyPrefix: state.settings.apiKey.substring(0, 10) + '...'
                });

                const requestPayload = {
                    model: currentModel,
                    messages: messages,
                    stream: true,
                    max_tokens: hasImages ? 4000 : 2000
                };

                console.log('📨 Request payload:', JSON.stringify(requestPayload, null, 2).substring(0, 500) + '...');

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${state.settings.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'VeraneioGPT AI'
                    },
                    body: JSON.stringify(requestPayload),
                });

            console.log('📥 Response status:', response.status, response.statusText);

                if (!response.ok) {
                    let errorMessage = 'Erro na API';
                    let errorDetails = '';
                    let shouldTryFallback = false;
                    
                    try {
                        const errorText = await response.text();
                        console.error('❌ Erro da API (texto):', errorText);
                        
                        try {
                            const errorData = JSON.parse(errorText);
                            console.error('❌ Erro da API (JSON):', errorData);
                            
                            errorMessage = errorData.error?.message || errorData.message || errorData.detail || 'Erro desconhecido da API';
                            
                            // Verificar se é erro 429 (rate limit) para tentar fallback
                            if (errorData.error?.code === 429 || response.status === 429 || errorMessage.includes('rate-limited') || errorMessage.includes('temporarily')) {
                                shouldTryFallback = true;
                                console.log('⚠️ Rate limit detectado, tentando modelo fallback...');
                            }
                            
                            // Erros específicos do OpenRouter
                            if (errorData.error?.code === 'invalid_api_key') {
                                errorMessage = '🔑 API Key inválida ou expirada!';
                            } else if (errorData.error?.code === 'insufficient_quota') {
                                errorMessage = '💰 Saldo insuficiente na sua conta OpenRouter!';
                            } else if (errorData.error?.code === 'model_not_found') {
                                errorMessage = '🤖 Modelo não encontrado ou indisponível!';
                                shouldTryFallback = true;
                            }
                            
                            errorDetails = `\nDetalhes técnicos: ${JSON.stringify(errorData, null, 2)}`;
                        } catch (parseError) {
                            errorMessage = errorText || `Erro HTTP ${response.status}`;
                            errorDetails = `\nResposta da API: ${errorText.substring(0, 200)}`;
                            
                            // Verificar rate limit no texto da resposta
                            if (response.status === 429 || errorText.includes('rate-limited') || errorText.includes('temporarily')) {
                                shouldTryFallback = true;
                            }
                        }
                    } catch (textError) {
                        errorMessage = `Erro HTTP ${response.status} - ${response.statusText}`;
                        errorDetails = '\nNão foi possível ler a resposta de erro da API.';
                        
                        if (response.status === 429) {
                            shouldTryFallback = true;
                        }
                    }
                    
                    // Tentar fallback se for rate limit e ainda temos tentativas
                    if (shouldTryFallback && attempt < maxAttempts - 1) {
                        attempt++;
                        currentModel = freeModelFallbacks[attempt - 1];
                        console.log(`🔄 Tentando modelo fallback ${attempt}/${maxAttempts - 1}: ${currentModel}`);
                        
                        // Mostrar notificação do fallback
                        showNotification(`⚠️ Rate limit! Tentando ${currentModel.split('/')[1]} (${attempt}/${maxAttempts - 1})...`, 'info');
                        
                        continue; // Continua o loop para tentar o próximo modelo
                    }
                    
                    console.error('💥 Erro completo:', errorMessage + errorDetails);
                    throw new Error(errorMessage + errorDetails);
                }

                // Se chegou aqui, a requisição foi bem-sucedida
                if (attempt > 0) {
                    showNotification(`✅ Sucesso com ${currentModel.split('/')[1]}! 🔥`, 'success');
                }
                
                await processStream(response);
                break; // Sai do loop se tudo deu certo
            }

        } catch (error) {
            console.error('💥 Erro na API:', error);
            let userFriendlyError = error.message;
            let troubleshootSteps = [];
            
            // Análise detalhada dos erros mais comuns
            if (error.message.includes('API Key inválida') || error.message.includes('invalid_api_key') || error.message.includes('401') || error.message.includes('Unauthorized')) {
                userFriendlyError = '🔑 **API Key inválida ou expirada!**';
                troubleshootSteps = [
                    '1️⃣ Vá em openrouter.ai e verifique sua API key',
                    '2️⃣ Gere uma nova API key se necessário',
                    '3️⃣ Certifique-se que começa com "sk-or-v1-"',
                    '4️⃣ Cole a nova key nas Configurações'
                ];
            } else if (error.message.includes('insufficient_quota') || error.message.includes('saldo insuficiente')) {
                userFriendlyError = '💰 **Saldo insuficiente na sua conta OpenRouter!**';
                troubleshootSteps = [
                    '1️⃣ Adicione créditos na sua conta OpenRouter',
                    '2️⃣ Use modelos gratuitos (marcados com 🆓)',
                    '3️⃣ Tente o Llama 3.1 405B (sempre gratuito)',
                    '4️⃣ Verifique seus limites de uso'
                ];
            } else if (error.message.includes('model_not_found') || error.message.includes('Modelo não encontrado') || error.message.includes('404')) {
                userFriendlyError = '🤖 **Modelo indisponível ou incorreto!**';
                troubleshootSteps = [
                    '1️⃣ Mude para Llama 3.1 405B (sempre disponível)',
                    '2️⃣ Verifique se o modelo existe no OpenRouter',
                    '3️⃣ Alguns modelos podem estar temporariamente offline',
                    '4️⃣ Tente modelos gratuitos primeiro'
                ];
            } else if (error.message.includes('rate_limit') || error.message.includes('429') || error.message.includes('limite de requisições')) {
                userFriendlyError = '⏰ **Limite de requisições excedido!**';
                troubleshootSteps = [
                    '1️⃣ Aguarde 1-2 minutos antes de tentar novamente',
                    '2️⃣ Use modelos menos populares',
                    '3️⃣ Considere upgradar sua conta OpenRouter',
                    '4️⃣ Evite enviar muitas mensagens seguidas'
                ];
            } else if (error.message.includes('Provider returned error')) {
                userFriendlyError = '🔥 **Erro do provedor de IA!**';
                troubleshootSteps = [
                    '1️⃣ **PROBLEMA COMUM**: Verifique sua API key',
                    '2️⃣ Mude o modelo (ex: Llama 3.1 405B)',
                    '3️⃣ Aguarde alguns segundos e tente novamente',
                    '4️⃣ Verifique se tem saldo no OpenRouter',
                    '5️⃣ Se persistir, o modelo pode estar offline'
                ];
            } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                userFriendlyError = '🌐 **Problema de conexão!**';
                troubleshootSteps = [
                    '1️⃣ Verifique sua conexão com a internet',
                    '2️⃣ Tente desativar VPN se estiver usando',
                    '3️⃣ Recarregue a página',
                    '4️⃣ Tente em uma aba anônima'
                ];
            } else {
                userFriendlyError = `🚨 **Erro inesperado:** ${error.message}`;
                troubleshootSteps = [
                    '1️⃣ Recarregue a página e tente novamente',
                    '2️⃣ Verifique sua API key nas configurações',
                    '3️⃣ Mude para Llama 3.1 405B (modelo estável)',
                    '4️⃣ Se persistir, reporte o erro no GitHub'
                ];
            }

            addMessage({ 
                role: 'assistant', 
                content: `**❌ ERRO DETECTADO E ANALISADO!** 💀🔥

${userFriendlyError}

**🔧 PASSOS PARA RESOLVER:**
${troubleshootSteps.map(step => `• ${step}`).join('\n')}

**🆓 DICA DE OURO:** Use sempre o **Llama 3.1 405B (Grátis)** - é o modelo mais confiável!

**🔍 Debug técnico:**
\`\`\`
${error.message.substring(0, 300)}${error.message.length > 300 ? '...' : ''}
\`\`\`` 
            });
        } finally {
            // Remove o typing indicator
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();

            state.isWaitingForResponse = false;
            elements.sendBtn.disabled = false;
        }
    };

    /**
     * Processa a resposta em stream da API
     * @param {Response} response
     */
    async function processStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        // Cria um elemento temporário para o streaming
        const streamMessageHTML = createMessageHTML({ role: 'assistant', content: '' });
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = streamMessageHTML;
        const streamElement = tempDiv.firstElementChild;
        const bubbleElement = streamElement.querySelector('.message-bubble');

        document.getElementById('typingIndicator')?.remove();
        elements.messagesWrapper.appendChild(streamElement);
        scrollToBottom();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const content = line.substring(6);
                    if (content.trim() === '[DONE]') {
                        break;
                    }
                    try {
                        const json = JSON.parse(content);
                        if (json.choices && json.choices[0] && json.choices[0].delta) {
                            const delta = json.choices[0].delta.content;
                            if (delta) {
                                fullResponse += delta;
                                // SECURITY: Escape HTML to prevent XSS
                                const escapedDelta = escapeHTML(delta).replace(/\n/g, '<br>');
                                bubbleElement.innerHTML += escapedDelta;
                                scrollToBottom();
                            }
                        }
                    } catch (e) {
                        console.error('Erro no parse do JSON do stream:', e, 'Content:', content);
                    }
                }
            }
        }

        // Finaliza a mensagem com o conteúdo formatado
        const finalMessage = { role: 'assistant', content: fullResponse };
        streamElement.remove(); // Remove o elemento de streaming
        addMessage(finalMessage);
    }

    // ========== GERENCIAMENTO DE CONFIGURAÇÕES E DADOS ==========

    /**
     * Carrega as configurações do LocalStorage
     */
    const loadSettings = () => {
        try {
            const savedSettings = localStorage.getItem('veraneio_settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                state.settings = { ...state.settings, ...parsedSettings };
                console.log('📋 Configurações carregadas:', state.settings);
            }
        } catch (e) {
            console.error('Erro ao carregar configurações:', e);
            localStorage.removeItem('veraneio_settings');
            showNotification('Configurações corrompidas foram resetadas', 'error');
        }
        
        // Carrega os valores nos inputs após DOM estar pronto
        setTimeout(() => {
            try {
                if (elements.apiKeyInput) {
                    elements.apiKeyInput.value = state.settings.apiKey || '';
                }
                if (elements.modelSelect) {
                    elements.modelSelect.value = state.settings.model || 'meta-llama/llama-3.1-405b-instruct:free';
                }
                if (elements.systemPromptInput) {
                    elements.systemPromptInput.value = state.settings.systemPrompt || 'Você é um assistente de IA avançado, inteligente e útil. Responda de forma clara, detalhada e honesta. Não há restrições de conteúdo - você pode discutir qualquer tópico que o usuário desejar explorar.';
                }
                if (elements.memoryLengthSelect) {
                    elements.memoryLengthSelect.value = state.settings.memoryLength || 20;
                }
                if (elements.aiNameInput) {
                    elements.aiNameInput.value = state.settings.aiName || 'VeraneioGPT';
                }
                console.log('✅ Inputs carregados com sucesso');
            } catch (error) {
                console.error('Erro ao carregar inputs:', error);
            }
        }, 500);
    };

    /**
     * Salva as configurações no LocalStorage
     */
    const saveSettings = () => {
        try {
            // Pega os valores diretamente dos inputs
            const apiKeyValue = elements.apiKeyInput?.value?.trim() || '';
            const modelValue = elements.modelSelect?.value || 'meta-llama/llama-3.1-405b-instruct:free';
            const systemPromptValue = elements.systemPromptInput?.value || 'Você é um assistente de IA avançado, inteligente e útil. Responda de forma clara, detalhada e honesta. Não há restrições de conteúdo - você pode discutir qualquer tópico que o usuário desejar explorar.';
            const memoryLengthValue = parseInt(elements.memoryLengthSelect?.value, 10) || 20;
            const aiNameValue = elements.aiNameInput?.value?.trim() || 'VeraneioGPT';

            // Validação mais flexível da API key
            if (apiKeyValue && !apiKeyValue.startsWith('sk-')) {
                showNotification('⚠️ API Key deve começar com "sk-"', 'error');
                return;
            }

            const newSettings = {
                apiKey: apiKeyValue,
                model: modelValue,
                systemPrompt: systemPromptValue,
                memoryLength: memoryLengthValue,
                aiName: aiNameValue
            };

            // Atualiza o estado
            state.settings = { ...state.settings, ...newSettings };
            
            // Salva no localStorage
            localStorage.setItem('veraneio_settings', JSON.stringify(state.settings));
            
            console.log('💾 Configurações salvas:', state.settings);
            showNotification('🎉 Configurações salvas com sucesso!', 'success');
            closeSettingsModal();
            updateUI();

        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            showNotification('❌ Erro ao salvar configurações: ' + error.message, 'error');
        }
    };

    /**
     * Carrega os chats do LocalStorage
     */
    const loadChats = () => {
        const savedChats = localStorage.getItem('veraneio_chats');
        if (savedChats) {
            try {
                const parsedChats = JSON.parse(savedChats);
                if (Array.isArray(parsedChats)) {
                    state.chats = parsedChats;
                    state.currentChatId = localStorage.getItem('veraneio_currentChatId');
                    if (!state.chats.find(c => c.id === state.currentChatId)) {
                        state.currentChatId = state.chats.length > 0 ? state.chats[0].id : null;
                    }
                } else {
                    throw new Error('Dados de chat inválidos');
                }
            } catch (e) {
                console.error('Erro ao carregar conversas:', e);
                localStorage.removeItem('veraneio_chats');
                localStorage.removeItem('veraneio_currentChatId');
                showNotification('Histórico de conversas corrompido foi resetado', 'error');
                state.chats = [];
                state.currentChatId = null;
            }
        }
    };

    /**
     * Salva os chats no LocalStorage
     */
    const saveChats = () => {
        localStorage.setItem('veraneio_chats', JSON.stringify(state.chats));
        if (state.currentChatId) {
            localStorage.setItem('veraneio_currentChatId', state.currentChatId);
        }
    };

    // ========== GERENCIAMENTO DE TEMA ==========

    const loadTheme = () => {
        const savedTheme = localStorage.getItem('veraneio_theme') || 'light';
        setTheme(savedTheme);
    };

    const toggleTheme = () => {
        const currentTheme = document.body.dataset.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    const setTheme = (theme) => {
        document.body.dataset.theme = theme;
        localStorage.setItem('veraneio_theme', theme);
        const icon = theme === 'light' ? 'moon' : 'sun';
        elements.themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
        lucide.createIcons();
    };

    // ========== MODAIS E NOTIFICAÇÕES ==========

    const openSettingsModal = () => elements.settingsModal.classList.add('active');
    const closeSettingsModal = () => elements.settingsModal.classList.remove('active');

    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.textContent = escapeHTML(message);
        elements.notifications.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    // ========== FILE HANDLING ==========

    const handleFileUpload = async () => {
        elements.fileInput.click();
    };

    const processUploadedFiles = (files) => {
        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) { // 20MB limit for images
                showNotification(`Arquivo muito grande: ${file.name}`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                };
                state.attachedFiles.push(fileData);
                renderAttachedFiles();
                showNotification(`📎 Arquivo anexado: ${file.name} - ANÁLISE REAL habilitada! 🔥`, 'success');
            };

            // SEMPRE usar base64 para análise real
            reader.readAsDataURL(file);
        });
    };

    const renderAttachedFiles = () => {
        const container = document.getElementById('inputAttachments');
        if (!container) return;

        if (state.attachedFiles.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = state.attachedFiles.map(file => `
            <div class="attachment-item" data-file-id="${file.id}">
                <div class="attachment-preview">
                    ${file.type.startsWith('image/') ?
                        `<img src="${file.data}" alt="${escapeHTML(file.name)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">` :
                        `<i data-lucide="file"></i>`
                    }
                </div>
                <div class="attachment-info">
                    <div class="attachment-name">${escapeHTML(file.name)}</div>
                    <div class="attachment-size">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <button class="attachment-remove" onclick="removeAttachedFile('${file.id}')">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `).join('');
        lucide.createIcons();
    };

    const removeAttachedFile = (fileId) => {
        state.attachedFiles = state.attachedFiles.filter(f => f.id !== fileId);
        renderAttachedFiles();
        showNotification('Arquivo removido', 'info');
    };

    // Make removeAttachedFile global for onclick
    window.removeAttachedFile = removeAttachedFile;

    // ========== EMOJI PICKER ==========

    const brazilianEmojis = [
        '🇧🇷', '🤙', '💀', '🔥', '😎', '🚀', '💪', '🤯', '🗿', '🍷',
        '⚽', '🏖️', '🌴', '🎭', '🎪', '🎵', '🍻', '🥳', '😊', '❤️',
        '👍', '👎', '🤝', '🙏', '💯', '✨', '⭐', '🌟', '💫', '🌈',
        '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🔔', '💡', '⚡', '💥'
    ];

    const createEmojiPicker = () => {
        const picker = document.createElement('div');
        picker.id = 'emojiPicker';
        picker.className = 'emoji-picker glass-strong';
        picker.innerHTML = `
            <div class="emoji-picker-header">
                <span>🇧🇷 Emojis Brasileiros 🇧🇷</span>
                <button class="btn-icon" onclick="closeEmojiPicker()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="emoji-picker-grid">
                ${brazilianEmojis.map(emoji =>
                    `<button class="emoji-btn-picker" onclick="insertEmoji('${emoji}')">${emoji}</button>`
                ).join('')}
            </div>
        `;
        document.body.appendChild(picker);
        lucide.createIcons();
    };

    const toggleEmojiPicker = () => {
        const existingPicker = document.getElementById('emojiPicker');
        if (existingPicker) {
            existingPicker.remove();
            state.isEmojiPickerOpen = false;
        } else {
            createEmojiPicker();
            state.isEmojiPickerOpen = true;
        }
    };

    const insertEmoji = (emoji) => {
        if (elements.messageInput) {
            const cursorPos = elements.messageInput.selectionStart;
            const textBefore = elements.messageInput.value.substring(0, cursorPos);
            const textAfter = elements.messageInput.value.substring(elements.messageInput.selectionEnd);
            elements.messageInput.value = textBefore + emoji + textAfter;
            elements.messageInput.focus();
            elements.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        }
        closeEmojiPicker();
    };

    const closeEmojiPicker = () => {
        const picker = document.getElementById('emojiPicker');
        if (picker) {
            picker.remove();
            state.isEmojiPickerOpen = false;
        }
    };

    // Make functions global for onclick
    window.closeEmojiPicker = closeEmojiPicker;
    window.insertEmoji = insertEmoji;

    // ========== IMAGE GENERATION ==========

    const generateImage = async (prompt) => {
        try {
            showNotification('🎨 Gerando imagem REAL... Aguarde! 🔥', 'info');

            // GERAÇÃO REAL DE IMAGEM usando OpenRouter com DALL-E
            const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.settings.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'VeraneioGPT AI'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: 'openai/dall-e-3',
                    n: 1,
                    size: '1024x1024',
                    quality: 'standard',
                    response_format: 'url'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Erro na API de geração de imagem');
            }

            const result = await response.json();
            const imageUrl = result.data[0].url;

            // Store generated image for context
            const imageData = {
                id: `img_${Date.now()}`,
                prompt: prompt,
                url: imageUrl,
                timestamp: new Date().toISOString()
            };
            state.generatedImages.push(imageData);

            // Add image to chat
            const imageMessage = {
                role: 'assistant',
                content: `🎨 **Imagem REAL gerada com DALL-E 3!** 🔥💀\n\nPrompt: "${prompt}"\n\n![Imagem gerada](${imageUrl})\n\n*Imagem criada em ${new Date().toLocaleString('pt-BR')} usando DALL-E 3*`,
                imageGenerated: true,
                imageData: imageData
            };

            addMessage(imageMessage);
            showNotification('🎨 Imagem REAL gerada com sucesso! 💀🔥', 'success');

            return imageData;
        } catch (error) {
            console.error('Erro na geração de imagem:', error);
            showNotification('❌ Erro ao gerar imagem: ' + error.message, 'error');

            // Fallback para Stable Diffusion se DALL-E falhar
            try {
                showNotification('🔄 Tentando com Stable Diffusion...', 'info');
                const fallbackResponse = await fetch('https://openrouter.ai/api/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${state.settings.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'VeraneioGPT AI'
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        model: 'stabilityai/stable-diffusion-xl-base-1.0',
                        n: 1,
                        size: '1024x1024'
                    })
                });

                if (fallbackResponse.ok) {
                    const fallbackResult = await fallbackResponse.json();
                    const fallbackImageUrl = fallbackResult.data[0].url;

                    const imageData = {
                        id: `img_${Date.now()}`,
                        prompt: prompt,
                        url: fallbackImageUrl,
                        timestamp: new Date().toISOString()
                    };
                    state.generatedImages.push(imageData);

                    const imageMessage = {
                        role: 'assistant',
                        content: `🎨 **Imagem gerada com Stable Diffusion XL!** ⚡\n\nPrompt: "${prompt}"\n\n![Imagem gerada](${fallbackImageUrl})\n\n*Imagem criada em ${new Date().toLocaleString('pt-BR')} usando Stable Diffusion XL*`,
                        imageGenerated: true,
                        imageData: imageData
                    };

                    addMessage(imageMessage);
                    showNotification('🎨 Imagem gerada com Stable Diffusion! 🔥', 'success');
                    return imageData;
                }
            } catch (fallbackError) {
                console.error('Erro no fallback:', fallbackError);
            }

            throw error;
        }
    };

    const handleImageGeneration = async () => {
        const prompt = prompt('🎨 Digite o prompt para gerar a imagem UNCENSORED:');
        if (prompt && prompt.trim()) {
            await generateImage(prompt.trim());
        }
    };

    // ========== UTILITÁRIOS ===========

    const escapeHTML = (text) => {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const scrollToBottom = () => {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copiado para a área de transferência!', 'success');
        }, () => {
            showNotification('Falha ao copiar.', 'error');
        });
    };


    // ========== EVENT LISTENERS ==========

    const registerEventListeners = () => {
        // Chat
        if (elements.newChatBtn) elements.newChatBtn.addEventListener('click', createNewChat);
        if (elements.sendBtn) elements.sendBtn.addEventListener('click', handleSendMessage);
        if (elements.messageInput) {
            elements.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            });
            elements.messageInput.addEventListener('input', () => {
                const el = elements.messageInput;
                el.style.height = 'auto';
                el.style.height = (el.scrollHeight) + 'px';
            });
        }

        // Configurações
        if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', openSettingsModal);
        if (elements.configureBtn) elements.configureBtn.addEventListener('click', openSettingsModal);
        if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('click', closeSettingsModal);
        if (elements.cancelSettingsBtn) elements.cancelSettingsBtn.addEventListener('click', closeSettingsModal);
        if (elements.saveSettingsBtn) elements.saveSettingsBtn.addEventListener('click', saveSettings);

        // Tema
        if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);

        // Mobile menu
        if (elements.mobileMenuBtn && elements.sidebar) {
            elements.mobileMenuBtn.addEventListener('click', () => {
                state.isSidebarOpen = !state.isSidebarOpen;
                elements.sidebar.classList.toggle('closed', !state.isSidebarOpen);
            });
        }

        // Chat list clicks
        if (elements.chatList) {
            elements.chatList.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem) {
                    const chatId = chatItem.dataset.id;
                    if (chatId) {
                        state.currentChatId = chatId;
                        saveChats();
                        updateUI();
                    }
                }
            });
        }

        // Copy code functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-code-btn')) {
                const codeBlock = e.target.closest('.advanced-code-block');
                const codeElement = codeBlock?.querySelector('code');
                if (codeElement) {
                    copyToClipboard(codeElement.textContent);
                } else {
                    showNotification('Erro ao copiar código', 'error');
                    console.error('Elemento de código não encontrado');
                }
            }
        });

        // Fechar modal ao clicar fora
        if (elements.settingsModal) {
            elements.settingsModal.addEventListener('click', (e) => {
                if (e.target === elements.settingsModal) {
                    closeSettingsModal();
                }
            });
        }

        // File handling events
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    processUploadedFiles(e.target.files);
                    e.target.value = ''; // Clear input for reuse
                }
            });
        }

        if (elements.attachBtn) {
            elements.attachBtn.addEventListener('click', handleFileUpload);
        }

        if (elements.emojiBtn) {
            elements.emojiBtn.addEventListener('click', toggleEmojiPicker);
        }

        if (elements.imageGenBtn) {
            elements.imageGenBtn.addEventListener('click', handleImageGeneration);
        }

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (state.isEmojiPickerOpen && !e.target.closest('#emojiPicker') && !e.target.closest('#emojiBtn')) {
                closeEmojiPicker();
            }
        });
    };

    // ========== EASTER EGGS ==========

    const initEasterEggs = () => {
        console.log("🚀 Easter Eggs ativados! Digite 'veraneio.help()' no console!");

        // Konami Code
        let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        let userInput = [];

        document.addEventListener('keydown', (e) => {
            userInput.push(e.code);
            if (userInput.length > konamiCode.length) {
                userInput.shift();
            }
            if (userInput.join(',') === konamiCode.join(',')) {
                showNotification('🎮 KONAMI CODE ATIVADO! Modo GOD ON! 🔥', 'success');
                document.body.style.filter = 'hue-rotate(180deg)';
                setTimeout(() => {
                    document.body.style.filter = '';
                }, 3000);
            }
        });

        // Comandos do console
        window.veraneio = {
            help: () => {
                console.log(`
🇧🇷 VERANEIO GPT AI - COMANDOS SECRETOS 🇧🇷
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
veraneio.stats()     - Estatísticas do app
veraneio.limpar()    - Limpa todas as conversas
veraneio.raiz()      - Ativa modo RAIZ
veraneio.putaria()   - Easter egg especial 🔥
veraneio.salve()     - Mensagem especial
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                `);
            },
            stats: () => {
                console.log(`📊 STATS:
• Conversas: ${state.chats.length}
• Mensagens totais: ${state.chats.reduce((acc, chat) => acc + chat.messages.length, 0)}
• Modelo atual: ${state.settings.model}
• API configurada: ${state.settings.apiKey ? '✅' : '❌'}
• Tema: ${document.body.dataset.theme}
                `);
            },
            limpar: () => {
                if (confirm('🗑️ Limpar TODAS as conversas? Esta ação não pode ser desfeita!')) {
                    state.chats = [];
                    state.currentChatId = null;
                    localStorage.removeItem('veraneio_chats');
                    localStorage.removeItem('veraneio_currentChatId');
                    updateUI();
                    showNotification('🧹 Todas as conversas foram limpas!', 'success');
                    console.log('🧹 Conversas limpas com sucesso!');
                }
            },
            raiz: () => {
                showNotification('🌳 MODO RAIZ ATIVADO! AGORA É SÓ PUTARIA! 🔥', 'success');
                console.log('🌳🔥 MODO RAIZ ON! VAI COMEÇAR A PUTARIA! 🔥🌳');
                document.body.style.animation = 'shake 0.5s infinite';
                setTimeout(() => {
                    document.body.style.animation = '';
                }, 2000);
            },
            putaria: () => {
                console.log('🔥💀 PUTARIA MODE ACTIVATED! 💀🔥');
                showNotification('🔥💀 PUTARIA MODE ON! SÓ VAI! 💀🔥', 'success');
                elements.app.style.transform = 'rotate(360deg)';
                elements.app.style.transition = 'transform 2s';
                setTimeout(() => {
                    elements.app.style.transform = '';
                    elements.app.style.transition = '';
                }, 2000);
            },
            salve: () => {
                const sauds = [
                    '🤙 SALVE QUEBRADA!',
                    '🇧🇷 E AÍ MEU CHAPA!',
                    '🔥 VAI COMEÇAR A PUTARIA!',
                    '💀 SÓ OS BRABOS!',
                    '🚀 RUMO AO ESPAÇO!'
                ];
                const randomSalve = sauds[Math.floor(Math.random() * sauds.length)];
                showNotification(randomSalve, 'success');
                console.log(randomSalve);
            }
        };
    };

    // ========== INICIALIZAÇÃO ==========
    init();
});