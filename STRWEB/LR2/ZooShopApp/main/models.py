from django.db import models
from django.utils.timezone import now

class AboutCompany(models.Model):
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    history = models.JSONField(blank=True, null=True)
    requisites = models.TextField(blank=True, null=True)
    certificate = models.TextField(blank=True, null=True)

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

class FAQ(models.Model):
    question = models.TextField(max_length=500)
    answer = models.TextField(max_length=500)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question

class News(models.Model):
    title = models.CharField(max_length=255)
    summary = models.TextField(max_length=500)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.title

class Partner(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='partners/')
    website = models.URLField()

    def __str__(self):
        return self.name
