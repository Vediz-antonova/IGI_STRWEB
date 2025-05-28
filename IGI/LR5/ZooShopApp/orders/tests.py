from django.test import TestCase
from users.models import User
from goods.models import Product, Category
from orders.models import Order, OrderItem
from decimal import Decimal

class OrderModelTest(TestCase):
    """Тесты модели `Order`."""

    def setUp(self):
        self.user = User.objects.create(username="testuser", first_name="Анна", last_name="Иванова")
        self.order = Order.objects.create(
            user=self.user,
            phone_number="+375 (29) 123-45-67",
            requires_delivery=True,
            delivery_address="Минск, проспект Независимости",
            payment_on_get=False,
            status="Подтвержден",
        )

    def test_order_creation(self):
        """Проверяем, что заказ создается корректно."""
        self.assertEqual(self.order.user, self.user)
        self.assertEqual(self.order.status, "Подтвержден")
        self.assertTrue(self.order.requires_delivery)

    def test_order_str(self):
        """Проверяем метод `__str__()`."""
        self.assertEqual(str(self.order), "Заказ № 1 | Покупатель Анна Иванова")


class OrderItemModelTest(TestCase):
    """Тесты модели `OrderItem`."""

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
        self.order = Order.objects.create(user=self.user, phone_number="+375 (29) 123-45-67")
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            name="Смартфон",
            price=Decimal("799.99"),
            quantity=2,
        )

    def test_order_item_creation(self):
        """Проверяем, что `OrderItem` создается корректно."""
        self.assertEqual(self.order_item.order, self.order)
        self.assertEqual(self.order_item.product, self.product)
        self.assertEqual(self.order_item.quantity, 2)

    def test_order_item_price_calculation(self):
        """Проверяем расчет стоимости товаров."""
        self.assertEqual(self.order_item.products_price(), Decimal("1599.98"))
