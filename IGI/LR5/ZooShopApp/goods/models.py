from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator, MinValueValidator
from django.utils import timezone

phone_regex = RegexValidator(
    regex=r'^\\+375\\s*\\(29\\)\\s*\\d{3}-\\d{2}-\\d{2}$',
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

class Product(models.Model):
    """Модель товара, включающая артикул, цену, категории и поставщиков."""
    article = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(blank=True, null=True, upload_to='images/')
    default_price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    suppliers = models.ManyToManyField(Supplier, through='ProductSupply', related_name='products')

    def __str__(self):
        return f'{self.name} ({self.article})'

class ProductSupply(models.Model):
    """Модель поставки товара с указанием количества, даты и цены."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    supply_date = models.DateField(default=timezone.now)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.product.name} от {self.supplier.name} ({self.supply_date})'

class Sale(models.Model):
    """Модель продажи товара с расчетом общей стоимости."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sales')
    sale_date = models.DateField(default=timezone.now)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f'Продажа {self.product.name} от {self.sale_date}'