from django.shortcuts import render
from datetime import date
import matplotlib.pyplot as plt
import os
from django.conf import settings
from django.db.models import Avg, Count, Sum, F
from orders.models import Order, OrderItem
from users.models import User
from goods.models import Product, Category

def statistics_view(request):
    generate_sales_chart()  # Генерируем графики

    categories = Category.objects.all()
    category_charts = {category: f"{settings.MEDIA_URL}charts/{category.slug}.png" for category in categories}

    # Общая сумма продаж
    total_sales = OrderItem.objects.aggregate(Sum("price"))["price__sum"] or 0

    # Среднее, мода, медиана по сумме продаж
    sales_data = OrderItem.objects.values_list("price", flat=True)
    sales_avg = sum(sales_data) / len(sales_data) if sales_data else 0
    sales_median = sorted(sales_data)[len(sales_data) // 2] if sales_data else 0

    today = date.today()
    user_ages = [
        today.year - user.birth_date.year - ((today.month, today.day) < (user.birth_date.month, user.birth_date.day))
        for user in User.objects.filter(birth_date__isnull=False)
    ]
    age_avg = sum(user_ages) / len(user_ages) if user_ages else 0
    age_median = sorted(user_ages)[len(user_ages) // 2] if user_ages else 0

    # Популярные категории товаров
    popular_categories = Product.objects.annotate(num_orders=Count("orderitem")).filter(num_orders__gt=0).order_by(
        "-num_orders")[:5]

    # Самые прибыльные товары (цена не `None`, количество продаж > 0)
    profitable_products = (
        Product.objects.annotate(total_income=Sum(F("orderitem__price") * F("orderitem__quantity")))
        .filter(orderitem__price__isnull=False, orderitem__quantity__gt=0)
        .order_by("-total_income")[:5])

    context = {
        "category_charts": category_charts,
        "total_sales": total_sales,
        "sales_avg": sales_avg,
        "sales_median": sales_median,
        "age_avg": age_avg,
        "age_median": age_median,
        "popular_categories": popular_categories,
        "profitable_products": profitable_products,
    }
    return render(request, "analytics/statistics.html", context)

def generate_sales_chart():
    categories = Category.objects.all()
    all_products = Product.objects.annotate(
        total_income=Sum(F("orderitem__price") * F("orderitem__quantity"))
    ).filter(total_income__gt=0)

    product_names = [product.name for product in all_products]
    total_incomes = [product.total_income for product in all_products]

    if all_products.exists():
        plt.figure(figsize=(12, 6))
        plt.barh(product_names, total_incomes, color="green")
        plt.xlabel("Доход от продаж (BYN)")
        plt.ylabel("Товары")
        plt.title("Общий доход по всем проданным товарам")

        plt.xticks(rotation=45, ha="right")
        plt.gca().invert_yaxis()

        plt.tight_layout()
        plt.savefig(os.path.join(settings.MEDIA_ROOT, "charts/all.png"))
        plt.close()

    for category in categories:
        products = Product.objects.filter(category=category).annotate(
            total_income=Sum(F("orderitem__price") * F("orderitem__quantity"))
        ).filter(total_income__gt=0)

        if products.exists():
            product_names = [product.name for product in products]
            incomes = [product.total_income for product in products]

            plt.figure(figsize=(10, 5))
            plt.bar(product_names, incomes, color="skyblue")
            plt.xlabel("Товары")
            plt.ylabel("Доход от продаж (BYN)")
            plt.title(f"Доход от продаж: {category.name}")

            plt.xticks(rotation=45, ha="right")
            plt.tight_layout()

            chart_path = os.path.join(settings.MEDIA_ROOT, f"charts/{category.slug}.png")
            os.makedirs(os.path.dirname(chart_path), exist_ok=True)
            plt.savefig(chart_path)
            plt.close()