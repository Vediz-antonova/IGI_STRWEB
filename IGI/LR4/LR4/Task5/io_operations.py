import numpy as np
import os
from .utils import get_data_directory

def save_matrix(filename, matrix):
    """
    Saves a NumPy matrix to a file in the data directory.
    Args:
        filename (str): Name of the file to save.
        matrix (np.ndarray): The matrix to save.
    """
    data_dir = get_data_directory()
    file_path = os.path.join(data_dir, filename)
    np.savetxt(file_path, matrix, fmt='%d')
    print(f"Matrix saved to {file_path}")

def load_matrix(filename):
    """
    Loads a NumPy matrix from a file in the data directory.
    Args:
        filename (str): Name of the file to load.
    Returns:
        np.ndarray: The loaded matrix.
    """
    data_dir = get_data_directory()
    file_path = os.path.join(data_dir, filename)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} not found.")
    return np.loadtxt(file_path, dtype=int)