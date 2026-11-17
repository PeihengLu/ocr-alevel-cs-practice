/**
 * OCR past-paper inspired Python practice.
 * Prompts are original teaching rewrites that train the same skills —
 * never verbatim exam wording. Each prompt cites the source paper for focus only.
 */

import type { PythonExercise } from './linkedList.ts'

export interface PastPaperChapter {
  id: string
  title: string
  summary: string
  paperCode: string
  series: string
  level: 'AS' | 'A'
  exercises: PythonExercise[]
}

const AS_H046_02_2023: PythonExercise[] = [
  {
    id: 'pp-as23-to-binary',
    title: '1. Denary to binary remainders',
    prompt: `to_binary(n) converts an integer n in 0..255 to a binary string.

Use repeated division by 2. Each remainder is a bit: 1 if the value is odd, 0 if even. The first remainder is the least significant bit (rightmost). Keep dividing the quotient until it becomes 0, then join the remainders so the most significant bit is on the left.

Example: 25 → remainders 1, 0, 0, 1, 1 → "11001".
Special case: 0 returns "0".

Skill focus from OCR H046/02 May 2023 (denary-to-binary by remainders).`,
    starterCode: `def to_binary(n):
    # repeated /2 remainders; MSB on the left
    pass
`,
    tests: `
def __t_zero():
    assert to_binary(0) == "0"

__check("0 becomes \\"0\\"", __t_zero)

def __t_examples():
    assert to_binary(1) == "1"
    assert to_binary(25) == "11001"
    assert to_binary(255) == "11111111"
    assert to_binary(2) == "10"

__check("builds MSB-left binary for typical values", __t_examples)

def __t_range():
    assert to_binary(128) == "10000000"
    assert to_binary(10) == "1010"

__check("handles powers of two and small odds", __t_range)
`
  },
  {
    id: 'pp-as23-convert-if-valid',
    title: '2. Convert only when valid',
    prompt: `convert_if_valid(n) returns the binary string for n when n is an integer in 1..255 inclusive. Otherwise return None.

Reuse the same remainder method as to_binary once you know the input is allowed. Do not raise an error for out-of-range values — just return None.

Skill focus from OCR H046/02 May 2023 (validate then convert).`,
    starterCode: `def convert_if_valid(n):
    # return binary string for 1..255, else None
    pass
`,
    tests: `
def __t_ok():
    assert convert_if_valid(25) == "11001"
    assert convert_if_valid(1) == "1"
    assert convert_if_valid(255) == "11111111"

__check("converts values in 1..255", __t_ok)

def __t_reject():
    assert convert_if_valid(0) is None
    assert convert_if_valid(256) is None
    assert convert_if_valid(-3) is None

__check("returns None outside 1..255", __t_reject)
`
  },
  {
    id: 'pp-as23-fixed-stats',
    title: '3. Mean, smallest, largest',
    prompt: `fixed_stats(values) takes a non-empty list of positive numbers and returns a tuple (mean, smallest, largest).

mean is the arithmetic average (a float is fine). Walk the list once if you can: keep a running total, and update smallest and largest as you go.

Example: [4, 1, 9, 2] → mean 4.0, smallest 1, largest 9.

Skill focus from OCR H046/02 May 2023 (stats from a list — fix the broken algorithm idea).`,
    starterCode: `def fixed_stats(values):
    # return (mean, smallest, largest)
    pass
`,
    tests: `
def __t_basic():
    mean, smallest, largest = fixed_stats([4, 1, 9, 2])
    assert abs(mean - 4.0) < 1e-9
    assert smallest == 1
    assert largest == 9

__check("mean, smallest, and largest for mixed positives", __t_basic)

def __t_one():
    mean, smallest, largest = fixed_stats([7])
    assert mean == 7
    assert smallest == 7 and largest == 7

__check("a single value is mean, min, and max", __t_one)

def __t_same():
    mean, smallest, largest = fixed_stats([5, 5, 5])
    assert mean == 5 and smallest == 5 and largest == 5

__check("identical values still work", __t_same)
`
  }
]

