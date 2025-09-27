from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.db import transaction
from django.forms import ValidationError
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views.generic import FormView
from decimal import Decimal
from carts.models import Cart
from main.models import Promotional
from orders.models import Order, OrderItem
from orders.forms import CreateOrderForm

def create_order(request):
    if request.method == "POST":
        form = CreateOrderForm(data=request.POST)
        if form.is_valid():
            try:
                with transaction.atomic():
                    user = request.user
                    cart_items = Cart.objects.filter(user=user)

                    if cart_items.exists():
                        order = Order.objects.create(
                            user=user,
                            phone_number=form.cleaned_data["phone_number"],
                            requires_delivery=form.cleaned_data["requires_delivery"],
                            delivery_address = form.cleaned_data.get("delivery_address") if form.cleaned_data["requires_delivery"] else "",
                            payment_on_get=form.cleaned_data["payment_on_get"],
                        )

                        promo_code = form.cleaned_data.get("promo_code")
                        discount_percent = 0
                        if promo_code:
                            try:
                                promo = Promotional.objects.get(code=promo_code)
                                discount_percent = promo.discount
                            except Promotional.DoesNotExist:
                                messages.warning(request, "Промокод не найден. Скидка не применена.")

                            discount_percent = promo.discount

                        total_price = 0

                        for cart_item in cart_items:
                            product = cart_item.product
                            name = cart_item.product.name
                            price = cart_item.product.default_price
                            quantity = cart_item.quantity

                            if product.quantity < quantity:
                                raise ValidationError(
                                    f"Недостаточное количество товара {name} на складе. В наличии - {product.quantity}"
                                )

                            discount_percent = Decimal(discount_percent)
                            discounted_price = price * (1 - discount_percent / 100)

                            OrderItem.objects.create(
                                order=order,
                                product=product,
                                name=name,
                                price=discounted_price,
                                quantity=quantity,
                            )
                            product.quantity -= quantity
                            product.save()

                            total_price += discounted_price * quantity

                        # Очистить корзину пользователя после создания заказа
                        cart_items.delete()

                        messages.success(request, f"Заказ оформлен! Итоговая сумма: {total_price:.2f} BYN")
                        return redirect("profile")
            except ValidationError as e:
                messages.error(request, str(e))
                return redirect("create_order")
    else:
        initial = {
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
        }

        form = CreateOrderForm(initial=initial)

    context = {
        "title": "Order",
        "form": form,
        "order": True,
    }
    return render(request, "orders/create_order.html", context)