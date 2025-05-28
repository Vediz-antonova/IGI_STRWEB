from django.test import TestCase
from jobs.models import Job
from decimal import Decimal

class JobModelTest(TestCase):
    """Тесты модели `Job`."""

    def setUp(self):
        self.job = Job.objects.create(
            title="Python Developer",
            description="Требуется разработчик с опытом Django.",
            salary=Decimal("5000.00"),
            location="Минск",
        )

    def test_job_creation(self):
        """Проверяем, что вакансия создается корректно."""
        self.assertEqual(self.job.title, "Python Developer")
        self.assertEqual(self.job.description, "Требуется разработчик с опытом Django.")
        self.assertEqual(self.job.salary, Decimal("5000.00"))
        self.assertEqual(self.job.location, "Минск")

    def test_str_method(self):
        """Проверяем, что `__str__()` возвращает название вакансии."""
        self.assertEqual(str(self.job), "Python Developer")
