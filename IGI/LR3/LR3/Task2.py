from Decorator import log_execution
from Input import *

@log_execution
def sum_of_squares(sequence):
    """
    Calculates the sum of squares of integers entered by the user until 0 is entered.
    Args:
        sequence (list): Sequence of integers.
    Returns:
        int: Sum of squares.
    """
    return sum(num ** 2 for num in sequence)

def task2():
    """
    Task 2: Sum of squares with sequence initialization and length customization.
    """
    while True:
        print("\n== Task 2: Sum of Sequence Squares ==")
        print("1. Input sequence manually")
        print("2. Generate sequence automatically")
        print("0. Exit")
        choice = input("Choose an option: ").strip()

        if choice == '1':
            sequence = input_sequence()
            print("User input sequence:", sequence)
        elif choice == '2':
            length = input_int("Enter the length of the sequence: ", 1)
            sequence = list(generate_sequence(length))
            print("Generated sequence:", sequence)
        elif choice == '0':
            print("Exiting Task 2...")
            break
        else:
            print("Invalid choice. Please choose 1, 2, or 0.")
            continue

        total_squares = sum_of_squares(sequence)
        print(f"Sum of squares: {total_squares}")