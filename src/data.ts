export const WA = '258835109190';
export const WA_BUSINESS = '258840166592';
export const WA_GROUP_LINK = 'https://chat.whatsapp.com/invite/netkservices-vendas';
export const KAYAMOZ = 'https://jonsonjb.github.io/kayamoz';
export const ADMIN_EMAIL = 'admin@jonsonjb.com';
export const ADMIN_PASS = '25021995Jb@';
export const MASTER_EMAIL = 'netekservcice@gmail.com';
export const MASTER_PASS = 'Master@2025!Netek';
// Backoffice credentials (desenvolvimento / mock)
export const BO_EMAIL = 'admin@netek.com';
export const BO_PASS = 'N3t3k@S3cur3#2025!';
export const BO_2FA_SECRET = '748291';          // TOTP mock para dev
export const CERT_HOURS = 265;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  isAdmin: boolean;
  bio?: string;
  joined?: string;
  points?: number;
}

export interface QuizQuestion { q: string; opts: string[]; correct: number; }
export interface CourseModule { title: string; content: string; quiz: QuizQuestion[]; }
export interface FullCourse {
  id: number; title: string; platform: string; desc: string;
  cat: string; level: string; hours: number; url: string; img: string;
  modules: CourseModule[];
}

export const freeCourses: FullCourse[] = [
  {
    id:1, title:'Inteligência Artificial', platform:'Netek Academy', desc:'IA, machine learning e redes neurais aplicados a Moçambique.', cat:'IA', level:'Iniciante', hours:30, url:'', img:'🤖',
    modules:[
      { title:'O que é IA?', content:'A IA é a capacidade das máquinas imitarem a inteligência humana.\n\nTipos de IA:\n• IA Fraca – tarefas específicas (Siri, ChatGPT)\n• IA Forte – inteligência geral humana (não existe ainda)\n• IA Super – acima do humano (teórica)\n\nAplicações em Moçambique:\n• Agricultura com drones inteligentes\n• Diagnóstico médico assistido\n• Chatbots para atendimento\n• Tradução de línguas locais', quiz:[
        {q:'O ChatGPT é um exemplo de:',opts:['IA Forte','IA Fraca','IA Super','Robô físico'],correct:1},
        {q:'Qual IA ainda não existe?',opts:['IA Fraca','IA Forte','Ambas existem','Nenhuma existe'],correct:1},
        {q:'Drones na agricultura usam:',opts:['Magia','IA','Apenas GPS','Nada'],correct:1},
      ]},
      { title:'Machine Learning', content:'Machine Learning (ML) é ensinar computadores com dados.\n\nTipos:\n• Supervisionado – aprende com exemplos rotulados\n• Não-supervisionado – encontra padrões sozinho\n• Por reforço – aprende por tentativa e erro\n\nExemplo prático em Moçambique:\nUm banco usa ML para detectar fraudes no M-Pesa analisando padrões de transações.', quiz:[
        {q:'ML Supervisionado usa:',opts:['Dados sem rótulos','Dados rotulados','Sem dados','Apenas imagens'],correct:1},
        {q:'Detectar fraudes no M-Pesa usa:',opts:['ML','Magia','Pessoas','Nada'],correct:0},
      ]},
      { title:'ChatGPT na prática', content:'ChatGPT é o assistente de IA mais popular do mundo.\n\nO que pode fazer:\n• Escrever emails e cartas\n• Criar conteúdo para redes sociais\n• Traduzir textos\n• Explicar conceitos complexos\n• Programar código\n• Fazer resumos\n\nComo usar:\n1. Aceda chat.openai.com\n2. Crie conta gratuita\n3. Escreva pedidos claros e específicos\n\nDica de prompt:\n"Escreve um email profissional em português para [situação], tom formal, máximo 150 palavras."', quiz:[
        {q:'ChatGPT está disponível em:',opts:['Apenas app','chat.openai.com','Apenas desktop','Não está disponível'],correct:1},
        {q:'Para melhor resultado no ChatGPT devemos ser:',opts:['Vagos','Específicos','Curtos','Em inglês'],correct:1},
      ]},
      { title:'IA para Negócios em MZ', content:'Como usar IA no seu negócio em Moçambique:\n\n1. ATENDIMENTO:\n• Chatbot WhatsApp para responder dúvidas 24h\n• Respostas automáticas no email\n\n2. CONTEÚDO:\n• Criar posts para Facebook e Instagram\n• Escrever descrições de produtos\n• Criar flyers com Canva AI\n\n3. FINANÇAS:\n• Analisar gastos e receitas\n• Prever vendas\n\n4. OPERAÇÕES:\n• Organizar agenda\n• Criar relatórios\n• Traduzir documentos', quiz:[
        {q:'IA pode ajudar no atendimento através de:',opts:['Contratar mais pessoal','Chatbot WhatsApp','Apenas email','Nada'],correct:1},
        {q:'Canva AI serve para:',opts:['Contabilidade','Criar imagens e designs','Vendas','Transporte'],correct:1},
      ]},
    ]
  },
  {
    id:2, title:'Marketing Digital', platform:'Netek Academy', desc:'Estratégias online para negócios em Moçambique.', cat:'Marketing', level:'Iniciante', hours:25, url:'', img:'📱',
    modules:[
      { title:'Fundamentos do Marketing Digital', content:'Marketing Digital é promover produtos e serviços online.\n\nComo o mercado moçambicano usa internet:\n• Facebook: 5 milhões de utilizadores\n• WhatsApp: Principal canal de comunicação\n• YouTube: Crescimento rápido\n• TikTok: Popularidade crescente\n\nPilares do Marketing Digital:\n1. Presença Online (site, redes sociais)\n2. Conteúdo de Valor\n3. Engajamento com clientes\n4. Análise de resultados', quiz:[
        {q:'Quantos moçambicanos usam Facebook?',opts:['1 milhão','3 milhões','5 milhões','10 milhões'],correct:2},
        {q:'Qual é o principal canal de comunicação em MZ?',opts:['Email','WhatsApp','Facebook','SMS'],correct:1},
      ]},
      { title:'WhatsApp Business', content:'WhatsApp Business é essencial em Moçambique!\n\nConfigurar perfil profissional:\n1. Baixe WhatsApp Business\n2. Adicione nome da empresa\n3. Adicione descrição e horário\n4. Configure catálogo de produtos\n\nFuncionalidades:\n• Catálogo de produtos com fotos e preços\n• Mensagens automáticas de boas-vindas\n• Respostas rápidas para perguntas frequentes\n• Etiquetas para organizar clientes\n• Estatísticas de mensagens\n\nDica: Crie grupos por tipo de cliente!', quiz:[
        {q:'Catálogo no WhatsApp Business permite:',opts:['Jogar','Listar produtos com preços','Fazer chamadas','Nada'],correct:1},
        {q:'Etiquetas servem para:',opts:['Decorar','Organizar clientes','Enviar spam','Apagar'],correct:1},
      ]},
      { title:'Facebook e Instagram', content:'Como criar presença profissional:\n\nFACEBOOK:\n• Crie Página (não perfil pessoal)\n• Publique 3-5x por semana\n• Use Facebook Ads a partir de 100MT/dia\n• Responda todos os comentários\n\nINSTAGRAM:\n• Fotos de alta qualidade\n• Hashtags moçambicanas: #maputo #mozambique #mocambique\n• Stories diários\n• Reels para maior alcance\n\nMelhor horário para publicar em MZ:\n• 12h-14h (hora de almoço)\n• 19h-21h (após trabalho)', quiz:[
        {q:'No Facebook para negócios deve criar:',opts:['Perfil pessoal','Grupo privado','Página','Evento'],correct:2},
        {q:'Melhor horário para publicar em MZ:',opts:['3h da manhã','12h-14h','Qualquer hora','Nunca'],correct:1},
      ]},
      { title:'Google Meu Negócio', content:'Apareça no Google Maps GRATUITAMENTE!\n\nComo criar:\n1. Acede google.com/business\n2. Clique "Gerir agora"\n3. Pesquise o nome da empresa\n4. Adicione endereço\n5. Escolha categoria\n6. Adicione telefone e site\n7. Verifique a conta\n\nBenefícios:\n• Aparece quando alguém procura perto\n• Clientes deixam avaliações\n• Mostra horário de funcionamento\n• Recebe mensagens directas\n• Estatísticas de visualizações\n\nGratuito e poderoso!', quiz:[
        {q:'Google Meu Negócio é:',opts:['Pago','Gratuito','Apenas para grandes empresas','Não existe em MZ'],correct:1},
        {q:'Onde criar o Google Meu Negócio?',opts:['facebook.com','google.com/business','yahoo.com','bing.com'],correct:1},
      ]},
    ]
  },
  {
    id:3, title:'Programação Python', platform:'Netek Academy', desc:'Do zero ao avançado em Python.', cat:'Programação', level:'Iniciante', hours:40, url:'', img:'🐍',
    modules:[
      { title:'Introdução ao Python', content:'Python é a linguagem mais popular no mundo!\n\nPor que aprender Python?\n• Fácil de ler e escrever\n• Muito usado em IA e dados\n• Salários altos (50.000MT+)\n• Grande comunidade\n• Gratuito e open source\n\nInstalar Python:\n1. python.org/downloads\n2. Baixe a versão mais recente\n3. Instale no Windows/Mac/Linux\n\nPrimeiro programa:\nprint("Olá, Moçambique!")\n# Resultado: Olá, Moçambique!', quiz:[
        {q:'Python é uma linguagem:',opts:['Difícil','Cara','Fácil e gratuita','Antiga e inútil'],correct:2},
        {q:'O comando print() serve para:',opts:['Imprimir papel','Mostrar texto no ecrã','Somar','Apagar'],correct:1},
      ]},
      { title:'Variáveis e Tipos de Dados', content:'Variáveis guardam informação.\n\nTipos em Python:\n• str  → Texto: nome = "João"\n• int  → Inteiro: idade = 25\n• float → Decimal: preco = 150.50\n• bool  → Verdadeiro/Falso: activo = True\n• list  → Lista: frutas = ["manga","caju"]\n• dict  → Dicionário: pessoa = {"nome":"Ana","idade":30}\n\nExemplo completo:\nnome = "Carlos"\nidade = 30\ncidade = "Maputo"\nprint(f"{nome} tem {idade} anos e vive em {cidade}")\n# Carlos tem 30 anos e vive em Maputo', quiz:[
        {q:'Que tipo guarda "Maputo"?',opts:['int','float','str','bool'],correct:2},
        {q:'Lista em Python usa:',opts:['{}','()','[]','<>'],correct:2},
      ]},
      { title:'Condicionais e Loops', content:'CONDICIONAIS (Tomar decisões):\nnota = 15\nif nota >= 10:\n    print("Aprovado!")\nelif nota >= 5:\n    print("Exame de recurso")\nelse:\n    print("Reprovado")\n\nLOOPS (Repetir código):\n# For loop\nfor i in range(5):\n    print(f"Número: {i}")\n\n# While loop\ncontador = 0\nwhile contador < 3:\n    print(f"Ciclo: {contador}")\n    contador += 1\n\n# Loop em lista\ncidades = ["Maputo","Beira","Nampula"]\nfor cidade in cidades:\n    print(cidade)', quiz:[
        {q:'O "if" serve para:',opts:['Repetir código','Tomar decisões','Guardar dados','Imprimir'],correct:1},
        {q:'range(5) gera:',opts:['1,2,3,4,5','0,1,2,3,4','5,4,3,2,1','Apenas 5'],correct:1},
      ]},
      { title:'Funções e Módulos', content:'FUNÇÕES (Código reutilizável):\ndef saudacao(nome, cidade="Maputo"):\n    return f"Olá {nome}, de {cidade}!"\n\nprint(saudacao("Maria"))\n# Olá Maria, de Maputo!\n\nprint(saudacao("João", "Beira"))\n# Olá João, de Beira!\n\nMÓDULOS ÚTEIS:\nimport datetime  # Datas\nimport math      # Matemática\nimport random    # Números aleatórios\n\n# Instalar módulos externos:\n# pip install requests\n# pip install pandas\n# pip install flask\n\nProjeto simples:\ndef calcular_mpesa(valor, taxa=0.01):\n    comissao = valor * taxa\n    return valor - comissao', quiz:[
        {q:'def serve para:',opts:['Apagar função','Criar função','Chamar função','Nada'],correct:1},
        {q:'Para instalar módulos usamos:',opts:['install','pip install','python install','module'],correct:1},
      ]},
      { title:'Projeto Final: Mini Sistema', content:'Vamos criar um sistema de gestão de clientes!\n\n# Sistema Netek Clientes\nclientes = []\n\ndef adicionar_cliente(nome, telefone):\n    cliente = {"nome": nome, "tel": telefone}\n    clientes.append(cliente)\n    print(f"✅ {nome} adicionado!")\n\ndef listar_clientes():\n    print("\\n📋 CLIENTES:")\n    for i, c in enumerate(clientes, 1):\n        print(f"{i}. {c[\'nome\']} - {c[\'tel\']}")\n\n# Usar o sistema\nadicionar_cliente("Maria", "84 123 4567")\nadicionar_cliente("João", "82 987 6543")\nlistar_clientes()\n\n# Resultado:\n# ✅ Maria adicionado!\n# ✅ João adicionado!\n# 📋 CLIENTES:\n# 1. Maria - 84 123 4567\n# 2. João - 82 987 6543', quiz:[
        {q:'append() serve para:',opts:['Apagar','Adicionar à lista','Ordenar','Imprimir'],correct:1},
        {q:'enumerate() retorna:',opts:['Apenas valores','Apenas índices','Índice e valor','Nada'],correct:2},
      ]},
    ]
  },
  {
    id:4, title:'Excel Profissional', platform:'Netek Academy', desc:'Domine Excel para trabalho e negócios.', cat:'Produtividade', level:'Iniciante', hours:35, url:'', img:'📊',
    modules:[
      { title:'Introdução ao Excel', content:'Excel é a ferramenta de escritório mais usada no mundo!\n\nÉ usado para:\n• Folhas de salários\n• Controlo de stocks\n• Orçamentos\n• Relatórios\n• Análise de dados\n\nElementos básicos:\n• Célula → endereço: A1, B2, C10\n• Linha → horizontal: 1, 2, 3...\n• Coluna → vertical: A, B, C...\n• Folha → Sheet1, Sheet2\n• Pasta de Trabalho → ficheiro .xlsx\n\nAtalhos essenciais:\n• Ctrl+C → Copiar\n• Ctrl+V → Colar\n• Ctrl+Z → Desfazer\n• Ctrl+S → Guardar', quiz:[
        {q:'A célula "B5" está na:',opts:['Linha B, Coluna 5','Coluna B, Linha 5','Célula aleatória','Não existe'],correct:1},
        {q:'Ctrl+Z serve para:',opts:['Guardar','Copiar','Desfazer','Colar'],correct:2},
      ]},
      { title:'Fórmulas Essenciais', content:'Fórmulas sempre começam com =\n\nARITMÉTICA:\n=A1+B1   → Soma\n=A1-B1   → Subtracção\n=A1*B1   → Multiplicação\n=A1/B1   → Divisão\n\nFUNÇÕES:\n=SOMA(A1:A10)    → Soma intervalo\n=MÉDIA(A1:A10)   → Média\n=MÁXIMO(A1:A10)  → Maior valor\n=MÍNIMO(A1:A10)  → Menor valor\n=CONTAR(A1:A10)  → Contar células\n=SE(A1>10,"Bom","Mau")  → Condição\n\nExemplo folha de salários:\nSalário base: =C2 * D2\nDescontos INSS: =E2 * 0.03\nLíquido: =E2 - F2', quiz:[
        {q:'Para calcular média usamos:',opts:['=SOMA()','=MÉDIA()','=MEDIANA()','=CALC()'],correct:1},
        {q:'=SE(A1>10,"Bom","Mau") mostra "Bom" quando:',opts:['A1=10','A1<10','A1>10','Sempre'],correct:2},
      ]},
      { title:'Gráficos e Formatação', content:'CRIAR GRÁFICO:\n1. Seleccione os dados\n2. Inserir → Gráfico\n3. Escolha tipo:\n   • Barras → Comparar valores\n   • Linhas → Tendências\n   • Pizza → Percentagens\n   • Área → Volume ao longo do tempo\n4. Personalize título e cores\n\nFORMATAÇÃO PROFISSIONAL:\n• Negrito: Ctrl+B\n• Cor de fundo: Preenchimento\n• Moeda: Formato → Moeda (MT)\n• Percentagem: %\n• Bordas: Inserir bordas\n• Congelar painel: Ver → Congelar\n\nDica: Use tabelas para organizar dados automaticamente!', quiz:[
        {q:'Gráfico de pizza serve para:',opts:['Tendências','Percentagens','Comparar','Somar'],correct:1},
        {q:'Congelar painel serve para:',opts:['Fechar Excel','Fixar cabeçalhos ao rolar','Proteger dados','Imprimir'],correct:1},
      ]},
    ]
  },
  {
    id:5, title:'ChatGPT Avançado', platform:'Netek Academy', desc:'Domine prompts e automatize com IA.', cat:'IA', level:'Intermédio', hours:20, url:'', img:'💡',
    modules:[
      { title:'Engenharia de Prompts', content:'Prompt é a instrução que dás ao ChatGPT.\n\nESTRUTURA DE UM BOM PROMPT:\n1. Contexto → Quem és\n2. Tarefa → O que queres\n3. Formato → Como queres\n4. Restrições → Limites\n\nExemplo MAU:\n"Escreve algo sobre negócios"\n\nExemplo BOM:\n"És um consultor de negócios especialista no mercado moçambicano. Escreve um plano de marketing de 30 dias para uma loja de roupa em Maputo com orçamento de 5.000MT. Formato: lista numerada com tarefas diárias."\n\nTécnicas avançadas:\n• Role-playing: "Actua como..."\n• Chain-of-thought: "Pensa passo a passo..."\n• Few-shot: Dá exemplos antes do pedido', quiz:[
        {q:'Um bom prompt deve incluir:',opts:['Apenas a pergunta','Contexto, tarefa, formato','Apenas em inglês','Ser muito curto'],correct:1},
        {q:'"Actua como..." é uma técnica de:',opts:['Formatação','Role-playing','Chain-of-thought','Nenhuma'],correct:1},
      ]},
      { title:'IA para Produtividade', content:'Ferramentas de IA gratuitas para usar HOJE:\n\nEscrita:\n• ChatGPT (chat.openai.com)\n• Claude (claude.ai)\n• Gemini (gemini.google.com)\n\nImagens:\n• DALL-E (via ChatGPT Plus)\n• Canva AI (grátis)\n• Leonardo AI (grátis)\n• Midjourney\n\nVoz/Áudio:\n• ElevenLabs (texto para voz)\n• Whisper (transcrição)\n\nCódigo:\n• GitHub Copilot\n• Cursor AI\n\nProdutividade:\n• Notion AI\n• Grammarly\n\nEm Moçambique:\n• Todas acessíveis com boa internet\n• VPN pode ser necessário para algumas', quiz:[
        {q:'Canva AI serve para criar:',opts:['Código','Imagens e designs','Vídeos longos','Áudio'],correct:1},
        {q:'Claude.ai é um assistente de:',opts:['Imagens','Vídeo','Escrita e análise','Música'],correct:2},
      ]},
    ]
  },
  {
    id:6, title:'Desenvolvimento Web', platform:'Netek Academy', desc:'Crie sites profissionais do zero.', cat:'Desenvolvimento', level:'Iniciante', hours:50, url:'', img:'🌐',
    modules:[
      { title:'HTML – A Estrutura', content:'HTML define a estrutura de um site.\n\nTags essenciais:\n<!DOCTYPE html>\n<html lang="pt">\n<head>\n  <title>Netek Services</title>\n</head>\n<body>\n  <h1>Título principal</h1>\n  <h2>Subtítulo</h2>\n  <p>Parágrafo de texto</p>\n  <a href="https://netek.co.mz">Link</a>\n  <img src="foto.jpg" alt="Foto">\n  <ul>\n    <li>Item 1</li>\n    <li>Item 2</li>\n  </ul>\n  <button>Clique aqui</button>\n</body>\n</html>', quiz:[
        {q:'HTML define a _____ do site:',opts:['Estilo','Estrutura','Lógica','Dados'],correct:1},
        {q:'Para criar um link usamos:',opts:['<link>','<href>','<a>','<url>'],correct:2},
      ]},
      { title:'CSS – O Estilo', content:'CSS dá aparência ao HTML.\n\n/* Selectors */\nh1 { color: blue; }\n.classe { font-size: 16px; }\n#id { background: red; }\n\n/* Propriedades essenciais */\ncolor: blue;              /* cor do texto */\nbackground-color: white;  /* fundo */\nfont-size: 18px;          /* tamanho letra */\nfont-weight: bold;        /* negrito */\nmargin: 20px;             /* espaço exterior */\npadding: 10px;            /* espaço interior */\nborder: 1px solid gray;   /* borda */\nborder-radius: 8px;       /* cantos arredondados */\ndisplay: flex;            /* layout flexível */\ntext-align: center;       /* alinhamento */\n\n/* Responsivo */\n@media (max-width: 768px) {\n  .menu { display: none; }\n}', quiz:[
        {q:'CSS define o _____ do site:',opts:['Estrutura','Estilo','Dados','Lógica'],correct:1},
        {q:'border-radius serve para:',opts:['Bordas coloridas','Cantos arredondados','Texto em volta','Sombras'],correct:1},
      ]},
      { title:'JavaScript Básico', content:'JavaScript adiciona interactividade!\n\n// Variáveis\nlet nome = "Maria";\nconst cidade = "Maputo";\n\n// Função\nfunction saudar(nome) {\n  alert("Olá, " + nome + "!");\n}\n\n// Eventos\ndocument.getElementById("botao")\n  .addEventListener("click", function() {\n    saudar("Visitante");\n  });\n\n// Manipular HTML\ndocument.getElementById("titulo")\n  .innerHTML = "Novo Título";\n\n// Fetch API (carregar dados)\nfetch("https://api.exemplo.com/dados")\n  .then(res => res.json())\n  .then(data => console.log(data));', quiz:[
        {q:'JavaScript adiciona ao site:',opts:['Estrutura','Estilo','Interactividade','Nada'],correct:2},
        {q:'addEventListener serve para:',opts:['Ouvir eventos','Guardar dados','Estilizar','Criar HTML'],correct:0},
      ]},
    ]
  },
  {
    id:7, title:'Cibersegurança', platform:'Netek Academy', desc:'Proteja-se e ao seu negócio online.', cat:'Segurança', level:'Iniciante', hours:20, url:'', img:'🛡️',
    modules:[
      { title:'Ameaças Digitais', content:'Principais ameaças em Moçambique:\n\nPHISHING:\n• Emails/SMS falsos pedindo dados\n• "Parabéns! Ganhou 10.000MT"\n• Links que imitam sites reais\n\nSCOPS (Burlas):\n• Falsos empregos no estrangeiro\n• Investimentos "garantidos"\n• M-Pesa: "Enviei por engano"\n\nMalware:\n• Vírus que rouba dados\n• Ransomware que cifra ficheiros\n\nENGENHARIA SOCIAL:\n• Alguém se faz passar por banco\n• Pede código de verificação\n• Urgência artificial\n\nComo identificar:\n✅ Verifique o remetente\n✅ Não clique em links suspeitos\n✅ Banco NUNCA pede senha por telefone', quiz:[
        {q:'Phishing é:',opts:['Um jogo','Fraude por email/SMS falso','Tipo de vírus','Rede social'],correct:1},
        {q:'Banco pede senha por telefone?',opts:['Sim, sempre','Só em emergência','Nunca','Às vezes'],correct:2},
      ]},
      { title:'Protecção e Boas Práticas', content:'SENHAS FORTES:\n✅ Mínimo 12 caracteres\n✅ Maiúsculas + minúsculas\n✅ Números e símbolos\n✅ Diferente para cada conta\n\nExemplo forte: M0çamb1qu3@Netek!\nExemplo fraco: maputo123\n\nAUTENTICAÇÃO 2 FACTORES (2FA):\n• Activa em Gmail, Facebook, WhatsApp\n• Código SMS após senha\n• App Authenticator\n\nWI-FI SEGURO:\n• Evite redes públicas sem VPN\n• Use HTTPS (cadeado verde)\n• Mude senha do router\n\nBACKUPS:\n• Google Drive (15GB grátis)\n• OneDrive\n• Cópia local + nuvem\n\nACTUALIZAÇÕES:\n• Instale sempre actualizações\n• Corrigem falhas de segurança', quiz:[
        {q:'2FA significa:',opts:['2 Factores de Autenticação','2 senhas diferentes','2 contas','Nada'],correct:0},
        {q:'Backup ideal deve estar:',opts:['Apenas local','Apenas nuvem','Local + nuvem','Em papel'],correct:2},
      ]},
    ]
  },
  {
    id:8, title:'Finanças Pessoais', platform:'Netek Academy', desc:'Gerencie o seu dinheiro em Meticais.', cat:'Finanças', level:'Iniciante', hours:15, url:'', img:'💰',
    modules:[
      { title:'Orçamento Pessoal', content:'Regra 50/30/20 adaptada para Moçambique:\n\n50% – NECESSIDADES:\n• Renda/casa\n• Alimentação\n• Transporte (chapa)\n• Saúde\n• Educação dos filhos\n\n30% – DESEJOS:\n• Lazer\n• Restaurantes\n• Roupas extras\n• Entretenimento\n\n20% – POUPANÇA E INVESTIMENTO:\n• Fundo de emergência\n• Poupança para objectivos\n• Investimento\n\nExemplo com salário de 25.000MT:\n• Necessidades: 12.500MT\n• Desejos: 7.500MT\n• Poupança: 5.000MT', quiz:[
        {q:'Na regra 50/30/20, quanto vai para poupança?',opts:['10%','20%','30%','50%'],correct:1},
        {q:'Transporte é uma:',opts:['Necessidade','Desejo','Poupança','Investimento'],correct:0},
      ]},
      { title:'Investir em Moçambique', content:'Opções de investimento em Moçambique:\n\nBAIXO RISCO:\n• Conta poupança BIM/Standard Bank\n• Bilhetes do Tesouro (Estado)\n• Depósito a prazo\n\nMÉDIO RISCO:\n• Bolsa de Valores de Moçambique (BVM)\n• Fundos de investimento\n• Imobiliário de baixo valor\n\nALTO RISCO:\n• Negócio próprio\n• Criptomoedas (muito cuidado!)\n• Forex (evitar inicialmente)\n\nFundo de Emergência:\n• 3-6 meses de despesas\n• Conta separada\n• Fácil de aceder\n\nAtenção às BURLAS:\n• Esquemas de pirâmide\n• "Duplica o dinheiro em 1 semana"\n• Investimentos sem licença do BM', quiz:[
        {q:'Bilhetes do Tesouro são emitidos por:',opts:['Banco BIM','O Estado','Seguradora','Empresa privada'],correct:1},
        {q:'Fundo de emergência deve cobrir:',opts:['1 mês','3-6 meses','1 ano','2 anos'],correct:1},
      ]},
    ]
  },
  {
    id:9, title:'Inglês para Negócios', platform:'Netek Academy', desc:'Inglês profissional para o mercado.', cat:'Idiomas', level:'Iniciante', hours:30, url:'', img:'🇬🇧',
    modules:[
      { title:'Vocabulário Essencial', content:'Palavras e frases para o trabalho:\n\nSAUDAÇÕES:\n• Good morning → Bom dia\n• Good afternoon → Boa tarde\n• How are you? → Como está?\n• Nice to meet you → Prazer em conhecê-lo\n\nTRABALHO:\n• Meeting → Reunião\n• Deadline → Prazo\n• Report → Relatório\n• Budget → Orçamento\n• Invoice → Factura\n• Receipt → Recibo\n• Client → Cliente\n• Supplier → Fornecedor\n\nEMAIL PROFISSIONAL:\n• Dear Mr./Ms. → Caro/a Sr./a\n• I am writing to → Escrevo para\n• Please find attached → Em anexo\n• Best regards → Atenciosamente\n• I look forward to → Aguardo', quiz:[
        {q:'"Deadline" significa:',opts:['Morte','Prazo','Reunião','Contrato'],correct:1},
        {q:'"Best regards" usa-se no:',opts:['Início do email','Meio do email','Final do email','Nunca'],correct:2},
      ]},
      { title:'Conversação nos Negócios', content:'Situações reais em inglês:\n\nNUMA REUNIÃO:\n"Could you please repeat that?"\n(Pode repetir, por favor?)\n\n"I agree with you on that point."\n(Concordo com esse ponto.)\n\n"Let me check and get back to you."\n(Deixe-me verificar e volto.)\n\nNUMA ENTREVISTA:\n"Tell me about yourself."\n→ "I have X years of experience in..."\n\n"What are your strengths?"\n→ "I am good at... and I am known for..."\n\nNEGOCIAÇÃO:\n"What is your best price?"\n→ "The best I can offer is..."\n\n"Can we discuss the terms?"\n→ "Sure, what did you have in mind?"', quiz:[
        {q:'"Could you repeat that?" significa:',opts:['Pode ir embora?','Pode repetir?','Pode falar mais alto?','Entendi tudo'],correct:1},
        {q:'Em entrevista, "Tell me about yourself" pede:',opts:['Endereço','Apresentação profissional','Salário','Referências'],correct:1},
      ]},
    ]
  },
  {
    id:10, title:'Design com Canva', platform:'Netek Academy', desc:'Crie designs profissionais gratuitamente.', cat:'Design', level:'Iniciante', hours:15, url:'', img:'🎨',
    modules:[
      { title:'Introdução ao Canva', content:'Canva é a ferramenta de design mais acessível do mundo!\n\nCONTAS:\n• Grátis: Milhares de templates\n• Canva Pro: Funcionalidades premium\n• Canva Education: Grátis para estudantes\n\nO QUE CRIAR:\n• Posts Facebook/Instagram (1080x1080px)\n• Stories (1080x1920px)\n• Logótipos\n• Cartões de visita\n• Flyers e cartazes\n• Apresentações\n• Banners de WhatsApp\n• Certificados\n\nCOMO COMEÇAR:\n1. canva.com → Criar conta\n2. Escolha o tipo de design\n3. Seleccione um template\n4. Personalize texto, cores, imagens\n5. Descarregue ou partilhe\n\nDica: Use "Moçambique" na pesquisa para temas locais!', quiz:[
        {q:'Tamanho de post para Instagram é:',opts:['800x600px','1920x1080px','1080x1080px','500x500px'],correct:2},
        {q:'Canva Education é:',opts:['Pago','Grátis para estudantes','Apenas em inglês','Não existe'],correct:1},
      ]},
      { title:'Design Profissional', content:'PRINCÍPIOS DE DESIGN:\n\n1. CONTRASTE:\n• Texto escuro em fundo claro\n• Texto claro em fundo escuro\n• Nunca amarelo em branco!\n\n2. ALINHAMENTO:\n• Centro para títulos\n• Esquerda para texto longo\n• Use guias do Canva\n\n3. ESPAÇAMENTO:\n• Não amontoe elementos\n• Respire entre secções\n• Margem mínima de 20px\n\n4. CONSISTÊNCIA:\n• Use no máximo 2 fontes\n• Paleta de 2-3 cores\n• Estilo uniforme\n\n5. HIERARQUIA:\n• Título grande\n• Subtítulo médio\n• Corpo pequeno\n\nCORES POPULARES EM MZ:\n• Verde: Natureza, sucesso\n• Vermelho: Energia, urgência\n• Azul: Confiança, tecnologia\n• Dourado: Prestígio, qualidade', quiz:[
        {q:'Máximo de fontes num design:',opts:['1','2','5','10'],correct:1},
        {q:'Azul representa:',opts:['Urgência','Natureza','Confiança','Alegria'],correct:2},
      ]},
    ]
  },
  {
    id:11, title:'Empreendedorismo Digital', platform:'Netek Academy', desc:'Crie e escale o seu negócio online.', cat:'Negócios', level:'Intermédio', hours:25, url:'', img:'🚀',
    modules:[
      { title:'Modelo de Negócio Digital', content:'TIPOS DE NEGÓCIO ONLINE EM MZ:\n\n1. E-COMMERCE:\n• Venda produtos pelo WhatsApp/Instagram\n• Loja online simples\n• Dropshipping\n\n2. SERVIÇOS DIGITAIS:\n• Design gráfico\n• Programação\n• Marketing digital\n• Tradução\n\n3. CONTEÚDO:\n• YouTube (monetização)\n• Blog com publicidade\n• Cursos online\n\n4. MARKETPLACE:\n• KayaMoz (talentos)\n• OLX Moçambique\n• Facebook Marketplace\n\nCANVAS DE NEGÓCIO:\n• Proposta de Valor: O que resolve?\n• Clientes: Quem compra?\n• Canais: Como chega?\n• Receita: Como ganha?\n• Custos: O que gasta?', quiz:[
        {q:'KayaMoz é um tipo de:',opts:['E-commerce','Marketplace de serviços','Blog','App de jogos'],correct:1},
        {q:'Proposta de Valor responde a:',opts:['Quanto cobra?','O que resolve para o cliente?','Onde está?','Quem é?'],correct:1},
      ]},
      { title:'Lançar o Negócio', content:'PASSO A PASSO PARA COMEÇAR:\n\nSEMANA 1 – VALIDAR:\n• Identifique um problema real\n• Pergunte a 10 pessoas se pagariam\n• Calcule o preço mínimo viável\n\nSEMANA 2 – CRIAR:\n• Perfil WhatsApp Business\n• Página Facebook\n• Logótipo básico (Canva)\n• Catálogo de produtos/serviços\n\nSEMANA 3 – VENDER:\n• Publique conteúdo diário\n• Ofereça para os primeiros 3 clientes\n• Peça avaliações e depoimentos\n\nSEMANA 4 – CRESCER:\n• Analise o que funcionou\n• Invista em publicidade (100MT/dia)\n• Crie sistema de referências\n\nMÉTRICAS ESSENCIAIS:\n• CAC: Custo para ganhar cliente\n• LTV: Valor total do cliente\n• Taxa de conversão\n• ROI: Retorno do investimento', quiz:[
        {q:'Quantas pessoas deve questionar antes de lançar?',opts:['1','5','10+','100'],correct:2},
        {q:'CAC significa:',opts:['Custo de Aquisição de Cliente','Conta de Acesso ao Cliente','Central de Atendimento','Nenhum'],correct:0},
      ]},
    ]
  },
  {
    id:12, title:'Gestão de Redes Sociais', platform:'Netek Academy', desc:'Gira perfis profissionais e cria conteúdo viral.', cat:'Marketing', level:'Intermédio', hours:15, url:'', img:'📸',
    modules:[
      { title:'Estratégia de Conteúdo', content:'CALENDÁRIO EDITORIAL PARA MZ:\n\nSEGUNDA: 🎓 Dica educativa\nTERÇA: 💼 Bastidores do negócio\nQUARTA: 🛒 Produto/serviço\nQUINTA: 💬 Testemunho/avaliação\nSEXTA: 🎉 Promoção ou novidade\nSÁBADO: 🎯 Conteúdo inspiracional\nDOMINGO: 📊 Dados/curiosidade\n\nREGRA 80/20:\n• 80% conteúdo de valor (educa, entretém)\n• 20% conteúdo promocional\n\nFORMATOS QUE MAIS FUNCIONAM:\n1. Vídeos curtos (Reels/TikTok): +300% alcance\n2. Carrosséis: Alta taxa de guarda\n3. Stories: Proximidade\n4. Lives: Confiança e vendas', quiz:[
        {q:'Na regra 80/20, 80% é:',opts:['Promoção','Conteúdo de valor','Publicidade paga','Silêncio'],correct:1},
        {q:'Reels e TikTok aumentam alcance em:',opts:['10%','50%','100%','+300%'],correct:3},
      ]},
    ]
  },
];

