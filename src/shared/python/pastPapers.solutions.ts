/** Reference solutions for past-paper exercises (smoke tests only). */

export const PAST_PAPER_SOLUTIONS: Record<string, string> = {
  'pp-as23-to-binary': `def to_binary(n):
    if n == 0:
        return "0"
    bits = []
    while n > 0:
        bits.append(str(n % 2))
        n //= 2
    return "".join(reversed(bits))
`,
  'pp-as23-convert-if-valid': `def to_binary(n):
    if n == 0:
        return "0"
    bits = []
    while n > 0:
        bits.append(str(n % 2))
        n //= 2
    return "".join(reversed(bits))

def convert_if_valid(n):
    if not isinstance(n, int) or n < 1 or n > 255:
        return None
    return to_binary(n)
`,
  'pp-as23-fixed-stats': `def fixed_stats(values):
    total = 0
    smallest = values[0]
    largest = values[0]
    for value in values:
        total += value
        if value < smallest:
            smallest = value
        if value > largest:
            largest = value
    return (total / len(values), smallest, largest)
`,
  'pp-as25-linear-search': `def linear_search(array, value):
    for item in array:
        if item == value:
            return True
    return False
`,
  'pp-as25-stack': `class Stack:
    def __init__(self):
        self.items = [None] * 8
        self.pointer = -1

    def push(self, item):
        if self.pointer == 7:
            return False
        self.pointer += 1
        self.items[self.pointer] = item
        return True

    def pop(self):
        if self.pointer == -1:
            return False
        value = self.items[self.pointer]
        self.pointer -= 1
        return value
`,
  'pp-as25-initialise-slots': `def initialise_slots(n):
    return [["empty", "empty"] for _ in range(n)]
`,
  'pp-a01-23-apply-add': `def apply_add(stack):
    a = stack.pop()
    b = stack.pop()
    stack.append(b + a)
`,
  'pp-a01-23-apply-sub': `def apply_sub(stack):
    first = stack.pop()
    second = stack.pop()
    stack.append(second - first)
`,
  'pp-a01-23-do-check': `def do_check(number):
    total = 0
    for ch in str(number):
        total += int(ch)
    return total % 10
`,
  'pp-a02-22-linear-index': `def linear_search_index(items, target):
    for i, item in enumerate(items):
        if item == target:
            return i
    return -1
`,
  'pp-a02-22-bubble': `def bubble_sort_pass_complete(arr):
    data = list(arr)
    n = len(data)
    for _ in range(n):
        swapped = False
        for i in range(n - 1):
            if data[i] > data[i + 1]:
                data[i], data[i + 1] = data[i + 1], data[i]
                swapped = True
        if not swapped:
            break
    return data
`,
  'pp-a02-22-sum-to': `def sum_to(n):
    if n == 1:
        return 1
    return n + sum_to(n - 1)
`,
  'pp-a02-23-find-node': `def find_node(to_find, head, linked_list):
    current = head
    while current != -1:
        if linked_list[current]["data"] == to_find:
            return current
        current = linked_list[current]["pointer"]
    return -1
`,
  'pp-a02-23-is-integer': `def is_integer(s):
    if s == "":
        return False
    for ch in s:
        code = ord(ch)
        if code < 48 or code > 57:
            return False
    return True
`,
  'pp-a02-23-recursive': `def recursive_algorithm(value):
    if value <= 0:
        return 1
    if value % 2 == 0:
        return value + recursive_algorithm(value - 3)
    return value + recursive_algorithm(value - 1)
`,
  'pp-a02-24-stack100': `class Stack100:
    def __init__(self):
        self.items = [None] * 100
        self.pointer = -1

    def push(self, data):
        if self.pointer == 99:
            return False
        self.pointer += 1
        self.items[self.pointer] = data
        return True

    def pop(self):
        if self.pointer == -1:
            return False
        value = self.items[self.pointer]
        self.pointer -= 1
        return value
`,
  'pp-a02-24-prize': `class Prize:
    def __init__(self, name, type, value):
        self.name = name
        self.type = type
        self.value = value

    def get_name(self):
        return self.name

    def get_type(self):
        return self.type

    def get_value(self):
        return self.value
`,
  'pp-a02-24-character': `class Character:
    def __init__(self, name):
        self.name = name
        self.money = 5
        self.experience = 0
        self.road_position = 0

    def update_values(self, stat, amount):
        if stat == "money":
            self.money += amount
        elif stat == "experience":
            self.experience += amount

    def get_money(self):
        return self.money

    def get_experience(self):
        return self.experience
`,
  'pp-a02-25-stack20': `class Stack20:
    def __init__(self):
        self.items = [None] * 20
        self.pointer = -1

    def push(self, data):
        if self.pointer == 19:
            return False
        self.pointer += 1
        self.items[self.pointer] = data
        return True

    def pop(self):
        if self.pointer == -1:
            return False
        value = self.items[self.pointer]
        self.pointer -= 1
        return value
`,
  'pp-a02-25-partition': `def partition(array, low, high):
    pivot = array[high]
    index = low - 1
    for count in range(low, high):
        if array[count] < pivot:
            index += 1
            array[index], array[count] = array[count], array[index]
    array[index + 1], array[high] = array[high], array[index + 1]
    return index + 1
`,
  'pp-a02-25-bubble-efficient': `def bubble_sort_efficient(arr):
    data = list(arr)
    n = len(data)
    bound = n - 1
    while bound > 0:
        swapped = False
        new_bound = 0
        for i in range(bound):
            if data[i] > data[i + 1]:
                data[i], data[i + 1] = data[i + 1], data[i]
                swapped = True
                new_bound = i
        if not swapped:
            break
        bound = new_bound
    return data
`,
  'pp-a02-21-binary-search': `def binary_search(data_array, search_value):
    low = 0
    high = len(data_array) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if data_array[mid] == search_value:
            return mid
        if data_array[mid] < search_value:
            low = mid + 1
        else:
            high = mid - 1
    return -1
`,
  'pp-a02-21-house': `class House:
    def __init__(self, floors, width, height, bedrooms, bathrooms):
        self.floors = floors
        self.width = width
        self.height = height
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms

    def get_floors(self):
        return self.floors

    def get_width(self):
        return self.width

    def get_height(self):
        return self.height

    def get_bedrooms(self):
        return self.bedrooms

    def get_bathrooms(self):
        return self.bathrooms

    def set_floors(self, n):
        if n >= 1:
            self.floors = n
            return True
        return False
`,
  'pp-a02-21-grids-match': `def grids_match(puzzle, answer_grid):
    for r in range(len(puzzle)):
        for c in range(len(puzzle[r])):
            if puzzle[r][c] != answer_grid[r][c]:
                return False
    return True
`
}
