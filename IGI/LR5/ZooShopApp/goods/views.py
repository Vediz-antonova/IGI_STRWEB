from django.shortcuts import render, get_list_or_404
from django.core.paginator import Paginator

from .models import Product

def catalog(request, category_slug):
    page=request.GET.get('page', 1)
    order_by = request.GET.get('order_by', None)

    if category_slug == 'all':
        products = Product.objects.all()
    else:
        products = get_list_or_404(Product.objects.filter(category__slug=category_slug))

    if order_by and order_by != 'default':
        products = products.order_by(order_by)

    paginator = Paginator(products, 3)
    current_page = paginator.page(int(page))

    context = {
        'title': 'Catalog',
        'products' : current_page,
        'slug_url': category_slug,
    }
    return render(request, 'goods/catalog.html', context)

def product(request, product_slug):
    product = Product.objects.get(slug=product_slug)
    context = {
        'product' : product,
    }
    return render(request, 'goods/product.html', context)