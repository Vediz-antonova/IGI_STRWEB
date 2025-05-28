from django import forms
from goods.models import Product

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ["article", "name", "description", "category", "quantity", "default_price", "image"]
        widgets = {
            "slug": forms.TextInput(attrs={"class": "form-control", "readonly": True}),
        }

        def clean_article(self):
            article = self.cleaned_data.get("article")
            if Product.objects.filter(article=article).exists():
                raise forms.ValidationError(f"Товар с артикулом {article} уже существует!")
            return article