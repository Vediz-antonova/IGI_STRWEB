from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.contrib import auth, messages
from django.urls import reverse
from users.forms import UserLoginForm, UserRegistrationForm, ProfileForm

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

    context = {"title": "Регистрация", "form": form}
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

    context = {
        'title': 'Profile',
        'form': form,
    }
    return render(request, 'users/profile.html', context)

@login_required
def logout(request):
    auth.logout(request)
    messages.success(request, 'You are logged out')
    return redirect(reverse('index'))