

### **Техническая Спецификация: Модульные API-Клиенты "Артикулятор"**

*   **Версия:** 2.2
*   **Дата:** 24 июля 2025 г.
*   **Целевая AI-модель:** Sonnet 4
*   **Основная Задача:** Создать Python-файл `api_clients.py`, содержащий три независимых функции для взаимодействия с внешними API. Каждая функция должна быть самодостаточной и тестируемой.

#### **1. Общие Принципы Разработки**

*   **Модульность:** Каждая функция должна отвечать только за один API и не зависеть от других.
*   **Управление Секретами:** Все ключи должны считываться из переменных окружения с помощью `python-dotenv`. Файл `.env` не должен быть включен в Git.
*   **Надежность:** Все сетевые запросы должны быть обернуты в блоки `try...except requests.exceptions.RequestException` и иметь разумный `timeout` (например, 15 секунд).
*   **Обработка Ошибок:** В случае HTTP-ошибки (статус-код не 2xx) или сетевого сбоя, функция должна вывести в консоль информативное сообщение об ошибке и вернуть `None`. Это позволит вызывающему коду понять, что произошел сбой.

#### **2. Модуль А: Клиент для VIN Decoder API**

*   **Назначение:** Получение точных данных об автомобиле по его VIN-коду.
*   **Функция:**
    ```python
    def get_car_info_by_vin(vin_code: str) -> dict | None:
        """
        Отправляет запрос к VIN Decoder API и возвращает структурированные данные об авто.
        Возвращает None в случае ошибки.
        """
    ```
*   **Детали Запроса:**
    *   **Метод:** `GET`
    *   **URL:** `https://car-net-vin-decoder.p.rapidapi.com/vin`
    *   **Headers:**
        ```json
        {
          "X-RapidAPI-Key": "ВАШ_RAPIDAPI_KEY",
          "X-RapidAPI-Host": "car-net-vin-decoder.p.rapidapi.com"
        }
        ```
    *   **Query Parameters:**
        ```json
        { "vin": vin_code }
        ```
*   **Логика:**
    1.  Сформировать и выполнить запрос.
    2.  При успешном ответе (статус-код 200), вернуть весь JSON-объект ответа.
    3.  При любой ошибке, вернуть `None`.

#### **3. Модуль Б: Клиент для Parts Catalog API**

*   **Назначение:** Поиск OEM-артикулов и их аналогов. Состоит из двух шагов.
*   **Функция:**
    ```python
    def get_parts_from_catalog(car_data: dict, part_query: str) -> dict | None:
        """
        Оркестрирует поиск запчастей: сначала ищет OEM, затем аналоги.
        car_data должен содержать ключи 'make', 'model', 'year'.
        Возвращает словарь с OEM и аналогами или None в случае ошибки.
        """
    ```
*   **Шаг 3.1: Внутренняя функция для поиска OEM**
    *   **Детали Запроса:**
        *   **Метод:** `GET`
        *   **URL:** `https://generic-parts-api.p.rapidapi.com/parts/search`
        *   **Headers:** (Аналогичные, но с хостом `generic-parts-api.p.rapidapi.com`)
        *   **Query Parameters:**
            ```json
            {
              "make": car_data['make'],
              "model": car_data['model'],
              "year": car_data['year'],
              "query": part_query
            }
            ```
    *   **Логика:**
        1.  Выполнить запрос.
        2.  Проанализировать массив `parts` в ответе. Найти первый элемент, где `brand` (в верхнем регистре) соответствует "HYUNDAI", "KIA" или "MOBIS".
        3.  Вернуть найденный `article` (артикул). Если ничего не найдено, вернуть `None`.

*   **Шаг 3.2: Внутренняя функция для поиска аналогов**
    *   **Детали Запроса:**
        *   **Метод:** `GET`
        *   **URL:** `https://generic-parts-api.p.rapidapi.com/parts/cross-reference`
        *   **Headers:** (те же)
        *   **Query Parameters:**
            ```json
            { "article": "НАЙДЕННЫЙ_OEM_АРТИКУЛ" }
            ```
    *   **Логика:**
        1.  Выполнить запрос.
        2.  При успехе, вернуть массив `analogs` из ответа. Если массив пуст или произошла ошибка, вернуть пустой список `[]`.

*   **Логика основной функции `get_parts_from_catalog`:**
    1.  Вызвать внутреннюю функцию для поиска OEM.
    2.  Если OEM не найден, вернуть `None`.
    3.  Если OEM найден, вызвать внутреннюю функцию для поиска аналогов.
    4.  Вернуть словарь: `{"oem_article": найденный_oem, "analogs": список_аналогов}`.

#### **4. Модуль В: Клиент для Perplexity API**

*   **Назначение:** Получение контекстной информации и подтверждений из открытых источников.
*   **Функция:**
    ```python
    def get_context_from_perplexity(car_data: dict, part_query: str) -> str | None:
        """
        Формирует вопрос для Perplexity API и возвращает текстовый ответ.
        Возвращает None в случае ошибки.
        """
    ```
*   **Детали Запроса:**
    *   **Метод:** `POST`
    *   **URL:** `https://api.perplexity.ai/chat/completions`
    *   **Headers:**
        ```json
        {
          "Authorization": "Bearer ВАШ_PERPLEXITY_API_KEY",
          "Content-Type": "application/json"
        }
        ```
    *   **Тело Запроса (JSON Body):**
        ```json
        {
          "model": "sonar-small-online",
          "messages": [
            { "role": "system", "content": "You are a precise car parts assistant. Provide a concise factual answer with sources about part numbers." },
            { "role": "user", "content": "Сформированный_вопрос_пользователя" }
          ]
        }
        ```
*   **Логика:**
    1.  **Сгенерировать `content` для `user`:** Динамически создать строку, используя данные из `car_data` и `part_query`. Пример: `f"What are the OEM and top aftermarket part numbers for a '{part_query}' on a {car_data['year']} {car_data['make']} {car_data['model']}?"`.
    2.  Выполнить POST-запрос.
    3.  При успешном ответе, извлечь и вернуть текстовое содержимое из `response.json()['choices'][0]['message']['content']`.
    4.  При любой ошибке, вернуть `None`.

#### **5. Тестовый блок для локальной проверки**

В конце файла `api_clients.py` добавь блок `if __name__ == "__main__":` для тестирования каждой функции по отдельности.

```python
if __name__ == "__main__":
    # --- Тестовые данные ---
    TEST_VIN = "KMHBT51GP9U910600"
    TEST_QUERY = "timing kit"

    print("--- ЗАПУСК ТЕСТА МОДУЛЯ А: VIN DECODER ---")
    test_car_data = get_car_info_by_vin(TEST_VIN)
    print(test_car_data)

    if test_car_data:
        print("\n--- ЗАПУСК ТЕСТА МОДУЛЯ Б: PARTS CATALOG ---")
        parts_info = get_parts_from_catalog(test_car_data, TEST_QUERY)
        print(parts_info)

        print("\n--- ЗАПУСК ТЕСТА МОДУЛЯ В: PERPLEXITY ---")
        context_info = get_context_from_perplexity(test_car_data, TEST_QUERY)
        print(context_info)```
---
