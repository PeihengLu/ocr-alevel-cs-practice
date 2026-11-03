/**
 * Problem-solving course. The student already knows loops, lists, and strings.
 * Each chapter is one way of using them: visit one value, remember a fact,
 * decide inside the loop, keep a place, then the same ideas on text, while, and nesting.
 */

import type { PythonExercise } from './linkedList.ts'

export const WALK_EXERCISES: PythonExercise[] = [
  {
    id: 'walk-copy',
    title: '1. Sequential traversal',
    prompt: `copied(items) returns a new list of the same values, in the same order.

A line of code looks at one value. A loop is how you look at every value: the body runs once per value, then the loop stops.

Start result as an empty list. For each value in items, append that value to result. Return result.

Trace [10, 20]. result starts as []. The first visit appends 10. The second visit appends 20. Then there is no next value, so the loop stops.

[] never enters the loop, so result stays [].`,
    starterCode: `def copied(items):
    # result starts empty, then one append per value
    pass
`,
    tests: `
def __t_empty():
    assert copied([]) == []

__check("an empty list copies to []", __t_empty)

def __t_values():
    assert copied([10, 20, 30]) == [10, 20, 30]
    assert copied(["a", "b"]) == ["a", "b"]

__check("visits every value, in order", __t_values)

def __t_new():
    items = [1, 2]
    result = copied(items)
    assert result == [1, 2]
    assert result is not items, "build a new list by visiting, and leave items as it was"

__check("returns a new list", __t_new)
`
  },
  {
    id: 'walk-total',
    title: '2. Running total',
    prompt: `total(items) returns the sum of the numbers.

The thing you remember has to live outside the loop. A name created inside the loop starts fresh on every visit. Create total before the loop, set it to 0, and add the current value onto it each visit. Return total after the loop.

An empty list never visits, so the total stays 0.
[1, 2, 3] goes 0, then 1, then 3, then 6.`,
    starterCode: `def total(items):
    # total starts at 0, before the loop
    pass
`,
    tests: `
def __t_empty():
    assert total([]) == 0

__check("an empty list sums to 0", __t_empty)

def __t_one():
    assert total([5]) == 5

__check("one value is the whole total", __t_one)

def __t_sum():
    assert total([1, 2, 3]) == 6
    assert total([10, -3]) == 7

__check("adds every value, including a negative", __t_sum)
`
  },
  {
    id: 'walk-count',
    title: '3. Element count',
    prompt: `how_many(items) returns how many values are in the list.

This is a total again. count starts at 0 before the loop. Each visit adds 1, whatever the value is. Return count after the loop.

Count by visiting each value. Do not call len.

[] is 0. ["a", "b", "c"] is 3.`,
    starterCode: `def how_many(items):
    # count starts at 0 and grows by 1 per visit
    pass
`,
    tests: `
def __t_empty():
    assert how_many([]) == 0

__check("an empty list has 0 values", __t_empty)

def __t_some():
    assert how_many([5]) == 1
    assert how_many(["a", "b", "c"]) == 3

__check("counts every visit", __t_some)

def __t_visits():
    class Bag:
        def __init__(self):
            self._values = ["a", "b", "c"]
        def __iter__(self):
            return iter(self._values)
        def __len__(self):
            raise AssertionError("count by visiting each value")
    assert how_many(Bag()) == 3

__check("counts by visiting, without len", __t_visits)
`
  },
  {
    id: 'walk-double',
    title: '4. Element-wise mapping',
    prompt: `doubled(items) returns a new list where each number is twice as big.

Same walk as copied. The body is the part that changes: append value * 2, not value itself.

Leave items as it was. Build a new list.
[1, 2, 3] returns [2, 4, 6]. [] returns [].`,
    starterCode: `def doubled(items):
    # a new list, one doubled value per visit
    pass
`,
    tests: `
def __t_empty():
    assert doubled([]) == []

__check("an empty list stays empty", __t_empty)

def __t_values():
    assert doubled([1, 2, 3]) == [2, 4, 6]

__check("doubles every value", __t_values)

def __t_leaves():
    items = [1, 2]
    assert doubled(items) == [2, 4]
    assert items == [1, 2], "leave the original list unchanged"

__check("does not change the list it was given", __t_leaves)
`
  }
]

