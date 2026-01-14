from .export_product import DetailedExportProduct

def search_product(data, product_name):
    """
    Search for a product in the data dictionary.
    Args:
        data (dict): Dictionary containing export data.
        product_name (str): The product name to search for.
    Returns:
        list or None: List of records if found, otherwise None.
    """
    return data.get(product_name, None)

def sort_products_by_total_volume(data):
    """
    Sort products based on total volume in descending order.
    Args:
        data (dict): Dictionary with product names as keys and list of record dicts as values.
    Returns:
        list: List of tuples (product_name, total_volume) sorted by volume descending.
    """
    products = []
    for product, records in data.items():
        total = sum(record["volume"] for record in records)
        products.append((product, total))
    products.sort(key=lambda x: x[1], reverse=True)
    return products

def create_product_objects(data):
    """
    Create DetailedExportProduct objects from the data dictionary.
    Args:
        data (dict): Dictionary with product names as keys and list of record dicts as values.
    Returns:
        dict: Mapping of product names to DetailedExportProduct instances.
    """
    products = {}
    for product_name, records in data.items():
        prod_obj = DetailedExportProduct(product_name)
        for record in records:
            prod_obj.add_record(record["country"], record["volume"])
        products[product_name] = prod_obj
    return products