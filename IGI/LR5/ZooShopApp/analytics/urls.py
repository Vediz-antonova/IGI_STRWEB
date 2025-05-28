from django.urls import path
from analytics.views import statistics_view

urlpatterns = [
    path("", statistics_view, name="statistics"),
]