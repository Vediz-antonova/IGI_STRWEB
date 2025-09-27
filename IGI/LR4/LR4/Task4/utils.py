import os

def input_float(prompt, min_val=None):
    """
    Prompts the user to enter a float value and validates the input.
    Args:
        prompt (str): The message shown to the user.
        min_val (float, optional): The minimum acceptable value. Defaults to None.
    Returns:
        float: The validated float value.
    """
    while True:
        try:
            value = float(input(prompt))
            if min_val is not None and value <= min_val:
                print(f"Value must be greater than {min_val}.")
                continue
            return value
        except ValueError:
            print("Invalid input. Please enter a valid number.")

def get_data_directory():
    """
    Returns the absolute path to the 'data' directory within Task4.
    If the directory does not exist, it is created.
    Returns:
        str: Path to the 'data' directory.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir