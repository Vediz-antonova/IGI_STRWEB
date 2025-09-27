from django.contrib import admin
from django.urls import path, include
from users import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('registration/', views.registration, name='registration'),
    path('profile/', views.profile, name='profile'),
    path('users-cart/', views.users_cart, name='users-cart'),
    path('logout/', views.logout, name='logout'),
    path("users/", views.user_list, name="user_list"),
    path("admin_orders/", views.admin_orders, name="admin_orders"),
]