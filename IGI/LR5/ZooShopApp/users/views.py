from django.shortcuts import render

def login(request):
    context = {
        'title': 'Login',
    }
    return render(request, 'users/login.html')

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