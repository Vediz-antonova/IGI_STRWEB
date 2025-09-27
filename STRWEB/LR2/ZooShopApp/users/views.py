from django.contrib.auth.decorators import login_required
from django.db.models import Prefetch
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.contrib import auth, messages
from django.urls import reverse

from orders.models import OrderItem, Order
from users.forms import UserLoginForm, UserRegistrationForm, ProfileForm
from users.models import User

def login(request):
    if request.method == 'POST':
        form = UserLoginForm(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = auth.authenticate(username=username, password=password)
            if user:
                auth.login(request, user)
                messages.success(request, 'You are logged in')

                redirect_page = request.POST.get('next', None)
                if redirect_page and redirect_page != reverse('logout'):
                    return HttpResponseRedirect(request.POST.get('next'))
                return HttpResponseRedirect(reverse('profile'))
    else:
        form = UserLoginForm()

    context = {
        'title': 'Login',
        'form': form,
    }
    return render(request, 'users/login.html', context)

def registration(request):
    if request.method == 'POST':
        form = UserRegistrationForm(data=request.POST)
        if form.is_valid():
            user = form.save()
            user.is_employee = form.cleaned_data["is_employee"]
            user.job_description = form.cleaned_data["job_description"] if user.is_employee else ""
            user.save()

            if not user.is_adult():
                messages.error(request, "Регистрация запрещена: вам должно быть 18 лет.")
                return redirect(reverse("registration"))

            auth.login(request, user)
            messages.success(request, "Вы успешно зарегистрировались!")
            return HttpResponseRedirect(reverse("profile"))
    else:
        form = UserRegistrationForm()

    today = date.today()
    max_birth_date = date(today.year - 18, today.month, today.day).isoformat()

    context = {"title": "Регистрация", "form": form, "max_birth_date": max_birth_date}
    return render(request, "users/registration.html", context)

@login_required
def profile(request):
    if request.method == 'POST':
        form = ProfileForm(data=request.POST, instance=request.user, files=request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile successfully updated')
            return HttpResponseRedirect(reverse('profile'))
    else:
        form = ProfileForm(instance=request.user)

    orders = Order.objects.filter(user=request.user) \
        .prefetch_related(
        Prefetch(
            "orderitem_set",
            queryset=OrderItem.objects.select_related("product")
        )
    ) \
        .order_by('-id')

    context = {
        'title': 'Profile',
        'form': form,
        'orders': orders,
    }
    return render(request, 'users/profile.html', context)

def users_cart(request):
    return render(request, 'users/users_cart.html')

@login_required
def logout(request):
    auth.logout(request)
    # cart_items = Cart.objects.filter(user=user)
    # cart_items.delete()
    messages.success(request, 'You are logged out')
    return redirect(reverse('index'))

@login_required
def user_list(request):
    if not request.user.is_employee:
        return render(request, "403.html")

    users = User.objects.all()
    return render(request, "users/user_list.html", {"users": users})


@login_required
def admin_orders(request):
    if not request.user.is_staff:
        return render(request, "403.html")

    orders = Order.objects.prefetch_related(
        Prefetch(
            "orderitem_set",
            queryset=OrderItem.objects.select_related("product")
        )
    ).order_by("-created_timestamp")

    return render(request, "users/admin_orders.html", {"orders": orders})