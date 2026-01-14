import os
from .text_analyzer import RegexTextAnalyzer
from . import file_manager

def task2():
    """
    Execute Task 2: Text Analysis.
    Steps:
      1. Read text from input file.
      2. Analyze text: sentence count (by type), average lengths, smileys count, etc.
      3. Perform additional regex tasks including extraction and substitution.
      4. Display and save the results.
      5. Archive the result file and show archive info.
      6. Provide an option to re-run the task.
    """
    input_filename = "input_text.txt"
    result_filename = "result_text_analysis.txt"
    zip_filename = "result_archive.zip"

    data_dir = file_manager.get_data_directory()
    input_full_path = os.path.join(data_dir, input_filename)

    if not os.path.exists(input_full_path):
        print(
            f"Input file '{input_filename}' not found in {data_dir}. Please create this file with the text to analyze.")
        return

    text = file_manager.read_text_file(input_filename)

    analyzer = RegexTextAnalyzer(text)

    analysis_results = []
    analysis_results.append("------ Text Analysis Results ------")

    sentences_info = analyzer.analyze_sentences()
    analysis_results.append(f"Total number of sentences: {sentences_info['total']}")
    analysis_results.append(f"Declarative (ending with '.'): {sentences_info['declarative']}")
    analysis_results.append(f"Interrogative (ending with '?'): {sentences_info['interrogative']}")
    analysis_results.append(f"Exclamatory (ending with '!'): {sentences_info['exclamatory']}")

    avg_sentence_len = analyzer.average_sentence_length()
    analysis_results.append(f"Average sentence length (word characters only): {avg_sentence_len:.2f}")

    avg_word_len = analyzer.average_word_length()
    analysis_results.append(f"Average word length: {avg_word_len:.2f}")

    smiley_count = analyzer.count_smileys()
    analysis_results.append(f"Number of smileys: {smiley_count}")

    uppercase_letters = analyzer.get_uppercase_letters()
    if uppercase_letters:
        analysis_results.append("Uppercase English letters: " + ", ".join(uppercase_letters))
    else:
        analysis_results.append("No uppercase English letters found.")

    replaced_text = analyzer.replace_pattern()
    analysis_results.append("Text after replacing pattern a+b{2,}c+ with 'qqq':")
    analysis_results.append(replaced_text)

    max_length_words_count = analyzer.count_max_length_words()
    analysis_results.append(f"Number of words with maximum length: {max_length_words_count}")

    words_punct = analyzer.get_words_followed_by_punct()
    analysis_results.append("Words followed by a comma or period: " + ", ".join(words_punct))

    longest_word = analyzer.longest_word_ending_on_e()
    analysis_results.append(f"Longest word ending with 'е': {longest_word}")

    result_text = "\n".join(analysis_results)
    print(result_text)

    file_manager.write_text_file(result_filename, result_text)
    print(f"\nAnalysis results have been saved to '{result_filename}' in {data_dir}.")

    try:
        file_manager.archive_file(result_filename, zip_filename)
        print(f"Result file has been archived as '{zip_filename}' in {data_dir}.")
    except Exception as e:
        print(f"Error archiving result file: {e}")
        return

    archive_info = file_manager.get_archive_info(zip_filename)
    print("\n---- Archive File Information ----")
    print(archive_info)

    repeat = input("Do you want to run Task 2 again? (y/n): ").strip().lower()
    if repeat == 'y':
        task2()
    else:
        print("Returning to main menu.")