export const blogPostsData = [
  { id:1, title:'10 Prompts de IA para Pequenos Negócios em MZ', excerpt:'Copie e use estes prompts do ChatGPT para criar conteúdo, responder clientes e organizar o seu negócio.', cat:'IA', time:'7 min', img:'🤖', content: 'Descubra como usar o ChatGPT para transformar o seu negócio moçambicano...' },
  { id:2, title:'Como Criar Imagens Profissionais com IA Grátis', excerpt:'Ferramentas gratuitas para criar logos, banners e posts sem precisar de designer.', cat:'Dicas', time:'5 min', img:'🎨', content: 'O Canva AI e outras ferramentas tornaram o design acessível a todos...' },
  { id:3, title:'Guia Completo: WhatsApp Business para Vender Mais', excerpt:'Tudo que precisa de saber sobre catálogos, respostas automáticas e estatísticas.', cat:'Marketing', time:'8 min', img:'💬', content: 'O WhatsApp Business mudou a forma de fazer negócio em Moçambique...' },
  { id:4, title:'Freelancing em Moçambique: Ganhe Dinheiro Online', excerpt:'Como começar, onde encontrar clientes e quanto cobrar pelos seus serviços.', cat:'Negócios', time:'10 min', img:'💰', content: 'O mercado de freelancing cresceu 40% em Moçambique...' },
  { id:5, title:'Python vs JavaScript: Qual Aprender Primeiro?', excerpt:'Comparação honesta para quem começa a programar em Moçambique.', cat:'Programação', time:'6 min', img:'💻', content: 'A escolha da linguagem certa pode acelerar muito a sua carreira...' },
  { id:6, title:'Segurança Digital: Proteja o Seu M-Pesa e Dados', excerpt:'As burlas mais comuns em Moçambique e como se proteger eficazmente.', cat:'Segurança', time:'8 min', img:'🛡️', content: 'As fraudes digitais custaram milhões de meticais em Moçambique...' },
  { id:7, title:'Excel para Pequenos Negócios: Folha de Salários', excerpt:'Template gratuito para gerir salários, INSS e IR em Meticais.', cat:'Produtividade', time:'5 min', img:'📊', content: 'Automatize a gestão de salários da sua empresa com Excel...' },
  { id:8, title:'KayaMoz: Como Encontrar Trabalho no Seu Bairro', excerpt:'Guia completo para usar o KayaMoz como trabalhador ou contratante.', cat:'Dicas', time:'4 min', img:'🔍', content: 'O KayaMoz está a revolucionar o mercado de trabalho local...' },
];

