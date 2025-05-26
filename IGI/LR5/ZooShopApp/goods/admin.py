from django.contrib import admin
from .models import Supplier, Category, Product, ProductSupply, Sale

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone')
    search_fields = ('name', 'address', 'phone')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'article', 'category', 'quantity')
    list_filter = ('category', 'suppliers')
    search_fields = ('name', 'article')
    prepopulated_fields = {"slug": ("name",)}

@admin.register(ProductSupply)
class ProductSupplyAdmin(admin.ModelAdmin):
    list_display = ('product', 'supplier', 'supply_date', 'unit_price', 'new_price_date', 'new_price')
    list_filter = ('supplier', 'supply_date')

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('product', 'sale_date', 'quantity', 'unit_price', 'total')
    list_filter = ('sale_date',)
    search_fields = ('product__name',)