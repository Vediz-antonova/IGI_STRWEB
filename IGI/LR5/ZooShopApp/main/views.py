from django.http import HttpResponse
from django.shortcuts import render
from goods.models import Category

def index(request):
    categories = Category.objects.all()
    context = {
        'title': 'Home',
        'categories' : categories
    }
    return render(request, 'main/index.html', context)

def about(request):
    context = {
        'title': 'About'
    }
    return render(request, 'main/about.html', context)