import math
from Decorator import log_execution
from Input import *
from prettytable import PrettyTable

@log_execution
def calculate_series(x, eps, max_iterations=500):
    """
    Function to compute ln(x+1)/(x-1) approximation using Taylor series expansion by 500 iterations or less and with math funciton
    Args:
        x (float): Argument value.
        eps (float): Desired accuracy.
        max_iterations (int): Maximum number of terms.
    Returns:
        dict: Result including F(x), Math F(x), n (terms needed).
    """
    if abs(x) <= 1:
        raise ValueError("x must satisfy |x| > 1")

    n = 0
    term = 1 / x
    result = term
    mathF = math.log((x + 1) / (x - 1))
    while abs(mathF - result * 2) > eps and n < max_iterations:
        n += 1
        term = 1 / ((2 * n + 1) * (x ** (2 * n + 1)))
        result += term
    return {
        "x": x,
        "F(x)": 2 * result,
        "Math F(x)": mathF,
        "n": n
    }

def display_results(result, eps):
    """
    Displays the results in a formatted table.
    Args:
        result (dict): Result of the series calculation.
        eps (float): Precision used in calculations.
    """
    table = PrettyTable()
    table.field_names = ["x", "n", "F(x)", "Math F(x)", "eps"]
    table.add_row([
        result["x"],
        result["n"],
        f"{result['F(x)']:.5f}",
        f"{result['Math F(x)']:.5f}",
        f"{eps:.1e}"
    ])
    print(table)

def task1():
    """
    Task 1: compute computing series with input or automatic generation.
    """
    while True:
        print("\n== Task 1: Compute Series ==")
        print("1. Input values manually")
        print("2. Generate values automatically")
        print("0. Exit")
        choice = input("Choose an option: ").strip()

        if choice == '1':
            try:
                x = input_float("Enter x, |x| > 1: ", 1.1)
                eps = input_float("Enter precision (eps): ", 0)
            except ValueError as ve:
                print(f"Invalid input: {ve}")
                continue
        elif choice == '2':
            x = generate_value(1.1, 10)
            eps = generate_value(1e-5, 1e-2)
            print(f"Generated values: x = {x:.2f}, eps = {eps:.1e}")
        elif choice == '0':
            print("Exiting Task 1...")
            break
        else:
            print("Invalid choice. Please choose 1, 2, or 0.")
            continue

        try:
            result = calculate_series(x, eps)
            display_results(result, eps)
        except ValueError as ve:
            print(f"Invalid input: {ve}")
        except Exception as e:
            print(f"An error occurred: {e}")