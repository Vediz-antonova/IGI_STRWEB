import logging

logger = logging.getLogger("django")

def my_view(request):
    logger.info("Запрос получен")
    try:
        logger.debug("Обрабатываем данные...")
    except Exception as e:
        logger.error(f"Ошибка: {e}")