const AS_H046_02_2025: PythonExercise[] = [
  {
    id: 'pp-as25-linear-search',
    title: '1. Linear search present?',
    prompt: `linear_search(array, value) returns True if value appears in array, otherwise False.

Walk from the start. Compare each element. Stop early once you find a match. An empty array never matches.

Skill focus from OCR H046/02 May 2025 (linear search).`,
    starterCode: `def linear_search(array, value):
    # True if value is found, else False
    pass
`,
    tests: `
def __t_found():
    assert linear_search([3, 8, 1, 8], 1) is True
    assert linear_search(["a", "b"], "a") is True

__check("finds a value that is present", __t_found)

def __t_missing():
    assert linear_search([3, 8, 1], 9) is False
    assert linear_search([], 1) is False

__check("returns False when missing or empty", __t_missing)
`
  },
  {
    id: 'pp-as25-stack',
    title: '2. Array stack (capacity 8)',
    prompt: `Implement class Stack for an array-backed stack of capacity 8.

- Empty pointer starts at -1.
- push(item) stores the item if there is room and returns True; if full, return False.
- pop() removes and returns the top item; if empty, return False.

Skill focus from OCR H046/02 May 2025 (array stack push/pop).`,
    starterCode: `class Stack:
    def __init__(self):
        # capacity 8, empty pointer -1
        pass

    def push(self, item):
        pass

    def pop(self):
        pass
`,
    tests: `
def __t_push_pop():
    s = Stack()
    assert s.push(10) is True
    assert s.push(20) is True
    assert s.pop() == 20
    assert s.pop() == 10

__check("push then pop is LIFO", __t_push_pop)

def __t_empty():
    s = Stack()
    assert s.pop() is False

__check("pop on empty returns False", __t_empty)

def __t_full():
    s = Stack()
    for i in range(8):
        assert s.push(i) is True
    assert s.push(99) is False
    assert s.pop() == 7

__check("rejects a ninth push at capacity 8", __t_full)
`
  },
  {
    id: 'pp-as25-initialise-slots',
    title: '3. Initialise inventory slots',
    prompt: `initialise_slots(n) returns a 2D list with n rows and 2 columns. Every cell is the string "empty".

Example: initialise_slots(3) → [["empty", "empty"], ["empty", "empty"], ["empty", "empty"]].

Skill focus from OCR H046/02 May 2025 (2D inventory initialisation).`,
    starterCode: `def initialise_slots(n):
    # n rows, 2 columns, each cell "empty"
    pass
`,
    tests: `
def __t_shape():
    slots = initialise_slots(10)
    assert len(slots) == 10
    assert all(len(row) == 2 for row in slots)
    assert all(cell == "empty" for row in slots for cell in row)

__check("builds n×2 of \\"empty\\"", __t_shape)

def __t_independent():
    slots = initialise_slots(2)
    slots[0][0] = "sword"
    assert slots[1][0] == "empty", "each row must be its own list"

__check("rows are independent lists", __t_independent)

def __t_zero():
    assert initialise_slots(0) == []

__check("n=0 returns []", __t_zero)
`
  }
]

