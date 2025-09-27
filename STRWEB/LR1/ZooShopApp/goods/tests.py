from django.test import TestCase
from goods.models import Product, Category, Supplier
from django.utils.text import slugify
from decimal import Decimal

class ProductModelTest(TestCase):
    """Тесты модели `Product`."""

    def setUp(self):
        self.category = Category.objects.create(name="Электроника", slug="electronics")
        self.supplier = Supplier.objects.create(name="Best Supplier", address="Минск, ул. Победителей", phone="+375 (29) 123-45-67")
        self.product = Product(
            article="12345",
            name="Смартфон",
            category=self.category,
            quantity=10,
            default_price=Decimal("799.99"),
        )
        self.product.save()
        self.product.refresh_from_db()

    def test_product_creation(self):
        """Проверяем, что продукт создается корректно."""
        self.assertEqual(self.product.name, "Смартфон")
        self.assertEqual(self.product.category, self.category)
        self.assertEqual(self.product.quantity, 10)
        self.assertEqual(self.product.default_price, Decimal("799.99"))

class CategoryModelTest(TestCase):
    """Тесты модели `Category`."""

    def test_category_creation(self):
        category = Category.objects.create(name="Одежда", slug="clothes")
        self.assertEqual(category.name, "Одежда")
        self.assertEqual(category.slug, "clothes")

class SupplierModelTest(TestCase):
    """Тесты модели `Supplier`."""

    def test_supplier_creation(self):
        supplier = Supplier.objects.create(name="Tech Supplier", address="Минск, ул. Ленина", phone="+375 (29) 987-65-43")
        self.assertEqual(supplier.name, "Tech Supplier")
        self.assertEqual(supplier.phone, "+375 (29) 987-65-43")
