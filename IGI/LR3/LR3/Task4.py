from Decorator import log_execution

@log_execution
def analyze_string(input_string):
    """
    Analyze a string to find word count, longest word, and even-indexed words.
    Args:
        input_string (str): Text to analyze.
    Returns:
        dict: Analysis results (word count, longest word, even words).
    """
    words = [word.strip(",") for word in input_string.split()]
    word_count = len(words)
    longest_word = max(words, key=len)
    longest_word_index = words.index(longest_word)
    even_words = [word for i, word in enumerate(words) if i % 2 == 0]
    return {
        "word_count": word_count,
        "longest_word": longest_word,
        "longest_word_index": longest_word_index,
        "even_words": even_words
    }

def task4():
    """
    Task 4: Analyze a predefined string and display results.
    """
    print("\n== Task 4: Analyze string ==")

    input_string = (
        "So she was considering in her own mind, as well as she could, "
        "for the hot day made her feel very sleepy and stupid, whether "
        "the pleasure of making a daisy-chain would be worth the trouble "
        "of getting up and picking the daisies, when suddenly a White Rabbit "
        "with pink eyes ran close by her."
    )

    results = analyze_string(input_string)

    print(f"Total number of words: {results['word_count']}")
    print(f"Longest word: '{results['longest_word']}' (Position: {results['longest_word_index']})")
    print("Even-indexed words:", ", ".join(results["even_words"]))