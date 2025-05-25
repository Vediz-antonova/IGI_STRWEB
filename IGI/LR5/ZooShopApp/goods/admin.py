from django.contrib import admin
from .models import *

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

class ProductSupplyInline(admin.TabularInline):
    model = ProductSupply
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'article', 'default_price')
    filter_horizontal = ('categories',)
    inlines = [ProductSupplyInline]

@admin.register(ProductSupply)
class ProductSupplyAdmin(admin.ModelAdmin):
    list_display = ('product', 'supplier', 'supply_date', 'quantity', 'unit_price')

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('product', 'sale_date', 'quantity', 'unit_price', 'total')

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'age', 'email')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'age', 'phone')