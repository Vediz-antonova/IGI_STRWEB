from django.contrib.auth.models import AbstractUser
from django.db import models
import datetime

class User(AbstractUser):
    image = models.ImageField(upload_to='images/', null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    is_employee = models.BooleanField(default=False)

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