const A_H446_01_2023: PythonExercise[] = [
  {
    id: 'pp-a01-23-apply-add',
    title: '1. Stack calculator add',
    prompt: `apply_add(stack) mutates a list used as a stack (top is the end via append/pop).

Pop two values. Add them. Push the sum back. Return nothing (None).

Assume the stack has at least two numbers.

Skill focus from OCR H446/01 June 2023 (stack calculator addition).`,
    starterCode: `def apply_add(stack):
    # pop two, push sum
    pass
`,
    tests: `
def __t_add():
    stack = [3, 5]
    apply_add(stack)
    assert stack == [8]

__check("adds the top two values", __t_add)

def __t_order():
    stack = [10, 1, 2]
    apply_add(stack)
    assert stack == [10, 3]

__check("leaves deeper values untouched", __t_order)
`
  },
  {
    id: 'pp-a01-23-apply-sub',
    title: '2. Stack calculator subtract',
    prompt: `apply_sub(stack) mutates a list-as-stack.

Pop two values. Subtract the first popped value from the second popped value, then push that result.

Example: stack [8, 3] → pop 3, pop 8 → push 8 - 3 → [5].

Skill focus from OCR H446/01 June 2023 (stack calculator subtraction).`,
    starterCode: `def apply_sub(stack):
    # first popped subtracted from second
    pass
`,
    tests: `
def __t_sub():
    stack = [8, 3]
    apply_sub(stack)
    assert stack == [5]

__check("subtracts first-popped from second-popped", __t_sub)

def __t_neg():
    stack = [2, 9]
    apply_sub(stack)
    assert stack == [-7]

__check("allows a negative result", __t_neg)
`
  },
  {
    id: 'pp-a01-23-do-check',
    title: '3. Digit-sum check digit',
    prompt: `do_check(number) converts the integer to digits, sums those digits, and returns that sum MOD 10.

Example: do_check(3178) → 3+1+7+8 = 19 → 9.

Skill focus from OCR H446/01 June 2023 (digit-sum MOD 10).`,
    starterCode: `def do_check(number):
    # digit sum, then MOD 10
    pass
`,
    tests: `
def __t_paper():
    assert do_check(3178) == 9

__check("matches the classic digit-sum example", __t_paper)

def __t_more():
    assert do_check(10) == 1
    assert do_check(99) == 8
    assert do_check(5) == 5

__check("works for other positive integers", __t_more)
`
  }
]

const A_H446_02_2022: PythonExercise[] = [
  {
    id: 'pp-a02-22-linear-index',
    title: '1. Linear search index',
    prompt: `linear_search_index(items, target) returns the index of the first match, or -1 if target is not found.

Skill focus from OCR H446/02 June 2022 (linear search).`,
    starterCode: `def linear_search_index(items, target):
    # index of target, or -1
    pass
`,
    tests: `
def __t_found():
    assert linear_search_index([4, 7, 2, 7], 7) == 1
    assert linear_search_index(["x"], "x") == 0

__check("returns the first matching index", __t_found)

def __t_missing():
    assert linear_search_index([4, 7, 2], 9) == -1
    assert linear_search_index([], 1) == -1

__check("returns -1 when not found", __t_missing)
`
  },
  {
    id: 'pp-a02-22-bubble',
    title: '2. Full bubble sort',
    prompt: `bubble_sort_pass_complete(arr) sorts the numbers into ascending order using bubble sort and returns the sorted list.

You may mutate arr in place and also return it, or build a new list — tests only check the returned order.

Skill focus from OCR H446/02 June 2022 (bubble sort).`,
    starterCode: `def bubble_sort_pass_complete(arr):
    # ascending bubble sort; return the sorted list
    pass
`,
    tests: `
def __t_sort():
    assert bubble_sort_pass_complete([5, 1, 4, 2]) == [1, 2, 4, 5]

__check("sorts ascending", __t_sort)

def __t_already():
    assert bubble_sort_pass_complete([1, 2, 3]) == [1, 2, 3]

__check("leaves a sorted list sorted", __t_already)

def __t_one():
    assert bubble_sort_pass_complete([9]) == [9]
    assert bubble_sort_pass_complete([]) == []

__check("handles short lists", __t_one)
`
  },
  {
    id: 'pp-a02-22-sum-to',
    title: '3. Recursive sum 1..n',
    prompt: `sum_to(n) returns 1 + 2 + ... + n using recursion (no loops, no sum()).

Base case: when n is 1, return 1.
Otherwise return n + sum_to(n - 1).
Assume n >= 1.

Skill focus from OCR H446/02 June 2022 (recursive calculate-style sum).`,
    starterCode: `def sum_to(n):
    # recursive 1..n
    pass
`,
    tests: `
def __t_base():
    assert sum_to(1) == 1

__check("base case n=1", __t_base)

def __t_values():
    assert sum_to(5) == 15
    assert sum_to(10) == 55

__check("sums 1..n recursively", __t_values)

def __t_small():
    assert sum_to(3) == 6
    assert sum_to(4) == 10

__check("computes small n correctly", __t_small)
`
  }
]

