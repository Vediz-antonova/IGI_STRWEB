from django.contrib import admin
from django.urls import path, include
from orders import views

urlpatterns = [
    path('create-order/', views.create_order, name='create_order'),
]