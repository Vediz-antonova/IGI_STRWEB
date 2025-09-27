from django.test import TestCase
from users.models import User
import datetime


class UserModelTest(TestCase):
    """Тесты модели `User`."""

    def setUp(self):
        self.user = User.objects.create(
            username="testuser",
            first_name="Анна",
            last_name="Иванова",
            birth_date=datetime.date(2000, 5, 20),
            phone="+375 (29) 123-45-67",
            is_employee=True,
            job_description="Менеджер по продажам",
        )

    def test_user_creation(self):
        """Проверяем, что пользователь создается корректно."""
        self.assertEqual(self.user.username, "testuser")
        self.assertEqual(self.user.first_name, "Анна")
        self.assertEqual(self.user.last_name, "Иванова")
        self.assertEqual(self.user.phone, "+375 (29) 123-45-67")
        self.assertTrue(self.user.is_employee)

    def test_user_str_method(self):
        """Проверяем метод `__str__()`."""
        self.assertEqual(str(self.user), "testuser (Сотрудник)")

    def test_is_adult(self):
        """Проверяем метод `is_adult()`."""
        self.assertTrue(self.user.is_adult())  # ✅ Должен быть взрослым (24 года)

        underage_user = User.objects.create(username="younguser", birth_date=datetime.date(2010, 6, 15))
        self.assertFalse(underage_user.is_adult())  # ✅ Должен быть несовершеннолетним
