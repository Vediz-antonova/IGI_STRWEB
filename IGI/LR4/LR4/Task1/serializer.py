import csv
import pickle

class LoggingMixin:
    """
    A Mixin class providing logging functionality.
    """
    def log(self, message):
        """Simple logging method."""
        print(f"[LOG]: {message}")

class BaseSerializer:
    """
    Base serializer class defining the interface for serialization.
    """
    def save(self, data, filename):
        """Save data to a file."""
        raise NotImplementedError("Save method not implemented")

    def load(self, filename):
        """Load data from a file."""
        raise NotImplementedError("Load method not implemented")

class CSVSerializer(BaseSerializer, LoggingMixin):
    """
    Serializer for CSV format.
    Demonstrates usage of static and dynamic attributes.
    """
    delimiter = ','

    def save(self, data, filename):
        """
        Save dictionary data to a CSV file.
        Args:
            data (dict): Data to be saved (expected format: {product: list of records}).
            filename (str): Name of the CSV file.
        """
        try:
            with open(filename, mode='w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile, delimiter=self.delimiter)

                writer.writerow(["Product", "Country", "Volume"])
                for product, records in data.items():
                    for record in records:
                        writer.writerow([product, record["country"], record["volume"]])
            self.log(f"Data successfully saved to CSV file: {filename}")
        except Exception as e:
            self.log(f"Error saving CSV: {e}")
            raise

    def load(self, filename):
        """
        Load data from a CSV file and return in dictionary format.
        Returns:
            dict: Data in format {product: list of records}.
        """
        result = {}
        try:
            with open(filename, mode='r', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile, delimiter=self.delimiter)
                for row in reader:
                    product = row["Product"]
                    country = row["Country"]
                    volume = int(row["Volume"])
                    if product in result:
                        result[product].append({"country": country, "volume": volume})
                    else:
                        result[product] = [{"country": country, "volume": volume}]
            self.log(f"Data successfully loaded from CSV file: {filename}")
            return result
        except Exception as e:
            self.log(f"Error loading CSV: {e}")
            raise

class PickleSerializer(BaseSerializer, LoggingMixin):
    """
    Serializer using the Python pickle module.
    """
    def save(self, data, filename):
        """
        Save data using pickle serialization.
        Args:
            data (dict): Data to be saved.
            filename (str): Name of the pickle file.
        """
        try:
            with open(filename, "wb") as pfile:
                pickle.dump(data, pfile)
            self.log(f"Data successfully saved to pickle file: {filename}")
        except Exception as e:
            self.log(f"Error saving pickle: {e}")
            raise

    def load(self, filename):
        """
        Load data using pickle deserialization.
        Returns:
            dict: The loaded data.
        """
        try:
            with open(filename, "rb") as pfile:
                data = pickle.load(pfile)
            self.log(f"Data successfully loaded from pickle file: {filename}")
            return data
        except Exception as e:
            self.log(f"Error loading pickle: {e}")
            raise