const A_H446_02_2023: PythonExercise[] = [
  {
    id: 'pp-a02-23-find-node',
    title: '1. Array linked-list find',
    prompt: `find_node(to_find, head, linked_list) searches an array-of-dicts linked list.

Each node is a dict with keys "data" and "pointer". A null pointer is -1.
Start at head. While the current index is not -1, if that node's data equals to_find, return the index. Otherwise follow pointer. If you walk off the list, return -1.

Skill focus from OCR H446/02 June 2023 (linked-list search).`,
    starterCode: `def find_node(to_find, head, linked_list):
    # return index of to_find, or -1
    pass
`,
    tests: `
def __t_found():
    # 0:"red"→2, 2:"green"→1, 1:"blue"→-1; free slots ignored
    linked = [
        {"data": "red", "pointer": 2},
        {"data": "blue", "pointer": -1},
        {"data": "green", "pointer": 1},
        {"data": "unused", "pointer": -1},
    ]
    assert find_node("green", 0, linked) == 2
    assert find_node("blue", 0, linked) == 1
    assert find_node("red", 0, linked) == 0

__check("returns the node index when present", __t_found)

def __t_missing():
    linked = [
        {"data": "red", "pointer": 1},
        {"data": "blue", "pointer": -1},
    ]
    assert find_node("yellow", 0, linked) == -1

__check("returns -1 when absent", __t_missing)
`
  },
  {
    id: 'pp-a02-23-is-integer',
    title: '2. Digits via ord / ASCII',
    prompt: `is_integer(s) returns True if every character in string s is a digit '0'..'9', otherwise False.

Check each character with ord(): digit codes are 48..57 inclusive. Do not use str.isdigit().

An empty string should return True (no failing character) or False — treat empty as False for this exercise.

Skill focus from OCR H446/02 June 2023 (ASCII digit check).`,
    starterCode: `def is_integer(s):
    # True only if every char has ord in 48..57
    pass
`,
    tests: `
def __t_digits():
    assert is_integer("103") is True
    assert is_integer("0") is True

__check("accepts digit-only strings", __t_digits)

def __t_reject():
    assert is_integer("12a") is False
    assert is_integer("-3") is False
    assert is_integer("") is False

__check("rejects non-digits and empty", __t_reject)

def __t_ord():
    # ensure logic works via code points
    assert is_integer(chr(48) + chr(57)) is True
    assert is_integer(chr(47)) is False

__check("uses 48..57 style digit bounds", __t_ord)
`
  },
  {
    id: 'pp-a02-23-recursive',
    title: '3. Branching recursive algorithm',
    prompt: `recursive_algorithm(value) follows this logic (verified against the paper):

- if value <= 0: return 1
- elif value is even: return value + recursive_algorithm(value - 3)
- else: return value + recursive_algorithm(value - 1)

Example path for 10: 10 → 7 → 6 → 3 → 2 → -1 → 1, final return 29.

Skill focus from OCR H446/02 June 2023 (recursiveAlgorithm).`,
    starterCode: `def recursive_algorithm(value):
    # base <=0 → 1; even → value + recurse(value-3); odd → value + recurse(value-1)
    pass
`,
    tests: `
def __t_base():
    assert recursive_algorithm(0) == 1
    assert recursive_algorithm(-1) == 1

__check("base case returns 1", __t_base)

def __t_trace():
    assert recursive_algorithm(10) == 29
    assert recursive_algorithm(2) == 3
    assert recursive_algorithm(3) == 6

__check("matches traced paper values", __t_trace)
`
  }
]

