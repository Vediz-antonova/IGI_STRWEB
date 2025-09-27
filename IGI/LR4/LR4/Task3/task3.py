from prettytable import PrettyTable
from .series_analyzer import SeriesAnalyzer
from .series_plotter import SeriesPlotter
from . import utils
import os

def display_table(result, stats, eps):
    """
    Display the series calculation results and basic parameters in a table.
    Args:
        result (dict): Dictionary containing series result values.
        stats (dict): Dictionary containing statistical parameters.
        eps (float): The precision used in the calculation.
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
    print("=== Series Calculation Results ===")
    print(table)

    stat_table = PrettyTable()
    stat_table.field_names = ["Statistic", "Value"]
    for key, value in stats.items():
        stat_table.add_row([key, value])
    print("=== Statistics of Series Terms ===")
    print(stat_table)

def save_report(report_text, filename="series_report.txt"):
    """
    Save a text report to a file in the data directory.
    Args:
        report_text (str): The report content.
        filename (str, optional): The report file name. Defaults to "series_report.txt".
    """
    data_dir = utils.get_data_directory()
    file_path = os.path.join(data_dir, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(report_text)
    print(f"Report saved as {file_path}")

def task3():
    """
    Main function for Task 3 interactive menu.
    Offers the following options:
        1) Calculate series manually (user inputs x and eps).
        2) Generate random values for x and eps and calculate series.
        3) Plot the series approximation and math function for a range of x values.
        0) Exit the program.
    """
    while True:
        print("\n== Task 3: Series Analysis and Plotting ==")
        print("1. Calculate series manually")
        print("2. Generate values automatically")
        print("3. Plot series and math function for a range of x values")
        print("0. Exit from Task 3")
        choice = input("Choose an option: ").strip()

        if choice == '1':
            try:
                x = utils.input_float("Enter x (|x| > 1, e.g., 1.5): ", 1)
                eps = utils.input_float("Enter precision (eps, positive): ", 0)
            except Exception as e:
                print(f"Error in input: {e}")
                continue
            try:
                analyzer = SeriesAnalyzer(x, eps)
                result = analyzer.calculate_series()
                stats = analyzer.compute_stats()
                display_table(result, stats, eps)

                report_text = f"x: {result['x']}\nn: {result['n']}\nSeries F(x): {result['F(x)']:.5f}\nMath F(x): {result['Math F(x)']:.5f}\neps: {eps:.1e}\n"
                for stat, val in stats.items():
                    report_text += f"{stat}: {val}\n"
                save_report(report_text)
            except Exception as e:
                print(f"An error occurred: {e}")
        elif choice == '2':
            x = utils.generate_value(1.1, 5)
            eps = utils.generate_value(1e-5, 1e-2)
            print(f"Generated values: x = {x:.3f}, eps = {eps:.1e}")
            try:
                analyzer = SeriesAnalyzer(x, eps)
                result = analyzer.calculate_series()
                stats = analyzer.compute_stats()
                display_table(result, stats, eps)
                report_text = f"x: {result['x']}\nn: {result['n']}\nSeries F(x): {result['F(x)']:.5f}\nMath F(x): {result['Math F(x)']:.5f}\neps: {eps:.1e}\n"
                for stat, val in stats.items():
                    report_text += f"{stat}: {val}\n"
                save_report(report_text)
            except Exception as e:
                print(f"An error occurred: {e}")
        elif choice == '3':
            try:
                eps = utils.input_float("Enter precision (eps, positive): ", 0)
            except Exception as e:
                print(f"Error in input: {e}")
                continue

            x_values = [round(1.1 + i * 0.2, 3) for i in range(20)]
            plotter = SeriesPlotter(eps)
            series_vals, math_vals, _ = plotter.compute_for_range(x_values)
            plotter.plot(x_values, series_vals, math_vals)
        elif choice == '0':
            print("Exiting Task 3.")
            break
        else:
            print("Invalid choice. Please select a valid option.")