// local-test.ts - Файл для локального тестирования бота
// Запуск: npx ts-node local-test.ts

import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Импортируем функцию из webhook
// import handler from './api/webhook';

// Функция для тестирования промпта локально
async function testPerplexityPrompt(userMessage: string) {
  console.log('🧪 Тестируем промпт для сообщения:', userMessage);
  
  const prompt = createExpertPrompt(userMessage);
  console.log('📝 Созданный промпт:');
  console.log('='.repeat(50));
  console.log(prompt);
  console.log('='.repeat(50));
  
  // Можно раскомментировать для реального вызова API
  /*
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    console.log('🤖 Ответ от Perplexity:');
    console.log(data.choices[0].message.content);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  */
}

// Промпт функция (копия из webhook.ts)
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

// Тестовые сценарии
async function runTests() {
  console.log('🚀 Запуск тестов промптов...\n');
  
  const testCases = [
    'VIN: WBA3B1C50DF123456, нужны тормозные колодки передние',
    'BMW F30 320i 2015, масляный фильтр',
    'Mercedes W204 C200 2012, амортизаторы задние',
    'Audi A4 B8 2.0 TDI 2010'
  ];
  
  for (const testCase of testCases) {
    await testPerplexityPrompt(testCase);
    console.log('\n' + '-'.repeat(80) + '\n');
  }
}

// Запуск тестов
if (require.main === module) {
  runTests();
}
