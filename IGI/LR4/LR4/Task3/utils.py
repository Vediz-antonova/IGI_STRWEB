import os
import random

def input_float(prompt, min_val=None):
    """
    Prompt the user to input a float value and validate it.
    Args:
        prompt (str): The prompt message to display to the user.
        min_val (float, optional): The minimum required value (if any).
    Returns:
        float: The validated float value.
    """
    while True:
        try:
            val = float(input(prompt))
            if min_val is not None and val <= min_val:
                print(f"Value must be greater than {min_val}.")
                continue
            return val
        except ValueError:
            print("Invalid input. Please enter a valid float.")

def generate_value(low, high):
    """
    Generate a random float value between low and high.
    Args:
        low (float): Lower bound.
        high (float): Upper bound.
    Returns:
        float: Randomly generated number.
    """
    return random.uniform(low, high)

def get_data_directory():
    """
    Returns the absolute path to the 'data' directory within Task3.
    Creates it if it does not exist.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir