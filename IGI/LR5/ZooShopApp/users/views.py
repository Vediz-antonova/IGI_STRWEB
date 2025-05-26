from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.contrib import auth
from django.urls import reverse
from users.forms import UserLoginForm, UserRegistrationForm


def login(request):
    if request.method == 'POST':
        form = UserLoginForm(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = auth.authenticate(username=username, password=password)
            if user:
                auth.login(request, user)
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
            form.save()
            user=form.instance
            auth.login(request, user)
            return HttpResponseRedirect(reverse('profile'))
    else:
        form = UserRegistrationForm()

    context = {
        'title': 'Registration',
        'form': form,
    }
    return render(request, 'users/registration.html', context)

def profile(request):
    context = {
        'title': 'Profile',
    }
    return render(request, 'users/profile.html')

def logout(request):
    auth.logout(request)
    return redirect(reverse('index'))