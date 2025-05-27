from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
import datetime

phone_regex = RegexValidator(
    regex=r'^\+375\s*\(29\)\s*\d{3}-\d{2}-\d{2}$',
    message="Номер должен быть в формате: +375 (29) XXX-XX-XX."
)

class User(AbstractUser):
    image = models.ImageField(upload_to='users/', null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    is_employee = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, validators=[phone_regex], blank=True, null=True)
    job_description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({'Сотрудник' if self.is_employee else 'Клиент'})"

    def is_adult(self):
        """Проверяет, исполнилось ли пользователю 18 лет"""
        if self.birth_date:
            today = datetime.date.today()
            age = today.year - self.birth_date.year - (
                    (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
            )
            return age >= 18
        return False