from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.contrib import auth
from django.urls import reverse
from users.forms import UserLoginForm

def login(request):
    if request.method == 'POST':
        form = UserLoginForm(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = auth.authenticate(username=username, password=password)
            if user:
                auth.login(request, user)
                return HttpResponseRedirect(reverse('index'))  # Исправлено: HttpResponseRedirect
    else:
        form = UserLoginForm()

    context = {
        'title': 'Login',
        'form': form,
    }
    return render(request, 'users/login.html', context)

def registration(request):
    context = {
        'title': 'Registration',
    }
    return render(request, 'users/registration.html')

def profile(request):
    context = {
        'title': 'Profile',
    }
    return render(request, 'users/profile.html')

def logout(request):
    ...