const A_H446_02_2024: PythonExercise[] = [
  {
    id: 'pp-a02-24-stack100',
    title: '1. Stack capacity 100',
    prompt: `Implement class Stack100: array-backed stack with capacity 100.

- Empty pointer starts at -1 (top index of the last pushed item).
- push(data) stores data if not full and returns True; if full, return False.
- pop() returns the removed value, or False when empty.

Skill focus from OCR H446/02 June 2024 (array stack push at capacity 100).`,
    starterCode: `class Stack100:
    def __init__(self):
        # capacity 100, empty at -1
        pass

    def push(self, data):
        pass

    def pop(self):
        pass
`,
    tests: `
def __t_basic():
    s = Stack100()
    assert s.push(15) is True
    assert s.pop() == 15

__check("push and pop one value", __t_basic)

def __t_empty():
    assert Stack100().pop() is False

__check("pop empty returns False", __t_empty)

def __t_full():
    s = Stack100()
    for i in range(100):
        assert s.push(i) is True
    assert s.push(0) is False

__check("100th push fills; 101st fails", __t_full)
`
  },
  {
    id: 'pp-a02-24-prize',
    title: '2. Prize class',
    prompt: `Implement class Prize(name, type, value).

Store the three attributes. Provide get_name(), get_type(), and get_value() that return them.

Skill focus from OCR H446/02 June 2024 (Prize OOP).`,
    starterCode: `class Prize:
    def __init__(self, name, type, value):
        pass

    def get_name(self):
        pass

    def get_type(self):
        pass

    def get_value(self):
        pass
`,
    tests: `
def __t_store():
    p = Prize("Box", "money", 25)
    assert p.get_name() == "Box"
    assert p.get_type() == "money"
    assert p.get_value() == 25

__check("stores and returns prize fields", __t_store)
`
  },
  {
    id: 'pp-a02-24-character',
    title: '3. Character.update_values',
    prompt: `Implement class Character(name).

Constructor sets money to 5, experience to 0, road_position to 0, and stores name.

update_values(stat, amount):
- if stat is "money", add amount to money
- if stat is "experience", add amount to experience
- otherwise change nothing

Expose get_money() and get_experience() for checks.

Skill focus from OCR H446/02 June 2024 (Character.updateValues).`,
    starterCode: `class Character:
    def __init__(self, name):
        pass

    def update_values(self, stat, amount):
        pass

    def get_money(self):
        pass

    def get_experience(self):
        pass
`,
    tests: `
def __t_init():
    c = Character("Jamal")
    assert c.get_money() == 5
    assert c.get_experience() == 0

__check("starts with money 5 and experience 0", __t_init)

def __t_update():
    c = Character("Ada")
    c.update_values("money", 10)
    c.update_values("experience", 5)
    c.update_values("foo", 9)
    assert c.get_money() == 15
    assert c.get_experience() == 5

__check("updates known stats only", __t_update)
`
  }
]

