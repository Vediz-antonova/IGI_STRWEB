import os
import importlib

shape = os.getenv("SHAPE", "circle").lower()
size = os.getenv("SIZE", "10")

available_shapes = ["circle", "square"]

if shape not in available_shapes:
    print(f"Ошибка: Выберите фигуру из: {available_shapes}")
    exit(1)

module = importlib.import_module(f"geometric_lib.{shape}")

print(f"Фигура: {shape}")
print(f"Размер: {size}")
print(f"Площадь: {module.area(float(size))}")
print(f"Периметр: {module.perimeter(float(size))}")