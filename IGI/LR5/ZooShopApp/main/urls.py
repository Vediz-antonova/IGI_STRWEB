from django.contrib import admin
from django.urls import path, include
from main import views

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('privacy_policy/', views.privacy_policy, name='privacy_policy'),
    path('promotional/', views.promotional, name='promotional'),
    path('faq/', views.faq, name='faq'),
    path('contact/', views.contact, name='contact'),
    path('news/', views.news, name='news'),
    path('news/<int:pk>/', views.news_detail, name='news_detail'),
    path("suppliers/", views.supplier_list, name="supplier_list"),
]