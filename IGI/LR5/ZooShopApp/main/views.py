from django.http import HttpResponse
from django.shortcuts import render

from main.models import AboutCompany


def index(request):

    context = {
        'title': 'Home'
    }
    return render(request, 'main/index.html', context)

def about(request):
    about_text = AboutCompany.objects.first()
    context = {
        'title': 'About',
        'content': about_text
    }
    return render(request, 'main/about.html', context)

def privacy_policy(request):
    context = {
        'title': 'Privacy policy'
    }
    return render(request, 'main/privacy_policy.html', context)