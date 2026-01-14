from django.test import TestCase
from django.urls import reverse
from users.models import User
from django.contrib.auth import get_user_model


class UserViewTest(TestCase):
    """Тесты представлений `login`, `registration`, `profile`."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="testuser", password="password123")

    def test_login_view(self):
        """Проверяем вход пользователя."""
        response = self.client.post(reverse("login"), {"username": "testuser", "password": "password123"})
        self.assertEqual(response.status_code, 302)  # ✅ Должен быть редирект на `profile`

    def test_profile_view(self):
        """Проверяем доступ к профилю."""
        self.client.force_login(self.user)
        response = self.client.get(reverse("profile"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "testuser")  # ✅ Должно отображаться имя пользователя
