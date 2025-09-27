from django.urls import reverse
from goods.models import Product, Category
from decimal import Decimal
from django.test import TestCase

class CatalogViewTest(TestCase):
    """Тесты представления `catalog`."""

    def setUp(self):
        self.category = Category.objects.create(name="Техника", slug="tech")
        self.product = Product.objects.create(
            article="54321",
            name="Ноутбук",
            slug="laptop",
            category=self.category,
            quantity=5,
            default_price=Decimal("1499.99"),
        )

    def test_catalog_page(self):
        """Проверяем, что страница каталога загружается и содержит продукт."""
        response = self.client.get(reverse("catalog", args=["all"]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Ноутбук")  # ✅ Проверяем, что товар есть на странице

    def test_catalog_filter_by_category(self):
        """Проверяем, что можно фильтровать каталог по категории."""
        response = self.client.get(reverse("catalog", args=["tech"]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Ноутбук")

class ProductViewTest(TestCase):
    """Тесты представления `product`."""

    def setUp(self):
        self.category = Category.objects.create(name="Техника", slug="tech")
        self.product = Product.objects.create(
            article="54321",
            name="Ноутбук",
            slug="laptop",
            category=self.category,
            quantity=5,
            default_price=Decimal("1499.99"),
        )

    def test_product_page(self):
        """Проверяем, что страница товара загружается."""
        response = self.client.get(reverse("product", args=["laptop"]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Ноутбук")  # ✅ Проверяем, что товар есть на странице
