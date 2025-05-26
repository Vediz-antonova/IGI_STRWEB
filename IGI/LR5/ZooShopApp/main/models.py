from django.db import models

class AboutCompany(models.Model):
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'{self.description}'