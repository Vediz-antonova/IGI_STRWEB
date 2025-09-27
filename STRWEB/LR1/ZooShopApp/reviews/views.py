from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from reviews.models import Review
from reviews.forms import ReviewForm

def review_list(request):
    reviews = Review.objects.order_by("-created_at") 
    return render(request, "reviews/review_list.html", {"reviews": reviews})

@login_required
def add_review(request):
    if request.method == "POST":
        form = ReviewForm(request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            review.user = request.user
            review.save()
            return redirect("review_list")
    else:
        form = ReviewForm()

    return render(request, "reviews/add_review.html", {"form": form})