export const talentsData = [
  { id:1, n:'Carlos Machava', p:'Electricista', loc:'Maputo - Sommerschield', r:4.8, rv:127, v:true, img:'⚡', ph:'841234567', d:'Electricista certificado com 10 anos de experiência. Instalações residenciais e industriais.' },
  { id:2, n:'Maria Santos', p:'Designer Gráfica', loc:'Maputo - Polana', r:4.9, rv:89, v:true, img:'🎨', ph:'852345678', d:'Design profissional. Logos, flyers, identidade visual e redes sociais.' },
  { id:3, n:'José Mabunda', p:'Canalizador', loc:'Matola - Machava', r:4.7, rv:156, v:false, img:'🔧', ph:'863456789', d:'Canalizador experiente. Desentupimentos, instalações e reparações urgentes.' },
  { id:4, n:'Ana Tembe', p:'Contabilista', loc:'Maputo - Centro', r:4.9, rv:203, v:true, img:'📊', ph:'844567890', d:'Contabilidade, impostos, folha de pagamento e consultoria fiscal.' },
  { id:5, n:'Pedro Nhaca', p:'Técnico Informática', loc:'Maputo - Maxaquene', r:4.8, rv:94, v:true, img:'💻', ph:'855678901', d:'Reparação de PCs e laptops, redes, software e formação em informática.' },
  { id:6, n:'Rosa Cossa', p:'Costureira', loc:'Maputo - Mavalane', r:4.6, rv:78, v:false, img:'🧵', ph:'866789012', d:'Costura artesanal e industrial. Roupas sob medida, consertos e capulanas.' },
  { id:7, n:'Manuel Banze', p:'Motorista', loc:'Maputo - Costa do Sol', r:4.5, rv:312, v:true, img:'🚗', ph:'847890123', d:'Motorista profissional. Entregas, transporte de pessoas e mudanças.' },
  { id:8, n:'Fátima Namuera', p:'Cabeleireira', loc:'Maputo - Xipamanine', r:4.7, rv:245, v:true, img:'💇', ph:'858901234', d:'Cabelo, tranças, extensões, manicure e pedicure. Domicílio disponível.' },
  { id:9, n:'António Guambe', p:'Pedreiro', loc:'Matola - Infulene', r:4.4, rv:67, v:false, img:'🧱', ph:'849012345', d:'Construção, reparações e pinturas. Trabalho rápido e qualidade garantida.' },
  { id:10, n:'Lucia Viegas', p:'Professora/Explicadora', loc:'Maputo - Malhangalene', r:4.9, rv:112, v:true, img:'📚', ph:'860123456', d:'Explicações de Matemática, Física e Química. 1.ª ao 12.ª classe.' },
  { id:11, n:'Hélio Mondlane', p:'Fotógrafo', loc:'Maputo - Sommerschield', r:4.8, rv:89, v:true, img:'📷', ph:'841234568', d:'Fotografia de eventos, casamentos, corporativa e retratos.' },
  { id:12, n:'Sandra Bila', p:'Cozinheira', loc:'Maputo - Alto Maé', r:4.7, rv:134, v:false, img:'👩‍🍳', ph:'852345679', d:'Cozinha moçambicana e internacional. Eventos, catering e aulas de culinária.' },
];
