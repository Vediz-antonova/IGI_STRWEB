from .serializer import LoggingMixin

class BaseExportProduct:
    """
    Base class representing export product data.
    Contains static attribute 'count' to track the number of product instances.
    """
    count = 0

    def __init__(self, name):
        """
        Initialize with product name.
        Args:
            name (str): The name of the product.
        """
        self._name = name
        self.import_records = []
        BaseExportProduct.count += 1

    @property
    def name(self):
        """Getter for the product name."""
        return self._name

    @name.setter
    def name(self, value):
        """
        Setter for the product name.
        Args:
            value (str): The new product name.
        Raises:
            ValueError: If the provided name is not a non-empty string.
        """
        if isinstance(value, str) and value:
            self._name = value
        else:
            raise ValueError("Name must be a non-empty string")

    def add_record(self, country, volume):
        """
        Add an import record to the product.
        Args:
            country (str): Country importing the product.
            volume (int): Volume of the product shipment.
        """
        self.import_records.append((country, volume))

    def total_volume(self):
        """
        Calculate the total shipment volume of the product.
        Returns:
            int: Total volume.
        """
        return sum(volume for _, volume in self.import_records)

    def importing_countries(self):
        """
        Get a list of unique importing countries for the product.
        Returns:
            list: List of country names.
        """
        return list(set(country for country, _ in self.import_records))

    def __str__(self):
        """
        Magic method to return a formatted string representing product details.
        Returns:
            str: Formatted product information.
        """
        return f"Product: {self.name}, Total Volume: {self.total_volume()}, Countries: {self.importing_countries()}"

    def __eq__(self, other):
        """
        Check equality based on product name.
        Args:
            other (BaseExportProduct): Another product instance.
        Returns:
            bool: True if product names are equal, False otherwise.
        """
        if isinstance(other, BaseExportProduct):
            return self.name == other.name
        return False

class DetailedExportProduct(BaseExportProduct, LoggingMixin):
    """
    Derived class that adds detailed logging functionality.
    Demonstrates usage of super() and mixins.
    """
    def __init__(self, name, category="General"):
        """
        Initialize with product name and category.
        Args:
            name (str): The name of the product.
            category (str): Category of the product.
        """
        super().__init__(name)
        self.category = category

    def add_record(self, country, volume):
        """
        Override add_record to include logging functionality.
        Args:
            country (str): Country importing the product.
            volume (int): Volume of the product shipment.
        """
        self.log(f"Adding record for {self.name}: {country} - {volume}")
        super().add_record(country, volume)

    def __str__(self):
        """
        Override __str__ method to include category information.
        Returns:
            str: Formatted detailed product information.
        """
        base_str = super().__str__()
        return f"{base_str}, Category: {self.category}"