from django.shortcuts import render
from jobs.models import Job

def job_list(request):
    jobs = Job.objects.order_by("-posted_at")
    return render(request, "jobs/job_list.html", {"jobs": jobs})