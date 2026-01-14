import numpy as np

def calculate_mean(matrix):
    """
    Calculates the mean value of the matrix.
    Args:
        matrix (np.ndarray): The matrix.
    Returns:
        float: The mean value.
    """
    return np.mean(matrix)

def calculate_median(matrix):
    """
    Calculates the median value of the matrix.
    Args:
        matrix (np.ndarray): The matrix.
    Returns:
        float: The median value.
    """
    return np.median(matrix)

def calculate_column_median(column):
    """
    Calculates the median value of a column manually (without using np.median).
    Args:
        column (np.ndarray): The column.
    Returns:
        float: The median value.
    """
    sorted_col = np.sort(column)
    mid = len(sorted_col) // 2
    if len(sorted_col) % 2 == 0:
        return (sorted_col[mid - 1] + sorted_col[mid]) / 2
    else:
        return sorted_col[mid]

def calculate_variance(matrix):
    """
    Calculates the variance of the matrix.
    Args:
        matrix (np.ndarray): The matrix.
    Returns:
        float: The variance.
    """
    return np.var(matrix)

def calculate_std_dev(matrix):
    """
    Calculates the standard deviation of the matrix.
    Args:
        matrix (np.ndarray): The matrix.
    Returns:
        float: The standard deviation.
    """
    return np.std(matrix)

def calculate_corrcoef(matrix):
    """
    Calculates the Pearson correlation coefficients of the matrix.
    Args:
        matrix (np.ndarray): The matrix.
    Returns:
        np.ndarray: The correlation coefficient matrix.
    """
    return np.corrcoef(matrix, rowvar=False)