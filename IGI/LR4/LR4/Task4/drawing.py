import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle as MplRectangle, Polygon
import os
from .utils import get_data_directory

def draw_rectangle(rect_obj, rect_text, save_filename="rectangle.png"):
    """
    Draws a rectangle using matplotlib, fills it with its color and annotates it,
    then saves the drawing to the data directory.
    Args:
        rect_obj (Rectangle): Instance of Rectangle.
        rec_text (str): Text of the rectangle.
        save_filename (str, optional): File name to save the image. Defaults to "rectangle.png".
    """
    fig, ax = plt.subplots()

    patch = MplRectangle((0, 0), rect_obj.width, rect_obj.height,
                           facecolor=rect_obj.color, edgecolor="black", lw=2)
    ax.add_patch(patch)
    ax.set_xlim(-1, rect_obj.width + 1)
    ax.set_ylim(-1, rect_obj.height + 1)
    ax.set_aspect('equal', 'box')
    ax.set_title(str(rect_obj))

    ax.text(rect_obj.width/2, rect_obj.height/2, str(rect_text),
            ha="center", va="center", fontsize=10, color="black")

    data_dir = get_data_directory()
    file_path = os.path.join(data_dir, save_filename)
    plt.savefig(file_path)
    print(f"Rectangle drawing saved as {file_path}")
    plt.show()

def draw_triangle(triangle_obj, tri_text, save_filename="triangle.png"):
    """
    Draws an isosceles triangle using matplotlib, fills it with its color and annotates it,
    then saves the drawing to the data directory.
    Args:
        triangle_obj (IsoscelesTriangle): Instance of IsoscelesTriangle.
        tri_text (str): Text of the isosceles triangle.
        save_filename (str, optional): File name to save the image. Defaults to "triangle.png".
    """
    fig, ax = plt.subplots()

    points = [(0, 0), (triangle_obj.base, 0), (triangle_obj.base/2, triangle_obj.height)]
    patch = Polygon(points, closed=True, facecolor=triangle_obj.color, edgecolor="black", lw=2)
    ax.add_patch(patch)
    ax.set_xlim(-1, triangle_obj.base + 1)
    ax.set_ylim(-1, triangle_obj.height + 1)
    ax.set_aspect('equal', 'box')
    ax.set_title(str(triangle_obj))

    ax.text(rect_obj.width/2, rect_obj.height/2, str(tri_text),
            ha="center", va="center", fontsize=10, color="black")

    data_dir = get_data_directory()
    file_path = os.path.join(data_dir, save_filename)
    plt.savefig(file_path)
    print(f"Triangle drawing saved as {file_path}")
    plt.show()