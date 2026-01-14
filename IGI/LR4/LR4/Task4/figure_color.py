class FigureColor:
    """
    Class for handling the color property of a geometric figure.
    Attributes:
        _color (str): Internal storage for color.
    """
    def __init__(self, color):
        """
        Initializes a FigureColor object with the provided color.
        Args:
            color (str): The color value; must be a non-empty string.
        Raises:
            ValueError: If the color is not a valid non-empty string.
        """
        self._color = None
        self.color = color  # use setter for validation

    @property
    def color(self):
        """
        Getter for the color.
        Returns:
            str: The color of the figure.
        """
        return self._color

    @color.setter
    def color(self, value):
        """
        Setter for the color.
        Args:
            value (str): The color to set.
        Raises:
            ValueError: If the provided value is not a non-empty string.
        """
        if not isinstance(value, str) or not value:
            raise ValueError("Color must be a non-empty string.")
        self._color = value

    def __str__(self):
        """
        String representation of the color.
        Returns:
            str: The color.
        """
        return self.color