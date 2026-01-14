from abc import ABC, abstractmethod

class GeometricFigure(ABC):
    """
    Abstract class representing a geometric figure.
    Attributes:
        figure_name (str): Name of the figure (to be defined in subclasses).
    """
    figure_name = "Figure"

    @abstractmethod
    def area(self):
        """
        Abstract method to calculate the area of the geometric figure.
        Returns:
            float: Area of the figure.
        """
        pass

    @classmethod
    def get_figure_name(cls):
        """
        Returns the name of the figure.
        Returns:
            str: Figure name.
        """
        return cls.figure_name