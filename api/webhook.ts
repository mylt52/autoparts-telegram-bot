// api/webhook.ts - Главный файл Telegram бота для поиска автозапчастей

import { VercelRequest, VercelResponse } from '@vercel/node';

interface TelegramMessage {
  message: {
    chat: { id: number };
    text: string;
    from?: { first_name?: string; username?: string };
  };
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message }: TelegramMessage = req.body;
    
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }
    
    const chatId = message.chat.id;
    const userText = message.text.trim();
    const userName = message.from?.first_name || message.from?.username || 'Пользователь';
    
    console.log(`📝 Запрос от ${userName} (${chatId}): ${userText}`);
    
    // Обрабатываем команды
    if (userText.startsWith('/start')) {
      await sendTelegramMessage(chatId, getWelcomeMessage());
      return res.status(200).json({ ok: true });
    }
    
    if (userText.startsWith('/help')) {
      await sendTelegramMessage(chatId, getHelpMessage());
      return res.status(200).json({ ok: true });
    }
    
    // Отправляем индикатор "печатает..."
    await sendTypingAction(chatId);
    
    // Основная логика поиска запчастей через Perplexity
    const result = await searchAutoparts(userText);
    
    // Отправляем результат пользователю
    await sendTelegramMessage(chatId, result);
    
    console.log(`✅ Ответ отправлен пользователю ${chatId}`);
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('❌ Ошибка в webhook:', error);
    
    // Пытаемся отправить сообщение об ошибке пользователю
    try {
      const { message } = req.body;
      if (message?.chat?.id) {
        await sendTelegramMessage(
          message.chat.id, 
          '❌ Произошла техническая ошибка. Попробуйте еще раз через несколько секунд.'
        );
      }
    } catch (sendError) {
      console.error('❌ Не удалось отправить сообщение об ошибке:', sendError);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 🧠 ГЛАВНАЯ ФУНКЦИЯ - Поиск автозапчастей через Perplexity
async function searchAutoparts(userMessage: string): Promise<string> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{
          role: 'user',
          content: createExpertPrompt(userMessage)
        }],
        temperature: 0.1,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as PerplexityResponse;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Пустой ответ от Perplexity API');
    }
    
    return content;
    
  } catch (error) {
    console.error('❌ Ошибка при обращении к Perplexity:', error);
    return '❌ Не удалось найти информацию о запчастях. Проверьте правильность VIN-кода и попробуйте еще раз.';
  }
}

// 🎯 ПРОДУМАННЫЙ ПРОМПТ для Perplexity API
function createExpertPrompt(userMessage: string): string {
  return `
Ты — профессиональный эксперт по автозапчастям с 15+ летним опытом работы на российском и европейском автомобильном рынке. Ты помогаешь менеджерам интернет-магазинов автозапчастей быстро находить нужные детали.

ПОЛЬЗОВАТЕЛЬ НАПИСАЛ: "${userMessage}"

ТВОЯ ЗАДАЧА:

1. АНАЛИЗ VIN-КОДА (если есть):
   - Декодируй VIN и определи точную модель автомобиля
   - Укажи год выпуска, двигатель, кузов
   - Если VIN неполный или неточный - сообщи об этом

2. ПОИСК ЗАПЧАСТЕЙ:
   - Найди точные OEM артикулы производителя
   - Укажи применимость по годам выпуска
   - Приведи 2-3 проверенных аналога (Febi, Lemforder, TRW, Bosch, etc.)
   
3. ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ:
   - Какие сопутствующие запчасти стоит предложить клиенту
   - На что обратить внимание при замене
   - Специфические особенности для данной модели

ВАЖНЫЕ ТРЕБОВАНИЯ:
- Отвечай ТОЛЬКО фактической информацией из надежных источников
- Если не уверен в артикуле - лучше скажи "не найдено"
- Указывай конкретные бренды аналогов, не придумывай номера
- Для европейских автомобилей приоритет: оригинал > премиум аналоги > бюджет
- Если нет VIN - попроси больше информации (марка, модель, год, двигатель)

ФОРМАТ ОТВЕТА:
🚗 **Автомобиль:** [точная модель с годами]
🔧 **OEM артикул:** [оригинальный номер производителя]
🔄 **Аналоги:** [2-3 проверенных бренда с артикулами]
⚠️ **Рекомендации:** [сопутствующие запчасти и советы]
📋 **Особенности:** [важная информация по замене]

Если информации недостаточно для точного ответа - запроси дополнительные данные у пользователя.

ОТВЕЧАЙ НА РУССКОМ ЯЗЫКЕ, будь точным и профессиональным.
`;
}

// 📤 Отправка сообщения в Telegram
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  });
}

// ⌨️ Отправка индикатора "печатает..."
async function sendTypingAction(chatId: number): Promise<void> {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendChatAction`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      action: 'typing'
    })
  });
}

// 👋 Приветственное сообщение
function getWelcomeMessage(): string {
  return `
🚗 **Добро пожаловать в AutoParts Assistant!**

Я помогу быстро найти автозапчасти по VIN-коду или описанию автомобиля.

**Примеры запросов:**
• \`VIN: WBA3B1C50DF123456, нужны тормозные колодки передние\`
• \`BMW F30 320i 2015, масляный фильтр\`
• \`Mercedes W204 C200 2012, амортизаторы задние\`

**Команды:**
/help - помощь и примеры
/start - показать это сообщение

**Просто напишите VIN-код и название запчасти** - я найду точные артикулы и аналоги! 🔧
`;
}

// ❓ Сообщение помощи
function getHelpMessage(): string {
  return `
🔧 **Как пользоваться ботом:**

**1. С VIN-кодом (самый точный способ):**
\`VIN: WVWZZZ3CZDE123456, нужны передние тормозные колодки\`

**2. Без VIN (укажите марку, модель, год):**
\`Audi A4 B8 2.0 TDI 2010, топливный фильтр\`

**3. По поколению кузова:**
\`BMW E90 320i, свечи зажигания\`

**Что я найду:**
✅ Точные OEM артикулы производителя
✅ Проверенные аналоги (Febi, TRW, Bosch)
✅ Сопутствующие запчасти
✅ Рекомендации по замене

**Поддерживаемые марки:**
BMW, Mercedes, Audi, Volkswagen, Skoda, Opel, Ford, Renault, Peugeot, Citroen и другие европейские марки.

Просто опишите что ищете - я помогу! 🚀
`;
}
