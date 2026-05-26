
/*
Simple Number Guessing Game (C++)

README
------
This is a tiny, self-contained C++ console project suitable for adding to a main GitHub
repository as a basic example. The program picks a random number between 1 and 100 and
prompts the user to guess it, giving higher/lower hints and reporting the number of
attempts when the user succeeds.

How to compile
--------------
- g++ -std=c++17 -O2 -o guess_game Untitled-1

How to run
----------
- ./guess_game

Notes
-----
- Single-file, no external dependencies.
- Good starter project for beginners to demonstrate building and running C++ code.
*/

#include <iostream>
#include <random>
#include <limits>

int main() {
	std::random_device rd;
	std::mt19937 gen(rd());
	std::uniform_int_distribution<> dist(1, 100);
	int target = dist(gen);

	std::cout << "Welcome to the Number Guessing Game!\n";
	std::cout << "I'm thinking of a number between 1 and 100. Try to guess it.\n";

	int attempts = 0;
	while (true) {
		std::cout << "Enter your guess: ";
		int guess;
		if (!(std::cin >> guess)) {
			// handle non-integer input
			std::cin.clear();
			std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
			std::cout << "Please enter a valid integer.\n";
			continue;
		}
		++attempts;
		if (guess < target) {
			std::cout << "Too low. Try again.\n";
		} else if (guess > target) {
			std::cout << "Too high. Try again.\n";
		} else {
			std::cout << "Congratulations! You guessed the number in " << attempts << " attempts.\n";
			break;
		}
	}

	return 0;
}