export const DECIDE_EXERCISES: PythonExercise[] = [
  {
    id: 'ask-count',
    title: '1. Match count',
    prompt: `count_matches(items, target) returns how many values equal target.

Walk the list the same way as a total. On each visit, ask one question: is this value equal to target? Add 1 only when the answer is yes.

[] returns 0. [1, 2, 1] with target 1 returns 2. [1, 2, 3] with target 9 returns 0.`,
    starterCode: `def count_matches(items, target):
    # count starts at 0; add 1 only on a match
    pass
`,
    tests: `
def __t_empty():
    assert count_matches([], 1) == 0

__check("an empty list has no matches", __t_empty)

def __t_some():
    assert count_matches([1, 2, 1], 1) == 2
    assert count_matches(["a", "a", "b"], "a") == 2

__check("counts every match", __t_some)

def __t_none():
    assert count_matches([1, 2, 3], 9) == 0

__check("returns 0 when nothing matches", __t_none)
`
  },
  {
    id: 'ask-keep',
    title: '2. Filter',
    prompt: `positives(items) returns a new list of the values that are greater than 0.

Walk the list. Append a value only when it is greater than 0. Zero and negative numbers stay out.

[] returns []. [3, -1, 0, 2] returns [3, 2].`,
    starterCode: `def positives(items):
    # new list; append only when the value is greater than 0
    pass
`,
    tests: `
def __t_empty():
    assert positives([]) == []

__check("an empty list stays empty", __t_empty)

def __t_keep():
    assert positives([3, -1, 0, 2]) == [3, 2]

__check("keeps positives, in order", __t_keep)

def __t_none():
    assert positives([-2, 0, -4]) == []

__check("drops every value that is not positive", __t_none)

def __t_leaves():
    items = [1, -1]
    assert positives(items) == [1]
    assert items == [1, -1]

__check("leaves the original list unchanged", __t_leaves)
`
  },
  {
    id: 'ask-found',
    title: '3. Early return',
    prompt: `contains(items, target) returns True if any value equals target, otherwise False.

You can stop once the answer is known. When a value equals target, return True immediately. Later values do not matter. If the loop finishes with no match, return False.

[] returns False. [4, 5, 6] with target 5 returns True. [4, 5, 6] with target 9 returns False.`,
    starterCode: `def contains(items, target):
    # return True on the first match, False if the loop finishes
    pass
`,
    tests: `
def __t_empty():
    assert contains([], 1) is False

__check("an empty list contains nothing", __t_empty)

def __t_yes():
    assert contains([4, 5, 6], 4) is True
    assert contains([4, 5, 6], 6) is True
    assert contains(["a", "b"], "b") is True

__check("finds a match at the start or the end", __t_yes)

def __t_no():
    assert contains([4, 5, 6], 9) is False

__check("returns False when the value never appears", __t_no)
`
  },
  {
    id: 'ask-all',
    title: '4. Universal check',
    prompt: `all_positive(items) returns True when every value is greater than 0.

Return False as soon as one value fails the test. If the loop finishes, every value passed, so return True.

An empty list has no failing value, so it returns True.
[1, 2] returns True. [1, -2] returns False. [] returns True.`,
    starterCode: `def all_positive(items):
    # return False on the first failing value
    pass
`,
    tests: `
def __t_empty():
    assert all_positive([]) is True

__check("an empty list has no failing value", __t_empty)

def __t_yes():
    assert all_positive([1, 4, 2]) is True

__check("true when every value is positive", __t_yes)

def __t_no():
    assert all_positive([1, 0, 2]) is False
    assert all_positive([-1]) is False

__check("false as soon as one value is not positive", __t_no)
`
  }
]

