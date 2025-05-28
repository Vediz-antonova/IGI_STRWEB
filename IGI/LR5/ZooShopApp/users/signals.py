from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group, Permission
from users.models import User

@receiver(post_save, sender=User)
def set_employee_permissions(sender, instance, created, **kwargs):
    if instance.is_employee and not instance.is_staff:
        User.objects.filter(id=instance.id).update(is_staff=True)

        permission = Permission.objects.get(codename="view_user")
        instance.user_permissions.add(permission)

        employees_group, _ = Group.objects.get_or_create(name="Сотрудники")
        instance.groups.add(employees_group)
