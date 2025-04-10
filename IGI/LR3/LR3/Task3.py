from Decorator import log_execution
from Input import *

@log_execution
def count_uppercase_letters(input_string):
    """
    Counts the number of uppercase English letters in the input string.
    Args:
        input_string (str): The input text.
    Returns:
        int: Number of uppercase English letters.
    """
    return sum(1 for char in input_string if 'A' <= char <= 'Z')

def task3():
    """
    Task 3: Analyzes a string entered by the user to count uppercase English letters.
    Allows user to input a string or generate a random one.
    """
    while True:
        print("\n== Task 3: Count Uppercase English Letters ==")
        print("1. Input string manually")
        print("2. Generate random string")
        print("0. Exit")

        choice = input("Choose an option: ").strip()

        if choice == '1':
            input_string = input("Enter a string (or type 'exit' to quit): ")

        elif choice == '2':
            try:
                length = input_int("Enter the desired length of the string: ", 1)
                input_string = generate_random_string(length)
                print(f"Generated string: {input_string}")
            except ValueError:
                print("Invalid input. Please enter a positive integer.")
                continue

        elif choice == '0':
            print("Exiting Task 3...")
            break

        else:
            print("Invalid choice. Please choose 1, 2, or 0.")
            continue

        uppercase_count = count_uppercase_letters(input_string)
        print(f"Number of uppercase English letters: {uppercase_count}")