export const FACT_EXERCISES: PythonExercise[] = [
  {
    id: 'fact-last',
    title: '1. Last element',
    prompt: `last_item(items) returns the last value, or None when the list is empty.

If the list is empty, return None before the loop. There is no value to remember.

Otherwise remember the first value in a variable called last. Each visit replaces last with the value you are on. After the loop, last is the final value.

[] returns None. [4] returns 4. [4, 5, 6] returns 6.`,
    starterCode: `def last_item(items):
    # empty list returns None; otherwise replace last on each visit
    pass
`,
    tests: `
def __t_empty():
    assert last_item([]) is None

__check("an empty list has no last value", __t_empty)

def __t_one():
    assert last_item([4]) == 4

__check("one value is the last value", __t_one)

def __t_last():
    assert last_item([4, 5, 6]) == 6
    assert last_item(["ann", "bo"]) == "bo"

__check("returns the final value", __t_last)
`
  },
  {
    id: 'fact-biggest',
    title: '2. Maximum',
    prompt: `biggest(items) returns the largest value, or None when the list is empty.

Return None when the list is empty. You need one real value to start from.

Remember the first value. On each visit, if this value is larger than the one you remember, remember this one instead. Return what you remember.

[3, 9, 4] starts at 3, becomes 9, and stays 9. [-2, -8] returns -2, because -2 is larger.`,
    starterCode: `def biggest(items):
    # empty list returns None; replace the remembered value when you see a larger one
    pass
`,
    tests: `
def __t_empty():
    assert biggest([]) is None

__check("an empty list has no biggest value", __t_empty)

def __t_one():
    assert biggest([4]) == 4

__check("one value is the biggest", __t_one)

def __t_big():
    assert biggest([3, 9, 4]) == 9
    assert biggest([-2, -8]) == -2

__check("keeps the larger value, including among negatives", __t_big)
`
  },
  {
    id: 'fact-smallest',
    title: '3. Minimum',
    prompt: `smallest(items) returns the smallest value, or None when the list is empty.

Same shape as biggest. Start from the first value, and replace the remembered value when you see a smaller one.

[] returns None. [3, 9, 4] returns 3. [-2, -8] returns -8.`,
    starterCode: `def smallest(items):
    pass
`,
    tests: `
def __t_empty():
    assert smallest([]) is None

__check("an empty list has no smallest value", __t_empty)

def __t_one():
    assert smallest([4]) == 4

__check("one value is the smallest", __t_one)

def __t_small():
    assert smallest([3, 9, 4]) == 3
    assert smallest([-2, -8]) == -8

__check("keeps the smaller value", __t_small)
`
  }
]

