from django.http import HttpResponse
from django.shortcuts import render
from django.utils.timezone import now
from main.models import AboutCompany, Promotional, FAQ
import calendar
import datetime

def generate_calendar():
    """Функция для генерации календаря"""
    today = datetime.date.today()
    c = calendar.HTMLCalendar()
    return c.formatmonth(today.year, today.month)

def index(request):

    context = {
        'title': 'Home',
        'month_calendar': generate_calendar()
    }
    return render(request, 'main/index.html', context)

def about(request):
    about_text = AboutCompany.objects.first()
    context = {
        'title': 'About',
        'content': about_text,
        'month_calendar': generate_calendar()
    }
    return render(request, 'main/about.html', context)

def privacy_policy(request):
    context = {
        'title': 'Privacy policy',
        'month_calendar': generate_calendar()
    }
    return render(request, 'main/privacy_policy.html', context)

def promotional(request):
    active_coupons = Promotional.objects.filter(expiration_date__gte=now(), is_active=True).order_by('expiration_date')
    expired_coupons = Promotional.objects.filter(expiration_date__lt=now()).order_by('-expiration_date')

    context = {
        'title': 'Promotional Codes',
        'active_coupons': active_coupons,
        'expired_coupons': expired_coupons,
        'month_calendar': generate_calendar()
    }
    return render(request, 'main/promotional.html', context)

def faq(request):
    faqs = FAQ.objects.order_by('-updated_at')  # Сортировка: сначала свежие вопросы

    context = {
        'title': 'FAQ - Часто задаваемые вопросы',
        'faqs': faqs,
    }
    return render(request, 'main/faq.html', context)