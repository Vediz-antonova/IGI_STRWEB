from django.urls import reverse
from django.test import TestCase
from goods.models import Category, Product
from users.models import User
from orders.models import Order, OrderItem
from decimal import Decimal
from datetime import date

class AnalyticsViewTest(TestCase):
    """Тесты представления `statistics_view`."""

    def setUp(self):
        self.category = Category.objects.create(name="Электроника", slug="electronics")
        self.user = User.objects.create(username="testuser", birth_date=date(1995, 5, 20))

        self.product = Product.objects.create(
            article="12345",
            name="Смартфон",
            category=self.category,
            quantity=10,
            default_price=Decimal("799.99"),
        )

        self.order = Order.objects.create(user=self.user, phone_number="+375 (29) 123-45-67")
        OrderItem.objects.create(order=self.order, product=self.product, name="Смартфон", price=Decimal("799.99"), quantity=2)

    def test_statistics_page_loads(self):
        """Проверяем, что страница статистики загружается."""
        response = self.client.get(reverse("statistics"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Общая сумма продаж")  # ✅ Проверяем, что данные отображаются
        self.assertContains(response, "799.99")  # ✅ Проверяем, что цена товара есть на странице
