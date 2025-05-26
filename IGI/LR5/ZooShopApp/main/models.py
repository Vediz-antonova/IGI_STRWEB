from django.db import models
from django.utils.timezone import now

class AboutCompany(models.Model):
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'{self.description}'

class Promotional(models.Model):
    code = models.CharField(max_length=20, unique=True)
    discount = models.DecimalField(max_digits=5, decimal_places=2)
    expiration_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.code} - {self.discount}%'

    @property
    def expired(self):
        return self.expiration_date < now()