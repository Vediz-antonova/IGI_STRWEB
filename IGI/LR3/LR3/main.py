# Lab 3: Standard Data Types, Collections, Functions, Modules
# Version: 1.0
# Developer: Vediz Antonava Lidia
# Date: 2025-03-24

import Task1
import Task2
import Task3
import Task4
import Task5

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
                Task1.task1()
            elif choice == '2':
                Task2.task2()
            elif choice == '3':
                Task3.task3()
            elif choice == '4':
                Task4.task4()
            elif choice == '5':
                Task5.task5()
            elif choice == '0':
                print("Exiting program...")
                break
            else:
                print("Invalid choice. Try again.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__": main()