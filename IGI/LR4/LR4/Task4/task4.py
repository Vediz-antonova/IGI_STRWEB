from .rectangle import Rectangle
from .triangle import IsoscelesTriangle
from .drawing import draw_rectangle, draw_triangle
from .utils import input_float

def task4():
    """
    Main function for Task 4 interactive menu.
    Options:
        1. Create and draw a Rectangle.
        2. Create and draw an Isosceles Triangle.
        0. Exit.
    """
    while True:
        print("\n== Task 4: Geometric Figures ==")
        print("1. Create and draw a Rectangle")
        print("2. Create and draw an Isosceles Triangle")
        print("0. Exit")
        choice = input("Choose an option: ").strip()

        if choice == '1':
            try:
                print("Enter parameters for the Rectangle:")
                width = input_float("Width: ", 0)
                height = input_float("Height: ", 0)
                color = input("Enter color: ").strip()
                rec_text = input("Enter text: ")
                rect = Rectangle(width, height, color)
                print(rect)
                draw_rectangle(rect, rec_text)
            except Exception as e:
                print(f"Error: {e}")
        elif choice == '2':
            try:
                print("Enter parameters for the Isosceles Triangle:")
                base = input_float("Base: ", 0)
                height = input_float("Height: ", 0)
                color = input("Enter color: ").strip()
                tri_text = input("Enter text: ")
                triangle = IsoscelesTriangle(base, height, color)
                print(triangle)
                draw_triangle(triangle, tri_text)
            except Exception as e:
                print(f"Error: {e}")
        elif choice == '0':
            print("Exiting Task 4.")
            break
        else:
            print("Invalid choice. Please try again.")