export const PLACE_EXERCISES: PythonExercise[] = [
  {
    id: 'place-index',
    title: '1. Index lookup',
    prompt: `index_of(items, target) returns the position of the first match, or None if the value is missing.

for value in items gives you the value and hides the place. Keep a second name, index, for the position. Positions start at 0.

index starts at 0.
While index is still inside the list, look at items[index].
If it equals target, return index.
Otherwise add 1 to index.
If the loop finishes, return None.

[10, 20, 30] with target 20 returns 1. [10, 20, 10] with target 10 returns 0. [] returns None.`,
    starterCode: `def index_of(items, target):
    # index starts at 0 and moves one place at a time
    pass
`,
    tests: `
def __t_empty():
    assert index_of([], 1) is None

__check("an empty list has no position", __t_empty)

def __t_first():
    assert index_of([10, 20, 10], 10) == 0

__check("returns the first match, at position 0", __t_first)

def __t_later():
    assert index_of([10, 20, 30], 20) == 1
    assert index_of([10, 20, 30], 30) == 2

__check("returns a later position", __t_later)

def __t_missing():
    assert index_of([10, 20, 30], 9) is None

__check("returns None when the value is missing", __t_missing)
`
  },
  {
    id: 'place-pair',
    title: '2. Adjacent elements',
    prompt: `has_pair(items) returns True when two neighboring values are equal.

Look at a place and the place after it. index starts at 0. While index + 1 is still inside the list, compare items[index] with items[index + 1]. Equal means return True. Otherwise add 1 to index. If the loop finishes, return False.

[] and [7] have no two neighbors, so they return False. [1, 2, 2] returns True.`,
    starterCode: `def has_pair(items):
    # compare each place with the next place
    pass
`,
    tests: `
def __t_short():
    assert has_pair([]) is False
    assert has_pair([7]) is False

__check("fewer than two values cannot have a pair", __t_short)

def __t_yes():
    assert has_pair([1, 1]) is True
    assert has_pair([1, 2, 2, 3]) is True

__check("finds equal neighbors", __t_yes)

def __t_no():
    assert has_pair([1, 2, 3]) is False
    assert has_pair([1, 2, 1]) is False

__check("equal values that are not neighbors do not count", __t_no)
`
  },
  {
    id: 'place-sums',
    title: '3. Adjacent sums',
    prompt: `neighbor_sums(items) returns each value added to the value after it.

[1, 2, 4] returns [3, 6], from 1 + 2 and 2 + 4. Fewer than two values returns [].

index starts at 0. While a next value exists, append items[index] + items[index + 1], then add 1 to index.`,
    starterCode: `def neighbor_sums(items):
    # append each value plus the next one
    pass
`,
    tests: `
def __t_short():
    assert neighbor_sums([]) == []
    assert neighbor_sums([5]) == []

__check("fewer than two values returns []", __t_short)

def __t_sums():
    assert neighbor_sums([1, 2, 4]) == [3, 6]
    assert neighbor_sums([1, 2, 4, 10]) == [3, 6, 14]

__check("adds each value to the next one", __t_sums)
`
  }
]

export const TEXT_EXERCISES: PythonExercise[] = [
  {
    id: 'text-count',
    title: '1. Character count',
    prompt: `count_letter(text, letter) returns how many times letter appears.

A string is a sequence of characters. for ch in text visits one character at a time, the same way a list loop visits one value.

count starts at 0. Add 1 when ch equals letter. "A" and "a" are different.

"" returns 0. "aab" with letter "a" returns 2.`,
    starterCode: `def count_letter(text, letter):
    # one character per visit
    pass
`,
    tests: `
def __t_empty():
    assert count_letter("", "a") == 0

__check("an empty string has no letters", __t_empty)

def __t_count():
    assert count_letter("aab", "a") == 2
    assert count_letter("aab", "b") == 1
    assert count_letter("aab", "c") == 0

__check("counts the matching character", __t_count)

def __t_case():
    assert count_letter("Aab", "a") == 1

__check("treats A and a as different", __t_case)
`
  },
  {
    id: 'text-digits',
    title: '2. Character filter',
    prompt: `digits_in(text) returns a new string made of only the digit characters, in the same order.

result starts as "". For each character, if it is one of 0123456789, add that character onto result.

"a1b2" returns "12". "abc" returns "". "" returns "".`,
    starterCode: `def digits_in(text):
    # result starts as an empty string
    pass
`,
    tests: `
def __t_empty():
    assert digits_in("") == ""

__check("an empty string stays empty", __t_empty)

def __t_keep():
    assert digits_in("a1b2") == "12"
    assert digits_in("42") == "42"

__check("keeps digits in order", __t_keep)

def __t_none():
    assert digits_in("abc") == ""

__check("returns an empty string when there are no digits", __t_none)
`
  },
  {
    id: 'text-double',
    title: '3. Consecutive characters',
    prompt: `has_double_letter(text) returns True when two identical characters sit next to each other.

This is the neighbor check, on a string. index starts at 0. While index + 1 is still inside the text, compare text[index] with text[index + 1].

"", "a", and "abc" return False. "aa" and "aabc" return True.`,
    starterCode: `def has_double_letter(text):
    # compare each character with the next one
    pass
`,
    tests: `
def __t_short():
    assert has_double_letter("") is False
    assert has_double_letter("a") is False

__check("fewer than two characters cannot have a double", __t_short)

def __t_yes():
    assert has_double_letter("aa") is True
    assert has_double_letter("aabc") is True
    assert has_double_letter("book") is True

__check("finds two identical letters in a row", __t_yes)

def __t_no():
    assert has_double_letter("abc") is False
    assert has_double_letter("aba") is False

__check("the same letter later on does not count", __t_no)
`
  },
  {
    id: 'text-long',
    title: '4. First match',
    prompt: `first_long_word(words, n) returns the first word whose length is greater than n, or None if there is none.

words is a list of strings. Walk it. len(word) is how many characters that word has. When a word is long enough, return it immediately. If the loop finishes, return None.

["cat", "horse"] with n 3 returns "horse". ["ant", "bee"] with n 2 returns "bee". [] returns None.`,
    starterCode: `def first_long_word(words, n):
    # return the first word that is long enough
    pass
`,
    tests: `
def __t_empty():
    assert first_long_word([], 3) is None

__check("an empty list has no word", __t_empty)

def __t_first():
    assert first_long_word(["ant", "bee", "horse"], 2) == "ant"
    assert first_long_word(["cat", "horse"], 3) == "horse"

__check("returns the first word longer than n", __t_first)

def __t_none():
    assert first_long_word(["a", "be"], 3) is None

__check("returns None when every word is too short", __t_none)
`
  }
]

