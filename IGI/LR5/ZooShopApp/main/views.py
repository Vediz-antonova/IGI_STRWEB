from django.http import HttpResponse
from django.shortcuts import render
from django.utils.timezone import now
from main.models import AboutCompany, Promotional

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

def promotional(request):
    active_coupons = Promotional.objects.filter(expiration_date__gte=now(), is_active=True).order_by('expiration_date')
    expired_coupons = Promotional.objects.filter(expiration_date__lt=now()).order_by('-expiration_date')

    context = {
        'title': 'Promotional Codes',
        'active_coupons': active_coupons,
        'expired_coupons': expired_coupons,
    }
    return render(request, 'main/promotional.html', context)