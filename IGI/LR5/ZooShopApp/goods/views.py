from django.shortcuts import render

from .models import Product

def catalog(request, category_slug):

    if category_slug == 'all':
        products = Product.objects.all()
    else:
        products = Product.objects.filter(category__slug=category_slug)

    context = {
        'title': 'Catalog',
        'products' : products
    }
    return render(request, 'goods/catalog.html', context)

def product(request, product_slug):
    product = Product.objects.get(slug=product_slug)
    context = {
        'product' : product,
    }
    return render(request, 'goods/product.html', context)