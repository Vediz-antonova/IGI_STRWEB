import re

class LoggingMixin:
    """
    Mixin class providing simple logging functionality.
    """
    def log(self, message):
        """Log a message to the console."""
        print(f"[LOG]: {message}")

class BaseTextAnalyzer:
    """
    Base class for text analysis.
    Attributes:
        instance_count (int): Static attribute to count how many analyzers were created.
    """
    instance_count = 0

    def __init__(self, text):
        """
        Initialize the analyzer with provided text.
        Args:
            text (str): The text to analyze.
        """
        if not isinstance(text, str):
            raise ValueError("Text must be a string.")
        self._text = text
        BaseTextAnalyzer.instance_count += 1

    @property
    def text(self):
        """Getter for the text."""
        return self._text

    @text.setter
    def text(self, value):
        """
        Setter for the text.
        Args:
            value (str): New text value.
        Raises:
            ValueError: If value is not a string.
        """
        if isinstance(value, str):
            self._text = value
        else:
            raise ValueError("Text must be a string.")

    def __str__(self):
        """
        Magic method to return a string representation of the analyzer.
        Returns:
            str: Summary info including the length of text.
        """
        return f"Text Analyzer (text length: {len(self.text)})"

class RegexTextAnalyzer(BaseTextAnalyzer, LoggingMixin):
    """
    Concrete text analyzer that uses regular expressions to extract various information
    from text.
    Inherits from BaseTextAnalyzer and LoggingMixin.
    """
    def analyze_sentences(self):
        """
        Analyze sentences in the text.
        The method counts the total number of sentences and the number of sentences by type:
        - Declarative: ending with '.'
        - Interrogative: ending with '?'
        - Exclamatory: ending with '!'
        Returns:
            dict: Dictionary with keys 'total', 'declarative', 'interrogative', 'exclamatory'.
        """
        sentence_pattern = r'[^.!?]+[.!?]'
        sentences = re.findall(sentence_pattern, self.text, flags=re.UNICODE)
        total = len(sentences)
        declarative = sum(1 for s in sentences if s.strip().endswith('.'))
        interrogative = sum(1 for s in sentences if s.strip().endswith('?'))
        exclamatory = sum(1 for s in sentences if s.strip().endswith('!'))
        self.log(f"Found {total} sentences in total.")
        return {
            "total": total,
            "declarative": declarative,
            "interrogative": interrogative,
            "exclamatory": exclamatory
        }

    def average_sentence_length(self):
        """
        Calculate the average length of sentences (considering only letters in words).
        For each sentence, only the characters belonging to words (letters and digits) are counted.
        Returns:
            float: The average sentence length in characters.
        """
        sentence_pattern = r'[^.!?]+[.!?]'
        sentences = re.findall(sentence_pattern, self.text, flags=re.UNICODE)
        if not sentences:
            return 0.0
        lengths = []
        for sent in sentences:
            words = re.findall(r'\b\w+\b', sent, flags=re.UNICODE)

            length = sum(len(word) for word in words)
            lengths.append(length)
        avg_length = sum(lengths) / len(lengths) if lengths else 0.0
        self.log(f"Average sentence length (letters only): {avg_length:.2f}")
        return avg_length

    def average_word_length(self):
        """
        Calculate the average word length in the entire text.
        Returns:
            float: Average number of characters per word.
        """
        words = re.findall(r'\b[a-zA-Zа-яА-ЯёЁ]+\b', self.text, flags=re.UNICODE)
        if not words:
            return 0.0
        avg = sum(len(word) for word in words) / len(words)
        self.log(f"Average word length: {avg:.2f}")
        return avg

    def count_smileys(self):
        """
        Count the number of smileys in the text.
        A smiley is defined as:
            - The first character is ':' or ';' (exactly one occurrence)
            - Followed by zero or more '-' (minus) symbols
            - Ending with at least one bracket symbol; all such brackets must be identical
              and can be one of: '(', ')', '[' or ']'
        Returns:
            int: The number of smiley occurrences.
        """
        pattern = r"[:;]-*([([{)\]}])+"
        matches = re.findall(pattern, self.text)
        count = len(matches)
        self.log(f"Found {count} smileys in the text.")
        return count

    def get_uppercase_letters(self):
        """
        Extract all uppercase English letters from the text.
        Returns:
            list: List of uppercase letters found.
        """
        letters = re.findall(r"[A-Z]", self.text)
        self.log(f"Found {len(letters)} uppercase English letters.")
        return letters

    def replace_pattern(self):
        """
        Replace in the text all sequences matching the pattern "a…ab…bc…c" with "qqq".
        The pattern is defined as:
            - One or more 'a'
            - Followed by two or more 'b'
            - Followed by one or more 'c'
        Returns:
            str: The modified text after replacement.
        """
        pattern = r"a+b{2,}c+"
        replaced_text = re.sub(pattern, "qqq", self.text, flags=re.IGNORECASE)
        self.log("Replaced all occurrences of pattern a+b{2,}c+ with 'qqq'.")
        return replaced_text

    def count_max_length_words(self):
        """
        Determine the number of words having the maximum length in the text.
        Returns:
            int: Count of words whose length equals the maximum word length.
        """
        words = re.findall(r'\b[a-zA-Zа-яА-ЯёЁ]+\b', self.text, flags=re.UNICODE)
        if not words:
            return 0
        max_length = max(len(word) for word in words)
        count = sum(1 for word in words if len(word) == max_length)
        self.log(f"Maximum word length is {max_length} and {count} words have this length.")
        return count

    def get_words_followed_by_punct(self):
        """
        Extract all words that are immediately followed by a comma or a period.
        Returns:
            list: List of such words.
        """
        words = re.findall(r'\b([a-zA-Zа-яА-ЯёЁ]+)(?=[,.])', self.text, flags=re.UNICODE)
        self.log(f"Found {len(words)} words followed by a comma or period.")
        return words

    def longest_word_ending_on_e(self):
        """
        Find the longest word in the text that ends with the letter 'е' (case-insensitive).
        Returns:
            str: The longest word ending with 'е'. If several words have the same length,
                 the first found is returned. Returns an empty string if none found.
        """
        words = re.findall(r'\b[a-zA-Zа-яА-ЯёЁ]+\b', self.text, flags=re.UNICODE)

        filtered = [word for word in words if re.search(r'е$', word, flags=re.IGNORECASE)]
        if not filtered:
            self.log("No word ending with 'е' was found.")
            return ""
        longest = max(filtered, key=len)
        self.log(f"The longest word ending with 'е' is '{longest}'.")
        return longest