export const UNTIL_EXERCISES: PythonExercise[] = [
  {
    id: 'until-countdown',
    title: '1. Countdown',
    prompt: `countdown(n) returns a list from n down to 1.

There is no list to walk. You change a number until a condition becomes false. That is a while loop. Each pass must change n, or the loop never stops.

If n is less than 1, return [] before the loop.
Otherwise start an empty result. While n is greater than 0, append n, then set n to n - 1.

countdown(3) is [3, 2, 1]. countdown(1) is [1]. countdown(0) is [].`,
    starterCode: `def countdown(n):
    # while n is still greater than 0, record it and make it smaller
    pass
`,
    tests: `
def __t_none():
    assert countdown(0) == []
    assert countdown(-2) == []

__check("n below 1 returns []", __t_none)

def __t_one():
    assert countdown(1) == [1]

__check("countdown(1) is [1]", __t_one)

def __t_down():
    assert countdown(3) == [3, 2, 1]
    assert countdown(4) == [4, 3, 2, 1]

__check("counts down to 1", __t_down)
`
  },
  {
    id: 'until-sum',
    title: '2. Bounded sum',
    prompt: `sum_to(n) returns 1 + 2 + ... + n. If n is less than 1, the sum is 0.

total starts at 0. k starts at 1. While k is still less than or equal to n, add k onto total, then add 1 to k. Return total.

k is the value you are on, the same job an index has in a list. Each pass moves k closer to the end.

sum_to(4) is 10. sum_to(1) is 1. sum_to(0) is 0.`,
    starterCode: `def sum_to(n):
    # k starts at 1 and moves up until it passes n
    pass
`,
    tests: `
def __t_none():
    assert sum_to(0) == 0
    assert sum_to(-3) == 0

__check("n below 1 sums to 0", __t_none)

def __t_one():
    assert sum_to(1) == 1

__check("sum_to(1) is 1", __t_one)

def __t_sum():
    assert sum_to(4) == 10
    assert sum_to(5) == 15

__check("adds every whole number from 1 to n", __t_sum)
`
  },
  {
    id: 'until-steps',
    title: '3. Repeated reduction',
    prompt: `steps_to_one(n) returns how many times you replace n with n // 2 before it becomes 1. n starts at 1 or more.

count starts at 0. While n is greater than 1, set n to n // 2 and add 1 to count. Return count.

1 is already done, so steps_to_one(1) is 0.
8 goes 8, then 4, then 2, then 1, so steps_to_one(8) is 3.
Each pass changes n. If n stays the same, the loop never ends.`,
    starterCode: `def steps_to_one(n):
    # while n is greater than 1, replace n with n // 2
    pass
`,
    tests: `
def __t_done():
    assert steps_to_one(1) == 0

__check("1 is already done", __t_done)

def __t_steps():
    assert steps_to_one(2) == 1
    assert steps_to_one(3) == 1
    assert steps_to_one(8) == 3
    assert steps_to_one(7) == 2

__check("counts each halving until 1", __t_steps)
`
  }
]

