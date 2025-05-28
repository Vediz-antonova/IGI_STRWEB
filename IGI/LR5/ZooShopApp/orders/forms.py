import re
from django import forms
from main.models import Promotional

class CreateOrderForm(forms.Form):
    first_name = forms.CharField()
    last_name = forms.CharField()
    phone_number = forms.CharField()
    promo_code = forms.CharField(max_length=10, required=False)  # ✅ Поле промокода
    requires_delivery = forms.ChoiceField(
        choices=[
            ("0", False),
            ("1", True),
        ],
    )
    delivery_address = forms.CharField(required=False)
    payment_on_get = forms.ChoiceField(
        choices=[
            ("0", "False"),
            ("1", "True"),
        ],
    )

    def clean_promo_code(self):
        promo_code = self.cleaned_data.get("promo_code")
        if promo_code:
            try:
                promo = Promotional.objects.get(code=promo_code)
                if promo.expired:
                    raise forms.ValidationError("Промокод истек!")
                return promo_code
            except Promotional.DoesNotExist:
                raise forms.ValidationError("Неверный промокод!")
        return promo_code

    def clean_phone_number(self):
        data = self.cleaned_data['phone_number']

        pattern = re.compile(r'^\+375\s*\(29\)\s*\d{3}-\d{2}-\d{2}$')
        if not pattern.match(data):
            raise forms.ValidationError("Неверный формат номера")

        return data