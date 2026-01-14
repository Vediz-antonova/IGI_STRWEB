import os
import matplotlib.pyplot as plt
from .series_analyzer import SeriesAnalyzer
from .utils import get_data_directory

class SeriesPlotter:
    """
    SeriesPlotter computes and plots the series approximation and the math.log-based function F(x)
    over a range of x values.
    Methods:
        compute_for_range(x_values): Computes F(x) via series and math.log for each x.
        plot(x_values, series_vals, math_vals, filename): Plots the resulting graphs and
               saves the plot in the data directory.
    """
    def __init__(self, eps, max_iterations=500):
        """
        Initialize the SeriesPlotter with given precision and maximum iterations.
        Args:
            eps (float): Precision for the series computation.
            max_iterations (int, optional): Maximum iterations for the series computation.
                                            Defaults to 500.
        """
        self.eps = eps
        self.max_iterations = max_iterations

    def compute_for_range(self, x_values):
        """
        Computes F(x) values for each x in the provided range using both the series expansion
        and the math.log function.
        Args:
            x_values (list): List of x values.
        Returns:
            tuple: Three lists containing:
                - series_vals: The F(x) values computed via the Taylor series.
                - math_vals: The F(x) values computed using math.log.
                - n_terms: The number of iterations used for each x.
        """
        series_vals = []
        math_vals = []
        n_terms = []

        for x in x_values:
            try:
                analyzer = SeriesAnalyzer(x, self.eps, self.max_iterations)
                result = analyzer.calculate_series()
                series_vals.append(result["F(x)"])
                math_vals.append(result["Math F(x)"])
                n_terms.append(result["n"])
            except Exception as e:
                print(f"Error computing for x = {x}: {e}")
                series_vals.append(None)
                math_vals.append(None)
                n_terms.append(None)
        return series_vals, math_vals, n_terms

    def plot(self, x_values, series_vals, math_vals, filename="series_plot.png"):
        """
        Plots the series approximation and the math.log-based function on the same coordinate axes.
        The plot includes:
            - Two curves with different colors.
            - Labeled axes.
            - A legend.
            - A grid.
            - An annotation for the point with the maximum difference between the curves.
        The plot is saved into the 'data' directory within Task3.
        Args:
            x_values (list): x-axis values.
            series_vals (list): F(x) computed via the series.
            math_vals (list): F(x) computed using math.log.
            filename (str, optional): File name for saving the plot. Defaults to "series_plot.png".
        """
        plt.figure(figsize=(10, 8))
        plt.plot(x_values, series_vals, 'bo-', label="Series F(x)")
        plt.plot(x_values, math_vals, 'r*-', label="Math F(x)")
        plt.xlabel("x", fontsize=12)
        plt.ylabel("F(x)", fontsize=12)
        plt.title("Series Approximation vs Math Function", fontsize=14)
        plt.legend(fontsize=12)
        plt.grid(True)

        differences = [abs(s - m) for s, m in zip(series_vals, math_vals)
                       if s is not None and m is not None]
        if differences:
            max_diff = max(differences)
            if max_diff > 0:
                idx = differences.index(max_diff)
                plt.annotate(f"Max diff: {max_diff:.2e}",
                             xy=(x_values[idx], series_vals[idx]),
                             xytext=(x_values[idx], series_vals[idx] + 0.5),
                             arrowprops=dict(facecolor='black', shrink=0.05),
                             fontsize=10)

        data_dir = get_data_directory()
        file_path = os.path.join(data_dir, filename)
        plt.savefig(file_path)
        print(f"Plot saved as {file_path}")
        plt.show()