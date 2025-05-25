from django.shortcuts import render
from .models import Product

def catalog(request):
    products = Product.objects.all()
    context = {
        'title': 'Catalog',
        'products' : products
    }
    return render(request, 'goods/catalog.html', context)

def product(request):
    return render(request, 'goods/product.html')