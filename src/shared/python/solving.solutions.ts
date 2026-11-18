/** Full editor contents that pass each problem-solving exercise. Used by the smoke test only. */
export const SOLVING_SOLUTIONS: Record<string, string> = {
  'walk-copy': `def copied(items: list) -> list:
    result = []
    for value in items:
        result.append(value)
    return result
`,
  'walk-total': `def total(items: list[int]) -> int:
    total = 0
    for value in items:
        total = total + value
    return total
`,
  'walk-count': `def how_many(items: list) -> int:
    count = 0
    for value in items:
        count = count + 1
    return count
`,
  'walk-double': `def doubled(items: list[int]) -> list[int]:
    result = []
    for value in items:
        result.append(value * 2)
    return result
`,
  'ask-count': `def count_matches(items: list, target: int | str) -> int:
    count = 0
    for value in items:
        if value == target:
            count = count + 1
    return count
`,
  'ask-keep': `def positives(items: list[int]) -> list[int]:
    result = []
    for value in items:
        if value > 0:
            result.append(value)
    return result
`,
  'ask-found': `def contains(items: list, target: int | str) -> bool:
    for value in items:
        if value == target:
            return True
    return False
`,
  'ask-all': `def all_positive(items: list[int]) -> bool:
    for value in items:
        if value <= 0:
            return False
    return True
`,
  'fact-last': `def last_item(items: list) -> int | str | None:
    if items == []:
        return None
    last = items[0]
    for value in items:
        last = value
    return last
`,
  'fact-biggest': `def biggest(items: list[int]) -> int | None:
    if items == []:
        return None
    best = items[0]
    for value in items:
        if value > best:
            best = value
    return best
`,
  'fact-smallest': `def smallest(items: list[int]) -> int | None:
    if items == []:
        return None
    best = items[0]
    for value in items:
        if value < best:
            best = value
    return best
`,
  'place-index': `def index_of(items: list[int], target: int) -> int | None:
    index = 0
    while index < len(items):
        if items[index] == target:
            return index
        index = index + 1
    return None
`,
  'place-pair': `def has_pair(items: list[int]) -> bool:
    index = 0
    while index + 1 < len(items):
        if items[index] == items[index + 1]:
            return True
        index = index + 1
    return False
`,
  'place-sums': `def neighbor_sums(items: list[int]) -> list[int]:
    result = []
    index = 0
    while index + 1 < len(items):
        result.append(items[index] + items[index + 1])
        index = index + 1
    return result
`,
  'text-count': `def count_letter(text: str, letter: str) -> int:
    count = 0
    for ch in text:
        if ch == letter:
            count = count + 1
    return count
`,
  'text-digits': `def digits_in(text: str) -> str:
    result = ""
    for ch in text:
        if ch in "0123456789":
            result = result + ch
    return result
`,
  'text-double': `def has_double_letter(text: str) -> bool:
    index = 0
    while index + 1 < len(text):
        if text[index] == text[index + 1]:
            return True
        index = index + 1
    return False
`,
  'text-long': `def first_long_word(words: list[str], n: int) -> str | None:
    for word in words:
        if len(word) > n:
            return word
    return None
`,
  'until-countdown': `def countdown(n: int) -> list[int]:
    if n < 1:
        return []
    result = []
    while n > 0:
        result.append(n)
        n = n - 1
    return result
`,
  'until-sum': `def sum_to(n: int) -> int:
    total = 0
    k = 1
    while k <= n:
        total = total + k
        k = k + 1
    return total
`,
  'until-steps': `def steps_to_one(n: int) -> int:
    count = 0
    while n > 1:
        n = n // 2
        count = count + 1
    return count
`,
  'nest-products': `def products(left: list[int], right: list[int]) -> list[int]:
    result = []
    for a in left:
        for b in right:
            result.append(a * b)
    return result
`,
  'nest-shared': `def shares_value(left: list[int], right: list[int]) -> bool:
    for a in left:
        for b in right:
            if a == b:
                return True
    return False
`,
  'nest-letters': `def count_in_words(words: list[str], letter: str) -> int:
    count = 0
    for word in words:
        for ch in word:
            if ch == letter:
                count = count + 1
    return count
`
}
