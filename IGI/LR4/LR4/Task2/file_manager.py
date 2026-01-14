import os
import zipfile

def get_data_directory():
    """
    Returns the path to the 'data' directory within Task2.
    Creates it if it does not exist.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

def read_text_file(filename):
    """
    Read text from the specified file located in the data directory.
    Args:
        filename (str): The filename (e.g., "input_text.txt").
    Returns:
        str: The content of the file.
    """
    data_dir = get_data_directory()
    full_path = os.path.join(data_dir, filename)
    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()

def write_text_file(filename, content):
    """
    Write the provided content to the specified file in the data directory.
    Args:
        filename (str): The filename for the output file.
        content (str): The text content to write.
    """
    data_dir = get_data_directory()
    full_path = os.path.join(data_dir, filename)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

def archive_file(file_to_archive, zip_filename):
    """
    Archive the specified file (located in the data directory) into a zip archive.
    The resulting zip file is also saved in the data directory.
    Args:
        file_to_archive (str): Name of the file to be archived (e.g., "result_text_analysis.txt").
        zip_filename (str): Name for the resulting zip file.
    """
    data_dir = get_data_directory()
    file_full_path = os.path.join(data_dir, file_to_archive)
    zip_full_path = os.path.join(data_dir, zip_filename)

    with zipfile.ZipFile(zip_full_path, 'w') as zipf:
        zipf.write(file_full_path, arcname=os.path.basename(file_full_path))

def get_archive_info(zip_filename):
    """
    Retrieve information about files contained in the zip archive stored in the data directory.
    Args:
        zip_filename (str): The filename of the zip archive.
    Returns:
        str: Information about each file in the archive.
    """
    data_dir = get_data_directory()
    zip_full_path = os.path.join(data_dir, zip_filename)
    info_str = ""
    with zipfile.ZipFile(zip_full_path, 'r') as zipf:
        for info in zipf.infolist():
            info_str += f"Filename: {info.filename}\n"
            info_str += f"File size: {info.file_size} bytes\n"
            info_str += f"Compressed size: {info.compress_size} bytes\n"
            info_str += f"Modified date: {info.date_time}\n"
            info_str += "--------------------------\n"
    return info_str