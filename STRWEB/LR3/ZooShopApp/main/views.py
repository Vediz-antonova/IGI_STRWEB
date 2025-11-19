from django.http import HttpResponse
from django.shortcuts import render
from django.utils.timezone import now
from main.models import AboutCompany, Promotional, FAQ, News, Partner
from users.models import User
from goods.models import Supplier, ProductSupply
from .models import Employee
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.shortcuts import redirect
import json
import random
import requests
import calendar
import datetime

def generate_calendar():
    """Функция для генерации календаря"""
    today = datetime.date.today()
    c = calendar.HTMLCalendar()
    return c.formatmonth(today.year, today.month)

slider_config_state = {
    "loop": True,
    "navs": True,
    "pags": True,
    "auto": True,
    "stopMouseHover": True,
    "delay": 5
}

@require_POST
def update_slider_config(request):
    slider_config_state["loop"] = bool(request.POST.get("loop"))
    slider_config_state["navs"] = bool(request.POST.get("navs"))
    slider_config_state["pags"] = bool(request.POST.get("pags"))
    slider_config_state["auto"] = bool(request.POST.get("auto"))
    slider_config_state["stopMouseHover"] = bool(request.POST.get("stopMouseHover"))
    try:
        slider_config_state["delay"] = max(1, int(request.POST.get("delay", 5)))
    except ValueError:
        slider_config_state["delay"] = 5

    return redirect("index")

def index(request):
    latest_article = News.objects.order_by("-id").first()
    partners = Partner.objects.all()

    slides = [
        {
            "image": "images/banner1.jpg",
            "text": "Аксессуары для питомцев, недорого)",
            "link": "/catalog/aksessuary/"
        },
        {
            "image": "images/banner2.jpg",
            "text": "Акция на корма!",
            "link": "/catalog/korm/"
        },
        {
            "image": "images/banner3.jpg",
            "text": "Игрушки для питомцев",
            "link": "/catalog/igrushki/"
        }
    ]

    context = {
        'title': 'Главная',
        'month_calendar': generate_calendar(),
        'latest_article': latest_article,
        'partners': partners,
        'seaweed_positions': list(range(0, 1200, 200)),
        'slides': slides,
        'slider_config': slider_config_state
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

@csrf_exempt
def add_employee_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            employee = Employee.objects.create(
                name=data.get("name"),
                phone=data.get("phone"),
                email=data.get("email"),
                job_description=data.get("job_description"),
                image=data.get("image"),
            )
            return JsonResponse({"status": "success", "id": employee.id})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)

def contacts_api(request):
    employees = Employee.objects.all()
    data = [
        {
            "name": e.name,
            "phone": e.phone,
            "email": e.email,
            "job_description": e.job_description,
            "image": e.image,
        }
        for e in employees
    ]
    return JsonResponse({"employees": data})

def contact(request):
    employees = Employee.objects.all()
    context = {
        "title": "Контакты",
        "employees": employees,
    }
    return render(request, "main/contact.html", context)

def contacts_table(request):
    return render(request, "main/contacts_table.html", {"title": "Таблица сотрудников"})



API_KEY = "9b9791430dae4f92afdb02bbb56defdf"
TOPICS = ["pets", "pet food", "dogs", "cats", "birds", "exotic pets", "pet toys"]

def news(request):
    random_topic = random.choice(TOPICS)
    NEWS_URL = f"https://newsapi.org/v2/everything?q={random_topic}&apiKey={API_KEY}"

    response = requests.get(NEWS_URL)
    news_data = response.json().get("articles", [])

    random.shuffle(news_data)

    news_list = []
    for article in news_data[:5]:
        news_list.append({
            "title": article["title"],
            "summary": article["description"],
            "image_url": article["urlToImage"],
        })

    local_news_objects = News.objects.order_by("-id")[:2]

    external_news_objects = []
    for article in news_data[:5]:
        external_news_objects.append({
            "title": article["title"],
            "summary": article["description"],
            "image_url": article["urlToImage"],
            "publish_date": None,
            "external": True,
        })

    combined_news = list(local_news_objects) + external_news_objects

    cat_response = requests.get("https://catfact.ninja/facts")
    cat_facts = cat_response.json().get("data", [])[:3]

    context = {
        "title": "Новости",
        "news_list": combined_news,
        "cat_facts": [fact["fact"] for fact in cat_facts],
    }
    return render(request, "main/news.html", context)

def news_detail(request, pk):
    news = get_object_or_404(News, pk=pk)
    return render(request, 'news_detail.html', {'news': news})

@login_required
def supplier_list(request):
    if not request.user.is_employee:
        return render(request, "403.html")

    suppliers = Supplier.objects.all()

    supplier_data = []
    for supplier in suppliers:
        products = ProductSupply.objects.filter(supplier=supplier).values_list("product__name", flat=True).distinct()
        supplier_data.append({"supplier": supplier, "products": ", ".join(products)})  # Объединяем названия в строку

    context = {"supplier_data": supplier_data}
    return render(request, "main/supplier_list.html", context)