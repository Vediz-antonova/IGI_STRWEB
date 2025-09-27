from django.test import TestCase
from django.urls import reverse
from users.models import User
from goods.models import Product, Category
from carts.models import Cart
from decimal import Decimal

class CartViewTest(TestCase):
    """Тесты представлений корзины."""

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
        self.cart = Cart.objects.create(user=self.user, product=self.product, quantity=1)

    def test_cart_add(self):
        """Проверяем добавление товара в корзину."""
        self.client.force_login(self.user)  # ✅ Логиним пользователя
        response = self.client.post(reverse("cart_add"), {"product_id": self.product.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 1)
        self.assertEqual(Cart.objects.get(user=self.user).quantity, 2)  # ✅ Должно увеличиться до 2

    def test_cart_change(self):
        """Проверяем изменение количества товара."""
        self.client.force_login(self.user)
        response = self.client.post(reverse("cart_change"), {"cart_id": self.cart.id, "quantity": 3})
        self.assertEqual(response.status_code, 200)
        self.cart.refresh_from_db()
        self.assertEqual(self.cart.quantity, 3)  # ✅ Должно измениться на 3

    def test_cart_remove(self):
        """Проверяем удаление товара из корзины."""
        self.client.force_login(self.user)
        response = self.client.post(reverse("cart_remove"), {"cart_id": self.cart.id})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Cart.objects.filter(id=self.cart.id).exists())  # ✅ Должно удалиться
