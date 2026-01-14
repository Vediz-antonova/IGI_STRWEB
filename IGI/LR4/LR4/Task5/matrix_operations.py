import numpy as np

def create_random_matrix(n, m, low=0, high=100):
    """
    Creates a random integer matrix of shape (n, m).
    Args:
        n (int): Number of rows.
        m (int): Number of columns.
        low (int, optional): Minimum value for random integers. Defaults to 0.
        high (int, optional): Maximum value for random integers. Defaults to 100.
    Returns:
        np.ndarray: The generated matrix.
    """
    return np.random.randint(low, high, size=(n, m))

def find_column_with_min_sum(matrix):
    """
    Finds the index of the column with the minimum sum of elements.
    Args:
        matrix (np.ndarray): The matrix.
    Returns:
        tuple: (int, np.ndarray) The column index and the column values.
    """
    col_sums = matrix.sum(axis=0)
    min_col_idx = np.argmin(col_sums)
    return min_col_idx, matrix[:, min_col_idx]