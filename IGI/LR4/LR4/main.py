# Lab 4: Working with files, classes, serializers, regular expressions, and standard libraries.
# Version: 1.0
# Developer: Vediz Antonava Lidia
# Date: 2025-04-24

import Task1.task1 as task1_module
import Task2.task2 as task2_module
import Task3.task3 as task3_module
import Task4.task4 as task4_module
import Task5.task5 as task5_module

def menu():
    """
    Function to display the main menu and execute the selected task.
    """
    print("==Menu==")
    print("Choose task:")
    print("1. Task 1")
    print("2. Task 2")
    print("3. Task 3")
    print("4. Task 4")
    print("5. Task 5")
    print("0. Exit")

def main():
    """Main program"""
    while True:
        menu()
        choice = input("Choose: ").strip()
        try:
            if choice == '1':
                task1_module.task1()
            elif choice == '2':
                task2_module.task2()
            elif choice == '3':
                task3_module.task3()
            elif choice == '4':
                task4_module.task4()
            elif choice == '5':
                task5_module.task5()
            elif choice == '0':
                print("Exiting program...")
                break
            else:
                print("Invalid choice. Try again.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__": main()