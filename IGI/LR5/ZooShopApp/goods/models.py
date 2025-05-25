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
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20, validators=[phone_regex])

    def __str__(self):
        return self.name

class Category(models.Model):
    """Модель категории товара."""
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Product(models.Model):
    """Модель товара, включающая артикул, цену, категории и поставщиков."""
    article = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    default_price = models.DecimalField(max_digits=10, decimal_places=2)
    categories = models.ManyToManyField(Category, related_name='products')
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

class Client(models.Model):
    """Модель клиента с привязкой к учетной записи пользователя."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    phone = models.CharField(max_length=20, validators=[phone_regex])
    age = models.PositiveIntegerField(validators=[MinValueValidator(18)])
    email = models.EmailField()

    def __str__(self):
        return self.user.username

class Employee(models.Model):
    """Модель сотрудника с указанием должности и контактной информации."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    position = models.CharField(max_length=255)
    age = models.PositiveIntegerField(validators=[MinValueValidator(18)])
    phone = models.CharField(max_length=20, validators=[phone_regex])

    def __str__(self):
        return f'{self.user.username} — {self.position}'

class Article(models.Model):
    """Модель статьи с заголовком, содержанием, изображением и датой публикации."""
    title = models.CharField(max_length=255)
    short_content = models.CharField(max_length=512)
    full_content = models.TextField()
    image = models.ImageField(upload_to='articles/', null=True, blank=True)
    pub_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title

class Term(models.Model):
    """Модель часто задаваемых вопросов и ответов."""
    question = models.CharField(max_length=255)
    answer = models.TextField()
    created_at = models.DateField(default=timezone.now)

    def __str__(self):
        return self.question

class Contact(models.Model):
    """Модель контактов, включая фото, роль и данные связи."""
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    photo = models.ImageField(upload_to='contacts/', null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, validators=[phone_regex])

    def __str__(self):
        return self.name

class Vacancy(models.Model):
    """Модель вакансии с описанием."""
    title = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return self.title

class Review(models.Model):
    """Модель отзыва клиента с рейтингом и текстом комментария."""
    reviewer_name = models.CharField(max_length=255)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    text = models.TextField()
    created_at = models.DateField(default=timezone.now)

    def __str__(self):
        return f'Отзыв от {self.reviewer_name}'

class PromoCode(models.Model):
    """Модель промокода с датами активности."""
    code = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField(default=timezone.now)
    valid_to = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.code