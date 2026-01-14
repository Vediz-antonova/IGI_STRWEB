import math
import statistics

class SeriesAnalyzer:
    """
    Class for computing series expansion of F(x) and for calculating statistics.
    The series approximates:
        F(x) = ln((x+1)/(x-1))
    as:
        F(x) ≈ 2 * ∑[n=0..∞] 1/((2*n+1) * x^(2*n+1))
    (for |x| > 1).
    Attributes:
        x (float): The argument (|x| > 1).
        eps (float): Desired accuracy.
        max_iterations (int): Maximum allowed iterations.
        terms (list): List of series terms.
        result (float): Series approximation F(x).
        n (int): Number of terms used.
        mathF (float): Exact F(x) computed with math.log.
    """
    def __init__(self, x, eps, max_iterations=500):
        """
        Initializes the SeriesAnalyzer with the argument x and desired precision eps.
        Args:
            x (float): Function argument; must satisfy |x| > 1.
            eps (float): Desired precision; calculation stops when the difference between
                         2*series_sum and math.log((x+1)/(x-1)) is less than eps.
            max_iterations (int, optional): Maximum number of iterations. Defaults to 500.
        Raises:
            ValueError: If |x| is not greater than 1.
        """
        if abs(x) <= 1:
            raise ValueError("x must satisfy |x| > 1")
        self.x = x
        self.eps = eps
        self.max_iterations = max_iterations
        self.terms = []
        self.result = None
        self.n = None
        self.mathF = None
        self.calculated = False

    def calculate_series(self):
        """
        Compute the series expansion approximation for F(x) = ln((x+1)/(x-1)).
        Returns:
            dict: Contains "x", "F(x)" (series approximation),
                  "Math F(x)" (computed with math.log), "n" (number of iterations),
                  and "terms" (list of computed series terms).
        """
        n = 0
        term = 1 / self.x
        self.terms.append(term)
        result = term
        self.mathF = math.log((self.x + 1) / (self.x - 1))

        while abs(self.mathF - 2 * result) > self.eps and n < self.max_iterations:
            n += 1
            term = 1 / ((2 * n + 1) * (self.x ** (2 * n + 1)))
            self.terms.append(term)
            result += term

        self.n = n
        self.result = 2 * result
        self.calculated = True

        return {
            "x": self.x,
            "F(x)": self.result,
            "Math F(x)": self.mathF,
            "n": self.n,
            "terms": self.terms
        }

    def compute_stats(self):
        """
        Compute statistical parameters for the series terms:
           - Arithmetic mean
           - Median
           - Mode
           - Variance
           - Standard deviation
        Returns:
            dict: Keys 'mean', 'median', 'mode', 'variance' and 'std_dev'.
        """
        if not self.calculated:
            raise Exception("Series has not been calculated yet. Call calculate_series() first.")

        if not self.terms:
            return None

        try:
            mode_value = statistics.mode(self.terms)
        except statistics.StatisticsError:
            mode_value = "No unique mode"

        stats_data = {
            "mean": statistics.mean(self.terms),
            "median": statistics.median(self.terms),
            "mode": mode_value,
            "variance": statistics.variance(self.terms) if len(self.terms) > 1 else 0.0,
            "std_dev": statistics.stdev(self.terms) if len(self.terms) > 1 else 0.0
        }
        return stats_data