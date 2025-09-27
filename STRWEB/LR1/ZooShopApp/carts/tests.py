from django.test import TestCase
from users.models import User
from goods.models import Product, Category
from carts.models import Cart
from decimal import Decimal

class CartModelTest(TestCase):
    """Тесты модели `Cart`."""

    def setUp(self):
        self.user = User.objects.create(username="testuser")
        self.category = Category.objects.create(name="Электроника", slug="electronics")
        self.product = Product.objects.create(
            article="12345",
            name="Смартфон",
            category=self.category,
            quantity=10,
            default_price=Decimal("799.99"),
        )
        self.cart = Cart.objects.create(user=self.user, product=self.product, quantity=2)

    def test_cart_creation(self):
        """Проверяем, что корзина создается корректно."""
        self.assertEqual(self.cart.user, self.user)
        self.assertEqual(self.cart.product, self.product)
        self.assertEqual(self.cart.quantity, 2)

    def test_cart_products_price(self):
        """Проверяем расчет общей стоимости товаров."""
        self.assertEqual(self.cart.products_price(), Decimal("1599.98"))