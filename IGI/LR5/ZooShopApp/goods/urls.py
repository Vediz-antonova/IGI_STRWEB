from django.urls import re_path, path
from goods import views

urlpatterns = [
    re_path(r'^search/$', views.catalog, name='search'),
    re_path(r'^(?P<category_slug>[\w-]+)/$', views.catalog, name='catalog'),
    re_path(r'^product/(?P<product_slug>[\w-]+)/$', views.product, name='product'),
    re_path(r'^select_supplier/(?P<product_slug>[\w-]+)/$', views.select_supplier, name='select_supplier'),
    path("new_product/add/", views.add_product, name="add_product"),
    path("delete/<int:product_id>/", views.delete_product, name="delete_product"),
]