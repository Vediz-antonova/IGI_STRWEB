from Decorator import log_execution
from Input import *

@log_execution
def calculate_product_between_min_max(float_list):
    """
    Calculate the product of elements between the minimum and maximum elements.
    Args:
        float_list (list): List of floats.
    Returns:
        float: Product of elements between min and max.
    """
    min_index = float_list.index(min(float_list))
    max_index = float_list.index(max(float_list))

    if min_index > max_index:
        min_index, max_index = max_index, min_index

    product = 1
    for x in float_list[min_index + 1:max_index]:
        product *= x

    return product

def display_list(float_list):
    """
    Function to display the float list on the screen.
    Args:
        float_list (list): The list of floats to display.
    """
    print("List of floats:", float_list)

@log_execution
def calculate_negatives_sum(float_list):
    """
    Calculate the sum of negative elements in the list.
    Args:
        float_list (list): List of floats.
    Returns:
        float: Sum of negative elements.
    """
    return sum(x for x in float_list if x < 0)

def task5():
    """
    Task 5: Process a float list with user input or automatic generation and display results.
    Includes:
      1) Manual input or automatic generation of float list.
      2) Displaying the list.
      3) Calculating sum of negative elements.
      4) Calculating product of elements between min and max.
    """
    while True:
        print("\n== Task 5: Process Float List ==")
        print("1. Input list manually")
        print("2. Generate list automatically")
        print("0. Exit")

        choice = input("Choose an option: ").strip()

        if choice == '1':
            float_list = input_float_list()
        elif choice == '2':
            try:
                size = input_int("Enter the size of the list: ", 1)
                min_value = -20
                max_value = 20
                if min_value >= max_value:
                    print("Minimum value must be less than maximum value. Try again.")
                    continue
                float_list = generate_float_list(size, min_value, max_value)
            except ValueError:
                print("Invalid input. Please enter valid numbers.")
                continue
        elif choice == '0':
            print("Exiting Task 5...")
            break
        else:
            print("Invalid choice. Please choose 1, 2, or 0.")
            continue

        display_list(float_list)

        negatives_sum = calculate_negatives_sum(float_list)
        product_between_min_max = calculate_product_between_min_max(float_list)

        print(f"Sum of negative elements: {negatives_sum}")
        print(f"Product of elements between min and max: {product_between_min_max}")