from django.test import TestCase
from users.models import User
from reviews.models import Review

class ReviewModelTest(TestCase):
    """Тесты модели `Review`."""

    def setUp(self):
        self.user = User.objects.create(username="testuser")
        self.review = Review.objects.create(
            user=self.user,
            rating=5,
            text="Отличный сервис! Все понравилось!",
        )

    def test_review_creation(self):
        """Проверяем, что отзыв создается корректно."""
        self.assertEqual(self.review.user, self.user)
        self.assertEqual(self.review.rating, 5)
        self.assertEqual(self.review.text, "Отличный сервис! Все понравилось!")

    def test_review_str_method(self):
        """Проверяем, что `__str__()` возвращает корректную строку."""
        self.assertEqual(str(self.review), "Отзыв testuser - 5 ⭐")