const A_H446_02_2025: PythonExercise[] = [
  {
    id: 'pp-a02-25-stack20',
    title: '1. Stack capacity 20',
    prompt: `Implement class Stack20 with capacity 20. Empty pointer is -1.

push(data) returns True on success, False when full.
pop() returns the removed item. If empty, return False (the paper returns the string "false"; use the Boolean False here for Pythonic tests).

Skill focus from OCR H446/02 June 2025 (stack push/pop, empty pointer -1).`,
    starterCode: `class Stack20:
    def __init__(self):
        # capacity 20, empty pointer -1
        pass

    def push(self, data):
        pass

    def pop(self):
        pass
`,
    tests: `
def __t_lifo():
    s = Stack20()
    assert s.push("k") is True
    assert s.push("n") is True
    assert s.pop() == "n"
    assert s.pop() == "k"

__check("LIFO push/pop", __t_lifo)

def __t_empty():
    assert Stack20().pop() is False

__check("empty pop returns False", __t_empty)

def __t_full():
    s = Stack20()
    for i in range(20):
        assert s.push(i) is True
    assert s.push("x") is False

__check("rejects push when full", __t_full)
`
  },
  {
    id: 'pp-a02-25-partition',
    title: '2. Lomuto partition',
    prompt: `partition(array, low, high) performs a Lomuto partition for quicksort on the slice array[low..high] inclusive.

Use array[high] as the pivot. Move every value strictly less than the pivot to the left. Place the pivot in its final index and return that index. Mutate array in place.

Skill focus from OCR H446/02 June 2025 (quicksort partition).`,
    starterCode: `def partition(array, low, high):
    # Lomuto: pivot = array[high]; return final pivot index
    pass
`,
    tests: `
def __t_basic():
    arr = [4, 1, 3, 2]
    idx = partition(arr, 0, 3)
    assert idx == 1
    assert arr[idx] == 2
    assert all(v < 2 for v in arr[:idx])
    assert all(v >= 2 for v in arr[idx + 1 :])

__check("places pivot and splits less/greater", __t_basic)

def __t_sorted():
    arr = [1, 2, 3]
    idx = partition(arr, 0, 2)
    assert idx == 2
    assert arr == [1, 2, 3]

__check("already ascending keeps pivot at end", __t_sorted)
`
  },
  {
    id: 'pp-a02-25-bubble-efficient',
    title: '3. Efficient bubble sort',
    prompt: `bubble_sort_efficient(arr) sorts ascending and returns the sorted list.

Use an early-exit idea: stop when a full pass makes no swaps, and/or shrink the unsorted bound each pass so you do not re-check the settled tail.

Skill focus from OCR H446/02 June 2025 (bubble-sort efficiency).`,
    starterCode: `def bubble_sort_efficient(arr):
    # ascending; early exit / shrinking bound
    pass
`,
    tests: `
def __t_sort():
    assert bubble_sort_efficient([3, 1, 4, 1, 5]) == [1, 1, 3, 4, 5]

__check("sorts with duplicates", __t_sort)

def __t_early():
    assert bubble_sort_efficient([1, 2, 3, 4]) == [1, 2, 3, 4]
    assert bubble_sort_efficient([]) == []

__check("handles sorted and empty lists", __t_early)
`
  }
]

const A_H446_02_2021: PythonExercise[] = [
  {
    id: 'pp-a02-21-binary-search',
    title: '1. Binary search index',
    prompt: `binary_search(data_array, search_value) assumes data_array is sorted ascending.

Return the index of search_value, or -1 if it is not present. Use the classic mid = low + (high - low) // 2 approach and narrow the bounds until found or the range is empty.

Skill focus from OCR H446/02 Nov 2021 (binary search completion).`,
    starterCode: `def binary_search(data_array, search_value):
    # sorted ascending; return index or -1
    pass
`,
    tests: `
def __t_found():
    data = [1, 3, 5, 7, 9]
    assert binary_search(data, 1) == 0
    assert binary_search(data, 7) == 3
    assert binary_search(data, 9) == 4

__check("finds values at ends and middle", __t_found)

def __t_missing():
    assert binary_search([1, 3, 5], 4) == -1
    assert binary_search([], 1) == -1

__check("returns -1 when absent", __t_missing)
`
  },
  {
    id: 'pp-a02-21-house',
    title: '2. House class',
    prompt: `Implement class House(floors, width, height, bedrooms, bathrooms).

Store all five attributes on the instance (names of your choice are fine if get_* methods below match).

Provide:
- get_floors(), get_width(), get_height(), get_bedrooms(), get_bathrooms()
- set_floors(n) which sets floors only when n >= 1 and returns True; otherwise leaves floors unchanged and returns False

Skill focus from OCR H446/02 Nov 2021 (House / building OOP write-code).`,
    starterCode: `class House:
    def __init__(self, floors, width, height, bedrooms, bathrooms):
        pass

    def get_floors(self):
        pass

    def get_width(self):
        pass

    def get_height(self):
        pass

    def get_bedrooms(self):
        pass

    def get_bathrooms(self):
        pass

    def set_floors(self, n):
        pass
`,
    tests: `
def __t_init():
    h = House(2, 8, 10, 3, 2)
    assert h.get_floors() == 2
    assert h.get_width() == 8
    assert h.get_height() == 10
    assert h.get_bedrooms() == 3
    assert h.get_bathrooms() == 2

__check("stores house attributes", __t_init)

def __t_set():
    h = House(2, 8, 10, 3, 2)
    assert h.set_floors(4) is True
    assert h.get_floors() == 4
    assert h.set_floors(0) is False
    assert h.get_floors() == 4

__check("set_floors validates n >= 1", __t_set)
`
  },
  {
    id: 'pp-a02-21-grids-match',
    title: '3. Grids match?',
    prompt: `grids_match(puzzle, answer_grid) compares two same-size 2D lists cell by cell.

Return True only if every corresponding cell is equal; otherwise False.

(This is the corrected form of a common exam checkWon-style routine that wrongly returned early on a match.)

Skill focus from OCR H446/02 Nov 2021 (grid comparison / checkWon idea).`,
    starterCode: `def grids_match(puzzle, answer_grid):
    # True iff every cell matches
    pass
`,
    tests: `
def __t_same():
    a = [[1, 0], [0, 1]]
    b = [[1, 0], [0, 1]]
    assert grids_match(a, b) is True

__check("identical grids match", __t_same)

def __t_diff():
    a = [[1, 0], [0, 1]]
    b = [[1, 0], [1, 1]]
    assert grids_match(a, b) is False

__check("a single difference fails", __t_diff)
`
  }
]

