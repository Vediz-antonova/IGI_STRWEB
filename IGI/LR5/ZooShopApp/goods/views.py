from django.shortcuts import render, get_list_or_404
from django.core.paginator import Paginator
from django.db.models import Min
from .models import Product, ProductSupply
from .utils import q_search

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

    products = products.annotate(default_price=Min("productsupply__unit_price"))

    allowed_sorting_fields = ["default_price", "-default_price", "name", "-name"]
    if order_by in allowed_sorting_fields:
        products = products.order_by(order_by)

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
    prodSupply = ProductSupply.objects.filter(product=product) or None
    context = {
        'product' : product,
        'prodSupply' : prodSupply,
    }
    return render(request, 'goods/product.html', context)