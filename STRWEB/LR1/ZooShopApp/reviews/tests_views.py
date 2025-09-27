from django.test import TestCase
from django.urls import reverse
from users.models import User
from reviews.models import Review

class ReviewListViewTest(TestCase):
    """Тесты представления `review_list`."""

    def setUp(self):
        self.user = User.objects.create(username="testuser")
        self.review = Review.objects.create(
            user=self.user,
            rating=4,
            text="Хороший опыт, но есть куда улучшаться!",
        )

    def test_review_list_page_loads(self):
        """Проверяем, что страница отзывов загружается."""
        response = self.client.get(reverse("review_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Хороший опыт")  # ✅ Проверяем, что отзыв есть на странице
