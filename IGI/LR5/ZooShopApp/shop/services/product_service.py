from shop.models import Product

def get_product_by_id(product_id: int) -> Product:
    """
    Получает товар по идентификатору.
    """
    try:
        return Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return None

def update_product_price(product: Product, new_price: float) -> None:
    """
    Обновляет базовую (default) цену товара.
    """
    product.default_price = new_price
    product.save()