export const NESTED_EXERCISES: PythonExercise[] = [
  {
    id: 'nest-products',
    title: '1. Cartesian product',
    prompt: `products(left, right) returns every product of one value from left and one value from right.

The outer loop picks one value from left and keeps it. The inner loop, written inside the outer one, walks the whole of right and appends each product. When the inner loop finishes, the outer loop moves to the next left value.

Finish right before you move on in left.
products([1, 2], [10, 20]) returns [10, 20, 20, 40].
If either list is empty, the result is [].`,
    starterCode: `def products(left, right):
    # for each value in left, walk every value in right
    pass
`,
    tests: `
def __t_empty():
    assert products([], [1, 2]) == []
    assert products([1], []) == []

__check("an empty list means no products", __t_empty)

def __t_order():
    assert products([1, 2], [10, 20]) == [10, 20, 20, 40]

__check("finishes right before moving on in left", __t_order)

def __t_one():
    assert products([2], [3, 4]) == [6, 8]

__check("one left value pairs with every right value", __t_one)
`
  },
  {
    id: 'nest-shared',
    title: '2. Shared element',
    prompt: `shares_value(left, right) returns True if some value appears in both lists.

For each value in left, walk right. If a value in right equals it, return True. You can stop there. If both loops finish, return False.

[1, 2] and [3, 2] returns True. [1] and [2] returns False. [] and [1] returns False.`,
    starterCode: `def shares_value(left, right):
    # for each left value, look through right
    pass
`,
    tests: `
def __t_empty():
    assert shares_value([], [1]) is False
    assert shares_value([1], []) is False

__check("an empty list shares nothing", __t_empty)

def __t_yes():
    assert shares_value([1, 2], [3, 2]) is True
    assert shares_value([1, 2], [2, 1]) is True

__check("finds a value that is in both", __t_yes)

def __t_no():
    assert shares_value([1], [2]) is False
    assert shares_value([1, 2], [3, 4]) is False

__check("returns False when the lists are disjoint", __t_no)
`
  },
  {
    id: 'nest-letters',
    title: '3. Nested traversal',
    prompt: `count_in_words(words, letter) returns how many times letter appears, across every word.

count is created once, before either loop. The outer loop takes one word. The inner loop takes one character of that word and adds 1 when it matches.

["cat", "a"] with "a" returns 2. [] returns 0. ["dog"] with "a" returns 0.`,
    starterCode: `def count_in_words(words, letter):
    # count starts once; each word has its own character loop
    pass
`,
    tests: `
def __t_empty():
    assert count_in_words([], "a") == 0

__check("no words means a count of 0", __t_empty)

def __t_count():
    assert count_in_words(["cat", "a"], "a") == 2
    assert count_in_words(["aa", "b"], "a") == 2

__check("counts the letter in every word", __t_count)

def __t_none():
    assert count_in_words(["dog"], "a") == 0

__check("returns 0 when the letter never appears", __t_none)
`
  }
]
