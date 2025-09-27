from .utils import input_int
from .io_operations import save_matrix, load_matrix
from .matrix_operations import create_random_matrix, find_column_with_min_sum
from .statistics import (calculate_mean, calculate_median, calculate_variance,
                              calculate_std_dev, calculate_corrcoef, calculate_column_median)

def task5():
    """
    Main function for Task 5 interactive menu.
    Options:
      1. Create a random matrix.
      2. Perform statistical operations on the current matrix.
      3. Find the column with the minimum sum and compute its median.
      4. Save the current matrix to a file.
      5. Load a matrix from a file.
      0. Exit the program.
    """
    matrix = None
    while True:
        print("\n== Task 5: NumPy and Matrix Operations ==")
        print("1. Create a random matrix")
        print("2. Perform statistical operations on the current matrix")
        print("3. Find column with minimum sum and compute its median")
        print("4. Save current matrix to a file")
        print("5. Load matrix from a file")
        print("0. Exit")
        choice = input("Choose an option: ").strip()

        if choice == '1':
            n = input_int("Enter number of rows (n): ", 1)
            m = input_int("Enter number of columns (m): ", 1)
            matrix = create_random_matrix(n, m)
            print("Matrix created:")
            print(matrix)
        elif choice == '2':
            if matrix is None:
                print("Matrix not created yet. Please create a matrix first.")
            else:
                mean_val = calculate_mean(matrix)
                median_val = calculate_median(matrix)
                var_val = calculate_variance(matrix)
                std_dev_val = calculate_std_dev(matrix)
                corrcoef_mat = calculate_corrcoef(matrix)
                print("Statistical Operations:")
                print(f"Mean: {mean_val:.2f}")
                print(f"Median: {median_val:.2f}")
                print(f"Variance: {var_val:.2f}")
                print(f"Standard Deviation: {std_dev_val:.2f}")
                print("Correlation Coefficient matrix:")
                print(corrcoef_mat)
        elif choice == '3':
            if matrix is None:
                print("Matrix not created yet. Please create a matrix first.")
            else:
                col_idx, col_vals = find_column_with_min_sum(matrix)
                median_func = calculate_median(col_vals)
                median_manual = calculate_column_median(col_vals)
                print(f"Column with minimum sum is at index {col_idx}")
                print("Column values:")
                print(col_vals)
                print(f"Median (using np.median): {median_func:.2f}")
                print(f"Median (manual calculation): {median_manual:.2f}")
        elif choice == '4':
            if matrix is None:
                print("Matrix not created yet. Please create a matrix first.")
            else:
                filename = input("Enter filename to save (e.g., matrix.txt): ").strip()
                save_matrix(filename, matrix)
        elif choice == '5':
            filename = input("Enter filename to load (e.g., matrix.txt): ").strip()
            try:
                matrix = load_matrix(filename)
                print("Matrix loaded:")
                print(matrix)
            except Exception as e:
                print(f"Error loading matrix: {e}")
        elif choice == '0':
            print("Exiting Task 5.")
            break
        else:
            print("Invalid option. Please choose a valid option (0-5).")