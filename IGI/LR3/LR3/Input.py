import random

def input_int(value, min_value=None, max_value=None):
    """
    Get validated integer input from user within an optional range.
    Args:
        value (str): Prompt message for input.
        min_value (int, optional): Minimum value allowed (inclusive).
        max_value (int, optional): Maximum value allowed (inclusive).
    Returns:
        int: Validated integer input.
    """
    while True:
        try:
            num = int(input(value))
            if (min_value is not None and num < min_value) or (max_value is not None and num > max_value):
                if max_value is not None:
                    print(f"Number must be between {min_value} and {max_value}. Try again.")
                else:
                    print(f"Number must be more then {min_value}. Try again.")
            else:
                return num
        except ValueError:
            print("Invalid input. Please enter an integer.")

def input_float(value, min_value=None, max_value=None):
    """
    Get validated float input from user within an optional range.
    Args:
        value (str): Prompt message for input.
        min_value (float, optional): Minimum value allowed (inclusive).
        max_value (float, optional): Maximum value allowed (inclusive).
    Returns:
        float: Validated float input.
    """
    while True:
        try:
            num = float(input(value))
            if (min_value is not None and num < min_value) or (max_value is not None and num > max_value):
                if max_value is not None:
                    print(f"Number must be between {min_value} and {max_value}. Try again.")
                else:
                    print(f"Number must be more then {min_value}. Try again.")
            else:
                return num
        except ValueError:
            print("Invalid input. Please enter a valid number.")

def input_sequence():
    """
    Manually inputs a sequence of integers from the user.
    Ends input when 0 is entered.
    Returns:
        list: Sequence of integers entered by the user.
    """
    sequence = []
    print("Enter integers one by one (0 to stop):")
    while True:
        num = input_int("Enter an integer: ")
        if num == 0:
            break
        sequence.append(num)
    return sequence

def input_float_list():
    """
    Function to input a list of floats from the user.
    Returns:
        list: A list of floats entered by the user.
    """
    while True:
        try:
            size = int(input("Enter the size of the list: "))
            if size <= 0:
                print("Size must be a positive integer. Try again.")
                continue
            break
        except ValueError:
            print("Invalid input. Please enter a positive integer.")

    float_list = []
    print("Enter floats for the list:")
    for _ in range(size):
        while True:
            try:
                value = float(input("Enter a float: "))
                float_list.append(value)
                break
            except ValueError:
                print("Invalid input. Please enter a valid float.")

    return float_list

def generate_value(from_, to_):
    """
    Generates random value for x.
    Returns:
        tuple: Randomly generated value for x.
    """
    return random.uniform(from_, to_)

def generate_sequence(length):
    """
    Function generator to yield a sequence of random integers.
    Args:
        length (int): Length of the sequence.
    Yields:
        int: Random integer in the range [-10, 10].
    """
    for _ in range(length):
        yield random.randint(-10, 10)

def generate_random_string(length):
    """
    Generates a random string of the specified length.
    Args:
        length (int): Length of the random string.
    Returns:
        str: Generated random string.
    """
    chars = "0123456789_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return ''.join(random.choice(chars) for _ in range(length))

def generate_float_list(size, min_value, max_value):
    """
    Function to generate a list of random floats.
    Args:
        size (int): Size of the list.
        min_value (float): Minimum value of the floats.
        max_value (float): Maximum value of the floats.
    Returns:
        list: A randomly generated list of floats.
    """
    return [random.uniform(min_value, max_value) for _ in range(size)]