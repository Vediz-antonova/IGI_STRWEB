from .geometric_figure import GeometricFigure
from .figure_color import FigureColor

class Rectangle(GeometricFigure):
    """
    Rectangle class representing a rectangle.
    Attributes:
        width (float): Width of the rectangle.
        height (float): Height of the rectangle.
        _color_obj (FigureColor): Object storing the rectangle's color.
    """
    figure_name = "Rectangle"

    def __init__(self, width, height, color):
        """
        Initializes a Rectangle object with given width, height, and color.
        Args:
            width (float): Positive width.
            height (float): Positive height.
            color (str): Color name.
        Raises:
            ValueError: If width or height are not positive numbers.
        """
        if width <= 0 or height <= 0:
            raise ValueError("Width and height must be positive numbers.")
        self.width = width
        self.height = height
        self._color_obj = FigureColor(color)

    @property
    def color(self):
        """
        Returns the color of the rectangle.
        Returns:
            str: The rectangle's color.
        """
        return self._color_obj.color

    @color.setter
    def color(self, value):
        """
        Sets the rectangle's color.
        Args:
            value (str): The new color.
        """
        self._color_obj.color = value

    def area(self):
        """
        Calculates the area of the rectangle.
        Returns:
            float: The area.
        """
        return self.width * self.height

    def __str__(self):
        """
        Returns a formatted string with rectangle parameters, color, and area.
        Returns:
            str: Formatted description.
        """
        return "Rectangle (width: {w:.2f}, height: {h:.2f}, color: '{c}') has an area of {a:.2f}".format(
            w=self.width, h=self.height, c=self.color, a=self.area()
        )