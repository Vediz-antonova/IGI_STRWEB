def log_execution(func):
    """
    Decorator to log function execution.
    Logs the name of the function and its arguments.
    """
    def wrapper(*args, **kwargs):
        print(f"Executing function: {func.__name__}")
        print(f"Arguments: {args}, {kwargs}")
        result = func(*args, **kwargs)
        print(f"Result: {result}")
        return result
    return wrapper
