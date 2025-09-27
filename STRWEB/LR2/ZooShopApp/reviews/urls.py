from django.urls import path
from reviews.views import review_list, add_review

from reviews import views

urlpatterns = [
    path("", views.review_list, name="review_list"),
    path("add/", views.add_review, name="add_review"),
]