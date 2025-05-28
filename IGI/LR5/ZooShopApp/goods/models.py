from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.core.validators import RegexValidator, MinValueValidator
from django.utils import timezone

phone_regex = RegexValidator(
    regex=r'^\+375\s*\(29\)\s*\d{3}-\d{2}-\d{2}$',
    message="Номер должен быть в формате: +375 (29) XXX-XX-XX."
)

class Supplier(models.Model):
    """Модель поставщика товаров."""
    name = models.CharField(max_length=255, unique=True)
    address = models.TextField()
    phone = models.CharField(max_length=20, validators=[phone_regex])

    def __str__(self):
        return self.name

class Category(models.Model):
    """Модель категории товара."""
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)

    def __str__(self):
        return self.name

class ProductQuerySet(models.QuerySet):
    ...

class Product(models.Model):
    """Модель товара, включающая артикул, цену, категории и поставщиков."""
    article = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(blank=True, null=True, upload_to='goods_images/', default='images/Not found image.png')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(0)], default=0)
    default_price = models.DecimalField(max_digits=10, decimal_places=2)

    objects = ProductQuerySet.as_manager()

    def __str__(self):
        return f'{self.name} ({self.article})'

    class Meta:
        ordering = ('name',)

    def save(self, *args, **kwargs):
        """Автоматически создаем `slug` из `name`, если он пустой"""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class ProductSupply(models.Model):
    """Модель поставки товара с указанием количества, даты и цены."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    supply_date = models.DateField(default=timezone.now)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    new_price_date = models.DateField(blank=True, null=True)
    new_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return f'{self.product.name} от {self.supplier.name} ({self.supply_date})'