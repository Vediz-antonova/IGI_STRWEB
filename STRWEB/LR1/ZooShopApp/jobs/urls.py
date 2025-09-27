from django.contrib import admin
from django.urls import path, include
from jobs import views

urlpatterns = [
    path('', views.job_list, name='job_list'),
]