export const PAST_PAPER_CHAPTERS: PastPaperChapter[] = [
  {
    id: 'as-h046-02-2023',
    title: 'AS H046/02 May 2023',
    summary:
      'Binary conversion by remainders, validate-then-convert, and list statistics (mean / min / max).',
    paperCode: 'H046/02',
    series: 'May 2023',
    level: 'AS',
    exercises: AS_H046_02_2023
  },
  {
    id: 'as-h046-02-2025',
    title: 'AS H046/02 May 2025',
    summary: 'Linear search, an array stack of capacity 8, and 2D inventory initialisation.',
    paperCode: 'H046/02',
    series: 'May 2025',
    level: 'AS',
    exercises: AS_H046_02_2025
  },
  {
    id: 'a-h446-01-2023',
    title: 'A H446/01 June 2023',
    summary: 'Stack calculator add/subtract helpers and a digit-sum MOD 10 check.',
    paperCode: 'H446/01',
    series: 'June 2023',
    level: 'A',
    exercises: A_H446_01_2023
  },
  {
    id: 'a-h446-02-2022',
    title: 'A H446/02 June 2022',
    summary: 'Linear search by index, full bubble sort, and recursive sum 1..n.',
    paperCode: 'H446/02',
    series: 'June 2022',
    level: 'A',
    exercises: A_H446_02_2022
  },
  {
    id: 'a-h446-02-2023',
    title: 'A H446/02 June 2023',
    summary:
      'Array-of-dicts linked-list find, ASCII digit validation, and a branching recursive algorithm.',
    paperCode: 'H446/02',
    series: 'June 2023',
    level: 'A',
    exercises: A_H446_02_2023
  },
  {
    id: 'a-h446-02-2024',
    title: 'A H446/02 June 2024',
    summary: 'Capacity-100 stack, Prize class, and Character.update_values for known stats only.',
    paperCode: 'H446/02',
    series: 'June 2024',
    level: 'A',
    exercises: A_H446_02_2024
  },
  {
    id: 'a-h446-02-2025',
    title: 'A H446/02 June 2025',
    summary: 'Capacity-20 stack, Lomuto partition, and bubble sort with an efficiency tweak.',
    paperCode: 'H446/02',
    series: 'June 2025',
    level: 'A',
    exercises: A_H446_02_2025
  },
  {
    id: 'a-h446-02-2021',
    title: 'A H446/02 Nov 2021',
    summary: 'Binary search, House OOP with validated setter, and 2D grid comparison.',
    paperCode: 'H446/02',
    series: 'Nov 2021',
    level: 'A',
    exercises: A_H446_02_2021
  }
]

export function findPastPaperExercise(id: string): PythonExercise | undefined {
  for (const chapter of PAST_PAPER_CHAPTERS) {
    const found = chapter.exercises.find((item) => item.id === id)
    if (found) return found
  }
  return undefined
}

export function chapterForPastPaperExercise(id: string): PastPaperChapter | undefined {
  return PAST_PAPER_CHAPTERS.find((chapter) =>
    chapter.exercises.some((item) => item.id === id)
  )
}
