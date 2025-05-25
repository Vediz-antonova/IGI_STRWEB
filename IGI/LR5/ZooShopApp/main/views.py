from django.http import HttpResponse
from django.shortcuts import render

def index(request):

    context = {
        'title': 'Home'
    }
    return render(request, 'main/index.html', context)

def about(request):
    context = {
        'title': 'About'
    }
    return render(request, 'main/about.html', context)