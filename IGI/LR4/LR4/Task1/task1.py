import os
from .serializer import CSVSerializer, PickleSerializer
from .utils import search_product, sort_products_by_total_volume, create_product_objects

def task1():
    """
    Function representing Task 1.
    Offers functionality to save/load export data to CSV and Pickle,
    perform search, sorting, and display product export information.
    """
    export_data = {
        "Apple": [{"country": "Germany", "volume": 1000}, {"country": "France", "volume": 500}],
        "Orange": [{"country": "Italy", "volume": 1500}, {"country": "Spain", "volume": 700}],
        "Banana": [{"country": "Belgium", "volume": 800}, {"country": "Netherlands", "volume": 600}]
    }

    current_dir = os.path.dirname(os.path.abspath(__file__))

    data_dir = os.path.join(current_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    csv_filename = os.path.join(data_dir, "export_data.csv")
    pickle_filename = os.path.join(data_dir, "export_data.pkl")

    csv_serializer = CSVSerializer()
    pickle_serializer = PickleSerializer()

    try:
        csv_serializer.save(export_data, csv_filename)
        pickle_serializer.save(export_data, pickle_filename)
    except Exception as e:
        print(f"Error during serialization: {e}")
        return

    print("Select file format to load data:")
    print("1. CSV")
    print("2. Pickle")

    choice = input("Enter choice (1 or 2): ").strip()
    if choice == "1":
        try:
            loaded_data = csv_serializer.load(csv_filename)
        except Exception as e:
            print(f"Error loading CSV data: {e}")
            return
    elif choice == "2":
        try:
            loaded_data = pickle_serializer.load(pickle_filename)
        except Exception as e:
            print(f"Error loading pickle data: {e}")
            return
    else:
        print("Invalid choice for loading data.")
        return

    products = create_product_objects(loaded_data)

    product_query = input("Enter product name to display export info: ").strip()
    if product_query in products:
        print("\nProduct Information:")
        print(products[product_query])
    else:
        print("Product not found in the export data.")

    sorted_products = sort_products_by_total_volume(loaded_data)
    print("\nProducts sorted by total export volume (descending):")
    for name, volume in sorted_products:
        print(f"{name}: {volume}")

    if product_query in products:
        countries = products[product_query].importing_countries()
        print(f"\nThe product '{product_query}' is exported to the following countries: {countries}")
        print(f"Total export volume: {products[product_query].total_volume()}")

    repeat = input("\nDo you want to run Task 1 again? (y/n): ").strip().lower()
    if repeat == 'y':
        task1()
    else:
        print("Returning to main menu.")