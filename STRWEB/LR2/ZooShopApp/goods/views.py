from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from django.db.models import Min
from django import forms
from .models import Product, ProductSupply, Supplier, Category
from .forms import ProductForm
from .utils import q_search
from django.utils import timezone
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.urls import reverse

def catalog(request, category_slug=None):
    page=request.GET.get('page', 1)
    order_by = request.GET.get('order_by', None)
    query=request.GET.get('q', None)

    if category_slug == 'all':
        products = Product.objects.all()
    elif query:
        products = q_search(query)
    else:
        products = Product.objects.filter(category__slug=category_slug)

    allowed_sorting_fields = {
        "default_price": ["default_price", "name"],
        "-default_price": ["-default_price", "name"],
        "name": ["name"],
        "-name": ["-name"],
    }
    if order_by in allowed_sorting_fields:
        products = products.order_by(*allowed_sorting_fields[order_by])

    paginator = Paginator(products, 3)
    current_page = paginator.get_page(page)

    context = {
        'title': 'Catalog',
        'products': current_page,
        'slug_url': category_slug,
    }
    return render(request, 'goods/catalog.html', context)

def product(request, product_slug):
    product = Product.objects.get(slug=product_slug)
    suppliers = ProductSupply.objects.filter(product=product)
    context = {
        'product': product,
        'suppliers': suppliers,
    }
    return render(request, 'goods/product.html', context)

def select_supplier(request, product_slug):
    product = Product.objects.get(slug=product_slug)
    suppliers = ProductSupply.objects.filter(product=product)

    if request.method == "POST":
        supplier_id = request.POST.get("supplier_id")
        quantity = int(request.POST.get("quantity"))

        supplier = get_object_or_404(Supplier, id=supplier_id)

        product.quantity += quantity
        product.save()

        messages.success(request, f"Успешно заказано {quantity} шт. у {supplier.name}!")
        return HttpResponseRedirect(reverse('product', args=[product_slug]))

    context = {
        "product": product,
        "suppliers": suppliers,
    }
    return render(request, "goods/select_supplier.html", context)

@login_required
def add_product(request):
    if not request.user.is_employee:
        messages.error(request, "У вас нет прав на добавление товаров.")
        return redirect("catalog", category_slug="all")

    if request.method == "POST":
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                form.save()
                messages.success(request, "Товар успешно добавлен!")
                return redirect("catalog", category_slug="all")
            except forms.ValidationError as e:
                messages.warning(request, str(e))
        else:
            messages.warning(request, "Ошибка при добавлении товара! Проверьте данные.")
    else:
        form = ProductForm()

    categories = Category.objects.all()
    return render(request, "goods/add_product.html", {"form": form, "categories": categories})

@login_required
def delete_product(request, product_id):
    if not request.user.is_employee:
        messages.error(request, "У вас нет прав на удаление товаров.")
        return redirect("catalog", category_slug="all")

    product = get_object_or_404(Product, id=product_id)
    product.delete()
    messages.success(request, "Товар удален!")
    return redirect("catalog", category_slug="all")