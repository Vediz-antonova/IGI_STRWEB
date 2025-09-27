from .geometric_figure import GeometricFigure
from .figure_color import FigureColor

class IsoscelesTriangle(GeometricFigure):
    """
    Class representing an isosceles triangle with a base and height.
    Attributes:
        base (float): The base length.
        height (float): The height.
        _color_obj (FigureColor): Object storing the triangle's color.
    """
    figure_name = "Isosceles Triangle"

    def __init__(self, base, height, color):
        """
        Initializes an isosceles triangle.
        Args:
            base (float): Positive base length.
            height (float): Positive height.
            color (str): Color of the triangle.
        Raises:
            ValueError: If base or height are not positive.
        """
        if base <= 0 or height <= 0:
            raise ValueError("Base and height must be positive numbers.")
        self.base = base
        self.height = height
        self._color_obj = FigureColor(color)

    @property
    def color(self):
        """
        Returns the color of the triangle.
        Returns:
            str: The triangle's color.
        """
        return self._color_obj.color

    @color.setter
    def color(self, value):
        """
        Sets the triangle's color.
        Args:
            value (str): The new color.
        """
        self._color_obj.color = value

    def area(self):
        """
        Calculates the area of the triangle.
        Returns:
            float: The area.
        """
        return (self.base * self.height) / 2

    def __str__(self):
        """
        Returns a formatted string with triangle parameters, color, and area.
        Returns:
            str: Formatted description.
        """
        return "Isosceles Triangle (base: {b:.2f}, height: {h:.2f}, color: '{c}') has an area of {a:.2f}".format(
            b=self.base, h=self.height, c=self.color, a=self.area()
        )