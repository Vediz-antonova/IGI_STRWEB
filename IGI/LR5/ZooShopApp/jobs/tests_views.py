from django.test import TestCase
from django.urls import reverse
from jobs.models import Job
from decimal import Decimal

class JobListViewTest(TestCase):
    """Тесты представления `job_list`."""

    def setUp(self):
        self.job = Job.objects.create(
            title="Python Developer",
            description="Требуется разработчик с опытом Django.",
            salary=Decimal("5000.00"),
            location="Минск",
        )

    def test_job_list_page_loads(self):
        """Проверяем, что страница списка вакансий загружается."""
        response = self.client.get(reverse("job_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Python Developer")  # ✅ Проверяем, что вакансия есть на странице
